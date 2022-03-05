import { Provider, web3 } from "@heavy-duty/anchor";

export const createFundedWallet = async (
  provider: Provider
): Promise<web3.Keypair> => {
  const user = new web3.Keypair();

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

  return user;
};
