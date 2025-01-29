use crate::{TokenLottery, ANCHOR_DISCRIMINATOR};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = ANCHOR_DISCRIMINATOR + TokenLottery::INIT_SPACE,
        seeds = [b"token_lottery"],
        bump
    )]
    pub token_lottery: Account<'info, TokenLottery>,

    pub system_program: Program<'info, System>,
}

pub fn init(ctx: Context<InitializeConfig>, start: u64, end: u64, price: u64) -> Result<()> {
    *ctx.accounts.token_lottery = TokenLottery {
        bump: ctx.bumps.token_lottery,
        winner: 0,
        start_time: start,
        end_time: end,
        ticket_price: price,
        authority: ctx.accounts.payer.key(),
        lottery_pot_amount: 0,
        total_tickets: 0,
        randomness_account: Pubkey::default(),
        winner_chosen: false,
    };

    Ok(())
}
