import * as anchor from "@heavy-duty/anchor";
import { Program } from "@heavy-duty/anchor";
import { getAccount } from "@solana/spl-token";
import { assert } from "chai";
import { Decidooor } from "../target/types/decidooor";
import { createMint, createUserAndAssociatedWallet } from "./utils";

describe("decidooor", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Decidooor as Program<Decidooor>;
  const eventId = "PHH";
  const eventSize = 1000;
  const eventRedeemDate = new anchor.BN(Date.now());
  const projectKeypair = anchor.web3.Keypair.generate();
  const projectTitle = "project #1";
  const projectDescription = "project #1 description";
  const projectSize = 1000;
  const aliceBalance = 1000;
  const projectBalance = 1000;
  const amountToTransfer = 420;
  const amountToCharge = 110;
  let eventPublicKey: anchor.web3.PublicKey;
  let vaultPublicKey: anchor.web3.PublicKey;
  let eventMintPublicKey: anchor.web3.PublicKey;
  let acceptedMintPublicKey: anchor.web3.PublicKey;
  let alice: anchor.web3.Keypair, aliceWallet: anchor.web3.PublicKey;
  let aliceDonatorPublicKey: anchor.web3.PublicKey;
  let aliceDonatorVaultPublicKey: anchor.web3.PublicKey;
  let projectOwner: anchor.web3.Keypair;
  let projectVaultPublicKey: anchor.web3.PublicKey;

  before(async () => {
    acceptedMintPublicKey = await createMint(program.provider);
    [alice, aliceWallet] = await createUserAndAssociatedWallet(
      program.provider,
      acceptedMintPublicKey,
      aliceBalance
    );
    [projectOwner, projectVaultPublicKey] = await createUserAndAssociatedWallet(
      program.provider,
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
    [eventMintPublicKey] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("event_mint", "utf-8"), eventPublicKey.toBuffer()],
      program.programId
    );
    [aliceDonatorPublicKey] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("donator", "utf-8"),
        eventPublicKey.toBuffer(),
        alice.publicKey.toBuffer(),
      ],
      program.programId
    );
    [aliceDonatorVaultPublicKey] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("donator_vault", "utf-8"),
          aliceDonatorPublicKey.toBuffer(),
        ],
        program.programId
      );
  });

  it("should create events", async () => {
    // act
    await program.methods
      .createEvent(eventId, eventRedeemDate, eventSize)
      .accounts({
        authority: program.provider.wallet.publicKey,
        acceptedMint: acceptedMintPublicKey,
      })
      .rpc();
    // assert
    const eventAccount = await program.account.event.fetch(eventPublicKey);
    assert.ok(eventAccount.redeemDate.eq(eventRedeemDate));
    assert.ok(eventAccount.acceptedMint.equals(acceptedMintPublicKey));
    assert.ok(eventAccount.eventMint.equals(eventMintPublicKey));
    assert.ok(eventAccount.vault.equals(vaultPublicKey));
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
        projectVault: projectVaultPublicKey,
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
    await program.methods
      .deposit(new anchor.BN(amountToTransfer))
      .accounts({
        payer: aliceWallet,
        authority: alice.publicKey,
        event: eventPublicKey,
      })
      .signers([alice])
      .rpc();
    // assert
    const aliceDonatorVaultAccount = await getAccount(
      program.provider.connection,
      aliceDonatorVaultPublicKey
    );
    const aliceAccount = await getAccount(
      program.provider.connection,
      aliceWallet
    );
    const vaultAccount = await getAccount(
      program.provider.connection,
      vaultPublicKey
    );
    assert.equal(Number(aliceDonatorVaultAccount.amount), amountToTransfer);
    assert.equal(Number(aliceAccount.amount), aliceBalance - amountToTransfer);
    assert.equal(Number(vaultAccount.amount), amountToTransfer);
  });

  it("should vote", async () => {
    // act
    await program.methods
      .vote(new anchor.BN(amountToCharge))
      .accounts({
        event: eventPublicKey,
        authority: alice.publicKey,
        project: projectKeypair.publicKey,
      })
      .signers([alice])
      .rpc();
    // assert
    const aliceDonatorVaultAccount = await getAccount(
      program.provider.connection,
      aliceDonatorVaultPublicKey
    );
    const eventAccount = await program.account.event.fetch(eventPublicKey);
    assert.equal(
      Number(aliceDonatorVaultAccount.amount),
      amountToTransfer - amountToCharge
    );
    assert.ok(
      (eventAccount.votesStats as any)[0].votes.eq(
        new anchor.BN(amountToCharge)
      )
    );
  });
});
