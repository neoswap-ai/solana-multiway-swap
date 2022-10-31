import { Program, web3 } from '@project-serum/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

export async function depositSol(Data: {
    program: Program;
    from: PublicKey;
    to: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
}): Promise<{ instruction: TransactionInstruction }> {
    // console.log('deposit Sol Tx added');
    return {
        instruction: await Data.program.methods
            .depositSol(Data.swapDataAccount_seed, Data.swapDataAccount_bump)
            .accounts({
                systemProgram: web3.SystemProgram.programId,
                swapDataAccount: Data.to,
                signer: Data.from,
            })
            .instruction(),
    };
}
