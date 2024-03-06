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
import { TOKEN_PROGRAM_ID, createTransferInstruction } from "@solana/spl-token";
const user6 = Keypair.fromSecretKey(user6Sk);

describe("compressed NFT Test Unit", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    // let program = anchor.workspace.NeoSwap as Program;
    let clusterOrUrl =
        // "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
        "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/";

    let connection = new Connection(clusterOrUrl);

    let rbn = [
        "BMYA2TzmGXgBDBhaCv9DqcpyDRdC6X2XVp4fFdNRqfRf",
        "3j6UEDBj6KEKm9oXTfJMZYwQwdXQ614Tpf1u2exo9n82",
        "HzF31JojkcD2n72mWGSv7Yb5r5uu6Tdd93mrpYHhHLyk",
        "EK8zsyg9JLqqmnnHkLR8oJXBeuVB17RTtHGpuwMhSg6k",
    ];
    let rollingBones = "CjcJpNNPvhs8hwjJC4Pkca8aHDGBpfS3x8UdsbnwsaP5";
    let rbA = 0.011;

    let NApeanas = [
        "C7b3yy1dZPQATUpL17MfE1LAnKyXsMdA9bdEF82aUmnx",
        "F75nLh3M4AZS8KFqP21ACzZvo1TfghUE3LXCZajYGkot",
        "2M8WjKPHn24tMHDRqwo9TXz2ZUAFzug3r7UeUFrBqDGK",
        "GW6mMEYA7wZrLhwYgmEf8aDcib6EGNDGkYszZsRE2uBU", // 7LBKwGbx2H3hfnkMALFV1rKX1jv5sNfDwhCmgdymxPsq
    ];

    let Apeanas = "Hrn7amdBfEfyGZ2Y1E2xLor4Q2cz1dCEcNnKWC1ap9sS";
    let aa = 0.0089;

    let NPrimatinho = [
        "ANDL9LDzazVt5mw2onyY1vRG81BjMhCE9danzTzxiVD3",
        "3B4wEbCf1pNvvrx26dp25hJna75BFk1uHBSQVjmSznjX",
        "CDEVyC66azZB2wgXRSVnKUXtvWEXCFUeRnfWfXKwqWXH",
        "9e8buwaNdELD1WUPNd45fRe3TVvMTC7fGBuqunkdaR5k",
    ];
    let Primatinho = "8ZtMj6bRTh7inEDVoha5Qb5Pfajqxm7nCbk6mD1HDEsS";
    let pa = 0.01;

    let NCandy = [
        "ENvJpH178z3SjpwrQkJojAC3BZcv3yx8fym6gr7mPbn2", // 8DrwLrCmv8ehVjqXzW3zW2NwkqVhqLQ3a3bJvpPHhd6E
        "75xsAfTpWoiuctGNpi1SyAPJNiXH9EFZvwcE8gwNFqmN",
        "DDVKhzCpAc5MCGP4iiFeK5mgdPzoufqMkHsdVMaAmLK8",
    ];
    let candy = "3NauNKfqAbQVhAJyv464Tq14jynV6THSNiGxhf7W6fP9";
    let ca = 0.0089;

    let collections = [rollingBones, Apeanas, Primatinho, candy];

    let atlas = "ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx";
    let usdc = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    let payments = [atlas, usdc];

    let endDate = 0;

    let maker = user1;
    // let taker = user2;

    let bid: neoTypes.Bid = {
        collection: Apeanas,
        amount: 3 * 10 ** 4,

        makerNeoswapFee: 0.1 * 10 ** 4,
        makerRoyalties: 0.2 * 10 ** 4,
        takerNeoswapFee: 0.3 * 10 ** 4,
        takerRoyalties: 0.4 * 10 ** 4,
    };

    it("DatUsers", async () => {
        console.log("signer", signer.publicKey.toBase58());
        console.log("user1", user1.publicKey.toBase58());
        console.log("user1b", (await connection.getBalance(user1.publicKey)) / LAMPORTS_PER_SOL);
        console.log("user2", user2.publicKey.toBase58());
        console.log("user2b", (await connection.getBalance(user2.publicKey)) / LAMPORTS_PER_SOL);
        console.log("getOpenSda", await neoSwap.UTILS.getOpenSda({ clusterOrUrl }));
    });

    // it("createMultiple", async () => {
    //     console.log(neoConst.NEOSWAP_PROGRAM_ID_DEV.toString());
    //     let idata = [];
    //     await Promise.all(
    //         NCandy.map(async (r, i) => {
    //             await delay(500 * i);
    //             let paymentMint = payments[Math.ceil(Math.random())];

    //             bid.collection = collections.filter((x) => x != candy)[
    //                 Math.ceil(Math.random() * (collections.length - 2))
    //             ];
    //             console.log("bid.collection", bid.collection);
    //             console.log("paymentMint", paymentMint);
    //             console.log("r", r);
    //             try {
    //                 let initData = await neoSwap.makeSwap({
    //                     maker: maker,
    //                     bid,
    //                     endDate,
    //                     nftMintMaker: r,
    //                     paymentMint,
    //                     clusterOrUrl,
    //                 });
    //                 idata.push({ nft: r, initData });
    //                 console.log("initData", initData);
    //             } catch (error) {
    //                 idata.push({
    //                     data: {
    //                         maker: maker,
    //                         bid,
    //                         endDate,
    //                         nftMintMaker: r,
    //                         paymentMint,
    //                         clusterOrUrl,
    //                     },
    //                     error,
    //                 });
    //             }
    //         })
    //     );
    //     console.log("idata", idata);
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

    // it("cancelSwap", async () => {
    //     let datas = [];
    //     let opensda = await neoSwap.UTILS.getOpenSda({ clusterOrUrl });
    //     console.log("opensda", opensda);

    //     await Promise.all(
    //         opensda
    //             .filter((x) => {
    //                 console.log("x", x);

    //                 return x.data.maker == maker.publicKey.toString();
    //             })
    //             .map(async (x, i) => {
    //                 await delay(1000 * i);
    //                 try {
    //                     let hash = await neoSwap.cancelSwap({
    //                         swapDataAccount: x.sda,
    //                         signer: maker,
    //                         clusterOrUrl,
    //                     });
    //                     datas.push({ x, hash });
    //                     console.log("hash", hash);
    //                 } catch (error) {
    //                     datas.push({ x, error });
    //                 }
    //             })
    //     );
    //     console.log("datas", datas);
    // });

    it("send nft", async () => {
        let mint = "ENvJpH178z3SjpwrQkJojAC3BZcv3yx8fym6gr7mPbn2";
        let from = user1.publicKey.toString();
        let to = user2.publicKey.toString();
        let tx = await sendtoken(from, to, mint, connection);
        // await simuTx(tx, from, connection);
        const txSig = await connection.sendTransaction(tx, [maker]);
        console.log("txSig", txSig);
    });

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
    //         console.log("initData", initData);
    //         await simuTx(initData.bTx.tx, maker.publicKey, connection);
    //         // const txSig = await connection.sendTransaction(initData.tx, [maker]);
    //         // console.log("txSig", txSig);
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
    // it("takeAndCloseSwap", async () => {
    //     try {
    //         // console.log(
    //         //     await neoSwap.UTILS.getSwapDataAccountFromPublicKey({
    //         //         clusterOrUrl,
    //         //         swapDataAccount_publicKey: swapDataAccount,
    //         //     })
    //         // );

    //         let taker = user2;
    //         let tx = await neoSwap.CREATE_INSTRUCTIONS.createTakeAndCloseSwapInstructions({
    //             swapDataAccount,
    //             taker: taker.publicKey.toString(),
    //             bid,
    //             nftMintTaker,
    //             clusterOrUrl,
    //         });
    //         await simuTx(tx[0].tx, taker.publicKey, connection);
    //         // const txSig = await connection.sendTransaction(tx[0].tx, [taker]);
    //         // console.log("txSig", txSig);
    //     } catch (error) {
    //         console.log(error);
    //         throw error;
    //     }
    // });
    // it("cancelswap", async () => {
    //     try {
    //         let tx = await neoSwap.CREATE_INSTRUCTIONS.createCancelSwapInstructions({
    //             swapDataAccount: "7LBKwGbx2H3hfnkMALFV1rKX1jv5sNfDwhCmgdymxPsq",
    //             clusterOrUrl,
    //         });
    //         await simuVTx(tx.tx, connection);
    //         tx.tx.sign([user1]);
    //         const txSig = await connection.sendTransaction(tx.tx);
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
async function simuVTx(tx: VersionedTransaction, connection: Connection) {
    tx.message.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    let simu = await connection.simulateTransaction(tx);
    console.log("simu", simu.value);
}
async function simuTx(tx: Transaction, signer: PublicKey | string, connection: Connection) {
    tx.feePayer = new PublicKey(signer);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    let simu = await connection.simulateTransaction(new VersionedTransaction(tx.compileMessage()));
    console.log("simu", simu.value);
}

async function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendtoken(from: string, to: string, mint: string, connection: Connection) {
    let ixs = [];
    let { mintAta: fromRevenueAta, instruction: fromAtaIx } = await neoSwap.UTILS.findOrCreateAta({
        mint,
        owner: from,
        signer: from,
        connection,
    });
    if (!!fromAtaIx) {
        console.log("destAta", fromRevenueAta);
        ixs.push(fromAtaIx);
    }
    let { mintAta: toRevenueAta, instruction: destAtaIx } = await neoSwap.UTILS.findOrCreateAta({
        mint,
        owner: to,
        signer: from,
        connection,
    });

    if (!!destAtaIx) {
        console.log("destAta", toRevenueAta);
        ixs.push(destAtaIx);
    }
    ixs.push(
        createTransferInstruction(
            new PublicKey(fromRevenueAta),
            new PublicKey(toRevenueAta),
            new PublicKey(from),
            1,
            [],
            TOKEN_PROGRAM_ID
        )
    );
    let tx = new Transaction().add(...ixs);
    tx.feePayer = new PublicKey(from);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    return tx;
}
