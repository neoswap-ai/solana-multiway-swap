import * as anchor from "@coral-xyz/anchor";
import spl from "@solana/spl-token";

// import { BN } from "bn.js";
// const { assert } = require("chai");
// import SwapData from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/swapData.types.neoswap";
// import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
// const { assert } = require("chai");

// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

// import {
//     // createAssociatedTokenAccount,
//     // getAssociatedTokenAddress,
//     // createInitializeMintInstruction,
//     // TOKEN_PROGRAM_ID,
//     // MINT_SIZE,
//     // getMinimumBalanceForRentExemptMint,
//     // createMint,
//     // mintToChecked,
//     // createAssociatedTokenAccountInstruction,
//     // createMintToCheckedInstruction,
//     // createSyncNativeInstruction,
//     NATIVE_MINT,
//     closeAccount,
//     createCloseAccountInstruction,
// } from "@solana/spl-token";

import {
    Keypair,
    PublicKey,
    Connection,
    SystemProgram,
    Cluster,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    Transaction,
    // LAMPORTS_PER_SOL,
    // Transaction,
    // Signer,
    // SystemProgram,
    // Transaction,
    // TransactionInstruction,
    // TransactionMessage,
    // VersionedTransaction,
} from "@solana/web3.js";
import { neoSwap, neoTypes } from "@neoswap/solana";

import usk1 from "../deleteme/user1";
const user1 = Keypair.fromSecretKey(usk1);
import usk2 from "../deleteme/user2";
const user2 = Keypair.fromSecretKey(usk2);
import usk3 from "../deleteme/user3";
const user3 = Keypair.fromSecretKey(usk3);
import usks from "../deleteme/signer";
const signer = Keypair.fromSecretKey(usks);
import usk4 from "../deleteme/user4";
const user4 = Keypair.fromSecretKey(usk4);
import usk5 from "../deleteme/user5";
const user5 = Keypair.fromSecretKey(usk5);
import usk6 from "../deleteme/user6";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    MPL_BUBBLEGUM_PROGRAM_ID,
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from "@metaplex-foundation/mpl-bubblegum";
import {
    SOLANA_SPL_ATA_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM,
} from "@neoswap/solana/dist/lib/es5/utils/const";
const user6 = Keypair.fromSecretKey(usk6);
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import usclisks from "/home/biboux/.config/solana/id.json";
// const usc = Keypair.fromSecretKey(usks);

const clusterOrUrl = //"https://mainnet.helius-rpc.com/?api-key=3df6d163-6527-46bf-aa92-5f2e7af41aa4";
    "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/";
