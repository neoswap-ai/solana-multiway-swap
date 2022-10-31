//@ts-ignore
import { Program } from '@project-serum/anchor';
// import { PublicKey, Signer, Transaction } from '@solana/web3.js';
// import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
// import { getSeedFromData } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
// import {  SwapData } from '../utils.neoSwap/types.neoSwap';

// export const addInitialize = async (Data: {
//     swapData: SwapData;
//     signer: PublicKey;
//     program: Program;
// }): Promise<{
//     addInitSendAllArray: Array<{
//         tx: Transaction;
//         signers?: Array<Signer> | undefined;
//     }>;
// }> => {
//     if (Data.swapData.status !== 80) throw console.error('Trade not in waiting for initialized state');

//     const seedSwapData = await getSeedFromData({
//         swapData: Data.swapData,
//         program: Data.program,
//     });

//     let addInitTransaction: Array<Transaction> = [new Transaction()];

//     const maxInstructionPerTransaction = 6;
//     let row = 0;
//     for (let item = 1; item < Data.swapData.items.length; item++) {
//         const swapDataItem = Data.swapData.items[item];
//         let addTransaction = true;
//         console.log('XXXXXXX - item n° ', item -1, ' XXXXXXX');
//         for (let index2 = 0; index2 < Data.swapData.items.length; index2++) {
//             const seedSwapDataItem = Data.swapData.items[index2];

//             if (
//                 (seedSwapDataItem.amount.toNumber() === swapDataItem.amount.toNumber() &&
//                     seedSwapDataItem.destinary.toString() === swapDataItem.destinary.toString() &&
//                     seedSwapDataItem.isNft === swapDataItem.isNft &&
//                     seedSwapDataItem.mint.toString() === swapDataItem.mint.toString() &&
//                     seedSwapDataItem.owner.toString() === swapDataItem.owner.toString() &&
//                     seedSwapDataItem.status === swapDataItem.status) ||
//                 swapDataItem.status === 0
//             ) {
//                 console.log('not this one', item);

//                 addTransaction = false;
//                 break;
//             }
//         }
//         console.log('number', swapDataItem.amount.toNumber());

//         if (addTransaction) {
//             const instructionToAdd = await Data.program.methods
//                 .initializeAdd(seedSwapData.swapDataAccount_seed, seedSwapData.swapDataAccount_bump, swapDataItem)
//                 .accounts({
//                     swapDataAccount: seedSwapData.swapDataAccount,
//                     signer: Data.signer.toString(),
//                 })
//                 .instruction();

//             if (addInitTransaction[row].instructions.length < maxInstructionPerTransaction) {
//                 console.log('itemAddedInstruction');
//                 addInitTransaction[row].add(instructionToAdd);
//             } else if (addInitTransaction[row].instructions.length === maxInstructionPerTransaction) {
//                 row = row + 1;
//                 console.log('itemAddedInstruction new line');
//                 addInitTransaction.push(new Transaction().add(instructionToAdd));
//             } else {
//                 throw console.error('');
//             }
//         } else {
//             console.log('not Added');
//         }
//     }
//     addInitTransaction = addInitTransaction.slice(1, addInitTransaction.length);
//     const addInitSendAllArray = await convertAllTransaction(Data.program, addInitTransaction);

//     return { addInitSendAllArray };
// };
