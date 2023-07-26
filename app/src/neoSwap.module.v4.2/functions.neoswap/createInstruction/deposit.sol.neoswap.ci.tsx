import { Program, web3 } from "@project-serum/anchor";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";

/**
 * @notice creates instruction for depositing a Sol Item
 * @param {Program} program program linked to NeoSwap
 * @param {PublicKey} from user that sends sol
 * @param {PublicKey} to destinaru of sol transfer (should be PDA)
 * @param {Buffer} swapDataAccount_seed Seed linked to PDA
 * @param {number} swapDataAccount_bump Bump linked to PDA
 * @return {TransactionInstruction}instruction => TransactionInstruction for depositing sol.
 */
export async function depositSol(Data: {
  program: Program;
  from: PublicKey;
  to: PublicKey;
  swapDataAccount_seed: Buffer;
  // swapDataAccount_bump: number;
}): Promise<{ instruction: TransactionInstruction }> {
  // console.log('deposit Sol Tx added');
  return {
    instruction: await Data.program.methods
      .depositSol(Data.swapDataAccount_seed)
      .accounts({
        systemProgram: web3.SystemProgram.programId,
        swapDataAccount: Data.to,
        signer: Data.from,
      })
      .instruction(),
  };
}
export default depositSol;
