use anchor_lang::prelude::*;

#[account]
pub struct Donator {
    pub authority: Pubkey,
    pub event: Pubkey,
    pub bumps: DonatorBumps,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct DonatorBumps {
    pub donator_bump: u8,
    pub donator_vault_bump: u8,
}
