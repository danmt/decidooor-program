use crate::collections::{Event, EventState, EventVotes, EventBumps};
use anchor_lang::prelude::*;
use anchor_spl::token::*;

#[derive(Accounts)]
#[instruction(
    redeem_date: i64,
    capacity: u64, 
    event_votes_space: u32,
)]
pub struct CreateEvent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 44
    )]
    pub event: Account<'info, Event>,
    #[account(
        init,
        seeds = [
          b"event_state".as_ref(),
          event.key().as_ref(),
        ],
        bump,
        payer = authority,
        space = 109
    )]
    pub event_state: Account<'info, EventState>,
    #[account(
        init,
        seeds = [
          b"event_votes".as_ref(),
          event.key().as_ref(),
        ],
        bump,
        payer = authority,
        space = event_votes_space as usize
    )]
    pub event_votes: Account<'info, EventVotes>,
    pub accepted_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        payer = authority,
        seeds = [b"event_vault".as_ref(), event.key().as_ref()],
        bump,
        token::mint = accepted_mint,
        token::authority = event_state,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle(
    ctx: Context<CreateEvent>,
    redeem_date: i64,
    capacity: u64,
    _event_votes_space: u32,
) -> Result<()> {
    // Initialize event
    ctx.accounts.event.authority = ctx.accounts.authority.key();
    ctx.accounts.event.bumps = EventBumps {
        state_bump: *ctx.bumps.get("event_state").unwrap(),
        votes_bump: *ctx.bumps.get("event_votes").unwrap(),
        vault_bump: *ctx.bumps.get("vault").unwrap(),
    };

    // Initialize event state
    ctx.accounts.event_state.redeem_date = redeem_date;
    ctx.accounts.event_state.is_redeemed = false;
    ctx.accounts.event_state.capacity = capacity;
    ctx.accounts.event_state.registered_participants = 0;
    ctx.accounts.event_state.accepted_mint = ctx.accounts.accepted_mint.key();
    ctx.accounts.event_state.vault = ctx.accounts.vault.key();

    // Initialize votes stats
    ctx.accounts.event_votes.votes_stats = Vec::new();

    Ok(())
}
