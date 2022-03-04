import { Provider, web3 } from "@heavy-duty/anchor";
import {
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

export const createUserAndAssociatedWallet = async (
  provider: Provider,
  mint: web3.PublicKey,
  amount: number
): Promise<[web3.Keypair, web3.PublicKey | undefined]> => {
  const user = new web3.Keypair();
  const userAssociatedTokenAccount = await getAssociatedTokenAddress(
    mint,
    user.publicKey
  );

  // Fund user with some SOL
  await provider.send(
    new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: user.publicKey,
        lamports: 5 * web3.LAMPORTS_PER_SOL,
      })
    )
  );

  // Create a token account for the user and mint some tokens
  await provider.send(
    new web3.Transaction()
      .add(
        createAssociatedTokenAccountInstruction(
          user.publicKey,
          userAssociatedTokenAccount,
          user.publicKey,
          mint
        )
      )
      .add(
        createMintToInstruction(
          mint,
          userAssociatedTokenAccount,
          provider.wallet.publicKey,
          amount
        )
      ),
    [user]
  );

  return [user, userAssociatedTokenAccount];
};
