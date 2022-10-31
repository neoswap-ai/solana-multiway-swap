import { Program } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction } from '@solana/web3.js';
import { cancel } from './cancel.neoSwap.module';
import { validateCancel } from './validateCancel.neoSwap.module';

export const cancelAndClose = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    program: Program;
}): Promise<{
    allCancelSendAllArray: Array<{
        tx: Transaction;
        signers?: Signer[] | undefined;
    }>;
}> => {
    const { cancelSendAllArray } = await cancel({
        program: Data.program,
        signer: Data.signer,
        swapDataAccount: Data.swapDataAccount,
    });

    const { validateCancelSendAll } = await validateCancel({
        program: Data.program,
        signer: Data.signer,
        swapDataAccount: Data.swapDataAccount,
    });

    // console.log('cancelSendAllArray.length', cancelSendAllArray.length);
    // console.log('validateCancelSendAll.length', validateCancelSendAll.length);

    const allCancelSendAllArray = [...cancelSendAllArray, ...validateCancelSendAll];

    return { allCancelSendAllArray };
};
