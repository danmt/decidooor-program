use anchor_lang::prelude::*;

#[account]
pub struct EventVotes {
    pub votes_stats: Vec<EventVotesStats>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EventVotesStats {
    pub project: Pubkey,
    pub votes: u64,
}
