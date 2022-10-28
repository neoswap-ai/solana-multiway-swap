import { Program, web3 } from '@project-serum/anchor';
import { PublicKey, Transaction } from '@solana/web3.js';
import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { SwapData } from '../utils.neoSwap/types.neoSwap';

export const validateInitialize = async (Data: {
    signer: PublicKey;
    program: Program;
    swapData: SwapData;
    // swapDataAccount: PublicKey;
}): Promise<{
    validateInitSendAllArray: Array<{
        tx: web3.Transaction;
        signers?: Array<web3.Signer> | undefined;
    }>;
}> => {
    if (!Data.program.provider.sendAndConfirm) throw console.error('no sendAndConfirm');

    const seedSwapData = await getSeedFromData({
        program: Data.program,
        swapData: Data.swapData,
    });

    const firstTx = await Data.program.methods
        .validateInitialize(seedSwapData.swapDataAccount_seed, seedSwapData.swapDataAccount_bump)
        .accounts({
            swapDataAccount: seedSwapData.swapDataAccount,
            signer: Data.signer,
        })
        .instruction();

    let verifInitTransaction: Transaction = new Transaction().add(firstTx);

    const validateInitSendAllArray = await convertAllTransaction(Data.program, [verifInitTransaction]);
    console.log("validateInitTransaction Added");

    return { validateInitSendAllArray };
};
