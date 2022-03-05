use anchor_lang::prelude::*;

#[account]
pub struct Event {
    pub authority: Pubkey,
    pub event_id: String,
    pub redeem_date: i64,
    pub votes_stats: Vec<EventVotesStats>,
    pub accepted_mint: Pubkey,
    pub vault: Pubkey,
    pub capacity: u64,
    pub registered_participants: u64,
    pub is_redeemed: bool,
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
    pub vault_bump: u8,
}
