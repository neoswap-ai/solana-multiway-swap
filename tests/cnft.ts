import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
const { assert } = require("chai");

// import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
import {
    Cluster,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
// import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
// import NeoSwap from "../app/src/neoSwap.module.v4.2";
import { neoTypes, neoSwap } from "@neoswap/solana";
// import { ErrorFeedback, NftSwapItem, SwapData, TradeStatus } from "../deleteme/types";

import idl from "../target/idl/neo_swap";

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
// import { SwapInfo } from "@neoswap/solana/dist/lib/es5/utils/types";
// import { transferCnft } from "../app/src/neoSwap.module.v4.2/functions.neoswap/createInstruction/transferCnft";
const user6 = Keypair.fromSecretKey(user6Sk);
const tokenId = "3Mh7ReRQXRig1Lv8qNKdR1bvU9ehfto1JCnhMC6yUB2v";

describe("compressed NFT Test Unit", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    let program = anchor.workspace.NeoSwap as Program;
    let clusterOrUrl =
        "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/";
    // let clusterOrUrl = "devnet";

    //normal
    // let swapDataAccount: PublicKey = new PublicKey("6CDpDkB1j91469brgBiV3j1mZWwHNA5gifE3SWcRiXRg");
    let swapDataAccount: PublicKey = new PublicKey("J2g2rtfjS549Cs2uxUP6VnssQZ1THhpfnLqjeEfgYxtD");
    // let swapDataAccount: PublicKey | undefined = undefined;

    let swapInfo: neoTypes.SwapInfo = {
        currency: SystemProgram.programId.toBase58(),
        preSeed: "0035",
        users: [
            {
                address: user2.publicKey.toBase58(),
                items: {
                    give: [
                        {
                            address: "2Tc5ysNhnboDtyysQgrLEN6AEb37Q7DZDqCoixgLLWHd",
                            amount: 1,
                            getters: [{ address: user1.publicKey.toBase58(), amount: 1 }],
                        },
                        {
                            address: "98n9RpNnzwPRbKSVmizegAJ4rz5dhwHfunPQJJnkEhFX",
                            amount: 1,
                            getters: [{ address: user1.publicKey.toBase58(), amount: 1 }],
                        },
                    ],
                    get: [
                        {
                            address: "GdzJNpcJVQQX2rPAWMS83cFF2qMyf9DtH7kyuAeXbF7i",
                            amount: 1,
                            givers: [{ address: user1.publicKey.toBase58(), amount: 1 }],
                        },
                        {
                            address: "28S928mvfUAMwSXcRVmvEy4nLfvJWRHpb56icNyXaCam",
                            amount: 1,
                            givers: [{ address: user1.publicKey.toBase58(), amount: 1 }],
                        },
                        {
                            address: "2XMTk7bhL57FE8rR55MjWjw4hoRm7mWnfTjQd8ULTA6H",
                            amount: 1,
                            givers: [{ address: user1.publicKey.toBase58(), amount: 1 }],
                        },
                    ],
                    token: { amount: 50000 },
                },
            },
            {
                address: user1.publicKey.toBase58(),
                items: {
                    give: [
                        {
                            address: "GdzJNpcJVQQX2rPAWMS83cFF2qMyf9DtH7kyuAeXbF7i",
                            amount: 1,
                            getters: [{ address: user2.publicKey.toBase58(), amount: 1 }],
                        },
                        {
                            address: "2XMTk7bhL57FE8rR55MjWjw4hoRm7mWnfTjQd8ULTA6H",
                            amount: 1,
                            getters: [{ address: user2.publicKey.toBase58(), amount: 1 }],
                        },
                        {
                            address: "28S928mvfUAMwSXcRVmvEy4nLfvJWRHpb56icNyXaCam",
                            amount: 1,
                            getters: [{ address: user2.publicKey.toBase58(), amount: 1 }],
                        },
                    ],
                    get: [
                        {
                            address: "2Tc5ysNhnboDtyysQgrLEN6AEb37Q7DZDqCoixgLLWHd",
                            amount: 1,
                            givers: [{ address: user2.publicKey.toBase58(), amount: 1 }],
                        },
                        {
                            address: "98n9RpNnzwPRbKSVmizegAJ4rz5dhwHfunPQJJnkEhFX",
                            amount: 1,
                            givers: [{ address: user2.publicKey.toBase58(), amount: 1 }],
                        },
                    ],
                    token: { amount: -50000 },
                },
            },
        ],
        // `${user1.publicKey.toBase58()}`: { give: [], get: [], token: { amount: 0 } },
    };

    it("Initializing Program", async () => {
        program = new Program(
            idl as anchor.Idl,
            new PublicKey("EU5zoiRSvPE5k1Fy49UJZvPMBKxzatdBGFJ11XPFD42Z"),
            new anchor.AnchorProvider(
                new Connection(
                    "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/"
                ),
                new anchor.Wallet(signer),
                { commitment: "confirmed" }
            )
        );
        console.log("programId", program.programId.toBase58());
        console.log("signer", signer.publicKey.toBase58());
        console.log("user1", user1.publicKey.toBase58());
        console.log("user2", user2.publicKey.toBase58());
        // console.log("user2", user3.publicKey.toBase58());
        // console.log("user2", user4.publicKey.toBase58());
        // console.log("user2", user5.publicKey.toBase58());
        // console.log("user2", user6.publicKey.toBase58());
    });

    it("initialize swapDataAccount", async () => {
        try {
            if (!swapDataAccount) {
                const allInitData = await neoSwap.initializeSwap({
                    clusterOrUrl,
                    signer,
                    swapInfo,

                    // simulation: true,
                });

                // if (neoSwapNpm.utils.isErrorInitializeSwap(allInitData)) throw allInitData.error;
                console.log("initialized", allInitData);
            } else {
                console.log("initiaize skipped", swapDataAccount.toBase58());
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    });

    it("readData", async () => {
        const swapdaata = await neoSwap.UTILS.getSwapDataAccountFromPublicKey({
            program: neoSwap.UTILS.getProgram({ clusterOrUrl }),
            swapDataAccount_publicKey: swapDataAccount,
        });
        console.log("swapdaata", swapdaata);
    });

    it("deposit all NFT to  swap", async () => {
        if (swapDataAccount) {
            let data: { user: PublicKey; hashs: string[] }[] = [];
            await Promise.all(
                [user1, user2].map(async (user) => {
                    try {
                        let hashs = [];
                        // const depositSwapDatauser = await neoSwap.depositSwap({
                        //     clusterOrUrl,
                        //     signer: user,
                        //     swapDataAccount,
                        // });

                        //     await neoSwap.CREATE_INSTRUCTIONS.createDepositSwapInstructions({
                        //         clusterOrUrl,
                        //         user: user.publicKey,
                        //         swapDataAccount,
                        //         // simulation: false,
                        //     });
                        // //     let recentbh = (await program.provider.connection.getLatestBlockhash()).blockhash
                        // // depositSwapDatauser.map((v) => {
                        // //     v.tx.feePayer=(user.publicKey);
                        // //     v.tx.recentBlockhash=recentbh;
                        // //     v.tx.sign(user);
                        // // });
                        // await Promise.all(
                        //     depositSwapDatauser.map(async (tx) => {
                        //         try {
                        //             const hh = await neoSwap.UTILS.sendBundledTransactions({
                        //                 clusterOrUrl,
                        //                 signer: user,
                        //                 txsWithoutSigners: [tx],
                        //             });
                        //             hashs.push(hh[0]);
                        //             console.log("hh", hh);
                        //         } catch (error) {
                        //             hashs.push(error);
                        //         }
                        //     })
                        // );
                        const depositSwapDatauserprep =
                            await neoSwap.CREATE_INSTRUCTIONS.prepareDepositSwapInstructions({
                                clusterOrUrl,
                                swapDataAccount,
                                user: user.publicKey,
                            });

                        const depositSwapDatauser = await neoSwap.apiProcessor({
                            apiProcessorData: depositSwapDatauserprep[0],
                            clusterOrUrl,
                            signer: user,
                            simulation:false
                        });
                        data.push({ user: user.publicKey, hashs: depositSwapDatauser });
                        // data.push({ user: user.publicKey, hashs });
                        console.log("transactionhashes", depositSwapDatauser);
                    } catch (error) {
                        data.push({ user: user.publicKey, hashs: error });
                    }
                })
            );
            // for await (const user of [user1, user2, user3, user4, user5, user6]) {
            // }
            // console.log("deposit datas :", data);
            data.forEach((v) => console.log(v.user.toBase58(), "\ndeposit datas :", v.hashs));
        } else {
            console.log("swap not given");
        }
    });

    // it("finish cancel and close from signer", async () => {
    //     const swapData = await neoSwap.UTILS.getSwapDataAccountFromPublicKey({
    //         program: neoSwap.UTILS.getProgram({ clusterOrUrl }),
    //         swapDataAccount_publicKey: swapDataAccount,
    //     });

    //     console.log("swapData :", swapData);
    // });
    // it("finish cancel and close from signer", async () => {
    //     if (swapDataAccount) {
    //         const cancelAndCloseHash = await neoSwap.cancelAndCloseSwap({
    //             signer,
    //             clusterOrUrl,
    //             swapDataAccount,
    //         });

    //         console.log("cancelAndCloseHash :", cancelAndCloseHash);
    //     } else {
    //         console.log("swap not given");
    //     }
    // });

    it("claim 2 and close from signer", async () => {
        if (swapDataAccount) {
            // const claimAndCloseHash = await neoSwap.CREATE_INSTRUCTIONS.createClaimSwapInstructions(
            const claimAndCloseHash = await neoSwap.claimAndCloseSwap({
                signer: signer,
                clusterOrUrl,
                swapDataAccount,

                //     simulation: false,
                // skipConfirmation: true,
            });
            // claimAndCloseHash[0].tx;
            // claimAndCloseHash[0].tx.feePayer = signer.publicKey;
            // claimAndCloseHash[0].tx.recentBlockhash = (
            //     await program.provider.connection.getLatestBlockhash()
            // ).blockhash;
            // claimAndCloseHash[0].tx.sign(signer);
            // const signature = await program.provider.connection.sendRawTransaction(
            //     claimAndCloseHash[0].tx.serialize(),
            //     {
            //         skipPreflight: true,
            //     }
            // );
            // console.log(signature);
            console.log("claimAndCloseHash :", claimAndCloseHash);
        } else {
            console.log("swap not given");
        }
    });
});
