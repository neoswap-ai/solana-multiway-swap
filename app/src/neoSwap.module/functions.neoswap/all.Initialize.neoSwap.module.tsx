import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Signer, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { CONST_PROGRAM, splAssociatedTokenAccountProgramId } from '../utils.neoSwap/const.neoSwap';
import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { SwapData } from '../utils.neoSwap/types.neoSwap';
import { saddInitialize } from './sadd.Initialize.neoSwap.module';
import { initInitialize } from './init.Initialize.neoSwap.module';
import { verifyInitialize } from './verif.Initialize.neoSwap.module';

export const allInitialize = async (Data: {
    swapData: SwapData;
    signer: PublicKey;
    program: Program;
    // CONST_PROGRAM: string;
    // swapDataAccount: PublicKey;
}): Promise<{
    initinitTransactionSendAllArray: Array<{
        tx: web3.Transaction;
        signers?: web3.Signer[] | undefined;
    }>;
    verifyTransactionSendAllArray: Array<{
        tx: web3.Transaction;
        signers?: web3.Signer[] | undefined;
    }>;
}> => {
    const { initInitTransaction } = await initInitialize({
        program: Data.program,
        signer: Data.signer,
        swapData: Data.swapData,
    });
    const { addInitTransaction } = await saddInitialize({
        program: Data.program,
        signer: Data.signer,
        swapData: Data.swapData,
    });
    const { verifInitTransaction } = await verifyInitialize({
        program: Data.program,
        signer: Data.signer,
        swapData: Data.swapData,
    });
    console.log('addInitTransaction.length', addInitTransaction.length);

    const alltransaction = [initInitTransaction, ...addInitTransaction, verifInitTransaction];
    console.log('alltransaction.length', alltransaction.length);
    const initinitTransactionSendAllArray = await convertAllTransaction(Data.program, alltransaction);
    const verifyTransactionSendAllArray = await convertAllTransaction(Data.program, [verifInitTransaction]);
    return { initinitTransactionSendAllArray, verifyTransactionSendAllArray };
};
