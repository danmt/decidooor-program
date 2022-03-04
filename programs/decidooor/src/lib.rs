use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

mod collections;
mod instructions;

use instructions::*;

#[program]
pub mod decidooor {
    use super::*;

    pub fn create_event(ctx: Context<CreateEvent>, arguments: CreateEventArguments) -> Result<()> {
        instructions::create_event::handle(ctx, arguments)
    }

    pub fn create_project(
        ctx: Context<CreateProject>,
        arguments: CreateProjectArguments,
    ) -> Result<()> {
        instructions::create_project::handle(ctx, arguments)
    }
}
