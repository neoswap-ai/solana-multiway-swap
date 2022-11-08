import { AnchorProvider } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction } from '@solana/web3.js';
import saddInitialize from './subFunctions/sadd.Initialize.neoSwap.sub';
import initInitialize from './subFunctions/init.Initialize.neoSwap.sub';
import validateInitialize from './subFunctions/validate.Initialize.neoSwap.sub';
import SwapData from '../utils.neoSwap/types.neo-swap/swapData.types.neoswap';
import { getProgram } from '../utils.neoSwap/getProgram.neoswap';

/**
 * @notice creates Initialize instructions
 * @dev initializer is signer, initialize PDA, add data and verify items instruction. /!\ SwapData item order might be modified.
 * @param {SwapData} swapDataGiven Given Swap Data unsorted
 * @param {PublicKey} signer initializer and admin of the trade
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {AnchorProvider} provider with active Connection
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}allInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 * @return {PublicKey}pda => PDA related to swap Data
 * @return {SwapData}swapData => Ordered SwapData
 */
export const allInitialize = async (Data: {
    swapDataGiven: SwapData;
    signer: PublicKey;
    CONST_PROGRAM: string;
    provider: AnchorProvider;
}): Promise<{
    allInitSendAllArray: Array<{
        tx: Transaction;
        signers?: Signer[] | undefined;
    }>;
    pda: PublicKey;
    swapData: SwapData;
}> => {
    const program = getProgram(Data.provider);

    const { initinitSendAllArray, swapData } = await initInitialize({
        program: program,
        signer: Data.signer,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataGiven: Data.swapDataGiven,
    });
    const { addInitSendAllArray } = await saddInitialize({
        program: program,
        signer: Data.signer,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapData: swapData,
    });
    const { validateInitSendAllArray } = await validateInitialize({
        program: program,
        signer: Data.signer,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapData: swapData,
    });

    const allInitSendAllArray = [...initinitSendAllArray, ...addInitSendAllArray, ...validateInitSendAllArray];

    return {
        allInitSendAllArray,
        pda: allInitSendAllArray[0].tx.instructions[0]?.keys[0].pubkey,
        swapData,
    };
};

export default allInitialize;
