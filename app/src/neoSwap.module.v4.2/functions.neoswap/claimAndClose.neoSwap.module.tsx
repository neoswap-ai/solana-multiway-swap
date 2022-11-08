import { AnchorProvider } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction } from '@solana/web3.js';
import claim from './subFunctions/claim.neoSwap.sub';
import validateDeposit from './subFunctions/validateDeposit.neoSwap.sub';
import validateClaimed from './subFunctions/validateClaimed.neoSwap.sub';
import { getProgram } from '../utils.neoSwap/getProgram.neoswap';

/**
 * @notice creates claiming & closing instructions.
 * @dev verify all items are deposited, sends all assets to destinaries and close the PDA.
 * @param {PublicKey} swapDataAccount Swap's PDA account to cancel.
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {AnchorProvider} provider with active Connection
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}allClaimSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const claimAndClose = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    CONST_PROGRAM: string;
    provider: AnchorProvider;
}): Promise<{
    allClaimSendAllArray: Array<{
        tx: Transaction;
        signers?: Signer[] | undefined;
    }>;
}> => {
    const program = getProgram(Data.provider);

    const { validateDepositSendAll } = await validateDeposit({
        program: program,
        signer: Data.signer,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataAccount: Data.swapDataAccount,
    });
    const { claimSendAllArray } = await claim({
        program: program,
        signer: Data.signer,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataAccount: Data.swapDataAccount,
    });
    const { validateClaimedSendAll } = await validateClaimed({
        program: program,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        signer: Data.signer,
        swapDataAccount: Data.swapDataAccount,
    });

    const allClaimSendAllArray = [...validateDepositSendAll, ...claimSendAllArray, ...validateClaimedSendAll];

    return { allClaimSendAllArray };
};

export default claimAndClose;
