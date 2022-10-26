import { Program } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import { appendTransactionToArray } from '../utils.neoSwap/appendTransactionToArray.neosap';
import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { SwapData } from '../utils.neoSwap/types.neoSwap';

export const saddInitialize = async (Data: {
    swapData: SwapData;
    signer: PublicKey;
    program: Program;
    // CONST_PROGRAM: string;
    // swapDataAccount: PublicKey;
}): Promise<{
    addInitSendAllArray: Array<{
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }>;
}> => {
    // if (!Data.program.provider.sendAndConfirm) throw console.error('no sendAndConfirm');
    if (Data.swapData.status !== 80) throw console.error('Trade not in waiting for initialized state');

    const seedSwapData = await getSeedFromData({
        swapData: Data.swapData,
        program: Data.program,
    });

    let addInitTransactionInstruction: Array<TransactionInstruction> = [];
    for (let item = 1; item < Data.swapData.items.length; item++) {
        console.log('XXXXXXX - added to init item n° ', item -1, ' XXXXXXX');
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

    const addInitSendAllArray = await convertAllTransaction(Data.program, addInitTransaction);

    return { addInitSendAllArray };
};
