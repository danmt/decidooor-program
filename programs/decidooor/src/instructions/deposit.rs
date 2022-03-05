use crate::collections::Event;
use anchor_lang::prelude::*;
use anchor_spl::token::*;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Deposit<'info> {
  pub event: Box<Account<'info, Event>>,
  #[account(mut)]
  pub payer: Box<Account<'info, TokenAccount>>,
  #[account(
    mut,
    seeds = [b"vault".as_ref(), event.key().as_ref()],
    bump = event.bumps.vault_bump,
  )]
  pub vault: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub authority: Signer<'info>,
  pub token_program: Program<'info, Token>,
}

pub fn handle(ctx: Context<Deposit>, amount: u64) -> Result<()> {
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

  Ok(())
}