// "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
describe("MIX pre-signing", () => {
    anchor.setProvider(anchor.AnchorProvider.env());
    const connection = new Connection(clusterOrUrl);
    let cluster = "mainnet-beta" as Cluster;

    let programId = new PublicKey("2vumtPDSVo3UKqYYxMVbDaQz1K4foQf6A31KiUaii1M7");
    let program = neoSwap.UTILS.getProgram({
        clusterOrUrl,
        programId: programId ? programId : undefined,
    });

    let preSeed = "000023";
    // let swapDataAccount = new PublicKey("6nXFtWreXWfEw4rkoXMH56CFWAQcZqWaz9a6yzCCRzCZ");
    // let swapDataAccount = new PublicKey("9RjTFaJ5Vs8hpFPji21u5XrPV9NiqtVXHpKtYss9jYcp"); //cnft locked
    // let swapDataAccount = new PublicKey("8YJwoJ9VrqoHKxTmsMPcieK8oZRr3FNsytabKmSEmend"); // cnft locked 2
    let swapDataAccount = new PublicKey("DSWxzxKrDvRPKtjCgR3mEzx2ZzK7VPSammbZcVQiBXCY");
    // let swapDataAccount = undefined;

    let collection1Data = {
        collection: "5GzuKHXr7FBwZErdfsiUfrwsLpEcmLG8xNb4SmZ3UA1E",
        items: {
            1: {
                1: "6DH7Xnjs3dPPXeiKsThZ4CNSr5gXLKN8ATLd33VX31Yb",
                2: "7bXVgmbQ1yPcVfFkZGPYKwGD1th27XLdCTi6EcWKVAPy",
            },
        },
    };
    let collection2Data = {
        collection: "8Jy6UQxitXCStK97t4Lb9AZ5DpHDDWpUXDygmnZY6Rkt",
        items: { 2: { 1: "8DLmHWWRvghtFrhNVu6hvVQ2RujgL7GbwVLeLisvwtbJ" } },
    };
    let days = 86400;

    /// ONE WAY
    let swapInfo: neoTypes.SwapInfo = {
        currency: SystemProgram.programId.toString(),
        preSeed,
        status: "initializing",
        duration: 3 * days,
        startTime: Math.ceil(Date.now() / 1000),
        users: [
            {
                address: SystemProgram.programId.toString(),
                items: {
                    get: [
                        {
                            address: "75xsAfTpWoiuctGNpi1SyAPJNiXH9EFZvwcE8gwNFqmN",
                            amount: 1,
                            collection: "3NauNKfqAbQVhAJyv464Tq14jynV6THSNiGxhf7W6fP9",
                            givers: [{ address: user1.publicKey.toString(), amount: 1 }],
                        },
                    ],
                    give: [
                        {
                            address: SystemProgram.programId.toString(),
                            amount: 1,
                            collection: "AMSNskm2RZqPXCZ6P2z6JLyHWMQF6pQ8RA8Q6x42Xufq",
                            getters: [
                                {
                                    address: user1.publicKey.toString(),
                                    amount: 1,
                                },
                            ],
                        },
                    ],
                    token: { amount: -1 },
                },
            },
            {
                address: user1.publicKey.toString(),
                items: {
                    give: [
                        {
                            address: "75xsAfTpWoiuctGNpi1SyAPJNiXH9EFZvwcE8gwNFqmN",
                            amount: 1,
                            collection: "3NauNKfqAbQVhAJyv464Tq14jynV6THSNiGxhf7W6fP9",
                            getters: [{ address: SystemProgram.programId.toString(), amount: 1 }],
                        },
                    ],
                    get: [
                        {
                            address: SystemProgram.programId.toString(),
                            amount: 1,
                            collection: "AMSNskm2RZqPXCZ6P2z6JLyHWMQF6pQ8RA8Q6x42Xufq",
                            givers: [
                                {
                                    address: SystemProgram.programId.toString(),
                                    amount: 1,
                                },
                            ],
                        },
                    ],
                    token: { amount: 1 },
                },
            },
        ],
    };
    let swapInfoTaker: neoTypes.SwapInfo = {
        currency: SystemProgram.programId.toString(),
        preSeed,
        status: "initializing",
        duration: 3 * days,
        startTime: Math.ceil(Date.now() / 1000),
        users: [
            {
                address: user2.publicKey.toString(),
                items: {
                    get: [
                        {
                            address: "75xsAfTpWoiuctGNpi1SyAPJNiXH9EFZvwcE8gwNFqmN",
                            amount: 1,
                            collection: "3NauNKfqAbQVhAJyv464Tq14jynV6THSNiGxhf7W6fP9",
                            givers: [{ address: user1.publicKey.toString(), amount: 1 }],
                        },
                    ],
                    give: [
                        {
                            address: "Gyemg4nrzGLQqaAdEpbfw4y9LTx23K1YdiokxE5vHFd5",
                            amount: 1,
                            collection: "AMSNskm2RZqPXCZ6P2z6JLyHWMQF6pQ8RA8Q6x42Xufq",
                            getters: [
                                {
                                    address: user1.publicKey.toString(),
                                    amount: 1,
                                },
                            ],
                        },
                    ],
                    token: { amount: -1 },
                },
            },
            {
                address: user1.publicKey.toString(),
                items: {
                    give: [
                        {
                            address: "75xsAfTpWoiuctGNpi1SyAPJNiXH9EFZvwcE8gwNFqmN",
                            amount: 1,
                            collection: "3NauNKfqAbQVhAJyv464Tq14jynV6THSNiGxhf7W6fP9",
                            getters: [{ address: user2.publicKey.toString(), amount: 1 }],
                        },
                    ],
                    get: [
                        {
                            address: "Gyemg4nrzGLQqaAdEpbfw4y9LTx23K1YdiokxE5vHFd5",
                            amount: 1,
                            collection: "AMSNskm2RZqPXCZ6P2z6JLyHWMQF6pQ8RA8Q6x42Xufq",
                            givers: [
                                {
                                    address: user2.publicKey.toString(),
                                    amount: 1,
                                },
                            ],
                        },
                    ],
                    token: { amount: 1 },
                },
            },
        ],
    };

    /// locked
    // let swapInfo: neoTypes.SwapInfo = {
    //     currency: SystemProgram.programId.toString(),
    //     preSeed,
    //     status: "initializing",
    //     duration: 3 * days,
    //     startTime: Math.ceil(Date.now() / 1000),
    //     users: [
    //         {
    //             address: SystemProgram.programId.toString(),
    //             items: {
    //                 get: [
    //                     {
    //                         address: "FbCar18zAcUaUY7wZp3hxWxar8wwzBcfghnVLZuJQtAP",
    //                         amount: 1,
    //                         collection: "BNeFLwRJNG5zxwVRpQssEfqzinR24Xfn8Eh9CWhGb14T",
    //                         givers: [{ address: user1.publicKey.toString(), amount: 1 }],
    //                     },
    //                 ],
    //                 give: [
    //                     {
    //                         address: SystemProgram.programId.toString(),
    //                         amount: 1,
    //                         collection: "2WRn18ZiHji4ww3bsn2RUE2DDy2V45jChCR5mZHkbt6N",
    //                         getters: [
    //                             {
    //                                 address: user1.publicKey.toString(),
    //                                 amount: 1,
    //                             },
    //                         ],
    //                     },
    //                 ],
    //                 token: { amount: -1 },
    //             },
    //         },
    //         {
    //             address: user1.publicKey.toString(),
    //             items: {
    //                 give: [
    //                     {
    //                         address: "FbCar18zAcUaUY7wZp3hxWxar8wwzBcfghnVLZuJQtAP",
    //                         amount: 1,
    //                         collection: "BNeFLwRJNG5zxwVRpQssEfqzinR24Xfn8Eh9CWhGb14T",
    //                         getters: [{ address: SystemProgram.programId.toString(), amount: 1 }],
    //                     },
    //                 ],
    //                 get: [
    //                     {
    //                         address: SystemProgram.programId.toString(),
    //                         amount: 1,
    //                         collection: "2WRn18ZiHji4ww3bsn2RUE2DDy2V45jChCR5mZHkbt6N",
    //                         givers: [
    //                             {
    //                                 address: SystemProgram.programId.toString(),
    //                                 amount: 1,
    //                             },
    //                         ],
    //                     },
    //                 ],
    //                 token: { amount: 1 },
    //             },
    //         },
    //     ],
    // };
    // let swapInfoTaker: neoTypes.SwapInfo = {
    //     currency: SystemProgram.programId.toString(),
    //     preSeed,
    //     status: "initializing",
    //     duration: 3 * days,
    //     startTime: Math.ceil(Date.now() / 1000),
    //     users: [
    //         {
    //             address: user2.publicKey.toString(),
    //             items: {
    //                 get: [
    //                     {
    //                         address: "FbCar18zAcUaUY7wZp3hxWxar8wwzBcfghnVLZuJQtAP",
    //                         amount: 1,
    //                         collection: "BNeFLwRJNG5zxwVRpQssEfqzinR24Xfn8Eh9CWhGb14T",
    //                         givers: [{ address: user1.publicKey.toString(), amount: 1 }],
    //                     },
    //                 ],
    //                 give: [
    //                     {
    //                         address: "6bxDcis8PwRMXiv37XvNTMw6dMqUbxXeawFRGqAZJK3",
    //                         amount: 1,
    //                         collection: "2WRn18ZiHji4ww3bsn2RUE2DDy2V45jChCR5mZHkbt6N",
    //                         getters: [
    //                             {
    //                                 address: user1.publicKey.toString(),
    //                                 amount: 1,
    //                             },
    //                         ],
    //                     },
    //                 ],
    //                 token: { amount: -1 },
    //             },
    //         },
    //         {
    //             address: user1.publicKey.toString(),
    //             items: {
    //                 give: [
    //                     {
    //                         address: "FbCar18zAcUaUY7wZp3hxWxar8wwzBcfghnVLZuJQtAP",
    //                         amount: 1,
    //                         collection: "BNeFLwRJNG5zxwVRpQssEfqzinR24Xfn8Eh9CWhGb14T",
    //                         getters: [{ address: user2.publicKey.toString(), amount: 1 }],
    //                     },
    //                 ],
    //                 get: [
    //                     {
    //                         address: "6bxDcis8PwRMXiv37XvNTMw6dMqUbxXeawFRGqAZJK3",
    //                         amount: 1,
    //                         collection: "2WRn18ZiHji4ww3bsn2RUE2DDy2V45jChCR5mZHkbt6N",
    //                         givers: [
    //                             {
    //                                 address: user2.publicKey.toString(),
    //                                 amount: 1,
    //                             },
    //                         ],
    //                     },
    //                 ],
    //                 token: { amount: 1 },
    //             },
    //         },
    //     ],
    // };

    /// THE OTHER
    // let swapInfo: neoTypes.SwapInfo = {
    //     currency: SystemProgram.programId.toString(),
    //     preSeed,
    //     status: "initializing",
    //     duration: 3 * days,
    //     startTime: Math.ceil(Date.now() / 1000),
    //     users: [
    //         {
    //             address: user2.publicKey.toString(),
    //             items: {
    //                 get: [
    //                     {
    //                         address: SystemProgram.programId.toString(),
    //                         amount: 1,
    //                         collection: collection1Data.collection,
    //                         givers: [{ address: SystemProgram.programId.toString(), amount: 1 }],
    //                     },
    //                     {
    //                         address: SystemProgram.programId.toString(),
    //                         amount: 1,
    //                         collection: collection1Data.collection,
    //                         givers: [{ address: SystemProgram.programId.toString(), amount: 1 }],
    //                     },
    //                 ],
    //                 give: [
    //                     {
    //                         address: collection2Data.items[2][1],
    //                         amount: 1,
    //                         collection: collection2Data.collection,
    //                         getters: [
    //                             {
    //                                 address: SystemProgram.programId.toString(),
    //                                 amount: 1,
    //                             },
    //                         ],
    //                     },
    //                 ],
    //                 token: { amount: -1 },
    //             },
    //         },
    //         {
    //             address: SystemProgram.programId.toString(),
    //             items: {
    //                 give: [
    //                     {
    //                         address: SystemProgram.programId.toString(),
    //                         amount: 1,
    //                         collection: collection1Data.collection,
    //                         getters: [{ address: user2.publicKey.toString(), amount: 1 }],
    //                     },
    //                     {
    //                         address: SystemProgram.programId.toString(),
    //                         amount: 1,
    //                         collection: collection1Data.collection,
    //                         getters: [{ address: user2.publicKey.toString(), amount: 1 }],
    //                     },
    //                 ],
    //                 get: [
    //                     {
    //                         address: collection2Data.items[2][1],
    //                         amount: 1,
    //                         collection: collection2Data.collection,
    //                         givers: [
    //                             {
    //                                 address: user2.publicKey.toString(),
    //                                 amount: 1,
    //                             },
    //                         ],
    //                     },
    //                 ],
    //                 token: { amount: 1 },
    //             },
    //         },
    //     ],
    // };
    // let swapInfoTaker: neoTypes.SwapInfo = {
    //     currency: SystemProgram.programId.toString(),
    //     preSeed,
    //     status: "initializing",
    //     duration: 3 * days,
    //     startTime: Math.ceil(Date.now() / 1000),
    //     users: [
    //         {
    //             address: user2.publicKey.toString(),
    //             items: {
    //                 get: [
    //                     {
    //                         address: collection1Data.items[1][1],
    //                         amount: 1,
    //                         collection: collection1Data.collection,
    //                         givers: [{ address:user1.publicKey.toString(), amount: 1 }],
    //                     },
    //                     {
    //                         address: collection1Data.items[1][2],
    //                         amount: 1,
    //                         collection: collection1Data.collection,
    //                         givers: [{ address:user1.publicKey.toString(), amount: 1 }],
    //                     },
    //                 ],
    //                 give: [
    //                     {
    //                         address: collection2Data.items[2][1],
    //                         amount: 1,
    //                         collection: collection2Data.collection,
    //                         getters: [
    //                             {
    //                                 address:user1.publicKey.toString(),
    //                                 amount: 1,
    //                             },
    //                         ],
    //                     },
    //                 ],
    //                 token: { amount: -1 },
    //             },
    //         },
    //         {
    //             address:user1.publicKey.toString(),
    //             items: {
    //                 give: [
    //                     {
    //                         address: collection1Data.items[1][1],
    //                         amount: 1,
    //                         collection: collection1Data.collection,
    //                         getters: [{ address: user2.publicKey.toString(), amount: 1 }],
    //                     },
    //                     {
    //                         address: collection1Data.items[1][2],
    //                         amount: 1,
    //                         collection: collection1Data.collection,
    //                         getters: [{ address: user2.publicKey.toString(), amount: 1 }],
    //                     },
    //                 ],
    //                 get: [
    //                     {
    //                         address: collection2Data.items[2][1],
    //                         amount: 1,
    //                         collection: collection2Data.collection,
    //                         givers: [
    //                             {
    //                                 address: user2.publicKey.toString(),
    //                                 amount: 1,
    //                             },
    //                         ],
    //                     },
    //                 ],
    //                 token: { amount: 1 },
    //             },
    //         },
    //     ],
    // };

    // it("check SDA", async () => {
    //     const normal = await neoSwap.UTILS.swapDataConverter({ swapInfo, connection });
    //     const mod = await neoSwap.UTILS.swapDataConverter({ swapInfo: swapInfoTaker, connection });
    //     console.log(
    //         "normal",
    //         normal.swapDataAccount_publicKey.toString(),
    //         " VS ",
    //         mod.swapDataAccount_publicKey.toString(),
    //         " mod"
    //     );
    // });

    // it("make Swap", async () => {
    //     if (!swapDataAccount) {
    //         console.log("user1.publicKey", user1.publicKey);

    //         const { swapDataAccount, hashs } = await neoSwap.makeSwap({
    //             clusterOrUrl,
    //             swapInfo,
    //             signer: user1,
    //         });

    //         console.log("hashs", hashs);
    //         console.log("swapDataAccount", swapDataAccount);
    //     } else console.warn("makeSwap skipped");
    // });

    it("deposit Swap", async () => {
        // if (swapDataAccount) {
        // console.log("user1.publicKey", user1.publicKey);

        const hashs = await neoSwap.depositSwap({
            clusterOrUrl,
            swapDataAccount,
            // swapInfo,
            signer: user2,

            simulation: false,
            skipConfirmation: true,
            // swapInfo: swapInfoTaker,
        });

        console.log("hashs", hashs);
        // console.log("swapDataAccount", swapDataAccount);
        // } else console.warn("makeSwap skipped");
    });

    it("get Swap", async () => {
        console.log("user1.publicKey", user1.publicKey.toBase58());
        console.log("user2.publicKey", user2.publicKey.toBase58());

        if (swapDataAccount) {
            anchor.Program;
            const sdaD = await neoSwap.UTILS.getSwapDataAccountFromPublicKey({
                clusterOrUrl,
                swapDataAccount_publicKey: swapDataAccount,

                // validateOwnership:
                // simulation: false,
                // skipConfirmation:
            });

            console.log("SWAP:", sdaD);
        } else console.warn("get Swap");
    });

    // it("take swap", async () => {
    //     if (swapDataAccount) {
    //         const hashs = await neoSwap.takeSwap({
    //             clusterOrUrl,
    //             signer: user2,
    //             swapDataAccount,
    //             swapInfo: swapInfoTaker,
    //             // simulation: true,
    //         });
    //         console.log("hashs", hashs);
    //     } else {
    //         console.log("hashtakeSwap skipped");
    //     }
    // });

    // // // it("User 2 depositSwap should fail", async () => {
    // // //     if (swapDataAccount) {
    // // //         const hashs = await neoSwap.depositSwap({
    // // //             clusterOrUrl,
    // // //             signer: user2,
    // // //             swapDataAccount,
    // // //         });
    // // //         console.log("hashs", hashs);
    // // //     } else console.warn("depositing user 2 skipped");
    // // // });

    // it("User 2 completes Data", async () => {
    //     if (swapDataAccount) {
    //         console.log("swapInfoTaker", swapInfoTaker);

    //         const hashs = await neoSwap.modifySwap({
    //             clusterOrUrl,
    //             swapDataAccount,
    //             signer,
    //             swapInfo: swapInfoTaker,
    //         });
    //         console.log("hashs", hashs);
    //     } else console.warn("depositing user 2 skipped");
    // });

    // // it("User 2 deposits", async () => {
    // //     if (swapDataAccount) {
    // //         const hashs = await neoSwap.depositSwap({
    // //             clusterOrUrl,
    // //             signer: user1,
    // //             swapDataAccount,
    // //         });
    // //         console.log("hashs", hashs);
    // //     } else console.warn("depositing user 2 skipped");
    // // });

    // // it("claim and close", async () => {
    // //     if (swapDataAccount) {
    // //         const hashs = await neoSwap.claimAndCloseSwap({
    // //             clusterOrUrl,
    // //             signer,
    // //             swapDataAccount,
    // //         });
    // //         console.log("Claim & close transactionHashs :", hashs);
    // //     } else console.warn("Claim & close skipped");
    // // });

    // it("cancel and close", async () => {
    //     if (swapDataAccount) {
    //         const hashs = await neoSwap.cancelAndCloseSwap({
    //             clusterOrUrl,
    //             signer: user1,
    //             swapDataAccount,
    //         });
    //         console.log("Claim & close transactionHashs :", hashs);
    //     } else console.warn("Claim & close skipped");
    // });

    // it("cancel Cnft", async () => {
    //     if (swapDataAccount) {
    //         const swapIdentity = await neoSwap.UTILS.getSwapIdentityFromData({
    //             clusterOrUrl,
    //             swapData: await neoSwap.UTILS.getSwapDataAccountFromPublicKey({
    //                 swapDataAccount_publicKey: swapDataAccount,
    //                 program,
    //             }),
    //         });
    //         const {
    //             creatorHash,
    //             dataHash,
    //             index,
    //             merkleTree,
    //             nonce,
    //             proofMeta,
    //             root,
    //             treeAuthority,
    //         } = await neoSwap.UTILS.NFT_ACCOUNTS.getCNFTData({
    //             connection: program.provider.connection,
    //             tokenId: "6bxDcis8PwRMXiv37XvNTMw6dMqUbxXeawFRGqAZJK3",
    //             cluster: clusterOrUrl.includes("mainnet") ? "mainnet-beta" : "devnet",
    //         });

    //         let ix = await program.methods
    //             .cancelCNft(
    //                 swapIdentity.swapDataAccount_seed,
    //                 swapIdentity.swapDataAccount_bump,
    //                 root,
    //                 dataHash,
    //                 creatorHash,
    //                 nonce,
    //                 index
    //             )
    //             .accounts({
    //                 systemProgram: SystemProgram.programId,
    //                 metadataProgram: TOKEN_METADATA_PROGRAM,
    //                 sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    //                 tokenProgram: TOKEN_PROGRAM_ID,
    //                 ataProgram: SOLANA_SPL_ATA_PROGRAM_ID,
    //                 swapDataAccount,
    //                 user: user2.publicKey,
    //                 signer: user2.publicKey,
    //                 leafDelegate: user2.publicKey,
    //                 treeAuthority,
    //                 merkleTree,
    //                 logWrapper: SPL_NOOP_PROGRAM_ID,
    //                 compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    //                 bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
    //             })
    //             .remainingAccounts(proofMeta)
    //             .instruction();
    //         let tx = new Transaction().add(ix);
    //         tx.feePayer = user2.publicKey;
    //         let hashs = await neoSwap.UTILS.sendBundledTransactions({
    //             clusterOrUrl,
    //             signer: user2,
    //             txsWithoutSigners: [{ tx }],
    //             // provider: program.provider,
    //         });
    //         console.log("Claim & close transactionHashs :", hashs);
    //     } else console.warn("Claim & close skipped");
    // });

    // it("get all atas", async () => {
    //     console.log("user1", user1.publicKey.toString());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(user1.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    //     console.log("user2", user2.publicKey.toString());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(user2.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    //     console.log("user3", user3.publicKey.toString());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(user3.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    //     console.log("user4", user4.publicKey.toString());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(user4.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    //     console.log("user5", user5.publicKey.toString());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(user5.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    //     console.log("user6", user6.publicKey.toString());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(user6.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    //     console.log("signer", signer.publicKey.toString());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(signer.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    // });
});
