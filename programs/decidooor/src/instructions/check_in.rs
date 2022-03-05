use crate::collections::{Event, Participant};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CheckIn<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub event: Account<'info, Event>,
    #[account(
        init,
        payer = authority,
        space = 74
    )]
    pub participant: Account<'info, Participant>,
    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<CheckIn>) -> Result<()> {
    ctx.accounts.participant.authority = ctx.accounts.authority.key();
    ctx.accounts.participant.event = ctx.accounts.event.key();
    ctx.accounts.participant.has_voted = false;
    ctx.accounts.event.registered_participants += 1;
    Ok(())
}
