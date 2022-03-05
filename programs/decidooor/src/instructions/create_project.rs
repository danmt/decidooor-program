use crate::collections::{Event, EventVotes, EventVotesStats, Project};
use anchor_lang::prelude::*;
use anchor_spl::token::*;

#[derive(Accounts)]
pub struct CreateProject<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub project_vault: Box<Account<'info, TokenAccount>>,
    pub event: Account<'info, Event>,
    #[account(
        mut,
        seeds = [
            b"event_votes".as_ref(),
            event.key().as_ref(),
        ],
        bump = event.bumps.votes_bump,
    )]
    pub event_votes: Account<'info, EventVotes>,
    #[account(zero)]
    pub project: Account<'info, Project>,
    pub accepted_mint: Box<Account<'info, Mint>>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateProjectArguments {
    pub title: String,
    pub description: String,
}

pub fn handle(ctx: Context<CreateProject>, arguments: CreateProjectArguments) -> Result<()> {
    // Initialize project
    ctx.accounts.project.authority = ctx.accounts.authority.key();
    ctx.accounts.project.event = ctx.accounts.event.key();
    ctx.accounts.project.vault = ctx.accounts.project_vault.key();
    ctx.accounts.project.title = arguments.title;
    ctx.accounts.project.description = arguments.description;

    // Push new project to event votes
    ctx.accounts.event_votes.votes_stats.push(EventVotesStats {
        project: ctx.accounts.project.key(),
        votes: 0,
    });

    Ok(())
}
