use anchor_lang::prelude::*;

declare_id!("C7EcdBmywF3p1CwMJntzFN81PNyaf92yKZbkseoPck8D");

mod collections;
mod errors;
mod instructions;

use instructions::*;

#[program]
pub mod decidooor {
    use super::*;

    pub fn create_event(
        ctx: Context<CreateEvent>,
        event_id: String,
        redeem_date: i64,
        capacity: u64,
        event_space: u32,
    ) -> Result<()> {
        instructions::create_event::handle(ctx, event_id, redeem_date, capacity, event_space)
    }

    pub fn check_in(ctx: Context<CheckIn>) -> Result<()> {
        instructions::check_in::handle(ctx)
    }

    pub fn create_project(
        ctx: Context<CreateProject>,
        arguments: CreateProjectArguments,
    ) -> Result<()> {
        instructions::create_project::handle(ctx, arguments)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handle(ctx, amount)
    }

    pub fn vote(ctx: Context<Vote>) -> Result<()> {
        instructions::vote::handle(ctx)
    }

    pub fn redeem(ctx: Context<Redeem>) -> Result<()> {
        instructions::redeem::handle(ctx)
    }
}
