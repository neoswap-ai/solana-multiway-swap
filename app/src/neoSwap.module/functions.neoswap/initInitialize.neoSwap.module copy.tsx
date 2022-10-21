import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { splAssociatedTokenAccountProgramId } from '../utils.neoSwap/const.neoSwap';
import { getSeedFromSwapData } from '../utils.neoSwap/getSeed.neoSwap';
import { SwapData } from '../utils.neoSwap/types.neoSwap';

export const initInitialize = async (Data: {
    swapData: SwapData;
    signer: PublicKey;
    program: Program;
    programId: PublicKey;
    swapDataAccount: PublicKey;
}): Promise<{ validateClaimedTransaction: Transaction }> => {
    Data.swapData.initializer = Data.signer;

    const seedSwapData = await getSeedFromSwapData({ swapData: Data.swapData, programId: Data.programId });
    // console.log('tradeRef', tradeRef);
    let sentData: SwapData = { initializer:, items, status };
    sentData.initializer = Data.swapData.initializer;

    try {
        const initInitTransaction = new Transaction().add(
            await Data.program.methods
                .initInitialize(
                    seedSwapData.swapDataAccount_seed_buffer,
                    seedSwapData.swapDataAccount_bump,
                    sentData,
                    fullData.items.length
                )
                .accounts({
                    // accounts: {
                    swapDataAccount: swapDataAccount,
                    signer: publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    splTokenProgram: splAssociatedTokenAccountProgramId,
                    // },
                })
                .instruction()
        );
        console.log('initialize transactionHash', transactionHash);
    } catch (error) {
        programCatchError(error);
        const hash = String(error).slice(136, 223);
        console.log('hash', hash);

        const conftr = await program.provider.connection.confirmTransaction(hash, 'processed');

        console.log('conftr', conftr);
    }

    // const swapData: SwapData = (await vData.program.account.swapData.fetch(vData.swapDataAccount)) as SwapData;
    // // console.log('swapData', swapData);
    // if (swapData.status !== 1) throw console.error('Trade not in waiting to be changed to claimed');

    // const { swapDataAccount, swapDataAccount_seed_string, swapDataAccount_seed_buffer, swapDataAccount_bump } =
    //     await getSeedFromSwapData({ swapData, programId: vData.programId });

    // try {
    //     const validateClaimedTransaction = new Transaction().add(
    //         await vData.program.methods
    //             .validateClaimed(swapDataAccount_seed_buffer, swapDataAccount_bump)
    //             .accounts({
    //                 systemProgram: web3.SystemProgram.programId,
    //                 splTokenProgram: splAssociatedTokenAccountProgramId,
    //                 swapDataAccount: swapDataAccount,
    //                 signer: vData.userPublickey,
    //             })
    //             .instruction()
    //     );

    //     // console.log('validateClaimedTransaction :', validateClaimedTransaction);
    //     return { validateClaimedTransaction };
    // } catch (error) {
    //     throw error;
    // }
};

// const initInitialize = async () => {
//     if (!publicKey) throw new WalletNotConnectedError();
//     sentData.initializer = publicKey;
//     console.log('sentData', sentData);
//     // let sum = new BN(0);
//     // for (let index = 0; index < sentData.items.length; index++) {
//     //     const element = sentData.items[index];
//     //     if (!element.isNft) {
//     //         sum = sum.add(element.amount);
//     //     }
//     // }
//     // if (sum.toNumber() !== 0) {
//     //     console.log('sum', sum.toNumber());
//     //     throw console.error('balance at the end of trade not null');
//     // }

//     const program = await getProgram();
//     // const latestBlockHash = await program.provider.connection.getLatestBlockhash();
//     // console.log('latestBlockHash', latestBlockHash);

//     // const res = await new Connection(clusterApiUrl(network), opts.preflightCommitment).getTransaction(
//     //     '2ZtfSaYgceLVXauqqgBLpHUh6qzBTH1VvGnCYZsJCdi69S1j6736zwSGCB8PTt2B5yrGpjRpeLBqrL3EKaLZP64'
//     // );
//     // console.log('confirm tr', res);

//     const tradeRef = getSeed(fullData);
//     console.log('tradeRef', tradeRef);

//     const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);

//     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
//         [swapDataAccount_seed],
//         programId
//     );

//     console.log('swapDataAccount', swapDataAccount.toBase58());
//     console.log('swapDataAccount_bump', swapDataAccount_bump);
//     // let newSentData = sentData;
//     // newSentData.items = new Array(sentData.items[0]);
//     // console.log("newSentData",newSentData);

//     try {
//         const transactionHash = await program.methods
//             .initInitialize(swapDataAccount_seed, swapDataAccount_bump, sentData, fullData.items.length)
//             .accounts({
//                 // accounts: {
//                 swapDataAccount: swapDataAccount,
//                 signer: publicKey,
//                 systemProgram: web3.SystemProgram.programId,
//                 splTokenProgram: splAssociatedTokenAccountProgramId,
//                 // },
//             })
//             .rpc();
//         console.log('initialize transactionHash', transactionHash);
//     } catch (error) {
//         programCatchError(error);
//         const hash = String(error).slice(136, 223);
//         console.log('hash', hash);

//         const conftr = await program.provider.connection.confirmTransaction(hash, 'processed');

//         console.log('conftr', conftr);
//     }
// };
