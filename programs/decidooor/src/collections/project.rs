use anchor_lang::prelude::*;

#[account]
pub struct Project {
    pub authority: Pubkey,
    pub title: String,
    pub description: String,
}