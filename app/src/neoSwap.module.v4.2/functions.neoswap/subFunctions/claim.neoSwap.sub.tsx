import { AnchorProvider, Program } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import appendTransactionToArray from '../../utils.neoSwap/appendTransactionToArray.neosap';
import convertAllTransaction from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSwapDataFromPDA } from '../../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { ItemStatus, TradeStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
import claimNft from '../createInstruction/claim.nft.neoswap.ci';
import claimSol from '../createInstruction/claim.sol.neoswap.ci';

/**
 * @notice creates instruction claiming all items of a swap
 * @param {Program} program program linked to NeoSwap
 * @param {PublicKey} swapDataAccount Swap's PDA
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {PublicKey} signer user that sends NFT
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}claimSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const claim = async (Data: {
    program: Program;
    swapDataAccount: PublicKey;
    CONST_PROGRAM: string;
    signer: PublicKey;
}): Promise<{
    claimSendAllArray: Array<{
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }>;
}> => {
    const swapData = await getSwapDataFromPDA({
        provider: Data.program.provider as AnchorProvider,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataAccount: Data.swapDataAccount,
    });

    // if (swapData.swapData.status !== TradeStatus.WaitingToDeposit) throw console.error('Trade not in waiting for deposit state');

    let claimTransactionInstruction: TransactionInstruction[] = [];
    let ataList: Array<PublicKey> = [];

    for (let item = 0; item < swapData.swapData.items.length; item++) {
        let swapDataItem = swapData.swapData.items[item];
        switch (swapDataItem.isNft) {
            case true:
                if (swapDataItem.status === ItemStatus.NFTDeposited) {
                    console.log('XXXXXXX - item n° ', item, ' XXXXXXX');
                    // console.log(Data.user.toBase58(), swapDataItem.destinary.toBase58());

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
                if (swapDataItem.status === ItemStatus.SolToClaim) {
                    console.log('XXXXXXX - item n° ', item, ' XXXXXXX', swapDataItem);
                    const claimingSol = await claimSol({
                        program: Data.program,
                        user: swapDataItem.owner,
                        signer: Data.signer,
                        swapDataAccount: Data.swapDataAccount,
                        swapDataAccount_seed: swapData.swapDataAccount_seed,
                        swapDataAccount_bump: swapData.swapDataAccount_bump,
                        ataList,
                    });
                    claimTransactionInstruction.push(...claimingSol.instruction);
                    console.log('claimSolinstruction added');
                } else {
                    console.log('not to claim item n° ', item);
                }
                break;
        }
    }
    let claimTransaction = [new Transaction()];
    claimTransaction = appendTransactionToArray({
        mainArray: claimTransaction,
        itemToAdd: claimTransactionInstruction,
    });
    const claimSendAllArray = await convertAllTransaction(claimTransaction);
    return { claimSendAllArray };
};

export default claim;
