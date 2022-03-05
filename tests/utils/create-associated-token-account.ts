import { Provider, web3 } from "@heavy-duty/anchor";
import {
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

export const createAssociatedTokenAccount = async (
  provider: Provider,
  authority: web3.Keypair,
  mint: web3.PublicKey,
  amount: number
): Promise<web3.PublicKey | undefined> => {
  const associatedTokenPublicKey = await getAssociatedTokenAddress(
    mint,
    authority.publicKey
  );

  // Create a token account for the user and mint some tokens
  await provider.send(
    new web3.Transaction()
      .add(
        createAssociatedTokenAccountInstruction(
          authority.publicKey,
          associatedTokenPublicKey,
          authority.publicKey,
          mint
        )
      )
      .add(
        createMintToInstruction(
          mint,
          associatedTokenPublicKey,
          provider.wallet.publicKey,
          amount
        )
      ),
    [authority]
  );

  return associatedTokenPublicKey;
};
