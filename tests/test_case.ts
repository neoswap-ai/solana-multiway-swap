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
import { WRAPPED_SOL_MINT } from "@metaplex-foundation/js";

import signerSK from "../deleteme/signer";
const signer = Keypair.fromSecretKey(signerSK);
import user1Sk from "../deleteme/user1";
const user1 = Keypair.fromSecretKey(user1Sk);
import user2Sk from "../deleteme/user2";
const user2 = Keypair.fromSecretKey(user2Sk);

describe("compressed NFT Test Unit", () => {
    anchor.setProvider(anchor.AnchorProvider.env());
    let clusterOrUrl =
        // "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
        "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/";
    // "https://rpc.hellomoon.io/13bb514b-0e38-4ff2-a167-6383ef88aa10";
    // "https://mainnet.helius-rpc.com/?api-key=3df6d163-6527-46bf-aa92-5f2e7af41aa4";

    let connection = new Connection(clusterOrUrl);
    let prioritizationFee = undefined; //1e9
    let swapDataAccount: undefined = undefined;

    let nftMintMaker = "GW6mMEYA7wZrLhwYgmEf8aDcib6EGNDGkYszZsRE2uBU";
    let maker_collection = "Hrn7amdBfEfyGZ2Y1E2xLor4Q2cz1dCEcNnKWC1ap9sS";

    let nftMintTaker = "ENvJpH178z3SjpwrQkJojAC3BZcv3yx8fym6gr7mPbn2";
    let taker_collection = "3NauNKfqAbQVhAJyv464Tq14jynV6THSNiGxhf7W6fP9";

    let reverse = false;
    if (reverse) {
        let temp1 = nftMintMaker;
        nftMintMaker = nftMintTaker;
        nftMintTaker = temp1;
        let temp2 = maker_collection;
        maker_collection = taker_collection;
        taker_collection = temp2;
    }

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

    it("Data Users", async () => {
        console.log("signer", signer.publicKey.toBase58());
        console.log("user1", user1.publicKey.toBase58());
        console.log("user1b", (await connection.getBalance(user1.publicKey)) / LAMPORTS_PER_SOL);
        console.log("user2", user2.publicKey.toBase58());
        console.log("user2b", (await connection.getBalance(user2.publicKey)) / LAMPORTS_PER_SOL);
        if (swapDataAccount) console.log("swapDataAccount", swapDataAccount);
        if (swapDataAccount)
            console.log("data", await neoSwap.UTILS.getSdaData({ clusterOrUrl, swapDataAccount }));
        [];
        // console.log("getOpenSda", await neoSwap.UTILS.getOpenSda({ clusterOrUrl }));
        // console.log(neoConst.NEOSWAP_PROGRAM_ID_DEV.toString());
    });

    it("makeSwap", async () => {
        let initData = await neoSwap.CREATE_INSTRUCTIONS.createMakeSwapInstructions({
            maker: maker.publicKey.toString(),
            bid,
            endDate,
            nftMintMaker,
            paymentMint,
            clusterOrUrl,
            prioritizationFee,
        });

        console.log("initData", initData);
        await simuTx(initData.bTx.tx, connection);

        initData.bTx.tx.sign([maker]);
        
        const txSig = await connection.sendTransaction(initData.bTx.tx);
        console.log("txSig", txSig);
    });

    it("takeAncCloseSwap", async () => {
        await delay(10000);
        let takeData = await neoSwap.CREATE_INSTRUCTIONS.createTakeAndCloseSwapInstructions({
            swapDataAccount,
            taker: taker.publicKey.toString(),
            bid,
            nftMintTaker,
            clusterOrUrl,
            prioritizationFee,
        });
        console.log("takeData", takeData);

        let hashs = await neoSwap.UTILS.sendBundledTransactions({
            clusterOrUrl,
            signer,
            txsWithoutSigners: takeData,
            skipConfirmation: true,
        });
        console.log("hashs", hashs);
    });
});

async function simuTx(tx: VersionedTransaction, connection: Connection) {
    let bcdata = await connection.getLatestBlockhash();
    let bxh = bcdata.blockhash;
    tx.message.recentBlockhash = bxh;

    let simu = await connection.simulateTransaction(tx);
    console.log("simu", simu.value);

    if (simu.value.err) throw new Error(JSON.stringify(simu.value.err));
}

let delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
