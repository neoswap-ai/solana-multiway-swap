import { AnchorProvider } from '@project-serum/anchor';
import { hash } from '@project-serum/anchor/dist/cjs/utils/sha256';
import { PublicKey } from '@solana/web3.js';
import { getProgram } from './getProgram.neoswap';
import SwapData from './types.neo-swap/swapData.types.neoswap';

/**
 * @notice fetch and deserialize data from PDA.
 * @dev fetch and return data from PDA & reconstruct seed.
 * @param {PublicKey} swapDataAccount PublicKey of the Swap's PDA
 * @param {string}CONST_PROGRAM 4 character string to initialize the seed
 * @param {AnchorProvider} provider with active Connection
 * @return {SwapData}swapData => read from PDA
 * @return {Buffer}swapDataAccount_seed => seed to find the PDA Address & sign. /!\ reconstructed from PDA data
 * @return {number}swapDataAccount_bump => bump to find the PDA Address & sign. /!\ reconstructed from PDA data
 */
export const getSwapDataFromPDA = async (Data: {
    swapDataAccount: PublicKey;
    CONST_PROGRAM: string;
    provider: AnchorProvider;
}): Promise<{
    swapData: SwapData;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
}> => {
    try {
        const program = getProgram(Data.provider);
        console.log('getSwapDataFromPDA');
        let swapData = (await program.account.swapData.fetch(Data.swapDataAccount)) as SwapData;

        let preSeed = Data.CONST_PROGRAM;
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

        const [compareSwapDataAccount, swapDataAccount_bump] = PublicKey.findProgramAddressSync(
            [swapDataAccount_seed],
            program.programId
        );

        if (!compareSwapDataAccount.equals(Data.swapDataAccount)) {
            throw console.error(
                'incorrect seed\n',
                compareSwapDataAccount.toBase58(),
                '\n',
                Data.swapDataAccount.toBase58()
            );
        }

        return {
            swapData,
            swapDataAccount_seed,
            swapDataAccount_bump,
        };
    } catch (error) {
        throw console.error('PDA not initialized', error);
    }
};

// export default getSwapDataFromPDA;
