import { AnchorProvider, Program, utils } from "@project-serum/anchor";
// import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";

// // import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
// // import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
// // import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
// // import { clusterApiUrl, Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
// // import { FC, useCallback } from 'react';
// // import { idl } from './idl';
// // import { splAssociatedTokenAccountProgramId, opts } from './solana.const';
// // import { CONST_PROGRAM, fullData, network, programId, sentData, swapDataAccountGiven } from './solana.test';
// // import { SwapData } from './solana.types';
// // import {
// //     cIcancelNft,
// //     cIcancelSol,
// //     cIclaimNft,
// //     cIclaimSol,
// //     cIdepositNft,
// //     cIdepositSol,
// // } from './solana.programInstruction';
// // import { programCatchError } from './solana.errors';
// const getProvider =async (): Promise<AnchorProvider> => {
//     if (!anchorWallet) {
//         throw new WalletNotConnectedError();
//     } else {
//         return new AnchorProvider(
//             new Connection(clusterApiUrl(network), opts.preflightCommitment),
//             anchorWallet,
//             opts.preflightCommitment
//         );
//     }
// };

// const getProgram = async (): Promise<Program> => {
//     return new Program(idl, programId, await getProvider());
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

// const verifyInitialize = async () => {
//     if (!publicKey) throw new WalletNotConnectedError();
//     sentData.initializer = publicKey;
//     console.log('sentData', sentData);

//     const program = await getProgram();
//     // if (program.provider.sendAndConfirm) throw console.error('no provider');
//     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
//     console.log('SwapData', swapData);
//     if (swapData.status !== 80) throw console.error('Trade not in waiting for initialized state');

//     const tradeRef = getSeed(fullData);
//     console.log('tradeRef', tradeRef);
//     if (getSeed(fullData) !== getSeed(swapData)) {
//         console.log('data missing');
//     }
//     const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);

//     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
//         [swapDataAccount_seed],
//         programId
//     );

//     console.log('swapDataAccount', swapDataAccount.toBase58());
//     console.log('swapDataAccount_bump', swapDataAccount_bump);

//     try {
//         const transactionHash = await program.methods
//             .validateInitialize(swapDataAccount_seed, swapDataAccount_bump)
//             .accounts({
//                 // accounts: {
//                 swapDataAccount: swapDataAccount,
//                 signer: publicKey,
//                 // systemProgram: web3.SystemProgram.programId,
//                 // splTokenProgram: splAssociatedTokenAccountProgramId,
//                 // },
//             })
//             .rpc();
//         console.log('initialize transactionHash', transactionHash);
//     } catch (error) {
//         programCatchError(error);
//     }
// };

// const allInitialize = async () => {
//     await addInitialize();
//     await verifyInitialize();
// };

// const deposit = async () => {
//     if (!publicKey) throw new WalletNotConnectedError();

//     const program = await getProgram();
//     // console.log('program', program);
//     if (!program.provider.sendAndConfirm) throw console.error('no provider');

//     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
//     console.log('SwapData', swapData);
//     if (swapData.status !== 0) throw console.error('Trade not in waiting for deposit state');

//     const tradeRef = getSeed(swapData);
//     // console.log('tradeRef', tradeRef);

//     const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
//     // console.log('swapDataAccount_seed', swapDataAccount_seed);

//     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
//         [swapDataAccount_seed],
//         programId
//     );

//     console.log('swapDataAccount', swapDataAccount.toBase58());
//     console.log('swapDataAccount_bump', swapDataAccount_bump);

//     let depositInstructionTransaction = new Transaction();
//     let ataList: Array<PublicKey>  = [];
//     for (let item = 0; item < swapData.items.length; item++) {
//         let e = swapData.items[item];
//         // console.log('element', item, ' \n', e);

//         switch (e.isNft) {
//             case true:
//                 if (e.owner.toBase58() === publicKey.toBase58() && e.status === 0) {
//                     let depositing = await cIdepositNft(
//                         program,
//                         publicKey,
//                         e.mint,
//                         swapDataAccount,
//                         swapDataAccount_seed,
//                         swapDataAccount_bump,
//                         ataList
//                     );
//                     ataList.push(depositing.ata);
//                     depositInstructionTransaction.add(depositing.transaction);
//                     console.log("ataList",ataList);
                    
//                 }
//                 break;
//             case false:
//                 if (e.owner.toBase58() === publicKey.toBase58() && e.status === 0) {
//                     depositInstructionTransaction.add(
//                         await cIdepositSol(
//                             program,
//                             publicKey,
//                             swapDataAccount,
//                             swapDataAccount_seed,
//                             swapDataAccount_bump
//                         )
//                     );
//                 }
//                 break;
//         }
//     }
//     //         let arrowToDel: Array<number> = [];
//     //         for (let index1 = 0; index1 < depositInstructionTransaction.instructions.length; index1++) {
//     //             const element1 = depositInstructionTransaction.instructions[index1];
//     //             for (let index2 = index1 + 1; index2 < depositInstructionTransaction.instructions.length; index2++) {
//     //                 const element2 = depositInstructionTransaction.instructions[index2];
//     //                 console.log('element1.data ', index1, '\n', (element1.data.buffer));
//     //                 console.log('element2.keys', index2, '\n', (element2.data.buffer));

