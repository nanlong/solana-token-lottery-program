import * as anchor from '@coral-xyz/anchor';
import * as sb from '@switchboard-xyz/on-demand';
import { Program, BN } from '@coral-xyz/anchor';
import { TokenLottery } from '../target/types/token_lottery';
import { ComputeBudgetProgram, PublicKey } from '@solana/web3.js';
import { confirmTransaction } from '@solana-developers/helpers';
import { assert } from 'chai';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import SwitchboardIDL from '../tests/switchboard-idl.json';

describe('token-lottery', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const connection = provider.connection;
  const wallet = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.TokenLottery as Program<TokenLottery>;
  const switchboardProgram = new anchor.Program(
    SwitchboardIDL as anchor.Idl,
    provider
  );
  const rngKp = anchor.web3.Keypair.generate();

  before(async () => {
    console.log('test before');
  });

  it('initialize config', async () => {
    const transactionSignature = await program.methods
      .initializeConfig(new BN(0), new BN(999999999), new BN(1))
      .rpc({ skipPreflight: true });

    await confirmTransaction(connection, transactionSignature);

    const tokenLottery = PublicKey.findProgramAddressSync(
      [Buffer.from('token_lottery')],
      program.programId
    )[0];

    const tokenLotteryAccount = await program.account.tokenLottery.fetch(
      tokenLottery
    );

    assert(tokenLotteryAccount.startTime.eq(new BN(0)));
    assert(tokenLotteryAccount.endTime.eq(new BN(999999999)));
    assert(tokenLotteryAccount.ticketPrice.eq(new BN(1)));
    assert(tokenLotteryAccount.authority.equals(provider.wallet.publicKey));
    assert(tokenLotteryAccount.randomnessAccount.equals(new PublicKey(0)));
  });

  it('initlalize lottery', async () => {
    const transactionSignature = await program.methods
      .initializeLottery()
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ skipPreflight: true });

    await confirmTransaction(connection, transactionSignature);

    console.log(transactionSignature);
  });

  it('buy ticket', async () => {
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 220_000,
    });

    const transactionSignature = await program.methods
      .buyTicket()
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions([modifyComputeUnits])
      .rpc({ skipPreflight: true });

    await confirmTransaction(connection, transactionSignature);

    console.log(transactionSignature);
  });

  it('commit randomness', async () => {
    const queue = new anchor.web3.PublicKey(
      'A43DyUGA7s8eXPxqEjJY6EBu1KKbNgfxF8h17VAHn13w'
    );
    const queueAccount = new sb.Queue(switchboardProgram, queue);

    try {
      await queueAccount.loadData();
    } catch (err) {
      console.error(err);
      process.exit(1);
    }

    // create randomness start
    const [randomness, createRandomnessIx] = await sb.Randomness.create(
      switchboardProgram,
      rngKp,
      queue
    );

    const createRandomnessTx = await sb.asV0Tx({
      connection,
      ixs: [createRandomnessIx],
      payer: wallet.publicKey,
      signers: [wallet.payer, rngKp],
    });

    const createRandomnessSignature = await connection.sendTransaction(
      createRandomnessTx,
      { skipPreflight: true }
    );
    await confirmTransaction(connection, createRandomnessSignature);

    // commit randomness start
    const commitIx = await randomness.commitIx(queue);

    const commitRandomnessIx = await program.methods
      .commitRandomness()
      .accounts({
        randomnessAccount: randomness.pubkey,
      })
      .instruction();

    const commitTx = await sb.asV0Tx({
      connection,
      ixs: [commitIx, commitRandomnessIx],
      payer: wallet.publicKey,
      signers: [wallet.payer],
      computeUnitPrice: 75_000,
      computeUnitLimitMultiple: 1.3,
    });

    const commitSignature = await connection.sendTransaction(commitTx, {
      skipPreflight: true,
    });
    await confirmTransaction(connection, commitSignature);
    console.log('commitSignature', commitSignature);
  });
});
