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
    clusterApiUrl,
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
    let clusterOrUrl = //"mainnet-beta" as Cluster;
        // "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
        "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/";
    // "https://rpc.hellomoon.io/13bb514b-0e38-4ff2-a167-6383ef88aa10";
    // "https://mainnet.helius-rpc.com/?api-key=3df6d163-6527-46bf-aa92-5f2e7af41aa4";
    let connection = new Connection(clusterOrUrl);
    // let connection = new Connection(clusterApiUrl(clusterOrUrl));

    // let swapDataAccount = "7LBKwGbx2H3hfnkMALFV1rKX1jv5sNfDwhCmgdymxPsq"; // one way
    // let swapDataAccount = "8DrwLrCmv8ehVjqXzW3zW2NwkqVhqLQ3a3bJvpPHhd6E"; // reverse
    let swapDataAccount = "4UPApoXPdNRDdz4rKQwjZvFiciF4EzRSQKX2EjoZjpka"; // reverse

    // let swapDataAccount: undefined = undefined;

    // let nftMintMaker = "GW6mMEYA7wZrLhwYgmEf8aDcib6EGNDGkYszZsRE2uBU";
    // let maker_collection = "Hrn7amdBfEfyGZ2Y1E2xLor4Q2cz1dCEcNnKWC1ap9sS";

    // let nftMintTaker = "ENvJpH178z3SjpwrQkJojAC3BZcv3yx8fym6gr7mPbn2";
    // let taker_collection = "3NauNKfqAbQVhAJyv464Tq14jynV6THSNiGxhf7W6fP9";

    //reverse
    let nftMintTaker = "GW6mMEYA7wZrLhwYgmEf8aDcib6EGNDGkYszZsRE2uBU";
    let taker_collection = "Hrn7amdBfEfyGZ2Y1E2xLor4Q2cz1dCEcNnKWC1ap9sS";

    let nftMintMaker = "ENvJpH178z3SjpwrQkJojAC3BZcv3yx8fym6gr7mPbn2";
    let maker_collection = "3NauNKfqAbQVhAJyv464Tq14jynV6THSNiGxhf7W6fP9";

    // let paymentMint = "VkW2xoKYRe8zVJgtX6otepGpw7cVvVMF2jVBPxDopw3";
    let paymentMint = WRAPPED_SOL_MINT.toString();
    let endDate = 0;

    let maker = user1;
    let taker = user2;

    let bid: neoTypes.Bid = {
        collection: taker_collection,
        amount: -5 * 10 ** 3,

        makerNeoswapFee: 0.1 * 10 ** 3,
        makerRoyalties: 0.2 * 10 ** 3,
        takerNeoswapFee: 0.3 * 10 ** 3,
        takerRoyalties: 0.4 * 10 ** 3,
    };

    // it("DatUsers", async () => {
    //     console.log("signer", signer.publicKey.toBase58());
    //     console.log("user1", user1.publicKey.toBase58());
    //     console.log("user1b", (await connection.getBalance(user1.publicKey)) / LAMPORTS_PER_SOL);
    //     console.log("user2", user2.publicKey.toBase58());
    //     console.log("user2b", (await connection.getBalance(user2.publicKey)) / LAMPORTS_PER_SOL);
    //     if (swapDataAccount) console.log("swapDataAccount", swapDataAccount);
    //     if (swapDataAccount)
    //         console.log("data", await neoSwap.UTILS.getSdaData({ clusterOrUrl, swapDataAccount }));
    //     [];
    //     // console.log("getOpenSda", await neoSwap.UTILS.getOpenSda({ clusterOrUrl }));
    //     // console.log(neoConst.NEOSWAP_PROGRAM_ID_DEV.toString());
    // });

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
    //         signer,
    //         clusterOrUrl,
    //     });
    //     console.log("hash", hash);
    // });

    // it("claimSwap", async () => {
    //     let hash = await neoSwap.claimSwap({
    //         swapDataAccount,
    //         signer,
    //         clusterOrUrl,
    //         skipSimulation: true,
    //         // skipConfirmation: true,
    //     });
    //     console.log("hash", hash);
    // });

    // it("makeSwap", async () => {
    //     console.log(neoConst.NEOSWAP_PROGRAM_ID_DEV.toString());
    //     try {
    //         let maker = user1;
    //         let initData = await neoSwap.CREATE_INSTRUCTIONS.createMakeSwapInstructions({
    //             maker: maker.publicKey.toString(),
    //             bid,
    //             endDate,
    //             nftMintMaker,
    //             paymentMint,
    //             clusterOrUrl,
    //         });
    //         console.log("SDA", initData.swapDataAccount.toString());
    //         console.log("initData.bTx", initData.bTx);
    //         // let bcdata = await connection.getLatestBlockhash();
    //         // let bch = bcdata.blockhash;
    //         // initData.bTx.tx.message.recentBlockhash = bch;
    //         await simuTx(initData.bTx.tx, connection);
    //         initData.bTx.tx.sign([maker]);
    //         const txSig = await connection.sendTransaction(initData.bTx.tx);
    //         console.log("txSig", txSig);
    //     } catch (error) {
    //         console.log(error);
    //         throw error;
    //     }
    // });

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
    //             taker: taker.publicKey.toBase58(),
    //             bid,
    //             nftMintTaker,
    //             clusterOrUrl,
    //         });
    //         let bcdata = await connection.getLatestBlockhash();
    //         let bch = bcdata.blockhash;
    //         tx.tx.message.recentBlockhash = bch;
    //         tx.tx.sign([taker]);
    //         const txSig = await connection.sendTransaction(tx.tx);
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
    //             signer: taker.publicKey.toString(),
    //             clusterOrUrl,
    //         });
    //         console.log("tx", tx.tx);
    //         connection = new Connection(clusterApiUrl("mainnet-beta"));
    //         await simuTx(tx.tx, connection);
    //         tx.tx.message.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    //         tx.tx.sign([taker]);
    //         console.log("txSIGNED", tx.tx);

    //         const txSig = await connection.sendRawTransaction(tx.tx.serialize());
    //         console.log("txSig", txSig);
    //     } catch (error) {
    //         console.log(error);
    //         throw error;
    //     }
    // });

    it("claimSwap", async () => {
        try {
            let taker = user2;
            let tx = await neoSwap.CREATE_INSTRUCTIONS.createClaimSwapInstructions({
                swapDataAccount,
                signer: signer.publicKey.toString(),
                clusterOrUrl,
            });
            connection = new Connection(clusterApiUrl("mainnet-beta"));
            await simuTx(tx.tx, connection);
            tx.tx.message.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.tx.sign([signer]);

            const txSig = await connection.sendRawTransaction(tx.tx.serialize());
            console.log("txSig", txSig);
        } catch (error) {
            console.log(error);
            throw error;
        }
    });
    // it("takeAndCloseSwap", async () => {
    //     try {
    //         // console.log(
    //         //     await neoSwap.UTILS.getSwapDataAccountFromPublicKey({
    //         //         clusterOrUrl,
    //         //         swapDataAccount_publicKey: swapDataAccount,
    //         //     })
    //         // );
    //         console.log((await connection.getRecentPrioritizationFees())[0].prioritizationFee);

    //         let taker = user2;
    //         let tx = await neoSwap.CREATE_INSTRUCTIONS.createTakeAndCloseSwapInstructions({
    //             swapDataAccount,
    //             taker: taker.publicKey.toString(),
    //             bid,
    //             nftMintTaker,
    //             clusterOrUrl,
    //             // program: neoSwap.UTILS.getProgram({
    //             //     clusterOrUrl,
    //             //     programId: new PublicKey("CtZHiWNnLu5rQuTN3jo7CmYDR8Wns6qXHn7taPvmnACp"),
    //             //     signer: taker,
    //             // }),
    //         });
    //         // console.log("tx", tx[0].tx);
    //         let retry = 10;
    //         while (retry > 0) {
    //             await delay(5000);

    //             let newConnection = new Connection(clusterApiUrl("mainnet-beta"));
    //             let bch = (await newConnection.getLatestBlockhash()).blockhash;
    //             await Promise.all(
    //                 tx.map(async (ttx) => {
    //                     ttx.tx.message.recentBlockhash = bch;
    //                 })
    //             );
    //             // console.log("tx", tx[0].tx);

    //             // await simuTx(tx[0].tx, newConnection);
    //             // console.log("tx", tx[0].tx);
    //             tx[0].tx.sign([taker]);
    //             // console.log("txSIGGNED", tx[0].tx);
    //             const txSig = await connection.sendTransaction(tx[0].tx);
    //             console.log("txSig", txSig);
    //             const txSig2 = await connection.sendRawTransaction(tx[0].tx.serialize());
    //             console.log("txSig2", txSig2);
    //             retry--;
    //         }
    //         // for (let index = 0; index < 10; index++) {
    //         // }
    //         // let conf = await connection.confirmTransaction({
    //         //     ...(await connection.getLatestBlockhash()),
    //         //     signature: txSig,
    //         // });
    //         // console.log("conf", conf);
    //     } catch (error) {
    //         console.log(error);
    //         throw error;
    //     }
    // });
});

async function simuTx(tx: VersionedTransaction, connection: Connection) {
    // tx.feePayer = signer;
    let bcdata = await connection.getLatestBlockhash();
    let bxh = bcdata.blockhash;
    tx.message.recentBlockhash = bxh;

    let simu = await connection.simulateTransaction(tx);
    console.log("simu", simu.value);
}

let delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
