use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod decidooor {
    use super::*;

    pub fn create_event(ctx: Context<CreateEvent>, arguments: CreateEventArguments) -> Result<()> {
        ctx.accounts.event.redeem_date = arguments.redeem_date;
        ctx.accounts.event.votes_stats = Vec::new();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateEvent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(zero)]
    pub event: Account<'info, Event>,
}

#[account]
pub struct Event {
    pub redeem_date: i64,
    pub votes_stats: Vec<EventVotesStats>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EventVotesStats {
    pub project: Pubkey,
    pub votes: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateEventArguments {
    pub redeem_date: i64,
}
