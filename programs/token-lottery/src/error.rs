use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Lottery not open")]
    LotteryNotOpen,

    #[msg("Not authorized")]
    NotAuthorized,

    #[msg("Randomness already revealed")]
    RandomnessAlreadyRevealed,

    #[msg("Incorrect randomness account")]
    IncorrectRandomnessAccount,

    #[msg("Lottery not completed")]
    LotteryNotCompleted,

    #[msg("Winner chosen")]
    WinnerChosen,

    #[msg("Randomness not resolved")]
    RandomnessNotResolved,
}
