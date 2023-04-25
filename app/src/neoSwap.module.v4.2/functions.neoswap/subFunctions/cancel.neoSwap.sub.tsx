import { AnchorProvider, Program } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import appendTransactionToArray from '../../utils.neoSwap/appendTransactionToArray.neosap';
import convertAllTransaction from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSwapDataFromPDA } from '../../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { ItemStatus, TradeStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
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
    cancelSendAllArray:
        | Array<{
              tx: Transaction;
              signers?: Array<Signer> | undefined;
          }>
        | undefined;
}> => {
    const swapData = await getSwapDataFromPDA({
        provider: Data.program.provider as AnchorProvider,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataAccount: Data.swapDataAccount,
    });
    console.log('swdata', swapData.swapData.status);
    if (
        !(
            swapData.swapData.status === TradeStatus.WaitingToDeposit ||
            swapData.swapData.status === TradeStatus.Cancelling ||
            swapData.swapData.status === TradeStatus.Initializing ||
            swapData.swapData.status === TradeStatus.WaitingToValidatePresigning
        )
    )
        throw { msg: 'Trade not in waiting for deposit state' };

    let cancelTransactionInstruction: TransactionInstruction[] = [];
    let ataList: Array<PublicKey> = [];

    for (let item = 0; item < swapData.swapData.items.length; item++) {
        let swapDataItem = swapData.swapData.items[item];

        switch (swapDataItem.isNft) {
            case true:
                console.log(
                    '\nXXXXXXX -  statuses item',
                    item,
                    'status:',
                    swapDataItem.status,
                    ' / ',
                    ItemStatus.NFTDeposited,
                    ' XXXXXXX'
                );

                if (swapDataItem.status === ItemStatus.NFTDeposited) {
                    console.log(
                        'cancelling NFT\nmint:',
                        swapDataItem.mint.toBase58(),
                        '\nowner:',
                        swapDataItem.owner.toBase58()
                    );
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
                    cancelingNft.instruction.forEach((iX) => {
                        cancelTransactionInstruction.push(iX);
                    });
                    ataList = cancelingNft.mintAta;
                    console.log('cancelNftinstruction added');
                } else {
                    console.log('not adding NFT n° ');
                }
                break;
            case false:
                console.log(
                    '\nXXXXXXX - statuses item',
                    item,
                    ' status: ',
                    swapDataItem.status,
                    ' / ',
                    ItemStatus.SolDeposited,
                    ' XXXXXXX'
                );

                if (swapDataItem.status === ItemStatus.SolDeposited) {
                    console.log('cancelling SOL with owner', swapDataItem.owner.toBase58());
                    let cancelingSol = await cancelSol({
                        program: Data.program,
                        user: swapDataItem.owner,
                        signer: Data.signer,
                        ataList,
                        swapDataAccount: Data.swapDataAccount,
                        swapDataAccount_seed: swapData.swapDataAccount_seed,
                        swapDataAccount_bump: swapData.swapDataAccount_bump,
                    });
                    cancelTransactionInstruction.push(...cancelingSol.instruction);
                    console.log('cancelSolinstruction added');
                } else {
                    console.log('not adding SOL ');
                }
                break;
        }
    }
    let cancelTransaction: Transaction[] = [new Transaction()];
    cancelTransaction = appendTransactionToArray({
        mainArray: cancelTransaction,
        itemToAdd: cancelTransactionInstruction,
    });
    const cancelSendAllArray = await convertAllTransaction(cancelTransaction);
    if (cancelSendAllArray[0].tx.instructions.length > 0) {
        return { cancelSendAllArray };
    } else return { cancelSendAllArray: undefined };
};

export default cancel;
