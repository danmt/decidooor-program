use anchor_lang::prelude::*;

#[account]
pub struct EventState {
    pub redeem_date: i64,             // 16
    pub accepted_mint: Pubkey,        // 32
    pub vault: Pubkey,                // 32
    pub capacity: u64,                // 8
    pub registered_participants: u64, // 8
    pub is_redeemed: bool,            // 2
}
