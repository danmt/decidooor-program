import * as anchor from "@heavy-duty/anchor";
import { Program } from "@heavy-duty/anchor";
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
  const eventId = "PHH";
  const eventSize = 1000;
  const eventCapacity = new anchor.BN(200);
  const eventRedeemDate = new anchor.BN(Math.floor(Date.now() / 1000));
  const projectKeypair = anchor.web3.Keypair.generate();
  const projectTitle = "project #1";
  const projectDescription = "project #1 description";
  const projectSize = 1000;
  const participantKeypair = anchor.web3.Keypair.generate();
  const aliceBalance = 1000;
  const projectBalance = 1000;
  const amountToDeposit = 420;
  let eventPublicKey: anchor.web3.PublicKey;
  let vaultPublicKey: anchor.web3.PublicKey;
  let acceptedMintPublicKey: anchor.web3.PublicKey;
  let alice: anchor.web3.Keypair, aliceWallet: anchor.web3.PublicKey;
  let bob: anchor.web3.Keypair;
  let projectOwner: anchor.web3.Keypair,
    projectOwnerWallet: anchor.web3.PublicKey;

  before(async () => {
    acceptedMintPublicKey = await createMint(program.provider);
    bob = await createFundedWallet(program.provider);
    alice = await createFundedWallet(program.provider);
    aliceWallet = await createAssociatedTokenAccount(
      program.provider,
      alice,
      acceptedMintPublicKey,
      aliceBalance
    );
    projectOwner = await createFundedWallet(program.provider);
    projectOwnerWallet = await createAssociatedTokenAccount(
      program.provider,
      projectOwner,
      acceptedMintPublicKey,
      aliceBalance
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
    await program.methods
      .checkIn()
      .accounts({
        authority: bob.publicKey,
        participant: participantKeypair.publicKey,
        event: eventPublicKey,
      })
      .signers([participantKeypair, bob])
      .rpc();
    // assert
    const eventAccount = await program.account.event.fetch(eventPublicKey);
    const participantAccount = await program.account.participant.fetch(
      participantKeypair.publicKey
    );
    assert.ok(eventAccount.registeredParticipants.eq(new anchor.BN(1)));
    assert.ok(participantAccount.event.equals(eventPublicKey));
    assert.ok(participantAccount.authority.equals(bob.publicKey));
    assert.ok(!participantAccount.hasVoted);
  });

  it("should create project", async () => {
    // act
    await program.methods
      .createProject({
        title: projectTitle,
        description: projectDescription,
      })
      .accounts({
        authority: projectOwner.publicKey,
        event: eventPublicKey,
        project: projectKeypair.publicKey,
        acceptedMint: acceptedMintPublicKey,
        projectVault: projectOwnerWallet,
      })
      .signers([projectKeypair, projectOwner])
      .preInstructions([
        await program.account.project.createInstruction(
          projectKeypair,
          projectSize
        ),
      ])
      .rpc();
    // assert
    const projectAccount = await program.account.project.fetch(
      projectKeypair.publicKey
    );
    const eventAccount = await program.account.event.fetch(eventPublicKey);
    assert.equal(projectAccount.title, projectTitle);
    assert.equal(projectAccount.description, projectDescription);
    assert.ok(projectAccount.event.equals(eventPublicKey));
    assert.equal((eventAccount.votesStats as any).length, 1);
    assert.ok(
      (eventAccount.votesStats as any)[0].project.equals(
        projectKeypair.publicKey
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

  it("should vote", async () => {
    // act
    await program.methods
      .vote()
      .accounts({
        event: eventPublicKey,
        authority: bob.publicKey,
        project: projectKeypair.publicKey,
        participant: participantKeypair.publicKey,
      })
      .signers([bob])
      .rpc();
    // assert
    const eventAccount = await program.account.event.fetch(eventPublicKey);
    assert.ok((eventAccount.votesStats as any)[0].votes.eq(new anchor.BN(1)));
  });

  it("should redeem", async () => {
    // act
    await program.methods
      .redeem()
      .accounts({
        event: eventPublicKey,
        authority: projectOwner.publicKey,
        project: projectKeypair.publicKey,
        acceptedMint: acceptedMintPublicKey,
        projectVault: projectOwnerWallet,
      })
      .signers([projectOwner])
      .rpc();
    // assert
    const projectVaultAccount = await getAccount(
      program.provider.connection,
      projectOwnerWallet
    );
    assert.equal(
      Number(projectVaultAccount.amount),
      projectBalance + amountToDeposit
    );
  });
});
