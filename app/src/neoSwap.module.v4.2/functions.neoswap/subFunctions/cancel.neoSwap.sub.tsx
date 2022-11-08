import { AnchorProvider, Program } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import appendTransactionToArray from '../../utils.neoSwap/appendTransactionToArray.neosap';
import convertAllTransaction from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSwapDataFromPDA } from '../../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import cancelNft from '../createInstruction/cancel.nft.neoswap.ci';
import cancelSol from '../createInstruction/cancel.sol.neoswap.ci';

/**
 * @notice creates instruction for cancelling all items of a swap
 * @param {Program} program program linked to NeoSwap
 * @param {PublicKey} swapDataAccount Swap's PDA
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {PublicKey} signer user that sends NFT
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}cancelSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const cancel = async (Data: {
    program: Program;
    swapDataAccount: PublicKey;
    CONST_PROGRAM: string;
    signer: PublicKey;
}): Promise<{
    cancelSendAllArray: Array<{
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }>;
}> => {
    const swapData = await getSwapDataFromPDA({
        provider: Data.program.provider as AnchorProvider,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataAccount: Data.swapDataAccount,
    });
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
                console.log('cancelSolinstruction added');
                break;
        }
    }
    let cancelTransaction: Transaction[] = [new Transaction()];
    cancelTransaction = appendTransactionToArray({
        mainArray: cancelTransaction,
        itemToAdd: cancelTransactionInstruction,
    });
    const cancelSendAllArray = await convertAllTransaction(cancelTransaction);
    return { cancelSendAllArray };
};

export default cancel;
