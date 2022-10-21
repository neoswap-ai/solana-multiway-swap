import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { splAssociatedTokenAccountProgramId } from '../utils.neoSwap/const.neoSwap';
import { getSeedFromSwapData } from '../utils.neoSwap/getSeed.neoSwap';
import { SwapData } from '../utils.neoSwap/types.neoSwap';

export const validateClaimed = async (vData: {
    userPublickey: PublicKey;
    program: Program;
    programId: PublicKey;
    swapDataAccount: PublicKey;
}): Promise<{ validateClaimedTransaction: Transaction }> => {
    const swapData: SwapData = (await vData.program.account.swapData.fetch(vData.swapDataAccount)) as SwapData;
    // console.log('swapData', swapData);
    if (swapData.status !== 1) throw console.error('Trade not in waiting to be changed to claimed');

    const { swapDataAccount, swapDataAccount_seed_string, swapDataAccount_seed_buffer, swapDataAccount_bump } =
        await getSeedFromSwapData({ swapData, programId: vData.programId });

    try {
        const validateClaimedTransaction = new Transaction().add(
            await vData.program.methods
                .validateClaimed(swapDataAccount_seed_buffer, swapDataAccount_bump)
                .accounts({
                    systemProgram: web3.SystemProgram.programId,
                    splTokenProgram: splAssociatedTokenAccountProgramId,
                    swapDataAccount: swapDataAccount,
                    signer: vData.userPublickey,
                })
                .instruction()
        );

        // console.log('validateClaimedTransaction :', validateClaimedTransaction);
        return { validateClaimedTransaction };
    } catch (error) {
        throw error;
    }
};
