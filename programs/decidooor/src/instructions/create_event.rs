use crate::collections::Event;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CreateEvent<'info> {
    pub authority: Signer<'info>,
    #[account(zero)]
    pub event: Account<'info, Event>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateEventArguments {
    pub redeem_date: i64,
}

pub fn handle(ctx: Context<CreateEvent>, arguments: CreateEventArguments) -> Result<()> {
    ctx.accounts.event.authority = ctx.accounts.authority.key();
    ctx.accounts.event.redeem_date = arguments.redeem_date;
    ctx.accounts.event.votes_stats = Vec::new();
    Ok(())
}
