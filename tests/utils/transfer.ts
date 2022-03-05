import { Provider, web3 } from "@heavy-duty/anchor";
import { createTransferInstruction } from "@solana/spl-token";

export const transfer = async (
  provider: Provider,
  fromPubkey: web3.PublicKey,
  toPubkey: web3.PublicKey,
  owner: web3.Keypair,
  amount: number
): Promise<string> => {
  return await provider.send(
    new web3.Transaction().add(
      createTransferInstruction(fromPubkey, toPubkey, owner.publicKey, amount)
    ),
    [owner]
  );
};
