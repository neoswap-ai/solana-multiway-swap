import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { splAssociatedTokenAccountProgramId } from '../utils.neoSwap/const.neoSwap';
import { getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { SwapData } from '../utils.neoSwap/types.neoSwap';

export const validateClaimed = async (Data: {
    userPublickey: PublicKey;
    program: Program;
    // CONST_PROGRAM: string;
    // programId: PublicKey;
    swapDataAccount: PublicKey;
}): Promise<{ validateClaimedTransaction: Transaction }> => {
    const { swapData, swapDataAccount_seed, swapDataAccount_bump } = await getSwapDataFromPDA({
        swapDataAccount: Data.swapDataAccount,
        program: Data.program,
    });

    if (swapData.status !== 1) throw console.error('Trade not in waiting to be changed to claimed');

    try {
        const validateClaimedTransaction = new Transaction().add(
            await Data.program.methods
                .validateClaimed(swapDataAccount_seed, swapDataAccount_bump)
                .accounts({
                    systemProgram: web3.SystemProgram.programId,
                    splTokenProgram: splAssociatedTokenAccountProgramId,
                    swapDataAccount: Data.swapDataAccount,
                    signer: Data.userPublickey,
                })
                .instruction()
        );

        // console.log('validateClaimedTransaction :', validateClaimedTransaction);
        return { validateClaimedTransaction };
    } catch (error) {
        throw error;
    }
};
