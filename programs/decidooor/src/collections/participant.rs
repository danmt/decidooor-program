use anchor_lang::prelude::*;

#[account]
pub struct Participant {
    pub authority: Pubkey,
    pub event: Pubkey,
    pub has_voted: bool,
}
