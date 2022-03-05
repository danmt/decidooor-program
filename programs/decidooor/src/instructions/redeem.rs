use crate::collections::{Event, Project};
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
    #[account(mut)]
    pub event: Box<Account<'info, Event>>,
    pub accepted_mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub project_vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        seeds = [b"vault".as_ref(), event.key().as_ref()],
        bump = event.bumps.vault_bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

pub fn handle(ctx: Context<Redeem>) -> Result<()> {
    // Check if event has been redeemed
    if ctx.accounts.event.is_redeemed {
        return Err(error!(ErrorCode::AlreadyRedeemed));
    }

    // Check event redeem date
    let clock = Clock::get()?;
    if clock.unix_timestamp < ctx.accounts.event.redeem_date {
        return Err(error!(ErrorCode::CannotRedeemYet));
    }

    // Check project is winner
    let first_vote_stat = ctx.accounts.event.votes_stats.first();
    let mut current_max_vote_stat = match first_vote_stat {
        Some(vote_stat) => vote_stat,
        None => return Err(error!(ErrorCode::CantRedeemEmptyEvent)),
    };
    ctx.accounts.event.votes_stats.iter().for_each(|vote_stat| {
        if vote_stat.votes > current_max_vote_stat.votes {
            current_max_vote_stat = vote_stat;
        }
    });
    if ctx.accounts.project.key() != current_max_vote_stat.project {
        return Err(error!(ErrorCode::OnlyTheWinnerCanRedeem));
    }

    // Transfer from vault to project_vault
    let seeds = &[
        b"event",
        ctx.accounts.event.event_id.as_bytes(),
        ctx.accounts.event.authority.as_ref(),
        &[ctx.accounts.event.bumps.event_bump],
    ];
    let signer = &[&seeds[..]];

    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.project_vault.to_account_info(),
                authority: ctx.accounts.event.to_account_info(),
            },
            signer,
        ),
        ctx.accounts.vault.amount,
    )?;

    // Mark event as redeemed
    ctx.accounts.event.is_redeemed = true;

    Ok(())
}
