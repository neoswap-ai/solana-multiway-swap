import { Program, web3 } from "@project-serum/anchor";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";

/**
 * @notice creates instruction for claiming a Sol Item for a specific user
 * @param {Program} program program linked to NeoSwap
 * @param {PublicKey} user user that receives sol
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {PublicKey} swapDataAccount Swap's PDA
 * @param {Buffer} swapDataAccount_seed Seed linked to PDA
 * @param {number} swapDataAccount_bump Bump linked to PDA
 * @return {TransactionInstruction}instruction => TransactionInstruction for claiming sol for a specific User.
 */
export async function claimSol(Data: {
  program: Program;
  user: PublicKey;
  signer: PublicKey;
  swapDataAccount: PublicKey;
  swapDataAccount_seed: Buffer;
  swapDataAccount_bump: number;
}): Promise<{ instruction: TransactionInstruction }> {
  return {
    instruction: await Data.program.methods
      .claimSol(Data.swapDataAccount_seed, Data.swapDataAccount_bump)
      .accounts({
        systemProgram: web3.SystemProgram.programId,
        swapDataAccount: Data.swapDataAccount,
        user: Data.user,
        signer: Data.signer,
      })
      .instruction(),
  };
}

export default claimSol;
