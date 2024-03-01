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
import { neoTypes, neoSwap, neoConst } from "@neoswap/solana";

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
const user6 = Keypair.fromSecretKey(user6Sk);

describe("compressed NFT Test Unit", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    // let program = anchor.workspace.NeoSwap as Program;
    let clusterOrUrl =
        "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
    // "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/";

    let connection = new Connection(clusterOrUrl);

    let swapDataAccount = new PublicKey("7Vnt8ifj2w3NrLcbt5dyyqpPnJxsvh7V9x1q7eL1tNw6"); // one way
    // let swapDataAccount = new PublicKey("AbJJYus1SBmXtDBJeRGezFhaoHonSrkDEJCHYLUAKdzr"); // reverse

    // let swapDataAccount: PublicKey | undefined = undefined;

    let nftMintMaker = new PublicKey("8n6EL6wceWymYJdfJvfRxiXWmcfX9tySsRXDRqZxSe1f");
    let maker_collection = new PublicKey("BamRUYoLsaomADRMdE2HXdpu9N8CUdCWwswup3yDjjBF");

    let nftMintTaker = new PublicKey("EtmJDdHMpd8aC1SAnFodzY9GRMmMgDw5zKscRvjCVjcP");
    let taker_collection = new PublicKey("DvwXZN69F8eRVSoac2qMzSdceDQCBWQWVWqWjpbcG8o4");

    //reverse
    // let nftMintTaker = new PublicKey("8n6EL6wceWymYJdfJvfRxiXWmcfX9tySsRXDRqZxSe1f");
    // let taker_collection = new PublicKey("BamRUYoLsaomADRMdE2HXdpu9N8CUdCWwswup3yDjjBF");

    // let nftMintMaker = new PublicKey("EtmJDdHMpd8aC1SAnFodzY9GRMmMgDw5zKscRvjCVjcP");
    // let maker_collection = new PublicKey("DvwXZN69F8eRVSoac2qMzSdceDQCBWQWVWqWjpbcG8o4");

    let paymentMint = new PublicKey("VkW2xoKYRe8zVJgtX6otepGpw7cVvVMF2jVBPxDopw3");
    let endDate = 0;

    let maker = user1;
    let taker = user2;

    let bid: Bid = {
        collection: taker_collection,
        amount: new BN(10 ** 9),

        makerNeoswapFee: new BN(1 * 10 ** 7),
        makerRoyalties: new BN(2 * 10 ** 7),
        takerNeoswapFee: new BN(3 * 10 ** 7),
        takerRoyalties: new BN(4 * 10 ** 7),
    };

    it("DatUsers", async () => {
        console.log("signer", signer.publicKey.toBase58());
        console.log("user1", user1.publicKey.toBase58());
        console.log("user2", user2.publicKey.toBase58());
        if (swapDataAccount) console.log("swapDataAccount", swapDataAccount.toBase58());
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

    it("takeAncCloseSwap", async () => {
        let hash = await neoSwap.takeAndCloseSwap({
            swapDataAccount,
            taker,
            bid,
            nftMintTaker,
            clusterOrUrl,
        });
        console.log("hash", hash);
    });

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

    // it("makeSwap", async () => {
    //     console.log(neoConst.NEOSWAP_PROGRAM_ID_DEV.toString());
    //     try {
    //         let maker = user1;
    //         let initData = await neoSwap.CREATE_INSTRUCTIONS.createMakeSwapInstructions({
    //             maker: maker.publicKey,
    //             bid,
    //             endDate,
    //             nftMintMaker,
    //             paymentMint,
    //             clusterOrUrl,
    //         });
    //         console.log("SDA", initData.swapDataAccount.toString());
    //         // await simuTx(initData.tx, maker.publicKey, connection);
    //         const txSig = await connection.sendTransaction(initData.tx, [maker]);
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
});

type Bid = {
    collection: PublicKey;
    amount: BN;
    makerNeoswapFee: BN;
    takerNeoswapFee: BN;
    takerRoyalties: BN;
    makerRoyalties: BN;
};

async function simuTx(tx: Transaction, signer: PublicKey, connection: Connection) {
    // initData.tx.feePayer = maker.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    let simu = await connection.simulateTransaction(new VersionedTransaction(tx.compileMessage()));
    console.log("simu", simu.value);
}
