use crate::collections::{Event, EventVotes, Participant, Project};
use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Vote<'info> {
    pub authority: Signer<'info>,
    pub event: Box<Account<'info, Event>>,
    #[account(
        mut,
        seeds = [
            b"event_votes".as_ref(),
            event.key().as_ref(),
        ],
        bump = event.bumps.votes_bump,
    )]
    pub event_votes: Account<'info, EventVotes>,
    #[account(
        constraint = project.event == event.key() @ ErrorCode::InvalidEvent
    )]
    pub project: Box<Account<'info, Project>>,
    #[account(
        mut,
        constraint = !participant.has_voted @ ErrorCode::ParticipantAlreadyVoted,
        has_one = authority @ ErrorCode::UnauthorizedVote
    )]
    pub participant: Box<Account<'info, Participant>>,
}

pub fn handle(ctx: Context<Vote>) -> Result<()> {
    // Burn participant to prevent double-votes
    ctx.accounts.participant.has_voted = true;

    // Check project is part of event vote stats and add to the event vote stats
    let vote_stats_index = ctx
        .accounts
        .event_votes
        .votes_stats
        .iter()
        .position(|a| a.project == ctx.accounts.project.key())
        .ok_or(error!(ErrorCode::InvalidProject))?;
    let vote_state = &mut ctx.accounts.event_votes.votes_stats[vote_stats_index];
    vote_state.votes += 1;

    Ok(())
}
