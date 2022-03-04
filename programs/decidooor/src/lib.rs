use anchor_lang::prelude::*;

declare_id!("C7EcdBmywF3p1CwMJntzFN81PNyaf92yKZbkseoPck8D");

mod collections;
mod instructions;

use instructions::*;

#[program]
pub mod decidooor {
    use super::*;

    pub fn create_event(
        ctx: Context<CreateEvent>,
        event_id: String,
        redeem_date: i64,
        event_space: u32,
    ) -> Result<()> {
        instructions::create_event::handle(ctx, event_id, redeem_date, event_space)
    }

    pub fn create_project(
        ctx: Context<CreateProject>,
        arguments: CreateProjectArguments,
    ) -> Result<()> {
        instructions::create_project::handle(ctx, arguments)
    }
}
