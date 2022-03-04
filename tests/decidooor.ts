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
});
