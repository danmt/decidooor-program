use crate::collections::{Event, EventState,EventVotes, Project};
use crate::errors::ErrorCode;
use anchor_lang::prelude::*;
use anchor_spl::token::*;

#[derive(Accounts)]
pub struct Redeem<'info> {
    pub authority: Signer<'info>,
    #[account(
        has_one = authority @ ErrorCode::OnlyTheProjectOwnerCanRedeem 
    )]
    pub project: Box<Account<'info, Project>>,
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
    pub accepted_mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub project_vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        seeds = [b"event_vault".as_ref(), event.key().as_ref()],
        bump = event.bumps.vault_bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        seeds = [b"event_votes".as_ref(), event.key().as_ref()],
        bump = event.bumps.votes_bump,
    )]
    pub event_votes: Box<Account<'info, EventVotes>>,
    pub token_program: Program<'info, Token>,
}

pub fn handle(ctx: Context<Redeem>) -> Result<()> {
    // Check if event has been redeemed
    if ctx.accounts.event_state.is_redeemed {
        return Err(error!(ErrorCode::AlreadyRedeemed));
    }

    // Check event redeem date
    let clock = Clock::get()?;
    if clock.unix_timestamp < ctx.accounts.event_state.redeem_date {
        return Err(error!(ErrorCode::CannotRedeemYet));
    }

    // Check project is winner
    let first_vote_stat = ctx.accounts.event_votes.votes_stats.first();
    let mut current_max_vote_stat = match first_vote_stat {
        Some(vote_stat) => vote_stat,
        None => return Err(error!(ErrorCode::CantRedeemEmptyEvent)),
    };
    ctx.accounts.event_votes.votes_stats.iter().for_each(|vote_stat| {
        if vote_stat.votes > current_max_vote_stat.votes {
            current_max_vote_stat = vote_stat;
        }
    });
    if ctx.accounts.project.key() != current_max_vote_stat.project {
        return Err(error!(ErrorCode::OnlyTheWinnerCanRedeem));
    }

    // Transfer from vault to project_vault
    let event_pubkey = ctx.accounts.event.key();
    let seeds = &[
        b"event_state",
        event_pubkey.as_ref(),
        &[ctx.accounts.event.bumps.state_bump],
    ];
    let signer = &[&seeds[..]];

    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.project_vault.to_account_info(),
                authority: ctx.accounts.event_state.to_account_info(),
            },
            signer,
        ),
        ctx.accounts.vault.amount,
    )?;

    // Mark event as redeemed
    ctx.accounts.event_state.is_redeemed = true;

    Ok(())
}
