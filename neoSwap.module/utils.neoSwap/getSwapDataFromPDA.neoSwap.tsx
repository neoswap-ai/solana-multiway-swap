import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { hash } from '@project-serum/anchor/dist/cjs/utils/sha256';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { CONST_PROGRAM } from './const.neoSwap';
// import { CONST_PROGRAM, splAssociatedTokenAccountProgramId } from './const.neoSwap';
import { SwapData } from './types.neoSwap';

export const getSwapDataFromPDA = async (Data: {
    swapDataAccount: PublicKey;
    program: Program;
}): Promise<{
    swapData: SwapData;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
}> => {
    try {
        let swapData = (await Data.program.account.swapData.fetch(Data.swapDataAccount)) as SwapData;

        let preSeed = CONST_PROGRAM;
        swapData.items.forEach((item) => {
            preSeed += item.mint;
            preSeed += item.owner;
            preSeed += item.destinary;
        });

        let swapDataAccount_seed = Buffer.from(hash(preSeed)).subarray(0, 32);

        const [__, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            Data.program.programId
        );

        return {
            swapData,
            swapDataAccount_seed,
            swapDataAccount_bump,
        };
    } catch (error) {
        throw console.error('PDA not initialized, try function getSeedFromPda');
    }
};

export const getSeedFromData = async (Data: {
    swapData: SwapData;
    program: Program;
}): Promise<{
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
}> => {
    let preSeed = CONST_PROGRAM;
    Data.swapData.items.forEach((item) => {
        preSeed += item.mint;
        preSeed += item.owner;
        preSeed += item.destinary;
    });

    let swapDataAccount_seed = Buffer.from(hash(preSeed)).subarray(0, 32);

    try {
        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            Data.program.programId
        );
        return {
            swapDataAccount,
            swapDataAccount_seed,
            swapDataAccount_bump,
        };
    } catch (error) {
        throw console.error('PDA not initialized, try function getSeedFromPda22', error);
    }
};
