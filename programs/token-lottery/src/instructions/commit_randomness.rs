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
    pub token_lottery: Account<'info, TokenLottery>,

    /// CHECK: This account is checked by the Switcboard smart contract
    pub randomness_account: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub(crate) fn handle(ctx: Context<CommitRandomness>) -> Result<()> {
    require_eq!(
        ctx.accounts.payer.key(),
        ctx.accounts.token_lottery.authority,
        ErrorCode::NotAuthorized,
    );

    let clock = Clock::get()?;

    let randomness_data =
        RandomnessAccountData::parse(ctx.accounts.randomness_account.data.borrow()).unwrap();

    require_eq!(
        randomness_data.seed_slot,
        clock.slot - 1,
        ErrorCode::RandomnessAlreadyRevealed,
    );

    msg!("Randomness seed slot: {}", randomness_data.seed_slot);
    msg!("Clock slot: {}", clock.slot);

    ctx.accounts.token_lottery.randomness_account = ctx.accounts.randomness_account.key();

    Ok(())
}
