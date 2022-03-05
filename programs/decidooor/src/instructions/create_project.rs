use crate::collections::{Event, EventVotesStats, Project};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::*;
use anchor_spl::token::*;

#[derive(Accounts)]
pub struct CreateProject<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub project_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub event: Account<'info, Event>,
    #[account(zero)]
    pub project: Account<'info, Project>,
    pub accepted_mint: Box<Account<'info, Mint>>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateProjectArguments {
    pub title: String,
    pub description: String,
}

pub fn handle(ctx: Context<CreateProject>, arguments: CreateProjectArguments) -> Result<()> {
    ctx.accounts.project.authority = ctx.accounts.authority.key();
    ctx.accounts.project.event = ctx.accounts.event.key();
    ctx.accounts.project.vault = ctx.accounts.project_vault.key();
    ctx.accounts.project.title = arguments.title;
    ctx.accounts.project.description = arguments.description;
    ctx.accounts.event.votes_stats.push(EventVotesStats {
        project: ctx.accounts.project.key(),
        votes: 0,
    });
    Ok(())
}
