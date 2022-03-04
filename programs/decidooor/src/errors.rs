use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid project")]
    InvalidProject,
    #[msg("Already redeemed")]
    AlreadyRedeemed,
    #[msg("Cannot redeem yet")]
    CannotRedeemYet,
    #[msg("Only the winner can redeem")]
    OnlyTheWinnerCanRedeem,
}