//     //                 if (element1.data.buffer === element2.data.buffer) {
//     //                     console.log('elem1===elem2');

//     //                     arrowToDel.push(index2);
//     //                 }
//     //             }
//     //         }
//     // console.log("arrowToDel",arrowToDel);

//     //         for (let index3 = arrowToDel.length; index3 > 0; index3--) {
//     //             const element = arrowToDel[index3];
//     //             depositInstructionTransaction.instructions = [
//     //                 ...depositInstructionTransaction.instructions.slice(0, element - 1),
//     //                 ...depositInstructionTransaction.instructions.slice(element),
//     //             ];
//     //         }
//     depositInstructionTransaction.feePayer = publicKey;
//     depositInstructionTransaction.recentBlockhash = (
//         await program.provider.connection.getLatestBlockhash()
//     ).blockhash;
//     console.log(depositInstructionTransaction);

//     if (depositInstructionTransaction.instructions.length > 0) {
//         try {
//             const hash = await program.provider.sendAndConfirm(depositInstructionTransaction);
//             console.log('deposit transaction hash\n', hash);
//         } catch (error) {
//             programCatchError(error);
//             const hash = String(error).slice(136, 223);
//             console.log('hash', hash);
//             const conftr = await program.provider.connection.confirmTransaction(hash, 'processed');
//             console.log('conftr', conftr);
//         }
//     } else {
//         console.log('Nothing to deposit');
//     }
// };

// const read = async () => {
//     if (!publicKey) throw new WalletNotConnectedError();

//     const program = await getProgram();

//     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
//     console.log('SwapData', swapData);
// };

// const cancel = async () => {
//     if (!publicKey) throw new WalletNotConnectedError();

//     const program = await getProgram();
//     if (!program.provider.sendAndConfirm) throw console.error('no provider');
//     // console.log('program', program);

//     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
//     console.log('SwapData', swapData);
//     if (!(swapData.status === 0 || swapData.status === 90)) {
//         throw console.error('Trade not able to be canceled');
//     }
//     const tradeRef = getSeed(swapData);
//     // console.log('tradeRef', tradeRef);

//     const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
//     // console.log('swapDataAccount_seed', swapDataAccount_seed);

//     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
//         [swapDataAccount_seed],
//         programId
//     );
//     console.log('swapDataAccount_bump', swapDataAccount_bump);

//     let cancelInstructionTransaction = new Transaction();

//     for (let item = 0; item < swapData.items.length; item++) {
//         let e = swapData.items[item];
//         // console.log('element', item, ' \n', e);

//         switch (e.isNft) {
//             case true:
//                 if (e.status === 1 || e.status === 0) {
//                     cancelInstructionTransaction.add(
//                         (
//                             await cIcancelNft(
//                                 program,
//                                 publicKey,
//                                 e.owner,
//                                 e.mint,
//                                 swapDataAccount,
//                                 swapDataAccount_seed,
//                                 swapDataAccount_bump
//                             )
//                         ).transaction
//                     );
//                     console.log('cancelNftinstruction added');
//                 }
//                 break;
//             case false:
//                 if (e.destinary.toBase58() === publicKey.toBase58() && (e.status === 1 || e.status === 0)) {
//                     cancelInstructionTransaction.add(
//                         (
//                             await cIcancelSol(
//                                 program,
//                                 e.owner,
//                                 publicKey,
//                                 swapDataAccount,
//                                 swapDataAccount_seed,
//                                 swapDataAccount_bump
//                             )
//                         ).transaction
//                     );
//                     console.log('cancelSolinstruction added');
//                 }
//                 break;
//         }
//     }

//     cancelInstructionTransaction.feePayer = publicKey;
//     cancelInstructionTransaction.recentBlockhash = (
//         await program.provider.connection.getLatestBlockhash()
//     ).blockhash;
//     // console.log('cancelInstructionTransaction', cancelInstructionTransaction);

//     if (cancelInstructionTransaction.instructions.length > 0) {
//         try {
//             const hash = await program.provider.sendAndConfirm(cancelInstructionTransaction);
//             console.log('cancel Transaction hash', hash);
//         } catch (error) {
//             programCatchError(error);
//         }
//     } else {
//         console.log('Nothing to cancel');
//     }
// };

// const validateCancel = async () => {
//     if (!publicKey) throw new WalletNotConnectedError();
//     sentData.initializer = publicKey;
//     // console.log('sentData', sentData);

