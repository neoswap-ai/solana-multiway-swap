import { findOrCreateAta } from "../../utils.neoSwap/findOrCreateAta.neoSwap";
import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { CONST_PROGRAM } from '../../utils.neoSwap/const.neoSwap';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";



export async function depositSol(
    program: Program,
    from: PublicKey,
    to: PublicKey,
    swapDataAccount_seed: Buffer,
    swapDataAccount_bump: number
): Promise<Transaction> {
    console.log('deposit Sol Tx added');
    return new Transaction().add(
        await program.methods
            .depositSol(swapDataAccount_seed, swapDataAccount_bump)
            .accounts({
                systemProgram: web3.SystemProgram.programId,
                swapDataAccount: to,
                signer: from,
            })
            .instruction()
    );
}
