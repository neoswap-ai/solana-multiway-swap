import { Program, web3 } from '@project-serum/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

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
