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




// const allInitialize = async () => {
//     await addInitialize();
//     await verifyInitialize();
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
