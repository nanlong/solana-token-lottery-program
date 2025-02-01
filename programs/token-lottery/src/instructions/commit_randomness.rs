use crate::{error::ErrorCode, TokenLottery};
use anchor_lang::prelude::*;
use switchboard_on_demand::RandomnessAccountData;

#[derive(Accounts)]
pub struct CommitRandomness<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"token_lottery"],
        bump = token_lottery.bump,
    )]
    pub token_lottery: Box<Account<'info, TokenLottery>>,

    /// CHECK: This account is checked by the Switcboard smart contract
    pub randomness_account: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub(crate) fn handle(ctx: Context<CommitRandomness>) -> Result<()> {
    if ctx.accounts.payer.key() != ctx.accounts.token_lottery.authority {
        return Err(ErrorCode::NotAuthorized.into());
    }

    let clock = Clock::get()?;

    let randomness_data =
        RandomnessAccountData::parse(ctx.accounts.randomness_account.data.borrow()).unwrap();

    if randomness_data.seed_slot != clock.slot - 1 {
        return Err(ErrorCode::RandomnessAlreadyRevealed.into());
    }

    ctx.accounts.token_lottery.randomness_account = ctx.accounts.randomness_account.key();

    Ok(())
}
