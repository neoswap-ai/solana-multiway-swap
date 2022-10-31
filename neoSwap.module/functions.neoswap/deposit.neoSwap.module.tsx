import { Program } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import { appendTransactionToArray } from '../utils.neoSwap/appendTransactionToArray.neosap';
import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { depositNft } from './createInstruction/deposit.nft.neoswap';
import { depositSol } from './createInstruction/deposit.sol.neoswap';

export const deposit = async (Data: {
    program: Program;
    swapDataAccount: PublicKey;
    signer: PublicKey;
}): Promise<{
    depositSendAllArray: Array<{
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }>;
}> => {
    const swapData = await getSwapDataFromPDA({ program: Data.program, swapDataAccount: Data.swapDataAccount });
    if (!swapData) throw console.error('PDA not initialized');
    console.log('SwapData', swapData);
    if (swapData.swapData.status !== 0) throw console.error('Trade not in waiting for deposit state');

    // let depositInstructionTransaction: Array<TransactionInstruction> = [];
    let depositInstruction: Array<TransactionInstruction> = [];
    let ataList: Array<PublicKey> = [];
    for (let item = 0; item < swapData.swapData.items.length; item++) {
        let swapDataItem = swapData.swapData.items[item];

        switch (swapDataItem.isNft) {
            case true:
                if (swapDataItem.owner.toBase58() === Data.signer.toBase58() && swapDataItem.status === 0) {
                    console.log('XXXXXXX - Deposit item n° ', item, ' XXXXXXX');

                    let depositing = await depositNft({
                        program: Data.program,
                        signer: Data.signer,
                        mint: swapDataItem.mint,
                        swapDataAccount: Data.swapDataAccount,
                        seed: swapData.swapDataAccount_seed,
                        bump: swapData.swapDataAccount_bump,
                        ataList,
                    });
                    let isPush = true;
                    depositing.mintAta.forEach((element) => {
                        ataList.forEach((ataElem) => {
                            if (element === ataElem) {
                                isPush = false;
                            }
                        });

                        if (isPush) ataList.push();
                    });
                    depositing.instruction.forEach((element) => {
                        depositInstruction.push(element);
                    });
                    // depositInstruction = appendTransactionToArray(depositInstructionTransaction, [
                    //     depositing.instruction,
                    // ]);
                    console.log('depositNftInstruction added');
                }
                break;
            case false:
                if (swapDataItem.owner.toBase58() === Data.signer.toBase58() && swapDataItem.status === 0) {
                    console.log('XXXXXXX - Deposit item n° ', item, ' XXXXXXX');
                    const { instruction: depositSolInstruction } = await depositSol({
                        program: Data.program,
                        from: Data.signer,
                        to: Data.swapDataAccount,
                        swapDataAccount_seed: swapData.swapDataAccount_seed,
                        swapDataAccount_bump: swapData.swapDataAccount_bump,
                    });
                    depositInstruction.push(depositSolInstruction);
                    // depositing.instruction.forEach((element) => {});
                    // depositInstructionTransaction = appendTransactionToArray(depositInstructionTransaction, [
                    //     solTransaction,
                    // ]);
                    console.log('depositSolinstruction added');
                }

                break;
        }
    }

    let depositTransaction = [new Transaction()];
    depositTransaction = appendTransactionToArray({
        mainArray: depositTransaction,
        itemToAdd: depositInstruction,
    });
    const depositSendAllArray = await convertAllTransaction(Data.program, depositTransaction);
    return { depositSendAllArray };
};
