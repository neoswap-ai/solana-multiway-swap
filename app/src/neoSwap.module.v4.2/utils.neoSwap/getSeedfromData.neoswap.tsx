import { hash } from '@project-serum/anchor/dist/cjs/utils/sha256';
import { PublicKey } from '@solana/web3.js';
import { neoSwapProgramAddress } from './const.neoSwap';
import SwapData from './types.neo-swap/swapData.types.neoswap';

/**
 * @notice find according PDA related to swapData. /!\ swapData's item order might be modified
 * @dev given swapData, sort data, reconstruct seed & find PDA.
 * @param {SwapData} swapDataGiven Swap's initial data 
 * @param {string}CONST_PROGRAM 4 character string to initialize the seed
 * @return {SwapData}swapData => sorted version to be written in the PDA
 * @return {PublicKey}swapDataAccount => Swap's PDA corresponding to given data
 * @return {Buffer}swapDataAccount_seed => seed to find the PDA Address & sign
 * @return {number}swapDataAccount_bump => bump to find the PDA Address & sign
 */
export const getSeedFromData = async (Data: {
    swapDataGiven: SwapData;
    CONST_PROGRAM: string;
}): Promise<{
    swapData: SwapData;
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
}> => {
    let preSeed = Data.CONST_PROGRAM;
    let swapData = Data.swapDataGiven;
    swapData.items
        .sort((x, y) => {
            return (x.mint.toString() + x.owner.toString() + x.destinary.toString()).localeCompare(
                y.mint.toString() + y.owner.toString() + y.destinary.toString()
            );
        })
        .forEach((item) => {
            preSeed += item.mint;
            preSeed += item.owner;
            preSeed += item.destinary;
        });

    let swapDataAccount_seed = Buffer.from(hash(preSeed)).subarray(0, 32);

    try {
        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            neoSwapProgramAddress
        );
        return {
            swapData,
            swapDataAccount,
            swapDataAccount_seed,
            swapDataAccount_bump,
        };
    } catch (error) {
        throw console.error('PDA not initialized', error);
    }
};

// export default getSeedFromData;
