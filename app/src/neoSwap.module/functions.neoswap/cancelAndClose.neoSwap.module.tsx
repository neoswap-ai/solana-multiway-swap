import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Signer, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { claim } from './claim.neoSwap.module';
import { validateDeposit } from './validateDeposit.neoSwap.module';
import { validateClaimed } from './validateClaimed.neoSwap.module';
import { cancel } from './cancel.neoSwap.module';
import { validateCancel } from './validateCancel.neoSwap.module';

export const cancelAndClose = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    program: Program;
    // CONST_PROGRAM: string;
    // swapDataAccount: PublicKey;
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

    console.log('cancelSendAllArray.length', cancelSendAllArray.length);
    // console.log('claimSendAllArray.length', claimSendAllArray.length);
    console.log('validateCancelSendAll.length', validateCancelSendAll.length);

    const allCancelSendAllArray = [...cancelSendAllArray, ...validateCancelSendAll];

    return { allCancelSendAllArray };
};
