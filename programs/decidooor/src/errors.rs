use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid event")]
    InvalidEvent,
    #[msg("Invalid project")]
    InvalidProject,
    #[msg("Already redeemed")]
    AlreadyRedeemed,
    #[msg("Cannot redeem yet")]
    CannotRedeemYet,
    #[msg("Only the winner can redeem")]
    OnlyTheWinnerCanRedeem,
    #[msg("Cant redeem empty event")]
    CantRedeemEmptyEvent,
    #[msg("Only the project owner can redeem")]
    OnlyTheProjectOwnerCanRedeem,
    #[msg("Unauthorized vote")]
    UnauthorizedVote,
    #[msg("Participant already voted")]
    ParticipantAlreadyVoted,
}
