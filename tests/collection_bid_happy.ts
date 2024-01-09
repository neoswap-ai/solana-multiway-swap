import * as anchor from "@coral-xyz/anchor";
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
const user6 = Keypair.fromSecretKey(usk6);
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import usclisks from "/home/biboux/.config/solana/id.json";
// const usc = Keypair.fromSecretKey(usks);

const clusterOrUrl =
    // "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/";
    "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
describe("MIX pre-signing", () => {
    anchor.setProvider(anchor.AnchorProvider.env());
    const connection = new Connection(clusterOrUrl);

    let preSeed = "000023";
    // let swapDataAccount = new PublicKey("6nXFtWreXWfEw4rkoXMH56CFWAQcZqWaz9a6yzCCRzCZ");
    let swapDataAccount = new PublicKey("GfYzjZAS1HE7PmTsUcavCoz3NVQLjZvHUomkuCh2QCbL");
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
    let swapInfo: neoTypes.SwapInfo = {
        currency: SystemProgram.programId.toString(),
        preSeed,
        status: "initializing",
        duration: days * 3,
        openTime: Math.ceil(Date.now() / 1000),
        users: [
            {
                address: user2.publicKey.toString(),
                items: {
                    get: [
                        {
                            address: SystemProgram.programId.toString(),
                            amount: 1,
                            collection: collection1Data.collection,
                            givers: [{ address: SystemProgram.programId.toBase58(), amount: 1 }],
                        },
                        {
                            address: SystemProgram.programId.toString(),
                            amount: 1,
                            collection: collection1Data.collection,
                            givers: [{ address: SystemProgram.programId.toBase58(), amount: 1 }],
                        },
                    ],
                    give: [
                        {
                            address: collection2Data.items[2][1],
                            amount: 1,
                            collection: collection2Data.collection,
                            getters: [
                                {
                                    address: SystemProgram.programId.toString(),
                                    amount: 1,
                                },
                            ],
                        },
                    ],
                    token: { amount: -1 },
                },
            },
            {
                address: SystemProgram.programId.toString(),
                items: {
                    give: [
                        {
                            address: SystemProgram.programId.toString(),
                            amount: 1,
                            collection: collection1Data.collection,
                            getters: [{ address: user2.publicKey.toString(), amount: 1 }],
                        },
                        {
                            address: SystemProgram.programId.toString(),
                            amount: 1,
                            collection: collection1Data.collection,
                            getters: [{ address: user2.publicKey.toString(), amount: 1 }],
                        },
                    ],
                    get: [
                        {
                            address: collection2Data.items[2][1],
                            amount: 1,
                            collection: collection2Data.collection,
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
    let swapInfoTaker: neoTypes.SwapInfo = {
        currency: SystemProgram.programId.toString(),
        preSeed,
        status: "initializing",
        duration: 100000,
        openTime: Math.ceil(Date.now() / 1000),
        users: [
            {
                address: user2.publicKey.toString(),
                items: {
                    get: [
                        {
                            address: collection1Data.items[1][1],
                            amount: 1,
                            collection: collection1Data.collection,
                            givers: [{ address: user1.publicKey.toString(), amount: 1 }],
                        },
                        {
                            address: collection1Data.items[1][2],
                            amount: 1,
                            collection: collection1Data.collection,
                            givers: [{ address: user1.publicKey.toString(), amount: 1 }],
                        },
                    ],
                    give: [
                        {
                            address: collection2Data.items[2][1],
                            amount: 1,
                            collection: collection2Data.collection,
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
                            address: collection1Data.items[1][1],
                            amount: 1,
                            collection: collection1Data.collection,
                            getters: [{ address: user2.publicKey.toString(), amount: 1 }],
                        },
                        {
                            address: collection1Data.items[1][2],
                            amount: 1,
                            collection: collection1Data.collection,
                            getters: [{ address: user2.publicKey.toString(), amount: 1 }],
                        },
                    ],
                    get: [
                        {
                            address: collection2Data.items[2][1],
                            amount: 1,
                            collection: collection2Data.collection,
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

    it("get Swap", async () => {
        if (swapDataAccount) {
            anchor.Program;
            const sdaD = await neoSwap.UTILS.getSwapDataAccountFromPublicKey({
                clusterOrUrl,
                swapDataAccount_publicKey: swapDataAccount,

                // validateOwnership:
                // simulation: false,
                // skipConfirmation:
            });

            console.log("initializeData", sdaD);
        } else console.warn("initializing swap skipped");
    });
    it("initialize Swap", async () => {
        // console.log(swapInfo);
        // console.log(1704284828);

        if (!swapDataAccount) {
            const { initializeData, transactionHashs } = await neoSwap.initializeSwap({
                clusterOrUrl,
                swapInfo,
                signer,

                // validateOwnership:
                // simulation: false,
                // skipConfirmation:
            });

            console.log("initializeData", initializeData);
            console.log("initializeData", transactionHashs);
        } else console.warn("initializing swap skipped");
    });

    it("Deposit user 1", async () => {
        if (swapDataAccount) {
            const hashs = await neoSwap.depositSwap({
                clusterOrUrl,
                signer: user2,
                swapDataAccount,
            });
            console.log("hashs", hashs);
        } else console.warn("depositing user 2 skipped");
    });

    // it("User 2 depositSwap should fail", async () => {
    //     if (swapDataAccount) {
    //         const hashs = await neoSwap.depositSwap({
    //             clusterOrUrl,
    //             signer: user2,
    //             swapDataAccount,
    //         });
    //         console.log("hashs", hashs);
    //     } else console.warn("depositing user 2 skipped");
    // });

    it("User 2 completes Data", async () => {
        if (swapDataAccount) {
            console.log("swapInfoTaker", swapInfoTaker);

            const hashs = await neoSwap.modifySwap({
                clusterOrUrl,
                swapDataAccount,
                signer,
                swapInfo: swapInfoTaker,
            });
            console.log("hashs", hashs);
        } else console.warn("depositing user 2 skipped");
    });

    it("User 2 deposits", async () => {
        if (swapDataAccount) {
            const hashs = await neoSwap.depositSwap({
                clusterOrUrl,
                signer: user1,
                swapDataAccount,
            });
            console.log("hashs", hashs);
        } else console.warn("depositing user 2 skipped");
    });

    it("claim and close", async () => {
        if (swapDataAccount) {
            const hashs = await neoSwap.claimAndCloseSwap({
                clusterOrUrl,
                signer,
                swapDataAccount,
            });
            console.log("Claim & close transactionHashs :", hashs);
        } else console.warn("Claim & close skipped");
    });

    // it("cancel and close", async () => {
    //     if (swapDataAccount) {
    //         const hashs = await neoSwap.cancelAndCloseSwap({
    //             clusterOrUrl,
    //             signer,
    //             swapDataAccount,
    //         });
    //         console.log("Claim & close transactionHashs :", hashs);
    //     } else console.warn("Claim & close skipped");
    // });

    // it("get all atas", async () => {
    //     console.log("user1", user1.publicKey.toBase58());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(user1.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    //     console.log("user2", user2.publicKey.toBase58());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(user2.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    //     console.log("user3", user3.publicKey.toBase58());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(user3.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    //     console.log("user4", user4.publicKey.toBase58());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(user4.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    //     console.log("user5", user5.publicKey.toBase58());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(user5.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    //     console.log("user6", user6.publicKey.toBase58());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(user6.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    //     console.log("signer", signer.publicKey.toBase58());
    //     console.log(
    //         (
    //             await connection.getParsedTokenAccountsByOwner(signer.publicKey, {
    //                 programId: TOKEN_PROGRAM_ID,
    //             })
    //         ).value.map((v) => v.pubkey.toString())
    //     );
    // });
});
