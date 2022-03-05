use anchor_lang::prelude::*;

#[account]
pub struct Project {
    pub authority: Pubkey,
    pub event: Pubkey,
    pub vault: Pubkey,
    pub title: String,
    pub description: String,
}
