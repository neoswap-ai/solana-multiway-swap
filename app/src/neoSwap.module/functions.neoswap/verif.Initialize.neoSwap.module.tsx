import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { splAssociatedTokenAccountProgramId } from '../utils.neoSwap/const.neoSwap';
import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData, getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { SwapData } from '../utils.neoSwap/types.neoSwap';

export const verifyInitialize = async (Data: {
    signer: PublicKey;
    program: Program;
    swapData: SwapData;
    // swapDataAccount: PublicKey;
}): Promise<{
    verifInitSendAllArray: Array<{
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

    const verifInitSendAllArray = await convertAllTransaction(Data.program, [verifInitTransaction]);

    return { verifInitSendAllArray };
};
