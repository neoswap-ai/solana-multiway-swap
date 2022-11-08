import { Program } from '@project-serum/anchor';
import { PublicKey, Signer, SystemProgram, Transaction } from '@solana/web3.js';
import { splAssociatedTokenAccountProgramId } from '../../utils.neoSwap/const.neoSwap';
import convertAllTransaction from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';

/**
 * @notice creates instruction for initializing the swap's PDA. /!\ swapData's item order might be modified
 * @param {SwapData} swapDataGiven Given Swap Data unsorted
 * @param {PublicKey} signer user that sends NFT
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}initinitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 * @return {SwapData}swapData => Ordered SwapData
 */
export const initInitialize = async (Data: {
    swapDataGiven: SwapData;
    signer: PublicKey;
    CONST_PROGRAM: string;
    program: Program;
}): Promise<{
    initinitSendAllArray: Array<{
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }>;
    swapData: SwapData;
}> => {
    Data.swapDataGiven.initializer = Data.signer;

    const seedSwapData = await getSeedFromData({
        swapDataGiven: Data.swapDataGiven,
        CONST_PROGRAM: Data.CONST_PROGRAM,
    });
    let swapData = seedSwapData.swapData;

    let sentData: SwapData = {
        initializer: Data.signer,
        items: [swapData.items[0]],
        status: 80,
    };

    const initInitTransaction = new Transaction().add(
        await Data.program.methods
            .initInitialize(
                seedSwapData.swapDataAccount_seed,
                seedSwapData.swapDataAccount_bump,
                sentData,
                swapData.items.length
            )
            .accounts({
                swapDataAccount: seedSwapData.swapDataAccount,
                signer: Data.signer,
                systemProgram: SystemProgram.programId,
                splTokenProgram: splAssociatedTokenAccountProgramId,
            })
            .instruction()
    );

    const initinitSendAllArray = await convertAllTransaction([initInitTransaction]);
    console.log('initInitTransaction Added');

    return { initinitSendAllArray, swapData };
};

export default initInitialize;
