import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { assert } from "chai";
import { Decidooor } from "../target/types/decidooor";

describe("decidooor", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Decidooor as Program<Decidooor>;
  const eventKeypair = anchor.web3.Keypair.generate();
  const eventSize = 1000;
  const eventRedeemDate = new anchor.BN(Date.now());
  const projectKeypair = anchor.web3.Keypair.generate();
  const projectTitle = "project #1";
  const projectDescription = "project #1 description";
  const projectSize = 1000;

  it("should create events", async () => {
    // act
    await program.methods
      .createEvent({
        redeemDate: eventRedeemDate,
      })
      .accounts({
        authority: program.provider.wallet.publicKey,
        event: eventKeypair.publicKey,
      })
      .signers([eventKeypair])
      .preInstructions([
        await program.account.event.createInstruction(eventKeypair, eventSize),
      ])
      .rpc();
    // assert
    const eventAccount = await program.account.event.fetch(
      eventKeypair.publicKey
    );
    assert.ok(eventAccount.redeemDate.eq(eventRedeemDate));
  });

  it("should create project", async () => {
    // act
    await program.methods
      .createProject({
        title: projectTitle,
        description: projectDescription,
      })
      .accounts({
        authority: program.provider.wallet.publicKey,
        event: eventKeypair.publicKey,
        project: projectKeypair.publicKey,
      })
      .signers([projectKeypair])
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
    const eventAccount = await program.account.event.fetch(
      eventKeypair.publicKey
    );
    assert.equal(projectAccount.title, projectTitle);
    assert.equal(projectAccount.description, projectDescription);
    assert.equal((eventAccount.votesStats as any).length, 1);
    assert.equal(
      (eventAccount.votesStats as any)[0].project.toBase58(),
      projectKeypair.publicKey
    );
    assert.equal((eventAccount.votesStats as any)[0].votes, 0);
  });
});
