use crate::collections::{Event, EventVotesStats, Project};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CreateProject<'info> {
    pub authority: Signer<'info>,
    #[account(mut)]
    pub event: Account<'info, Event>,
    #[account(zero)]
    pub project: Account<'info, Project>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateProjectArguments {
    pub title: String,
    pub description: String,
}

pub fn handle(ctx: Context<CreateProject>, arguments: CreateProjectArguments) -> Result<()> {
    ctx.accounts.project.authority = ctx.accounts.authority.key();
    ctx.accounts.project.title = arguments.title;
    ctx.accounts.project.description = arguments.description;
    ctx.accounts.event.votes_stats.push(EventVotesStats {
        project: ctx.accounts.project.key(),
        votes: 0,
    });
    Ok(())
}
