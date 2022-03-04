use anchor_lang::prelude::*;
use anchor_spl::token::*;

use crate::collections::Event;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Deposit<'info> {
    pub event: Box<Account<'info, Event>>,
    #[account(
        mut,
        seeds = [b"event_mint".as_ref(), event.key().as_ref()],
        bump = event.bumps.event_mint_bump,
    )]
    pub event_mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub payer: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [
          b"donator".as_ref(),
          event.key().as_ref(), 
          authority.key().as_ref()
        ],
        bump,
        token::mint = event_mint,
        token::authority = event,
    )]
    pub donator_vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        seeds = [b"vault".as_ref(), event.key().as_ref()],
        bump = event.bumps.vault_bump,
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<Deposit>, amount: u64) -> Result<()> {
  let seeds = [
    "event".as_bytes(),
    ctx.accounts.event.event_id.as_bytes(),
    ctx.accounts.event.authority.as_ref(),
    &[ctx.accounts.event.bumps.event_bump],
  ];
  let signer = &[&seeds[..]];

  // Charge the accepted_token amount from payer
  transfer(
    CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      Transfer {
        from: ctx.accounts.payer.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
      },
    ),
    amount,
  )?;

  // Transfer the equivalent event_token to donator vault
  mint_to(
    CpiContext::new_with_signer(
      ctx.accounts.token_program.to_account_info(),
      MintTo {
        mint: ctx.accounts.event_mint.to_account_info(),
        to: ctx.accounts.donator_vault.to_account_info(),
        authority: ctx.accounts.event.to_account_info(),
      },
      signer,
    ),
    amount,
  )?;

  Ok(())
}