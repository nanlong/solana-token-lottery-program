#![allow(unexpected_cfgs)]

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("Fywhc4DK37TALzTR7gsyQZwyKEHAhE9btmt4hKvELzdx");

#[program]
pub mod token_lottery {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        start: u64,
        end: u64,
        price: u64,
    ) -> Result<()> {
        instructions::initialize_config::init(ctx, start, end, price)?;
        Ok(())
    }
}
