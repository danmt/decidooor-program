import * as anchor from "@heavy-duty/anchor";
import { Program, ProgramError } from "@heavy-duty/anchor";
import { getAccount } from "@solana/spl-token";
import { assert } from "chai";
import { Decidooor } from "../target/types/decidooor";
import {
  createAssociatedTokenAccount,
  createFundedWallet,
  createMint,
  transfer,
} from "./utils";

describe("decidooor", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Decidooor as Program<Decidooor>;
  const eventSize = 1000;
  const eventId = "PHH";
  const eventCapacity = new anchor.BN(200);
  const eventRedeemDate = new anchor.BN(Math.floor(Date.now() / 1000));
  const projectSize = 1000;
  const projectBalance = 1000;
  const project1Keypair = anchor.web3.Keypair.generate();
  const project1Title = "project #1";
  const project1Description = "project #1 description";
  const project2Keypair = anchor.web3.Keypair.generate();
  const project2Title = "project #2";
  const project2Description = "project #2 description";
  const participant1Keypair = anchor.web3.Keypair.generate();
  const participant2Keypair = anchor.web3.Keypair.generate();
  const participant3Keypair = anchor.web3.Keypair.generate();
  const aliceBalance = 1000;
  const amountToDeposit = 420;
  let eventPublicKey: anchor.web3.PublicKey;
  let vaultPublicKey: anchor.web3.PublicKey;
  let acceptedMintPublicKey: anchor.web3.PublicKey;
  let alice: anchor.web3.Keypair, aliceWallet: anchor.web3.PublicKey;
  let participant1Owner: anchor.web3.Keypair;
  let participant2Owner: anchor.web3.Keypair;
  let participant3Owner: anchor.web3.Keypair;
  let project1Owner: anchor.web3.Keypair,
    project1OwnerWallet: anchor.web3.PublicKey;
  let project2Owner: anchor.web3.Keypair,
    project2OwnerWallet: anchor.web3.PublicKey;

  before(async () => {
    acceptedMintPublicKey = await createMint(program.provider);
    participant1Owner = await createFundedWallet(program.provider);
    participant2Owner = await createFundedWallet(program.provider);
    participant3Owner = await createFundedWallet(program.provider);
    alice = await createFundedWallet(program.provider);
    aliceWallet = await createAssociatedTokenAccount(
      program.provider,
      alice,
      acceptedMintPublicKey,
      aliceBalance
    );
    project1Owner = await createFundedWallet(program.provider);
    project1OwnerWallet = await createAssociatedTokenAccount(
      program.provider,
      project1Owner,
      acceptedMintPublicKey,
      projectBalance
    );
    project2Owner = await createFundedWallet(program.provider);
    project2OwnerWallet = await createAssociatedTokenAccount(
      program.provider,
      project2Owner,
      acceptedMintPublicKey,
      projectBalance
    );
    [eventPublicKey] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("event", "utf-8"),
        Buffer.from(eventId, "utf-8"),
        program.provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    [vaultPublicKey] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("vault", "utf-8"), eventPublicKey.toBuffer()],
      program.programId
    );
  });

  it("should create event", async () => {
    // act
    await program.methods
      .createEvent(
        eventId,
        eventRedeemDate,
        new anchor.BN(eventCapacity),
        eventSize
      )
      .accounts({
        authority: program.provider.wallet.publicKey,
        acceptedMint: acceptedMintPublicKey,
      })
      .rpc();
    // assert
    const eventAccount = await program.account.event.fetch(eventPublicKey);
    assert.ok(eventAccount.redeemDate.eq(eventRedeemDate));
    assert.ok(eventAccount.capacity.eq(eventCapacity));
    assert.ok(eventAccount.registeredParticipants.eq(new anchor.BN(0)));
    assert.ok(eventAccount.acceptedMint.equals(acceptedMintPublicKey));
    assert.ok(eventAccount.vault.equals(vaultPublicKey));
  });

  it("should check in participant", async () => {
    // act
    await Promise.all([
      program.methods
        .checkIn()
        .accounts({
          authority: participant1Owner.publicKey,
          participant: participant1Keypair.publicKey,
          event: eventPublicKey,
        })
        .signers([participant1Keypair, participant1Owner])
        .rpc(),
      program.methods
        .checkIn()
        .accounts({
          authority: participant2Owner.publicKey,
          participant: participant2Keypair.publicKey,
          event: eventPublicKey,
        })
        .signers([participant2Keypair, participant2Owner])
        .rpc(),
      program.methods
        .checkIn()
        .accounts({
          authority: participant3Owner.publicKey,
          participant: participant3Keypair.publicKey,
          event: eventPublicKey,
        })
        .signers([participant3Keypair, participant3Owner])
        .rpc(),
    ]);
    // assert
    const eventAccount = await program.account.event.fetch(eventPublicKey);
    const participant1Account = await program.account.participant.fetch(
      participant1Keypair.publicKey
    );
    assert.ok(eventAccount.registeredParticipants.eq(new anchor.BN(3)));
    assert.ok(participant1Account.event.equals(eventPublicKey));
    assert.ok(
      participant1Account.authority.equals(participant1Owner.publicKey)
    );
    assert.ok(!participant1Account.hasVoted);
  });

  it("should create project", async () => {
    // act
    await Promise.all([
      program.methods
        .createProject({
          title: project1Title,
          description: project1Description,
        })
        .accounts({
          authority: project1Owner.publicKey,
          event: eventPublicKey,
          project: project1Keypair.publicKey,
          acceptedMint: acceptedMintPublicKey,
          projectVault: project1OwnerWallet,
        })
        .signers([project1Keypair, project1Owner])
        .preInstructions([
          await program.account.project.createInstruction(
            project1Keypair,
            projectSize
          ),
        ])
        .rpc(),
      program.methods
        .createProject({
          title: project2Title,
          description: project2Description,
        })
        .accounts({
          authority: project2Owner.publicKey,
          event: eventPublicKey,
          project: project2Keypair.publicKey,
          acceptedMint: acceptedMintPublicKey,
          projectVault: project2OwnerWallet,
        })
        .signers([project2Keypair, project2Owner])
        .preInstructions([
          await program.account.project.createInstruction(
            project2Keypair,
            projectSize
          ),
        ])
        .rpc(),
    ]);
    // assert
    const projectAccount = await program.account.project.fetch(
      project1Keypair.publicKey
    );
    const eventAccount = await program.account.event.fetch(eventPublicKey);
    assert.equal(projectAccount.title, project1Title);
    assert.equal(projectAccount.description, project1Description);
    assert.ok(projectAccount.event.equals(eventPublicKey));
    assert.equal((eventAccount.votesStats as any).length, 2);
    assert.ok(
      (eventAccount.votesStats as any)[0].project.equals(
        project1Keypair.publicKey
      )
    );
    assert.equal((eventAccount.votesStats as any)[0].votes, 0);
  });

  it("should deposit", async () => {
    // act
    await transfer(
      program.provider,
      aliceWallet,
      vaultPublicKey,
      alice,
      amountToDeposit
    );
    // assert
    const aliceAccount = await getAccount(
      program.provider.connection,
      aliceWallet
    );
    const vaultAccount = await getAccount(
      program.provider.connection,
      vaultPublicKey
    );
    assert.equal(Number(aliceAccount.amount), aliceBalance - amountToDeposit);
    assert.equal(Number(vaultAccount.amount), amountToDeposit);
  });

  it("should fail on unauthorized vote", async () => {
    let error: ProgramError;
    // act
    try {
      await program.methods
        .vote()
        .accounts({
          event: eventPublicKey,
          authority: participant2Owner.publicKey,
          project: project1Keypair.publicKey,
          participant: participant1Keypair.publicKey,
        })
        .signers([participant2Owner])
        .rpc();
    } catch (err) {
      error = err as ProgramError;
    }
    // assert
    assert.equal(error.msg, "Unauthorized vote");
  });

  it("should fail when event is invalid", async () => {
    let error: ProgramError;
    const event2Id = "PHH2";
    const event2Capacity = new anchor.BN(200);
    const event2RedeemDate = new anchor.BN(Math.floor(Date.now() / 1000));
    const participantKeypair = anchor.web3.Keypair.generate();
    const [event2PublicKey] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("event", "utf-8"),
        Buffer.from(event2Id, "utf-8"),
        program.provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    const participantOwner = await createFundedWallet(program.provider);
    // act
    await program.methods
      .createEvent(
        event2Id,
        event2RedeemDate,
        new anchor.BN(event2Capacity),
        eventSize
      )
      .accounts({
        authority: program.provider.wallet.publicKey,
        acceptedMint: acceptedMintPublicKey,
      })
      .rpc();
    await program.methods
      .checkIn()
      .accounts({
        authority: participantOwner.publicKey,
        participant: participantKeypair.publicKey,
        event: eventPublicKey,
      })
      .signers([participantKeypair, participantOwner])
      .rpc();
    try {
      await program.methods
        .vote()
        .accounts({
          event: event2PublicKey,
          authority: participantOwner.publicKey,
          project: project1Keypair.publicKey,
          participant: participantKeypair.publicKey,
        })
        .signers([participantOwner])
        .rpc();
    } catch (err) {
      error = err as ProgramError;
    }
    // assert
    assert.equal(error.msg, "Invalid event");
  });

  it("should vote", async () => {
    // act
    await program.methods
      .vote()
      .accounts({
        event: eventPublicKey,
        authority: participant1Owner.publicKey,
        project: project1Keypair.publicKey,
        participant: participant1Keypair.publicKey,
      })
      .signers([participant1Owner])
      .rpc();
    await program.methods
      .vote()
      .accounts({
        event: eventPublicKey,
        authority: participant2Owner.publicKey,
        project: project2Keypair.publicKey,
        participant: participant2Keypair.publicKey,
      })
      .signers([participant2Owner])
      .rpc();
    await program.methods
      .vote()
      .accounts({
        event: eventPublicKey,
        authority: participant3Owner.publicKey,
        project: project2Keypair.publicKey,
        participant: participant3Keypair.publicKey,
      })
      .signers([participant3Owner])
      .rpc();
    // assert
    const eventAccount = await program.account.event.fetch(eventPublicKey);
    assert.ok((eventAccount.votesStats as any)[0].votes.eq(new anchor.BN(1)));
    assert.ok((eventAccount.votesStats as any)[1].votes.eq(new anchor.BN(2)));
  });

  it("should fail when participant already voted", async () => {
    let error: ProgramError;
    // act
    try {
      await program.methods
        .vote()
        .accounts({
          event: eventPublicKey,
          authority: participant1Owner.publicKey,
          project: project1Keypair.publicKey,
          participant: participant1Keypair.publicKey,
        })
        .signers([participant1Owner])
        .rpc();
    } catch (err) {
      error = err as ProgramError;
    }
    // assert
    assert.equal(error.msg, "Participant already voted");
  });

  it("should fail when redeeming non winning project", async () => {
    // arrange
    let error: ProgramError;
    // act
    try {
      await program.methods
        .redeem()
        .accounts({
          event: eventPublicKey,
          authority: project1Owner.publicKey,
          project: project1Keypair.publicKey,
          acceptedMint: acceptedMintPublicKey,
          projectVault: project1OwnerWallet,
        })
        .signers([project1Owner])
        .rpc();
    } catch (err) {
      error = err as ProgramError;
    }
    // assert
    assert.equal(error.msg, "Only the winner can redeem");
  });

  it("should redeem", async () => {
    // act
    await program.methods
      .redeem()
      .accounts({
        event: eventPublicKey,
        authority: project2Owner.publicKey,
        project: project2Keypair.publicKey,
        acceptedMint: acceptedMintPublicKey,
        projectVault: project2OwnerWallet,
      })
      .signers([project2Owner])
      .rpc();
    // assert
    const projectVaultAccount = await getAccount(
      program.provider.connection,
      project2OwnerWallet
    );
    const eventAccount = await program.account.event.fetch(eventPublicKey);
    assert.ok(eventAccount.isRedeemed);
    assert.equal(
      Number(projectVaultAccount.amount),
      projectBalance + amountToDeposit
    );
  });

  it("should fail when redeeming after event was redeemed", async () => {
    // arrange
    let error: ProgramError;
    // act
    try {
      await program.methods
        .redeem()
        .accounts({
          event: eventPublicKey,
          authority: project2Owner.publicKey,
          project: project2Keypair.publicKey,
          acceptedMint: acceptedMintPublicKey,
          projectVault: project2OwnerWallet,
        })
        .signers([project2Owner])
        .rpc();
    } catch (err) {
      error = err as ProgramError;
    }
    // assert
    assert.equal(error.msg, "Already redeemed");
  });

  it("should fail when redeeming before established date", async () => {
    let error: ProgramError;
    const event3Id = "PHH3";
    const event3Capacity = new anchor.BN(200);
    const event3RedeemDate = new anchor.BN(Math.floor((Date.now() * 2) / 1000));
    const participantKeypair = anchor.web3.Keypair.generate();
    const [event3PublicKey] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("event", "utf-8"),
        Buffer.from(event3Id, "utf-8"),
        program.provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    const participantOwner = await createFundedWallet(program.provider);
    // act
    await program.methods
      .createEvent(
        event3Id,
        event3RedeemDate,
        new anchor.BN(event3Capacity),
        eventSize
      )
      .accounts({
        authority: program.provider.wallet.publicKey,
        acceptedMint: acceptedMintPublicKey,
      })
      .rpc();
    try {
      await program.methods
        .redeem()
        .accounts({
          event: event3PublicKey,
          authority: project2Owner.publicKey,
          project: project2Keypair.publicKey,
          acceptedMint: acceptedMintPublicKey,
          projectVault: project2OwnerWallet,
        })
        .signers([project2Owner])
        .rpc();
    } catch (err) {
      error = err as ProgramError;
    }
    // assert
    assert.equal(error.msg, "Cannot redeem yet");
  });
});