//     const program = await getProgram();
//     // console.log('program', program);

//     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
//     console.log('swapData', swapData);
//     if (swapData.status !== 90) throw console.error('Trade not in waiting to be cancelled');

//     const tradeRef = getSeed(swapData);

//     // console.log('tradeRef', tradeRef);

//     const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
//     // console.log('swapDataAccount_seed', swapDataAccount_seed);

//     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
//         [swapDataAccount_seed],
//         programId
//     );

//     // console.log('swapDataAccount', swapDataAccount.toBase58());
//     // console.log('swapDataAccount_bump', swapDataAccount_bump);

//     try {
//         const transactionHash = await program.methods
//             .validateCancelled(swapDataAccount_seed, swapDataAccount_bump)
//             .accounts({
//                 // accounts: {
//                 systemProgram: web3.SystemProgram.programId,
//                 splTokenProgram: splAssociatedTokenAccountProgramId,
//                 swapDataAccount: swapDataAccount,
//                 signer: publicKey,
//                 // },
//             })
//             .rpc();

//         console.log('validateCancelled transactionHash', transactionHash);
//     } catch (error) {
//         programCatchError(error);
//     }
// };

// const validateDeposit = async () => {
//     if (!publicKey) throw new WalletNotConnectedError();
//     sentData.initializer = publicKey;
//     // console.log('sentData', sentData);

//     const program = await getProgram();
//     // console.log('program', program);

//     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
//     console.log('swapData', swapData);
//     if (swapData.status !== 0) throw console.error('Trade not in waiting to be validated');

//     const tradeRef = getSeed(swapData);

//     // console.log('tradeRef', tradeRef);

//     const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
//     // console.log('swapDataAccount_seed', swapDataAccount_seed);

//     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
//         [swapDataAccount_seed],
//         programId
//     );

//     console.log('swapDataAccount', swapDataAccount.toBase58());
//     console.log('swapDataAccount_bump', swapDataAccount_bump);

//     try {
//         const transactionHash = await program.methods
//             .validateDeposit(swapDataAccount_seed, swapDataAccount_bump)
//             .accounts({
//                 // accounts: {
//                 swapDataAccount: swapDataAccount,
//                 signer: publicKey,
//                 // },
//             })
//             .rpc();

//         console.log('transactionHash', transactionHash);
//     } catch (error) {
//         programCatchError(error);
//     }
// };

// const claim = async () => {
//     if (!publicKey) throw new WalletNotConnectedError();

//     const program = await getProgram();
//     if (!program.provider.sendAndConfirm) throw console.error('no provider');
//     // console.log('program', program);

//     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
//     console.log('swapData :', swapData);
//     if (swapData.status !== 1) throw console.error('Trade not in waiting for claim state');

//     const tradeRef = getSeed(swapData);
//     // console.log('tradeRef', tradeRef);

//     const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
//     // console.log('swapDataAccount_seed', swapDataAccount_seed);

//     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
//         [swapDataAccount_seed],
//         programId
//     );

//     // console.log('swapDataAccount_bump', swapDataAccount_bump);

//     let claimInstructionTransaction = new Transaction();

//     for (let item = 0; item < swapData.items.length; item++) {
//         let e = swapData.items[item];
//         // console.log('element', item, ' \n', e);

//         switch (e.isNft) {
//             case true:
//                 if (e.status === 1) {
//                     console.log(e.destinary.toBase58())
//                     claimInstructionTransaction.add(
//                         (
//                             await cIclaimNft(
//                                 program,
//                                 publicKey,
//                                 e.destinary,
//                                 e.mint,
//                                 swapDataAccount,
//                                 swapDataAccount_seed,
//                                 swapDataAccount_bump
//                             )
//                         ).transaction
//                     );
//                     console.log('claimNftinstruction added');
//                 }
//                 break;
//             case false:
//                 if (e.status === 1) {
//                     claimInstructionTransaction.add(
//                         (
//                             await cIclaimSol({
//                                 program,
//                                 user: e.owner,
//                                 publicKey,
//                                 swapDataAccount,
//                                 swapDataAccount_seed,
//                                 swapDataAccount_bump,
//                             })
//                         ).transaction
//                     );
//                     console.log('claimSolinstruction added');
//                 }
//                 break;
//         }
//     }

//     claimInstructionTransaction.feePayer = publicKey;
//     claimInstructionTransaction.recentBlockhash = (
//         await program.provider.connection.getLatestBlockhash()
//     ).blockhash;
//     // console.log('claimInstructionTransaction', claimInstructionTransaction);

//     if (claimInstructionTransaction.instructions.length > 0) {
//         try {
//             const hash = await program.provider.sendAndConfirm(claimInstructionTransaction);
//             console.log('claim transaction hash', hash);
//         } catch (error) {
//             programCatchError(error);
//         }
//     } else {
//         console.log('Nothing to claim');
//     }
// }

 

