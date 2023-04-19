import { AnchorProvider } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction } from '@solana/web3.js';
import claim from './subFunctions/claim.neoSwap.sub';
import validateDeposit from './subFunctions/validateDeposit.neoSwap.sub';
import validateClaimed from './subFunctions/validateClaimed.neoSwap.sub';
import depositPresigned from './depositPresigned.neoSwap.module';
import { getProgram } from '../utils.neoSwap/getProgram.neoswap';
import SwapData from '../utils.neoSwap/types.neo-swap/swapData.types.neoswap';
import hasUserDepositedBeforePresigned from './hasUserDepositedBeforePresigned.neoSwap.module';

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
    // let swapData = (await program.account.swapData.fetch(Data.swapDataAccount)) as SwapData;
    // console.log('swapData', swapData);

    // validate not presigned
    const is_non_presigned_all_deposited = await hasUserDepositedBeforePresigned({
        provider: program.provider as AnchorProvider,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataAccount: Data.swapDataAccount,
    });
    console.log('is_non_presigned_all_deposited', is_non_presigned_all_deposited);

    if (is_non_presigned_all_deposited === false) {
        throw { msg: 'swap not ready, left some normal user to deposit' };
    }
    // deposit presigned

    const { depositPresignedSendAll , ataList} = await depositPresigned({
        provider: program.provider as AnchorProvider,
        signer: Data.signer,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataAccount: Data.swapDataAccount,
    });

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
        ataList
    });
    const { validateClaimedSendAll } = await validateClaimed({
        program: program,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        signer: Data.signer,
        swapDataAccount: Data.swapDataAccount,
    });

    const allClaimSendAllArray = [
        ...depositPresignedSendAll,
        ...validateDepositSendAll,
        ...claimSendAllArray,
        ...validateClaimedSendAll,
    ];

    return { allClaimSendAllArray };
};

export default claimAndClose;
