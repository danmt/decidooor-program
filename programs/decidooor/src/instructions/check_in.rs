use crate::collections::{Event, EventState, Participant};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CheckIn<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub event: Box<Account<'info, Event>>,
    #[account(
        mut,
        seeds = [
            b"event_state".as_ref(),
            event.key().as_ref(),
        ],
        bump = event.bumps.state_bump,
    )]
    pub event_state: Account<'info, EventState>,
    #[account(
        init,
        payer = authority,
        space = 74
    )]
    pub participant: Account<'info, Participant>,
    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<CheckIn>) -> Result<()> {
    // Initialize participant
    ctx.accounts.participant.authority = ctx.accounts.authority.key();
    ctx.accounts.participant.event = ctx.accounts.event.key();
    ctx.accounts.participant.has_voted = false;

    // Increate number of participants
    ctx.accounts.event_state.registered_participants += 1;

    Ok(())
}
