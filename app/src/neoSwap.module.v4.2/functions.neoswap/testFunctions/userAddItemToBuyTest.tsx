import { AnchorProvider, BN, Program } from '@project-serum/anchor';
import { NATIVE_MINT } from '@solana/spl-token';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, Signer, Transaction } from '@solana/web3.js';
import NeoSwap from '../..';
import { ItemStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';

export const userAddItemToBuyTest = async (Data: {
    // swapDataAccount: PublicKey;
    // user: PublicKey;
    // signer: PublicKey;
    // CONST_PROGRAM: string;
    userKeypairsPresigned: {
        keypair: Keypair;
        tokens: {
            mint: PublicKey;
            ata: PublicKey;
            value: number;
        }[];
    }[];
    userKeypairsNormal: {
        keypair: Keypair;
        tokens: {
            mint: PublicKey;
            ata: PublicKey;
            value: number;
        }[];
    }[];
    swapData: SwapData;
    program: Program;
    buyLamportMoreThanSell: number;
    // userKeypairs: { keypair: Keypair[] };
    // signer: Keypair;
}): Promise<{
    sendAllArray: {
        tx: Transaction;
        signers?: Signer[] | undefined;
    }[];
    swapData: SwapData;
}> => {
    // let txhashs: string[] = [];
    let sendAllArray: {
        tx: Transaction;
        signers?: Signer[] | undefined;
    }[] = [];
    for (let index = 0; index < Data.userKeypairsNormal.length; index++) {
        const userKeypair = Data.userKeypairsNormal[index];
        //@ts-ignore
        if (userKeypair.keypair.publicKey.equals(Data.userKeypairsNormal.at(-1).keypair.publicKey)) {
            console.log(' last item', index, userKeypair.keypair.publicKey.toBase58());
            Data.swapData.items.push({
                isNft: false,
                isPresigning: false,
                owner: userKeypair.keypair.publicKey,
                mint: NATIVE_MINT,
                destinary: NATIVE_MINT,
                status: ItemStatus.SolPending,
                amount: new BN(0.025 * LAMPORTS_PER_SOL),
            });
            Data.userKeypairsNormal[0].tokens.map(async (token) => {
                Data.swapData.items.push({
                    isNft: true,
                    isPresigning: false,
                    mint: token.mint,
                    owner: Data.userKeypairsNormal[0].keypair.publicKey,
                    status: ItemStatus.NFTPending,
                    destinary: userKeypair.keypair.publicKey,
                    amount: new BN(1),
                });
            });
        } else {
            console.log(' not presigned ', index, userKeypair.keypair.publicKey.toBase58());
            Data.swapData.items.push({
                isNft: false,
                isPresigning: false,
                owner: userKeypair.keypair.publicKey,
                mint: NATIVE_MINT,
                destinary: NATIVE_MINT,
                status: ItemStatus.SolPending,
                amount: new BN(0.025 * LAMPORTS_PER_SOL),
            });
            Data.userKeypairsNormal[index + 1].tokens.map(async (token) => {
                Data.swapData.items.push({
                    isNft: true,
                    isPresigning: false,
                    mint: token.mint,
                    owner: Data.userKeypairsNormal[index + 1].keypair.publicKey,
                    status: ItemStatus.NFTPending,
                    destinary: userKeypair.keypair.publicKey,
                    amount: new BN(1),
                });
            });
        }
    }

    for (let index = 0; index < Data.userKeypairsPresigned.length; index++) {
        const userKeypair = Data.userKeypairsPresigned[index];
        // @ts-ignore
        if (userKeypair.keypair.publicKey.equals(Data.userKeypairsPresigned.at(-1).keypair.publicKey)) {
            console.log(' last item', index, userKeypair.keypair.publicKey.toBase58());
            Data.swapData.items.push({
                isNft: false,
                isPresigning: true,
                owner: userKeypair.keypair.publicKey,
                mint: NATIVE_MINT,
                destinary: NATIVE_MINT,
                status: ItemStatus.SolPending,
                amount: new BN(0.025 * LAMPORTS_PER_SOL),
            });
            Data.userKeypairsPresigned[0].tokens.map(async (token) => {
                const { userAddItemToBuyTransaction } = await NeoSwap.userAddItemToBuy({
                    program: Data.program,
                    itemToBuy: { mint: token.mint, amountMaxi: new BN(token.value + Data.buyLamportMoreThanSell) },
                    signer: userKeypair.keypair.publicKey,
                });
                userAddItemToBuyTransaction.signers = [userKeypair.keypair];
                userAddItemToBuyTransaction.tx.feePayer = userKeypair.keypair.publicKey;
                sendAllArray.push(userAddItemToBuyTransaction);
                // const transactionHash = await NeoSwap.boradcastToBlockchain({
                //     sendAllArray: [userAddItemToBuyTransaction],
                //     provider: Data.program.provider as AnchorProvider,
                //     signer: userKeypair.keypair,
                // });
                // txhashs.push(...transactionHash);

                Data.swapData.items.push({
                    isNft: true,
                    isPresigning: true,
                    mint: token.mint,
                    owner: Data.userKeypairsPresigned[0].keypair.publicKey,
                    status: ItemStatus.NFTPending,
                    destinary: userKeypair.keypair.publicKey,
                    amount: new BN(1),
                });
            });
        } else {
            //if (index < Data.userKeypairsPresigned.length - 2)
            console.log(' presigned User', index, userKeypair.keypair.publicKey.toBase58());
            Data.swapData.items.push({
                isNft: false,
                isPresigning: true,
                owner: userKeypair.keypair.publicKey,
                mint: NATIVE_MINT,
                destinary: NATIVE_MINT,
                status: ItemStatus.SolPresigningWaitingForApproval,
                amount: new BN(0.025 * LAMPORTS_PER_SOL),
            });
            Data.userKeypairsPresigned[index + 1].tokens.map(async (token) => {
                // console.log("else Token", index, token.mint.toBase58());

                const { userAddItemToBuyTransaction } = await NeoSwap.userAddItemToBuy({
                    program: Data.program,
                    itemToBuy: { mint: token.mint, amountMaxi: new BN(token.value + Data.buyLamportMoreThanSell) },
                    signer: userKeypair.keypair.publicKey,
                });
                userAddItemToBuyTransaction.signers = [userKeypair.keypair];
                userAddItemToBuyTransaction.tx.feePayer = userKeypair.keypair.publicKey;
                sendAllArray.push(userAddItemToBuyTransaction);

                Data.swapData.items.push({
                    isNft: true,
                    isPresigning: true,
                    mint: token.mint,
                    owner: Data.userKeypairsPresigned[index + 1].keypair.publicKey,
                    status: ItemStatus.NFTPresigningWaitingForApproval,
                    destinary: userKeypair.keypair.publicKey,
                    amount: new BN(1),
                });

                // const transactionHash = await NeoSwap.boradcastToBlockchain({
                //     sendAllArray: [userAddItemToBuyTransaction],
                //     provider: Data.program.provider as AnchorProvider,
                //     signer: userKeypair.keypair,
                // });
                // txhashs.push(...transactionHash);
            });
        }
        // else {
        //     console.log(' not presigned ', index, userKeypair.keypair.publicKey.toBase58());
        //     Data.swapData.items.push({
        //         isNft: false,
        //         isPresigning: false,
        //         owner: userKeypair.keypair.publicKey,
        //         mint: NATIVE_MINT,
        //         destinary: NATIVE_MINT,
        //         status: ItemStatus.SolPending,
        //         amount: new BN(0.025 * LAMPORTS_PER_SOL),
        //     });
        //     Data.userKeypairsPresigned[index + 1].tokens.map(async (token) => {
        //         Data.swapData.items.push({
        //             isNft: true,
        //             isPresigning: false,
        //             mint: token.mint,
        //             owner: Data.userKeypairsPresigned[index + 1].keypair.publicKey,
        //             status: ItemStatus.NFTPending,
        //             destinary: userKeypair.keypair.publicKey,
        //             amount: new BN(1),
        //         });
        //     });
        // }
    }
    // const txhashs = await boradcastToBlockchain({ provider: Data.program.provider as AnchorProvider, sendAllArray });

    return { sendAllArray, swapData: Data.swapData };
};

export default userAddItemToBuyTest;
