import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Signer, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { sendAllPopulateInstruction } from '../../solana.utils';
import { appendTransactionToArray } from '../utils.neoSwap/appendTransactionToArray.neosap';
import { splAssociatedTokenAccountProgramId } from '../utils.neoSwap/const.neoSwap';
import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData, getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { NftSwapItem, SwapData } from '../utils.neoSwap/types.neoSwap';
import { claimNft } from './createInstruction/claim.nft.neoswap';
import { claimSol } from './createInstruction/claim.sol.neoswap';
import { depositNft } from './createInstruction/deposit.nft.neoswap';
import { depositSol } from './createInstruction/deposit.sol.neoswap';

export const claim = async (Data: {
    program: Program;
    swapDataAccount: PublicKey;
    signer: PublicKey;
}): Promise<{
    claimSendAllArray: Array<{
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
    let claimInstructionTransaction = new Transaction();

    for (let item = 0; item < swapData.swapData.items.length; item++) {
        let e = swapData.swapData.items[item];
        // console.log('element', item, ' \n', e);

        switch (e.isNft) {
            case true:
                if (e.status === 1) {
                    console.log(e.destinary.toBase58());
                    claimInstructionTransaction.add(
                        (
                            await claimNft({
                                program: Data.program,
                                signer: Data.signer,
                                user: e.destinary,
                                mint: e.mint,
                                swapDataAccount: Data.swapDataAccount,
                                swapDataAccount_seed: swapData.swapDataAccount_seed,
                                swapDataAccount_bump: swapData.swapDataAccount_bump,
                            })
                        ).transaction
                    );
                    console.log('claimNftinstruction added');
                }
                break;
            case false:
                if (e.status === 1) {
                    claimInstructionTransaction.add(
                        (
                            await claimSol({
                                program: Data.program,
                                user: e.owner,
                                signer: Data.signer,
                                swapDataAccount: Data.swapDataAccount,
                                swapDataAccount_seed: swapData.swapDataAccount_seed,
                                swapDataAccount_bump: swapData.swapDataAccount_bump,
                            })
                        ).transaction
                    );
                    console.log('claimSolinstruction added');
                }
                break;
        }
    }

    const claimSendAllArray = await convertAllTransaction(Data.program, [claimInstructionTransaction]);
    return { claimSendAllArray };
};

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
