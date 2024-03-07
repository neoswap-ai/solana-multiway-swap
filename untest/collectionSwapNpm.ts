import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
const { assert } = require("chai");
import {
    getAccountMetasAndSigners,
    createNft,
    findMetadataPda,
    TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsPublicKey, toWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";

import {
    Cluster,
    ComputeBudgetProgram,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    VersionedTransaction,
} from "@solana/web3.js";
// import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { neoTypes, neoSwap, neoConst } from "@neoswap/solana-collection-swap";

import signerSK from "../deleteme/signer";
const signer = Keypair.fromSecretKey(signerSK);
import user1Sk from "../deleteme/user1";
const user1 = Keypair.fromSecretKey(user1Sk);
import user2Sk from "../deleteme/user2";
const user2 = Keypair.fromSecretKey(user2Sk);
import user3Sk from "../deleteme/user3";
const user3 = Keypair.fromSecretKey(user3Sk);
import user4Sk from "../deleteme/user4";
const user4 = Keypair.fromSecretKey(user4Sk);
import user5Sk from "../deleteme/user5";
const user5 = Keypair.fromSecretKey(user5Sk);
import user6Sk from "../deleteme/user6";
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";
const user6 = Keypair.fromSecretKey(user6Sk);

describe("compressed NFT Test Unit", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    // let program = anchor.workspace.NeoSwap as Program;
    let clusterOrUrl =
        // "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
        "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/";

    let connection = new Connection(clusterOrUrl);

    let swapDataAccount = "3cyKbPTJB5N5oWYGAbd5mq4N9devNA5ySPrrxpWn9Hup"; // one way
    // let swapDataAccount = "DE5yqjWKGZGhzqJsVnx112MPFm9EyMBEJSf3vBso9QxJ"; // reverse

    // let swapDataAccount: PublicKey | undefined = undefined;

    // let nftMintMaker = "8n6EL6wceWymYJdfJvfRxiXWmcfX9tySsRXDRqZxSe1f";
    // let maker_collection = "BamRUYoLsaomADRMdE2HXdpu9N8CUdCWwswup3yDjjBF";

    // let nftMintTaker = "EtmJDdHMpd8aC1SAnFodzY9GRMmMgDw5zKscRvjCVjcP";
    // let taker_collection = "DvwXZN69F8eRVSoac2qMzSdceDQCBWQWVWqWjpbcG8o4";

    //reverse
    let nftMintTaker = "8n6EL6wceWymYJdfJvfRxiXWmcfX9tySsRXDRqZxSe1f";
    let taker_collection = "BamRUYoLsaomADRMdE2HXdpu9N8CUdCWwswup3yDjjBF";

    let nftMintMaker = "v4HLXrmbPqa5M6XFqveY23HcxfobPCkdutbNrYv24qY";
    let maker_collection = "DvwXZN69F8eRVSoac2qMzSdceDQCBWQWVWqWjpbcG8o4";

    // let paymentMint = "VkW2xoKYRe8zVJgtX6otepGpw7cVvVMF2jVBPxDopw3";
    let paymentMint = WRAPPED_SOL_MINT.toString();
    let endDate = 0;

    let maker = user1;
    let taker = user2;

    let bid: neoTypes.Bid = {
        collection: taker_collection,
        amount: 5 * 10 ** 3,

        makerNeoswapFee: 0.1 * 10 ** 3,
        makerRoyalties: 0.2 * 10 ** 3,
        takerNeoswapFee: 0.3 * 10 ** 3,
        takerRoyalties: 0.4 * 10 ** 3,
    };

    it("DatUsers", async () => {
        console.log("signer", signer.publicKey.toBase58());
        console.log("user1", user1.publicKey.toBase58());
        console.log("user1b", (await connection.getBalance(user1.publicKey)) / LAMPORTS_PER_SOL);
        console.log("user2", user2.publicKey.toBase58());
        console.log("user2b", (await connection.getBalance(user2.publicKey)) / LAMPORTS_PER_SOL);
        if (swapDataAccount) console.log("swapDataAccount", swapDataAccount);
        if (swapDataAccount)
            console.log("getOpenSda", await neoSwap.UTILS.getOpenSda({ clusterOrUrl }));
        // console.log(neoConst.NEOSWAP_PROGRAM_ID_DEV.toString());
    });

    // it("makeSwap", async () => {
    //     console.log(neoConst.NEOSWAP_PROGRAM_ID_DEV.toString());

    //     let initData = await neoSwap.makeSwap({
    //         maker: maker,
    //         bid,
    //         endDate,
    //         nftMintMaker,
    //         paymentMint,
    //         clusterOrUrl,
    //     });

    //     console.log("initData", initData);
    // });

    // it("takeAncCloseSwap", async () => {
    //     let hash = await neoSwap.takeAndCloseSwap({
    //         swapDataAccount,
    //         taker,
    //         bid,
    //         nftMintTaker,
    //         clusterOrUrl,
    //     });
    //     console.log("hash", hash);
    // });

    // it("takeSwap", async () => {
    //     let hash = await neoSwap.takeSwap({
    //         swapDataAccount,
    //         taker,
    //         bid,
    //         nftMintTaker,
    //         clusterOrUrl,
    //     });
    //     console.log("hash", hash);
    // });

    // it("payRoyaltie", async () => {
    //     let hash = await neoSwap.payRoyalties({
    //         swapDataAccount,
    //         taker,
    //         clusterOrUrl,
    //     });
    //     console.log("hash", hash);
    // });

    // it("claimSwap", async () => {
    //     let hash = await neoSwap.claimSwap({
    //         swapDataAccount,
    //         taker,
    //         clusterOrUrl,
    //     });
    //     console.log("hash", hash);
    // });

    it("makeSwap", async () => {
        console.log(neoConst.NEOSWAP_PROGRAM_ID_DEV.toString());
        try {
            let maker = user1;
            let initData = await neoSwap.CREATE_INSTRUCTIONS.createMakeSwapInstructions({
                maker: maker.publicKey.toString(),
                bid,
                endDate,
                nftMintMaker,
                paymentMint,
                clusterOrUrl,
            });
            console.log("SDA", initData.swapDataAccount.toString());
            await simuTx(initData.bTx.tx, maker.publicKey, connection);
            // const txSig = await connection.sendTransaction(initData.tx, [maker]);
            // console.log("txSig", txSig);
        } catch (error) {
            console.log(error);
            throw error;
        }
    });

    // it("takeSwap", async () => {
    //     try {
    //         // console.log(
    //         //     await neoSwap.UTILS.getSwapDataAccountFromPublicKey({
    //         //         clusterOrUrl,
    //         //         swapDataAccount_publicKey: swapDataAccount,
    //         //     })
    //         // );

    //         let taker = user2;
    //         let tx = await neoSwap.CREATE_INSTRUCTIONS.createTakeSwapInstructions({
    //             swapDataAccount,
    //             taker: taker.publicKey,
    //             bid,
    //             nftMintTaker,
    //             clusterOrUrl,
    //         });
    //         // await simuTx(tx, taker.publicKey, connection);
    //         const txSig = await connection.sendTransaction(tx, [taker]);
    //         console.log("txSig", txSig);
    //     } catch (error) {
    //         console.log(error);
    //         throw error;
    //     }
    // });

    // it("payRoyaltie", async () => {
    //     try {
    //         let taker = user2;
    //         let tx = await neoSwap.CREATE_INSTRUCTIONS.createPayRoyaltiesInstructions({
    //             swapDataAccount,
    //             taker: taker.publicKey,
    //             clusterOrUrl,
    //         });
    //         // await si/muTx(tx, taker.publicKey, connection);
    //         const txSig = await connection.sendTransaction(tx, [taker]);
    //         console.log("txSig", txSig);
    //     } catch (error) {
    //         console.log(error);
    //         throw error;
    //     }
    // });

    // it("claimSwap", async () => {
    //     try {
    //         let taker = user2;
    //         let tx = await neoSwap.CREATE_INSTRUCTIONS.createClaimSwapInstructions({
    //             swapDataAccount,
    //             taker: taker.publicKey,
    //             clusterOrUrl,
    //         });
    //         // await simuTx(tx, taker.publicKey, connection);
    //         const txSig = await connection.sendTransaction(tx, [taker]);
    //         console.log("txSig", txSig);
    //     } catch (error) {
    //         console.log(error);
    //         throw error;
    //     }
    // });
    // it("takeAndCloseSwap", async () => {
    //     try {
    //         // console.log(
    //         //     await neoSwap.UTILS.getSwapDataAccountFromPublicKey({
    //         //         clusterOrUrl,
    //         //         swapDataAccount_publicKey: swapDataAccount,
    //         //     })
    //         // );

    //         let taker = user2;
    //         let tx = await neoSwap.CREATE_INSTRUCTIONS.createCancelSwapInstructions({
    //             swapDataAccount,
    //             // taker: taker.publicKey.toString(),
    //             // bid,
    //             // nftMintTaker,
    //             // clusterOrUrl,
    //             program: neoSwap.UTILS.getProgram({
    //                 clusterOrUrl,
    //                 programId: new PublicKey("CtZHiWNnLu5rQuTN3jo7CmYDR8Wns6qXHn7taPvmnACp"),
    //                 signer: taker,
    //             }),
    //         });
    //         await simuTx(tx.tx, taker.publicKey, connection);
    //         // const txSig = await connection.sendTransaction(tx, [taker]);
    //         // console.log("txSig", txSig);
    //     } catch (error) {
    //         console.log(error);
    //         throw error;
    //     }
    // });
});

type Bid = {
    collection: PublicKey;
    amount: BN;
    makerNeoswapFee: BN;
    takerNeoswapFee: BN;
    takerRoyalties: BN;
    makerRoyalties: BN;
};

async function simuTx(tx: VersionedTransaction, signer: PublicKey, connection: Connection) {
    // tx.feePayer = signer;
    tx.message.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    let simu = await connection.simulateTransaction(tx);
    console.log("simu", simu.value);
}
