import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Signer, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { claim } from './claim.neoSwap.module';
import { validateDeposit } from './validateDeposit.neoSwap.module';
import { validateClaimed } from './validateClaimed.neoSwap.module';

export const claimAndClose = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    program: Program;
    // CONST_PROGRAM: string;
    // swapDataAccount: PublicKey;
}): Promise<{
    allInitSendAllArray: Array<{
        tx: Transaction;
        signers?: Signer[] | undefined;
    }>;
}> => {
    const { validateDepositSendAll } = await validateDeposit({
        program: Data.program,
        signer: Data.signer,
        swapDataAccount: Data.swapDataAccount,
    });
    const { claimSendAllArray } = await claim({
        program: Data.program,
        signer: Data.signer,
        swapDataAccount: Data.swapDataAccount,
    });
    const { validateClaimedSendAll } = await validateClaimed({
        program: Data.program,
        signer: Data.signer,
        swapDataAccount: Data.swapDataAccount,
    });

    console.log('validateDepositSendAll.length', validateDepositSendAll[0].tx.instructions.length);
    console.log('claimSendAllArray.length', claimSendAllArray.length);
    console.log('validateClaimedSendAll.length', validateClaimedSendAll.length);

    const allInitSendAllArray = [...validateDepositSendAll, ...claimSendAllArray, ...validateClaimedSendAll];

    return { allInitSendAllArray };
};
