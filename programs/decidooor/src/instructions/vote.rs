use anchor_lang::prelude::*;
use anchor_spl::token::*;
use crate::errors::ErrorCode;
use crate::collections::{Donator, Event, Project};

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Vote<'info> {
    pub authority: Signer<'info>,
    pub project: Box<Account<'info, Project>>,
    #[account(mut)]
    pub event: Box<Account<'info, Event>>,
    #[account(
        mut,
        seeds = [b"event_mint".as_ref(), event.key().as_ref()],
        bump = event.bumps.event_mint_bump,
    )]
    pub event_mint: Box<Account<'info, Mint>>,
    #[account(
        seeds = [
            b"donator".as_ref(),
            event.key().as_ref(), 
            authority.key().as_ref()
        ],
        bump = donator.bumps.donator_bump,
    )]
    pub donator: Box<Account<'info, Donator>>,
    #[account(
        mut,
        seeds = [
          b"donator_vault".as_ref(),
          donator.key().as_ref()
        ],
        bump = donator.bumps.donator_vault_bump,
    )]
    pub donator_vault: Box<Account<'info, TokenAccount>>, 
    #[account(
        mut,
        seeds = [b"vault".as_ref(), event.key().as_ref()],
        bump = event.bumps.vault_bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<Vote>, amount: u64) -> Result<()> {
    let seeds = &[
        b"event",
        ctx.accounts.event.event_id.as_bytes(),
        ctx.accounts.event.authority.as_ref(),
        &[ctx.accounts.event.bumps.event_bump],
    ];
    let signer = &[&seeds[..]];

    // First, we burn X amount of event token from the donator_vault
    burn(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.event_mint.to_account_info(),
                to: ctx.accounts.donator_vault.to_account_info(),
                authority: ctx.accounts.event.to_account_info(),
            },
            signer,
        ),
        amount,
    )?;
    
    // Check project is part of event vote stats and add to the event vote stats
    let vote_stats_index = ctx
       .accounts
       .event
       .votes_stats
       .iter()
       .position(|a| a.project == ctx.accounts.project.key())
       .ok_or(error!(ErrorCode::InvalidProject))?;
    let vote_state = &mut ctx.accounts.event.votes_stats[vote_stats_index];
    vote_state.votes = amount;
    Ok(())
}