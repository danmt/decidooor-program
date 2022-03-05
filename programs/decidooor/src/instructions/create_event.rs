use crate::collections::{Event, EventBumps};
use anchor_lang::prelude::*;
use anchor_spl::token::*;

#[derive(Accounts)]
#[instruction(
    event_id: String, 
    redeem_date: i64,
    capacity: u64, 
    event_space: u32,
)]
pub struct CreateEvent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        seeds = [
          b"event".as_ref(),
          event_id.as_bytes(),
          authority.key().as_ref(),
        ],
        bump,
        payer = authority,
        space = event_space as usize
    )]
    pub event: Account<'info, Event>,
    pub accepted_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        payer = authority,
        seeds = [b"vault".as_ref(), event.key().as_ref()],
        bump,
        token::mint = accepted_mint,
        token::authority = event,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle(
    ctx: Context<CreateEvent>,
    event_id: String,
    redeem_date: i64,
    capacity: u64,
    _event_space: u32,
) -> Result<()> {
    ctx.accounts.event.authority = ctx.accounts.authority.key();
    ctx.accounts.event.event_id = event_id;
    ctx.accounts.event.redeem_date = redeem_date;
    ctx.accounts.event.votes_stats = Vec::new();
    ctx.accounts.event.is_redeemed = false;
    ctx.accounts.event.capacity = capacity;
    ctx.accounts.event.registered_participants = 0;
    
    ctx.accounts.event.accepted_mint = ctx.accounts.accepted_mint.key();
    ctx.accounts.event.vault = ctx.accounts.vault.key();
    ctx.accounts.event.bumps = EventBumps {
        event_bump: *ctx.bumps.get("event").unwrap(),
        vault_bump: *ctx.bumps.get("vault").unwrap(),
    };

    Ok(())
}
