import { AnchorProvider } from '@project-serum/anchor';
import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import appendTransactionToArray from '../utils.neoSwap/appendTransactionToArray.neosap';
import convertAllTransaction from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getProgram } from '../utils.neoSwap/getProgram.neoswap';
import { getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { ItemStatus, TradeStatus } from '../utils.neoSwap/types.neo-swap/status.type.neoswap';
import depositNft from './createInstruction/deposit.nft.neoswap.ci';
import depositNftPresigned from './createInstruction/deposit.nft.presigned.neoswap.ci';
import depositSol from './createInstruction/deposit.sol.neoswap.ci';
import depositSolPresigned from './createInstruction/deposit.sol.presigned.neoswap.ci';

/**
 * @notice creates depositing instructions related to user
 * @dev fetch information from PDA, creates all instruction for depositing assets related to signer.
 * @param {PublicKey} swapDataAccount Swap's PDA account to cancel.
 * @param {PublicKey} signer user that deposits
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {AnchorProvider} provider with active Connection
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}depositSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const depositUserOnly = async (Data: {
    swapDataAccount: PublicKey;
    // user: PublicKey;
    signer: PublicKey;
    CONST_PROGRAM: string;
    provider: AnchorProvider;
}): Promise<{
    depositSendAllArray:
        | Array<{
              tx: Transaction;
              signers?: Array<Signer> | undefined;
          }>
        | undefined;
}> => {
    const program = getProgram(Data.provider);

    const swapData = await getSwapDataFromPDA({
        provider: program.provider as AnchorProvider,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataAccount: Data.swapDataAccount,
    }).catch((error) => {
        throw console.error(error);
    });

    // console.log('swapData', swapData.swapData.items);

    if (swapData.swapData.status !== TradeStatus.WaitingToDeposit)
        throw console.error('Trade not in waiting for deposit state');
    // let test: number[] = [];
    // let i = 0;
    let depositInstruction: Array<TransactionInstruction> = [];
    let ataList: Array<PublicKey> = [];
    for await (let swapDataItem of swapData.swapData.items) {
        // let swapDataItem = swapData.swapData.items[item];
        if (!swapDataItem.isPresigning) {
            // case false:
            switch (swapDataItem.isNft) {
                case true:
                    if (
                        swapDataItem.owner.toBase58() === Data.signer.toBase58() &&
                        swapDataItem.status === ItemStatus.NFTPending
                    ) {
                        // console.log('not presigned is NFT', swapDataItem);
                        // if (Data.signer)
                        console.log('XXX - Deposit NFT X X ', swapDataItem.mint.toBase58(), ' - XXX ');
                        // test.push(i);
                        // i++;
                        // console.log('test', test);

                        let { instruction: depositNFTInstruction, mintAta: createdMint } = await depositNft({
                            program: program,
                            signer: Data.signer,
                            mint: swapDataItem.mint,
                            swapDataAccount: Data.swapDataAccount,
                            swapDataAccount_seed: swapData.swapDataAccount_seed,
                            swapDataAccount_bump: swapData.swapDataAccount_bump,
                            ataList,
                        });
                        ataList = createdMint;

                        depositNFTInstruction.forEach((depositNftAta) => {
                            depositInstruction.push(depositNftAta);
                        });
                        // console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ataList NFT', ataList);
                        console.log('depositNftInstruction added');
                    }

                    break;
                case false:
                    if (
                        swapDataItem.owner.toBase58() === Data.signer.toBase58() &&
                        swapDataItem.status === ItemStatus.SolPending
                    ) {
                        // console.log('not presigned not NFT', swapDataItem);
                        // test.push(i);
                        // i++;
                        // console.log('test', test);

                        console.log('XXXXXXX - Deposit sol item - XXXXXXX', ataList);
                        const { instruction: depositSolInstruction, mintAta: createdMint } = await depositSol({
                            program: program,
                            ataList,
                            signer: Data.signer,
                            ItemToDeposit: swapDataItem,
                            swapDataAccount: Data.swapDataAccount,
                            swapDataAccount_seed: swapData.swapDataAccount_seed,
                            swapDataAccount_bump: swapData.swapDataAccount_bump,
                        });
                        depositInstruction.push(...depositSolInstruction);
                        ataList = createdMint;

                        // console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ataList SOL', ataList);
                        console.log('depositSolinstruction added');
                    }
                    break;
            }
        } else if (swapDataItem.isPresigning) {
            // switch (swapDataItem.isNft) {
            //     case true:
            //         // console.log('presigned  NFT',µ swapDataItem, swapDataItem.owner.toBase58(), Data.user.toBase58());
            //         if (
            //             swapDataItem.owner.toBase58() === Data.user.toBase58() &&
            //             swapDataItem.status === ItemStatus.NFTPendingPresign
            //         ) {
            //             console.log('XXX - Presigned Deposit NFT X X ', swapDataItem.mint.toBase58(), ' - XXX ');
            //             // test.push(i);
            //             // i++;
            //             // console.log('test', test);
            //             let { instruction: depositNFTInstruction, mintAta: createdMint } = await depositNftPresigned({
            //                 program: program,
            //                 signer: Data.signer,
            //                 mint: swapDataItem.mint,
            //                 swapDataAccount: Data.swapDataAccount,
            //                 swapDataAccount_seed: swapData.swapDataAccount_seed,
            //                 swapDataAccount_bump: swapData.swapDataAccount_bump,
            //                 user: Data.user,
            //                 ataList,
            //             });
            //             ataList = createdMint;
            //             depositNFTInstruction.forEach((depositNftAta) => {
            //                 depositInstruction.push(depositNftAta);
            //             });
            //             // console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ataList NFT', ataList);
            //             console.log('depositNftInstruction added');
            //         }
            //         break;
            //     case false:
            //         // console.log('presigned not NFT', swapDataItem, swapDataItem.owner.toBase58(), Data.user.toBase58());
            //         if (
            //             swapDataItem.owner.toBase58() === Data.user.toBase58() &&
            //             swapDataItem.status === ItemStatus.SolPendingPresig
            //         ) {
            //             // test.push(i);
            //             // i++;
            //             // console.log('test', test);
            //             console.log(
            //                 'XXXXXXX - Presigned Deposit sol item - XXXXXXX',
            //                 'signer:',
            //                 Data.signer.toBase58(),
            //                 'user:',
            //                 Data.user.toBase58(),
            //                 // 'swapDataAccount:',
            //                 // Data.swapDataAccount,
            //                 ataList
            //             );
            //             const { instruction: depositSolInstruction, mintAta: createdMint } = await depositSolPresigned({
            //                 program: program,
            //                 ataList,
            //                 signer: Data.signer,
            //                 user: Data.user,
            //                 swapDataAccount: Data.swapDataAccount,
            //                 swapDataAccount_seed: swapData.swapDataAccount_seed,
            //                 swapDataAccount_bump: swapData.swapDataAccount_bump,
            //             });
            //             depositInstruction.push(...depositSolInstruction);
            //             ataList = createdMint;
            //             // console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ataList SOL', ataList);
            //             console.log('depositSolinstruction added');
            //         }
            //         break;
            // }
        } else {
            console.log('presigning value error');
            throw { msg: 'presigning value error' };
        }
    }
    console.log('depositInstruction', depositInstruction.length);

    let depositTransaction = [new Transaction()];
    depositTransaction = appendTransactionToArray({
        mainArray: depositTransaction,
        itemToAdd: depositInstruction,
    });
    const depositSendAllArray = await convertAllTransaction(depositTransaction);
    if (depositSendAllArray[0].tx.instructions.length > 0) {
        return { depositSendAllArray };
    } else {
        return { depositSendAllArray: undefined };
    }
};

export default depositUserOnly;
