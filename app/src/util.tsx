// import * as BufferLayout from "buffer-layout";

import { Program, Provider, web3 } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
export const TokenInstructions =
  require("@project-serum/serum").TokenInstructions;

/// VAR CONST
export const TOKEN_PROGRAM_ID = new web3.PublicKey(
  TokenInstructions.TOKEN_PROGRAM_ID.toString()
);
export const splAssociatedTokenAccountProgramId = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export const opts = {
  preflightCommitment: "confirmed" as any,
};
///

export type SwapData = {
  initializer: PublicKey;
  isComplete: boolean;
  userA: PublicKey;
  // userAAmount: Number;
  userANft1: PublicKey;
  userANft2: PublicKey;
  userB: PublicKey;
  // userBAmount: Number;
  userBNft: PublicKey;
  userC: PublicKey;
  // userCAmount: Number;
  userCNft: PublicKey;
};

export async function create3TokenAccount(
  provider: Provider,
  mint: PublicKey,
  owner: PublicKey
): Promise<{
  signature: any;
  acc1: PublicKey;
  acc2: PublicKey;
  acc3: PublicKey;
}> {
  const vault1 = web3.Keypair.generate();
  const vault2 = web3.Keypair.generate();
  const vault3 = web3.Keypair.generate();
  const tx = new web3.Transaction().add(
    ...(await createTokenAccountInstrs(provider, vault1.publicKey, mint, owner),
    await createTokenAccountInstrs(provider, vault2.publicKey, mint, owner),
    await createTokenAccountInstrs(provider, vault3.publicKey, mint, owner))
  );
  const signature = await provider.send(tx, [vault1, vault2, vault3]);
  return {
    signature: signature,
    acc1: vault1.publicKey,
    acc2: vault2.publicKey,
    acc3: vault3.publicKey,
  };
}

export async function createTokenAccountInstrs(
  provider: Provider,
  newAccountPubkey: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  lamports?: number
) {
  if (lamports === undefined) {
    lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
  }
  return [
    web3.SystemProgram.createAccount({
      fromPubkey: provider.wallet.publicKey,
      newAccountPubkey,
      space: 165,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    TokenInstructions.initializeAccount({
      account: newAccountPubkey,
      mint,
      owner,
    }),
  ];
}

export async function getUserMint(program: Program, mint: PublicKey) {
  return await program.provider.connection.getTokenAccountsByOwner(
    program.provider.wallet.publicKey,
    {
      mint: mint,
    }
  );
}

export async function getAtaPda(pda: PublicKey, mint: PublicKey) {
  return await PublicKey.findProgramAddress(
    [pda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    splAssociatedTokenAccountProgramId
  );
}
