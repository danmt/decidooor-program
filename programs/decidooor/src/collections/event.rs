use anchor_lang::prelude::*;

#[account]
pub struct Event {
    pub authority: Pubkey, // 32
    pub bumps: EventBumps, // 4
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EventBumps {
    pub state_bump: u8,
    pub vault_bump: u8,
    pub votes_bump: u8,
}
