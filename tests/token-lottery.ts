import * as anchor from '@coral-xyz/anchor';
import * as sb from '@switchboard-xyz/on-demand';
import { Program, BN } from '@coral-xyz/anchor';
import { TokenLottery } from '../target/types/token_lottery';
import {
  Commitment,
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { confirmTransaction } from '@solana-developers/helpers';
import { assert } from 'chai';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import SwitchboardIDL from '../tests/switchboard.json';

describe('token-lottery', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const connection = provider.connection;
  const wallet = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.TokenLottery as Program<TokenLottery>;
  const queue = new anchor.web3.PublicKey(
    'A43DyUGA7s8eXPxqEjJY6EBu1KKbNgfxF8h17VAHn13w'
  );
  const rngKp = anchor.web3.Keypair.generate();
  let randomness: sb.Randomness;
  let endSlot: number;
  const txOpts = {
    commitment: 'processed' as Commitment,
    skipPreflight: true,
    maxRetries: 0,
  };

  before(async () => {
    let createRandomnessIx: TransactionInstruction;

    const switchboardProgram = new anchor.Program(
      SwitchboardIDL as anchor.Idl,
      provider
    );

    const queueAccount = new sb.Queue(switchboardProgram, queue);

    try {
      await queueAccount.loadData();
    } catch (err) {
      console.error(err);
      process.exit(1);
    }

    // create randomness start
    [randomness, createRandomnessIx] = await sb.Randomness.create(
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

    // await connection.simulateTransaction(createRandomnessTx, txOpts);
    const createRandomnessSignature = await connection.sendTransaction(
      createRandomnessTx,
      txOpts
    );

    await confirmTransaction(connection, createRandomnessSignature);

    console.log('createRandomnessSignature', createRandomnessSignature);
  });

  it('initialize config', async () => {
    const slot = await connection.getSlot();
    endSlot = slot + 20;

    const transactionSignature = await program.methods
      .initializeConfig(new BN(slot), new BN(endSlot), new BN(1))
      .rpc(txOpts);

    await confirmTransaction(connection, transactionSignature);

    const tokenLottery = PublicKey.findProgramAddressSync(
      [Buffer.from('token_lottery')],
      program.programId
    )[0];

    const tokenLotteryAccount = await program.account.tokenLottery.fetch(
      tokenLottery
    );

    assert(tokenLotteryAccount.startTime.eq(new BN(slot)));
    assert(tokenLotteryAccount.endTime.eq(new BN(endSlot)));
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
      .rpc(txOpts);

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
      .rpc(txOpts);

    await confirmTransaction(connection, transactionSignature);

    console.log(transactionSignature);
  });

  it('commit randomness', async () => {
    // commit randomness start
    const sbCommitIx = await randomness.commitIx(queue);

    const commitIx = await program.methods
      .commitRandomness()
      .accounts({
        randomnessAccount: randomness.pubkey,
      })
      .instruction();

    const commitTx = await sb.asV0Tx({
      connection,
      ixs: [sbCommitIx, commitIx],
      payer: wallet.publicKey,
      signers: [wallet.payer],
      computeUnitPrice: 75_000,
      computeUnitLimitMultiple: 1.3,
    });

    const commitSignature = await connection.sendTransaction(commitTx, txOpts);
    await confirmTransaction(connection, commitSignature);
    console.log('commitSignature', commitSignature);
  });

  it('reveal winner', async () => {
    let currentSlot = 0;

    while (currentSlot < endSlot) {
      const slot = await connection.getSlot();

      if (slot > currentSlot) {
        currentSlot = slot;
        console.log('currentSlot ', slot);
      }
    }

    const sbRevealIx = await randomness.revealIx();

    const revealIx = await program.methods
      .revealWinner()
      .accounts({
        randomnessAccount: randomness.pubkey,
      })
      .instruction();

    const revealTx = await sb.asV0Tx({
      connection,
      ixs: [sbRevealIx, revealIx],
      payer: wallet.publicKey,
      signers: [wallet.payer],
      computeUnitPrice: 75_000,
      computeUnitLimitMultiple: 1.3,
    });

    const revealSignature = await connection.sendTransaction(revealTx, txOpts);
    await confirmTransaction(connection, revealSignature);

    console.log('revealSignature', revealSignature);
  });
});

async function sleep(secs: number) {
  return new Promise((resolve) => setTimeout(resolve, secs * 1000));
}
