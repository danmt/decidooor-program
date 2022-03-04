use anchor_lang::prelude::*;

#[account]
pub struct Event {
    pub redeem_date: i64,
    pub votes_stats: Vec<EventVotesStats>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EventVotesStats {
    pub project: Pubkey,
    pub votes: u32,
}
