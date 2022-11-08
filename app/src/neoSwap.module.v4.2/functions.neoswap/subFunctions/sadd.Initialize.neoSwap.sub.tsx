import {  Program } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import { appendTransactionToArray } from '../../utils.neoSwap/appendTransactionToArray.neosap';
import { convertAllTransaction } from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';

/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data. 
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const saddInitialize = async (Data: {
    swapData: SwapData;
    signer: PublicKey;
    CONST_PROGRAM: string;
    program: Program;
}): Promise<{
    addInitSendAllArray: Array<{
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }>;
}> => {
    if (Data.swapData.status !== 80) throw console.error('Trade not in waiting for initialized state');

    const seedSwapData = await getSeedFromData({
        swapDataGiven: Data.swapData,
        CONST_PROGRAM: Data.CONST_PROGRAM,
    });

    let addInitTransactionInstruction: Array<TransactionInstruction> = [];
    for (let item = 1; item < Data.swapData.items.length; item++) {
        console.log('XXXXXXX - added to init item n° ', item, ' XXXXXXX');
        const instructionToAdd = await Data.program.methods
            .initializeAdd(
                seedSwapData.swapDataAccount_seed,
                seedSwapData.swapDataAccount_bump,
                Data.swapData.items[item]
            )
            .accounts({
                swapDataAccount: seedSwapData.swapDataAccount,
                signer: Data.signer.toString(),
            })
            .instruction();
        addInitTransactionInstruction.push(instructionToAdd);
    }
    let addInitTransaction: Transaction[] = [new Transaction()];
    addInitTransaction = appendTransactionToArray({
        mainArray: addInitTransaction,
        itemToAdd: addInitTransactionInstruction,
    });

    const addInitSendAllArray = await convertAllTransaction(addInitTransaction);

    return { addInitSendAllArray };
};

export default saddInitialize;
