import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { splAssociatedTokenAccountProgramId } from '../utils.neoSwap/const.neoSwap';
import { getSeedFromData } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { NftSwapItem, SwapData } from '../utils.neoSwap/types.neoSwap';

export const addInitialize = async (Data: {
    swapData: SwapData;
    signer: PublicKey;
    program: Program;
    // CONST_PROGRAM: string;
    // swapDataAccount: PublicKey;
}): Promise<{ addInitTransaction: Array<Transaction> }> => {
    // if (!Data.program.provider.sendAndConfirm) throw console.error('no sendAndConfirm');
    if (Data.swapData.status !== 80) throw console.error('Trade not in waiting for initialized state');

    const seedSwapData = await getSeedFromData({
        swapData: Data.swapData,
        // programId: Data.program.programId,
        program: Data.program,
        // CONST_PROGRAM: Data.CONST_PROGRAM,
    });

    // let itemsToSend: NftSwapItem;
    let addInitTransaction: Array<Transaction> = [new Transaction()];
    const maxInstructionPerTransaction = 7;
    let row = 0;
    for (let index1 = 1; index1 < Data.swapData.items.length; index1++) {
        const swapDataItem = Data.swapData.items[index1];
        let addTransaction = true;
        for (let index2 = 0; index2 < Data.swapData.items.length; index2++) {
            const seedSwapDataItem = Data.swapData.items[index2];

            if (
                seedSwapDataItem.amount.toNumber() === swapDataItem.amount.toNumber() &&
                seedSwapDataItem.destinary.toString() === swapDataItem.destinary.toString() &&
                seedSwapDataItem.isNft === swapDataItem.isNft &&
                seedSwapDataItem.mint.toString() === swapDataItem.mint.toString() &&
                seedSwapDataItem.owner.toString() === swapDataItem.owner.toString() &&
                seedSwapDataItem.status === swapDataItem.status
            ) {
                console.log('not this one', index1);

                addTransaction = false;
                break;
            }
        }
        console.log('number', swapDataItem.amount.toNumber());

        if (addTransaction && (swapDataItem.isNft || swapDataItem.amount.toNumber() > 0)) {
            const instructionToAdd = await Data.program.methods
                .initializeAdd(seedSwapData.swapDataAccount_seed, seedSwapData.swapDataAccount_bump, swapDataItem)
                .accounts({
                    swapDataAccount: seedSwapData.swapDataAccount,
                    signer: Data.signer.toString(),
                })
                .instruction();

            if (addInitTransaction[row].instructions.length < maxInstructionPerTransaction) {
                console.log('itemAddedInstruction');
                addInitTransaction[row].add(instructionToAdd);
            } else if (addInitTransaction[row].instructions.length === maxInstructionPerTransaction) {
                row = row + 1;
                console.log('itemAddedInstruction new line');
                addInitTransaction.push(new Transaction().add(instructionToAdd));
            } else {
                throw console.error('');
            }
        } else {
            console.log('not Added');
        }
    }
    addInitTransaction = addInitTransaction.slice(1, addInitTransaction.length);

    return { addInitTransaction };
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
