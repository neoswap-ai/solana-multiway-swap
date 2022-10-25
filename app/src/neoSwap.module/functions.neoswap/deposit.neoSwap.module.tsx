import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Signer, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { sendAllPopulateInstruction } from '../../solana.utils';
import { appendTransactionToArray } from '../utils.neoSwap/appendTransactionToArray.neosap';
import { splAssociatedTokenAccountProgramId } from '../utils.neoSwap/const.neoSwap';
import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData, getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { NftSwapItem, SwapData } from '../utils.neoSwap/types.neoSwap';
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
    console.log('SwapData', swapData);
    if (swapData.swapData.status !== 0) throw console.error('Trade not in waiting for deposit state');

    // const tradeRef = getSeed(swapData);
    // console.log('tradeRef', tradeRef);

    // const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
    // console.log('swapDataAccount_seed', swapDataAccount_seed);

    // const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
    //     [swapData.swapDataAccount_seed],
    //     Data.program.programId
    // );

    // console.log('swapDataAccount', swapDataAccount.toBase58());
    // console.log('swapDataAccount_bump', swapDataAccount_bump);

    let depositInstructionTransaction: Array<Transaction> = [new Transaction()];
    // let row = 0;
    let ataList: Array<PublicKey> = [];
    for (let item = 0; item < swapData.swapData.items.length; item++) {
        let e = swapData.swapData.items[item];
        // if (item ===swapData.swapData.items.length-1){

        //     console.log('element', item);
        //     console.log('\namount :', e.amount.toNumber());
        //     console.log('\ndestinary :', e.destinary.toBase58());
        //     console.log('\nmint :', e.mint.toBase58());
        //     console.log('\nowner :', e.owner.toBase58());
        //     console.log('\nstatus :', e.status);
        //     console.log('\nisNft :', e.isNft);
        //     console.log('\nsigner :', Data.signer.toBase58());
        // }

        switch (e.isNft) {
            case true:
                if (e.owner.toBase58() === Data.signer.toBase58() && e.status === 0) {
                    let depositing = await depositNft(
                        Data.program,
                        Data.signer,
                        e.mint,
                        Data.swapDataAccount,
                        swapData.swapDataAccount_seed,
                        swapData.swapDataAccount_bump,
                        ataList
                    );
                    ataList.push(depositing.ata);

                    depositInstructionTransaction = appendTransactionToArray(depositInstructionTransaction, [
                        depositing.transaction,
                    ]);
                }
                break;
            case false:
                if (e.owner.toBase58() === Data.signer.toBase58() && e.status === 0) {
                    const solTransaction = await depositSol(
                        Data.program,
                        Data.signer,
                        Data.swapDataAccount,
                        swapData.swapDataAccount_seed,
                        swapData.swapDataAccount_bump
                    );

                    depositInstructionTransaction = appendTransactionToArray(depositInstructionTransaction, [
                        solTransaction,
                    ]);
                }
                break;
        }
    }
    let count = 0;
    ataList.forEach((element) => {
        console.log('ataList n°', count, '\nWith Pubkey: ', element.toBase58());
        count++;
    });

    // console.log('rkjfbhqzimejfbzmkejb', depositInstructionTransaction.length);
    const depositSendAllArray = await convertAllTransaction(Data.program, depositInstructionTransaction);
    return { depositSendAllArray };
};

// Data.swapData.initializer = Data.signer;

// const seedSwapData = await getSwapDataFromPDA({ swapData: Data.swapData, programId: Data.programId });
// let sentData: SwapData = {
//     initializer: Data.signer,
//     items: [Data.swapData.items[0]],
//     status: Data.swapData.status,
// };

// const initInitTransaction = new Transaction().add(
//     await Data.program.methods
//         .initInitialize(
//             seedSwapData.swapDataAccount_seed,
//             seedSwapData.swapDataAccount_bump,
//             sentData,
//             Data.swapData.items.length
//         )
//         .accounts({
//             swapDataAccount: seedSwapData.swapDataAccount,
//             signer: Data.signer,
//             systemProgram: web3.SystemProgram.programId,
//             splTokenProgram: splAssociatedTokenAccountProgramId,
//         })
//         .instruction()
// );
// return { initInitTransaction };
// };

// const addInitialize = async () => {
//     if (!publicKey) throw new WalletNotConnectedError();
//     sentData.initializer = publicKey;
//     const program = await getProgram();
//     if (!program.provider.sendAndConfirm) throw console.error('no provider');

//     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
//     console.log('SwapData', swapData);
//     if (swapData.status !== 80) throw console.error('Trade not in waiting for initialized state');

//     const tradeRef = getSeed(fullData);
//     const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);

//     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
//         [swapDataAccount_seed],
//         programId
//     );

//     console.log('swapDataAccount', swapDataAccount.toBase58());
//     console.log('swapDataAccount_bump', swapDataAccount_bump);

//     const firstTx = await program.methods
//         .initializeAdd(swapDataAccount_seed, swapDataAccount_bump, fullData.items[1])
//         .accounts({
//             // accounts: {
//             swapDataAccount: swapDataAccount,
//             signer: publicKey,
//             //  },
//         })
//         .instruction();
//     if (!firstTx) throw console.error('noTx');
//     let depositTransaction: Transaction = new Transaction().add(firstTx);

//     // const res = program.methods
//     //     .initializeAdd(swapDataAccount_seed, swapDataAccount_bump, fullData.items[1])
//     //     .accounts({ swapDataAccount: swapDataAccount, signer: publicKey })
//     //     .instruction();

//     for (let index = 2; index < fullData.items.length; index++) {
//         const element = fullData.items[index];
//         let temp_inst = await program.methods
//             .initializeAdd(swapDataAccount_seed, swapDataAccount_bump, element)
//             .accounts(
//                 {
//                     //     accounts: {
//                     swapDataAccount: swapDataAccount,
//                     signer: publicKey.toString(),
//                 }
//                 // }
//             )
//             .instruction();
//         if (!temp_inst) throw console.error('');

//         depositTransaction.add(
//             temp_inst
//             // await program.methods
//             //     .initializeAdd(swapDataAccount_seed, swapDataAccount_bump, element)
//             //     .accounts({ swapDataAccount: swapDataAccount, signer: publicKey })
//             //     .instruction()
//             //    new Transaction().add()
//             // .instruction(

//             // program.instruction.initializeAdd(swapDataAccount_seed, swapDataAccount_bump, element, {
//             //     accounts: {
//             //         swapDataAccount: swapDataAccount,
//             //         signer: publicKey,
//             //     },
//             // })
//         );
//         // depositTransaction[index].feePayer = publicKey;
//         // depositTransaction[index].recentBlockhash = (
//         //     await program.provider.connection.getLatestBlockhash()
//         // ).blockhash;
//     }

//     try {
//         // depositTransaction.feePayer = publicKey;
//         // depositTransaction.recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
//         const transactionHash = await program.provider.sendAndConfirm(depositTransaction);

//         console.log('initialize transactionHash', transactionHash);
//     } catch (error) {
//         programCatchError(error);

//         console.log('error', error);
//         const hash = String(error).slice(136, 223);
//         console.log('hash', hash);

//         const conftr = await program.provider.connection.getTransaction(hash);
//         console.log('conftr', conftr);
//     }
// };
