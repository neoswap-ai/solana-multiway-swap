import { AnchorProvider } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import appendTransactionToArray from '../utils.neoSwap/appendTransactionToArray.neosap';
import convertAllTransaction from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getProgram } from '../utils.neoSwap/getProgram.neoswap';
import { getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { ItemStatus, TradeStatus } from '../utils.neoSwap/types.neo-swap/status.type.neoswap';
import depositNft from './createInstruction/deposit.nft.neoswap.ci';
import depositSol from './createInstruction/deposit.sol.neoswap.ci';

/**
 * @notice creates depositing instructions related to user
 * @dev fetch information from PDA, creates all instruction for depositing assets related to signer.
 * @param {PublicKey} swapDataAccount Swap's PDA account to cancel.
 * @param {PublicKey} signer user that deposits
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {AnchorProvider} provider with active Connection
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}depositSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const deposit = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    CONST_PROGRAM: string;
    provider: AnchorProvider;
}): Promise<{
    depositSendAllArray: Array<{
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }>;
}> => {
    const program = getProgram(Data.provider);

    const swapData = await getSwapDataFromPDA({
        provider: program.provider as AnchorProvider,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataAccount: Data.swapDataAccount,
    }).catch((error) => {
        throw console.error(error);
    });

    if (swapData.swapData.status !== TradeStatus.WaitingToDeposit)
        throw console.error('Trade not in waiting for deposit state');

    let depositInstruction: Array<TransactionInstruction> = [];
    let ataList: Array<PublicKey> = [];
    for await (let swapDataItem of swapData.swapData.items) {
        // let swapDataItem = swapData.swapData.items[item];

        switch (swapDataItem.isNft) {
            case true:
                if (
                    swapDataItem.owner.toBase58() === Data.signer.toBase58() &&
                    swapDataItem.status === ItemStatus.NFTPending
                ) {
                    console.log('XXX - Deposit NFT X X ', swapDataItem.mint.toBase58(), ' - XXX ', ataList);

                    let { instruction: depositNFTInstruction, mintAta: mintAtaAta } = await depositNft({
                        program: program,
                        signer: Data.signer,
                        mint: swapDataItem.mint,
                        swapDataAccount: Data.swapDataAccount,
                        swapDataAccount_seed: swapData.swapDataAccount_seed,
                        swapDataAccount_bump: swapData.swapDataAccount_bump,
                        ataList,
                    });

                    mintAtaAta.forEach((depositNftAta) => {
                        let isPush = true;
                        ataList.forEach((ataElem) => {
                            if (depositNftAta.equals(ataElem)) {
                                isPush = false;
                            }
                        });

                        if (isPush) {
                            ataList.push(depositNftAta);
                            console.log('added mint NFT', depositNftAta.toBase58());
                        }
                    });
                    depositNFTInstruction.forEach((depositNftAta) => {
                        depositInstruction.push(depositNftAta);
                    });
                    // ]);
                    console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ataList', ataList);
                    console.log('depositNftInstruction added');
                }

                break;
            case false:
                if (
                    swapDataItem.owner.toBase58() === Data.signer.toBase58() &&
                    swapDataItem.status === ItemStatus.SolPending
                ) {
                    console.log('XXXXXXX - Deposit sol item - XXXXXXX', ataList);
                    const { instruction: depositSolInstruction, mintAta: allMint } = await depositSol({
                        program: program,
                        ataList,
                        signer: Data.signer,
                        ItemToDeposit: swapDataItem,
                        swapDataAccount: Data.swapDataAccount,
                        swapDataAccount_seed: swapData.swapDataAccount_seed,
                        swapDataAccount_bump: swapData.swapDataAccount_bump,
                    });
                    depositInstruction.push(...depositSolInstruction);
                    // console.log('allMint', allMint);

                    allMint.forEach((depositSolAta) => {
                        let isPush = true;
                        ataList.forEach((ataElem) => {
                            if (depositSolAta.equals(ataElem)) {
                                isPush = false;
                            }
                        });

                        if (isPush) {
                            ataList.push(depositSolAta);
                            console.log('added mint sol', depositSolAta.toBase58());
                        }
                    });
                    console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ataList', ataList);
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
    const depositSendAllArray = await convertAllTransaction(depositTransaction);
    return { depositSendAllArray };
};

export default deposit;
