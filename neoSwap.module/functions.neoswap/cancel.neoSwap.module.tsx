import { Program } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import { appendTransactionToArray } from '../utils.neoSwap/appendTransactionToArray.neosap';
import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { cancelNft } from './createInstruction/cancel.nft.neoswap';
import { cancelSol } from './createInstruction/cancel.sol.neoswap';

export const cancel = async (Data: {
    program: Program;
    swapDataAccount: PublicKey;
    signer: PublicKey;
}): Promise<{
    cancelSendAllArray: Array<{
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }>;
}> => {
    const swapData = await getSwapDataFromPDA({ program: Data.program, swapDataAccount: Data.swapDataAccount });
    console.log('SwapData', swapData);
    if (swapData.swapData.status !== 0) throw console.error('Trade not in waiting for deposit state');

    let cancelTransactionInstruction: TransactionInstruction[] = [];
    let ataList: Array<PublicKey> = [];

    for (let item = 0; item < swapData.swapData.items.length; item++) {
        let swapDataItem = swapData.swapData.items[item];

        switch (swapDataItem.isNft) {
            case true:
                console.log('XXXXXXX - cancelling item n° ', item, ' XXXXXXX');
                let cancelingNft = await cancelNft({
                    program: Data.program,
                    signer: Data.signer,
                    user: swapDataItem.owner,
                    mint: swapDataItem.mint,
                    swapDataAccount: Data.swapDataAccount,
                    swapDataAccount_seed: swapData.swapDataAccount_seed,
                    swapDataAccount_bump: swapData.swapDataAccount_bump,
                    ataList,
                });
                cancelingNft.instruction.forEach((element) => {
                    cancelTransactionInstruction.push(element);
                });
                let isPush = true;
                cancelingNft.mintAta.forEach((element) => {
                    ataList.forEach((ataElem) => {
                        if (element === ataElem) {
                            isPush = false;
                        }
                    });

                    if (isPush) ataList.push();
                });
                console.log('cancelNftinstruction added');
                break;
            case false:
                console.log('XXXXXXX - cancelling item n° ', item, ' XXXXXXX');
                let cancelingSol = await cancelSol({
                    program: Data.program,
                    user: swapDataItem.owner,
                    signer: Data.signer,
                    swapDataAccount: Data.swapDataAccount,
                    swapDataAccount_seed: swapData.swapDataAccount_seed,
                    swapDataAccount_bump: swapData.swapDataAccount_bump,
                });
                cancelTransactionInstruction.push(cancelingSol.instruction);
                // .forEach((element) => {
                // });
                // cancelTransactionInstruction.add(closing.transaction);
                console.log('cancelSolinstruction added');
                // }
                break;
        }
    }
    let cancelTransaction: Transaction[] = [new Transaction()];
    cancelTransaction = appendTransactionToArray({
        mainArray: cancelTransaction,
        itemToAdd: cancelTransactionInstruction,
    });
    const cancelSendAllArray = await convertAllTransaction(Data.program, cancelTransaction);
    return { cancelSendAllArray };
};
