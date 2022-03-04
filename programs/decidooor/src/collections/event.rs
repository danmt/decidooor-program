use anchor_lang::prelude::*;

#[account]
pub struct Event {
    pub authority: Pubkey,
    pub event_id: String,
    pub redeem_date: i64,
    pub votes_stats: Vec<EventVotesStats>,
    pub accepted_mint: Pubkey,
    pub event_mint: Pubkey,
    pub vault: Pubkey,
    pub bumps: EventBumps,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EventVotesStats {
    pub project: Pubkey,
    pub votes: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EventBumps {
    pub event_bump: u8,
    pub event_mint_bump: u8,
    pub vault_bump: u8,
}
