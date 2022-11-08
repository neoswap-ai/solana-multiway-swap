import {  Program, web3 } from '@project-serum/anchor';
import { PublicKey, Transaction } from '@solana/web3.js';
import convertAllTransaction from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';

/**
 * @notice creates instruction for validating the swap's PDA data and proceeding to depositing status
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}validateInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const validateInitialize = async (Data: {
    swapData: SwapData;
    signer: PublicKey;
    CONST_PROGRAM: string;
    program: Program;
}): Promise<{
    validateInitSendAllArray: Array<{
        tx: web3.Transaction;
        signers?: Array<web3.Signer> | undefined;
    }>;
}> => {
    if (!Data.program.provider.sendAndConfirm) throw console.error('no sendAndConfirm');

    const seedSwapData = await getSeedFromData({
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataGiven: Data.swapData,
    });

    const firstTx = await Data.program.methods
        .validateInitialize(seedSwapData.swapDataAccount_seed, seedSwapData.swapDataAccount_bump)
        .accounts({
            swapDataAccount: seedSwapData.swapDataAccount,
            signer: Data.signer,
        })
        .instruction();

    let verifInitTransaction: Transaction = new Transaction().add(firstTx);

    const validateInitSendAllArray = await convertAllTransaction([verifInitTransaction]);
    console.log('validateInitTransaction Added');

    return { validateInitSendAllArray };
};

export default validateInitialize;
