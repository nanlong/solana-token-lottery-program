use crate::{error::ErrorCode, NAME};
use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{Metadata, MetadataAccount},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::TokenLottery;

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"token_lottery"],
        bump = token_lottery.bump
    )]
    pub token_lottery: Account<'info, TokenLottery>,

    #[account(
        seeds = [b"collection_mint"],
        bump
    )]
    pub collection_mint: InterfaceAccount<'info, Mint>,

    #[account(
        seeds = [
            b"metadata",
            token_metadata_program.key().as_ref(),
            collection_mint.key().as_ref()
        ],
        bump,
        seeds::program = token_metadata_program.key()
    )]
    pub collection_metadata: Account<'info, MetadataAccount>,

    #[account(
        seeds = [token_lottery.winner.to_le_bytes().as_ref()],
        bump
    )]
    pub ticket_mint: InterfaceAccount<'info, Mint>,

    #[account(
        seeds = [
            b"metadata",
            token_metadata_program.key().as_ref(),
            ticket_mint.key().as_ref(),
        ],
        bump,
        seeds::program = token_metadata_program.key()
    )]
    pub ticket_metadata: Account<'info, MetadataAccount>,

    #[account(
        associated_token::mint = ticket_mint,
        associated_token::authority = payer,
        associated_token::token_program = token_program
    )]
    pub ticket_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub token_metadata_program: Program<'info, Metadata>,
}

pub(crate) fn handle(ctx: Context<ClaimPrize>) -> Result<()> {
    let payer = &ctx.accounts.payer;
    let token_lottery = &mut ctx.accounts.token_lottery;
    let collection_mint = &ctx.accounts.collection_mint;
    let ticket_account = &ctx.accounts.ticket_account;
    let ticket_metadata = &ctx.accounts.ticket_metadata;

    require!(token_lottery.winner_chosen, ErrorCode::WinnerNotChosen);
    require!(
        ticket_metadata.collection.as_ref().unwrap().verified,
        ErrorCode::CollectionNotVerified
    );
    require_eq!(
        ticket_metadata.collection.as_ref().unwrap().key,
        collection_mint.key(),
        ErrorCode::IncorrectTicket
    );

    let ticket_name = format!("{}{}", NAME, token_lottery.winner);
    let metadata_name = ticket_metadata.name.replace("\u{0}", "");

    require_eq!(ticket_name, metadata_name, ErrorCode::IncorrectTicket);
    require_gt!(ticket_account.amount, 0, ErrorCode::NoTicket);

    **token_lottery.to_account_info().try_borrow_mut_lamports()? -=
        token_lottery.lottery_pot_amount;
    **payer.to_account_info().try_borrow_mut_lamports()? += token_lottery.lottery_pot_amount;
    token_lottery.lottery_pot_amount = 0;

    Ok(())
}
