import { findOrCreateAta } from "../../utils.neoSwap/findOrCreateAta.neoSwap";
import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { types } from 'secretjs';
import { CONST_PROGRAM } from '../../utils.neoSwap/const.neoSwap';




export async function claimSol(Data: {
    program: Program;
    user: PublicKey;
    signer: PublicKey;
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
}): Promise<{ transaction: Transaction }> {
    console.log('claim Sol Tx added');
    return {
        transaction: new Transaction().add(
            await Data.program.methods
                .claimSol(Data.swapDataAccount_seed, Data.swapDataAccount_bump)
                .accounts({
                    systemProgram: web3.SystemProgram.programId,
                    swapDataAccount: Data.swapDataAccount,
                    user: Data.user,
                    signer: Data.signer,
                })
                .instruction()
        ),
    };
}
