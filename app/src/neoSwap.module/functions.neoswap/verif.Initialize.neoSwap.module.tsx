import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { splAssociatedTokenAccountProgramId } from '../utils.neoSwap/const.neoSwap';
import { getSeedFromData, getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { SwapData } from '../utils.neoSwap/types.neoSwap';

export const verifyInitialize = async (Data: {
    signer: PublicKey;
    program: Program;
    swapData: SwapData;
    // swapDataAccount: PublicKey;
}): Promise<{ verifInitTransaction: Transaction }> => {
    if (!Data.program.provider.sendAndConfirm) throw console.error('no sendAndConfirm');

    const seedSwapData = await getSeedFromData({
        program: Data.program,
        swapData: Data.swapData,
    });

    // const pdaSwapData = await getSwapDataFromPDA({
    //     program: Data.program,
    //     swapDataAccount: seedSwapData.swapDataAccount,
    // });

    // if (seedSeedSwap.swapDataAccount_seed!==seedSwapData.swapDataAccount_seed) throw console.error('not');

    // if (pdaSwapData.swapData.status !== 80) throw console.error('Trade not in waiting for initialized state');

    const firstTx = await Data.program.methods
        .validateInitialize(seedSwapData.swapDataAccount_seed, seedSwapData.swapDataAccount_bump)
        .accounts({
            swapDataAccount: seedSwapData.swapDataAccount,
            signer: Data.signer,
        })
        .instruction();

    let verifInitTransaction: Transaction = new Transaction().add(firstTx);

    // for (let index = 2; index < pdaSwapData.swapData.items.length; index++) {
    //     verifInitTransaction.add(
    //         await Data.program.methods
    //             .validateInitialize(seedSwapData.swapDataAccount_seed, seedSwapData.swapDataAccount_bump)
    //             .accounts({
    //                 swapDataAccount: seedSwapData.swapDataAccount,
    //                 signer: Data.signer,
    //             })
    //             .instruction()
    //     );
    // }
    return { verifInitTransaction };
};
