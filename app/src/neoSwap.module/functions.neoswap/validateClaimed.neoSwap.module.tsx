import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { splAssociatedTokenAccountProgramId } from '../utils.neoSwap/const.neoSwap';
import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { SwapData } from '../utils.neoSwap/types.neoSwap';

export const validateClaimed = async (Data: {
    signer: PublicKey;
    program: Program;
    // CONST_PROGRAM: string;
    // programId: PublicKey;
    swapDataAccount: PublicKey;
}): Promise<{
    validateClaimedSendAll: {
        tx: web3.Transaction;
        signers?: web3.Signer[] | undefined;
    }[];
}> => {
    const {  swapDataAccount_seed, swapDataAccount_bump } = await getSwapDataFromPDA({
        swapDataAccount: Data.swapDataAccount,
        program: Data.program,
    });

    // if (swapData.status !== 1) throw console.error('Trade not in waiting to be changed to claimed');

        const validateClaimedTransaction = new Transaction().add(
            await Data.program.methods
                .validateClaimed(swapDataAccount_seed, swapDataAccount_bump)
                .accounts({
                    systemProgram: web3.SystemProgram.programId,
                    splTokenProgram: splAssociatedTokenAccountProgramId,
                    swapDataAccount: Data.swapDataAccount,
                    signer: Data.signer,
                })
                .instruction()
        );

        // console.log('validateClaimedTransaction :', validateClaimedTransaction);
        const validateClaimedSendAll = await convertAllTransaction(Data.program, [validateClaimedTransaction]);
        return { validateClaimedSendAll };
};