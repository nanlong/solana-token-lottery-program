import * as anchor from '@coral-xyz/anchor';
import { Program, BN } from '@coral-xyz/anchor';
import { TokenLottery } from '../target/types/token_lottery';
import { PublicKey } from '@solana/web3.js';
import { confirmTransaction } from '@solana-developers/helpers';
import { assert } from 'chai';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

describe('token-lottery', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const connection = provider.connection;
  const program = anchor.workspace.TokenLottery as Program<TokenLottery>;

  it('initialize config', async () => {
    const transactionSignature = await program.methods
      .initializeConfig(new BN(1), new BN(2), new BN(3))
      .rpc({ skipPreflight: true });

    await confirmTransaction(connection, transactionSignature);

    const tokenLottery = PublicKey.findProgramAddressSync(
      [Buffer.from('token_lottery')],
      program.programId
    )[0];

    const tokenLotteryAccount = await program.account.tokenLottery.fetch(
      tokenLottery
    );

    assert(tokenLotteryAccount.startTime.eq(new BN(1)));
    assert(tokenLotteryAccount.endTime.eq(new BN(2)));
    assert(tokenLotteryAccount.ticketPrice.eq(new BN(3)));
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
  });
});
