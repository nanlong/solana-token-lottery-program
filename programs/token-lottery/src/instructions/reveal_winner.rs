use crate::{error::ErrorCode, TokenLottery};
use anchor_lang::prelude::*;
use switchboard_on_demand::RandomnessAccountData;

#[derive(Accounts)]
pub struct RevealWinner<'info> {
    #[account(mut)]
    payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"token_lottery"],
        bump = token_lottery.bump,
    )]
    pub token_lottery: Account<'info, TokenLottery>,

    /// CHECK: This account is checked by the switchboard smart contract
    pub randomness_account: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub(crate) fn handle(ctx: Context<RevealWinner>) -> Result<()> {
    let clock = Clock::get()?;
    let token_lottery = &mut ctx.accounts.token_lottery;

    require_eq!(
        ctx.accounts.payer.key(),
        token_lottery.authority,
        ErrorCode::NotAuthorized
    );
    require_eq!(
        ctx.accounts.randomness_account.key(),
        token_lottery.randomness_account,
        ErrorCode::IncorrectRandomnessAccount
    );
    require_gt!(
        clock.slot,
        token_lottery.end_time,
        ErrorCode::LotteryNotCompleted
    );
    require!(!token_lottery.winner_chosen, ErrorCode::WinnerChosen);

    let randomness_data =
        RandomnessAccountData::parse(ctx.accounts.randomness_account.data.borrow()).unwrap();

    let reveal_random_value = randomness_data
        .get_value(&clock)
        .map_err(|_| ErrorCode::RandomnessNotResolved)?;

    let winner = reveal_random_value[0] as u64 % token_lottery.total_tickets;

    msg!("Winner chosen: {}", winner);

    token_lottery.winner = winner;
    token_lottery.winner_chosen = true;

    Ok(())
}
