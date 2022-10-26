import { Program } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import { appendTransactionToArray } from '../utils.neoSwap/appendTransactionToArray.neosap';
import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { claimNft } from './createInstruction/claim.nft.neoswap';
import { claimSol } from './createInstruction/claim.sol.neoswap';

export const claim = async (Data: {
    program: Program;
    swapDataAccount: PublicKey;
    signer: PublicKey;
}): Promise<{
    claimSendAllArray: Array<{
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }>;
}> => {
    const swapData = await getSwapDataFromPDA({ program: Data.program, swapDataAccount: Data.swapDataAccount });
    console.log('SwapData', swapData);
    if (swapData.swapData.status !== 0) throw console.error('Trade not in waiting for deposit state');

    let claimTransactionInstruction: TransactionInstruction[] = [];
    let ataList: Array<PublicKey> = [];

    for (let item = 0; item < swapData.swapData.items.length; item++) {
        let swapDataItem = swapData.swapData.items[item];
        console.log('XXXXXXX - item n° ', item, ' XXXXXXX');
        switch (swapDataItem.isNft) {
            case true:
                if (swapDataItem.status === 1) {
                    console.log(swapDataItem.destinary.toBase58());
                    let claimingNft = await claimNft({
                        program: Data.program,
                        signer: Data.signer,
                        user: swapDataItem.destinary,
                        mint: swapDataItem.mint,
                        swapDataAccount: Data.swapDataAccount,
                        swapDataAccount_seed: swapData.swapDataAccount_seed,
                        swapDataAccount_bump: swapData.swapDataAccount_bump,
                        ataList,
                    });
                    claimingNft.instruction.forEach((element) => {
                        claimTransactionInstruction.push(element);
                    });
                    let isPush = true;
                    claimingNft.mintAta.forEach((element) => {
                        ataList.forEach((ataElem) => {
                            if (element === ataElem) {
                                isPush = false;
                            }
                        });

                        if (isPush) ataList.push();
                    });
                    console.log('claimNftinstruction added');
                }
                break;
            case false:
                if (swapDataItem.status === 1) {
                    const claimingSol = await claimSol({
                        program: Data.program,
                        user: swapDataItem.owner,
                        signer: Data.signer,
                        swapDataAccount: Data.swapDataAccount,
                        swapDataAccount_seed: swapData.swapDataAccount_seed,
                        swapDataAccount_bump: swapData.swapDataAccount_bump,
                    });
                    claimTransactionInstruction.push(claimingSol.instruction);
                    console.log('claimSolinstruction added');
                }
                break;
        }
    }
    let claimTransaction = [new Transaction()];
    claimTransaction = appendTransactionToArray({
        mainArray: claimTransaction,
        itemToAdd: claimTransactionInstruction,
    });
    const claimSendAllArray = await convertAllTransaction(Data.program, claimTransaction);
    return { claimSendAllArray };
};
