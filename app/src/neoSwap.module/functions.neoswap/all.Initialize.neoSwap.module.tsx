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
    allInitSendAllArray: Array<{
        tx: Transaction;
        signers?: Signer[] | undefined;
    }>;
    
}> => {
    const { initinitSendAllArray } = await initInitialize({
        program: Data.program,
        signer: Data.signer,
        swapData: Data.swapData,
    });
    const { addInitSendAllArray } = await saddInitialize({
        program: Data.program,
        signer: Data.signer,
        swapData: Data.swapData,
    });
    const { verifInitSendAllArray } = await verifyInitialize({
        program: Data.program,
        signer: Data.signer,
        swapData: Data.swapData,
    });
    console.log('initinitSendAllArray.length', initinitSendAllArray.length);
    console.log('addInitSendAllArray.length', addInitSendAllArray.length);
    console.log('verifInitSendAllArray.length', verifInitSendAllArray.length);

    const allInitSendAllArray = [...initinitSendAllArray, ...addInitSendAllArray, ...verifInitSendAllArray];
    
    return { allInitSendAllArray };
};
