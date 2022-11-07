import { AnchorProvider } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction } from '@solana/web3.js';
import { getProgram } from '../utils.neoSwap/getProgram.neoswap';
import cancel from './subFunctions/cancel.neoSwap.sub';
import validateCancel from './subFunctions/validateCancel.neoSwap.sub';

/**
 * @notice creates canceling & closing instructions.
 * @dev cancels all items, send back deposited assets and close the PDA.
 * @param {PublicKey} swapDataAccount Swap's PDA account to cancel.
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {AnchorProvider} provider with active Connection
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}allCancelSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const cancelAndClose = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    CONST_PROGRAM: string;
    provider: AnchorProvider;
}): Promise<{
    allCancelSendAllArray: Array<{
        tx: Transaction;
        signers?: Signer[] | undefined;
    }>;
}> => {
    const program = getProgram(Data.provider);

    const { cancelSendAllArray } = await cancel({
        program: program,
        signer: Data.signer,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataAccount: Data.swapDataAccount,
    });

    const { validateCancelSendAll } = await validateCancel({
        program: program,
        signer: Data.signer,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataAccount: Data.swapDataAccount,
    });

    const allCancelSendAllArray = [...cancelSendAllArray, ...validateCancelSendAll];

    return { allCancelSendAllArray };
};

export default cancelAndClose;
