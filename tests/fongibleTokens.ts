import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
const { assert } = require("chai");
import neoSwapNpm, {
    ApiProcessorConfigType,
    ApiProcessorData,
    ErrorFeedback,
    ItemStatus,
    NftSwapItem,
    SwapData,
    TradeStatus,
    TxWithSigner,
} from "@biboux.neoswap/neo-swap-npm";
// import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
import {
    Cluster,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import NeoSwap from "../app/src/neoSwap.module.v4.2";
// import {
//     ItemStatus,
//     TradeStatus,
// } from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/status.type.neoswap";
// import { getProgram } from "../app/src/neoSwap.module.v4.2/utils.neoSwap/getProgram.neoswap";
import signerSk from "../deleteme/signer";
import user1Sk from "../deleteme/user1";
import user2Sk from "../deleteme/user2";
import user3Sk from "../deleteme/user3";
import user1NSk from "../deleteme/user1Normal";
import user2NSk from "../deleteme/user2Normal";
import user3NSk from "../deleteme/user3Normal";
// import { getProgram } from "../app/src/neoSwap.module.v4.2/utils.neoSwap/getProgram.neoswap";
// import SwapData from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/swapData.types.neoswap";
// import { ErrorFeedback } from "@biboux.neoswap/neo-swap-npm/lib/es5/utils/types";

describe("FongibleTokens Test Unit", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    let program = anchor.workspace.NeoSwap as Program;
    let cluster = "devnet" as Cluster;
    // let cluster = "devnet";
    let swapDataAccount: PublicKey | undefined = new PublicKey(
        "3JkYjgvkuRFmy3hKDbFwUW7Rp5Du5TnbZQAUemma3CaB"
    ); //new PublicKey("DjzPCDEVwwqgAo7SfdE1paugvSreQMsVv57co8WdHJgM"); //new PublicKey("GNg66w1XyQG3jMT1rMxrApU4ggJR3LokJLfqmVGg8myt"); // new PublicKey("8khwnKwc97MiSPPCtz42Q3NAwfyHa2WYnjYt4Dg3sphs"); //new PublicKey("A87ZnUTVPKVT9o9pANf9WLSkXkhQsM3qc3EL9RobYP8m"); //
    // let swapDataAccount2: PublicKey | undefined = new PublicKey(
    //     "E6hBkNhJNGtwBvYtadCp4UAqmjanmMVsDqG3R1sPNFzY"
    // );
    // let swapDataAccount: PublicKey | undefined = undefined;
    // let swapDataAccount2: PublicKey | undefined = undefined;

    let currency = new PublicKey("9RruPYjoWoWcYQsoy981qMFdnervBpsbPohUP3NrPidn");

    let signer = Keypair.fromSecretKey(signerSk);

    let user1 = Keypair.fromSecretKey(user1Sk);
    let user1MintToTransfer = new PublicKey("DhFMwiEwH7DhUBpKyGGzxEMxMz2sbDmyQEWtSCv838pC");
    // let user1MintToTransfer = undefined;

    let user2 = Keypair.fromSecretKey(user2Sk);
    let user2MintToTransfer = new PublicKey("FP7poYqi7m6hjjciPf3wPb9F6j6jFDHq8nGEePyoa3ey");
    // let user2MintToTransfer = undefined;

    let user3 = Keypair.fromSecretKey(user3Sk);
    let user3MintToTransfer = new PublicKey("54oys9JomhLAy6yXo2eyGcug2StNTdP8y8FEPX5NEo8k");
    // let user3MintToTransfer = undefined;

    let user1N = Keypair.fromSecretKey(user1NSk);
    let user1NMintToTransfer = new PublicKey("55YqT3cRqMUMBRHtoAf3L1bXtdCCB6e2yv2uFeqejJUb");
    // let user1NMintToTransfer = undefined;

    let user2N = Keypair.fromSecretKey(user2NSk);
    let user2NMintToTransfer = new PublicKey("BEC1FL9HTkGY4qojkHvR2AE73xrPxjGcy3zLrkFYtKL1");
    // let user2NMintToTransfer = undefined;

    let user3N = Keypair.fromSecretKey(user3NSk);
    let user3NMintToTransfer = new PublicKey("HMtpSihYPAi8mR2JSQvp5m3peHed9SLkqbKWWHgyamDi");
    // let user3NMintToTransfer = undefined;

    let swapData: SwapData = {
        initializer: signer.publicKey,
        items: [],
        status: TradeStatus.Initializing,
        nbItems: 1,
        preSeed: "0021",
        acceptedPayement: currency,
    };

    it("Initializing Program", async () => {
        program = neoSwapNpm.utils.getProgram("devnet", signer); //as unknown as Program;
        console.log("programId", program.programId.toBase58());
        console.log("signer", signer.publicKey.toBase58());
    });

    it("Mint NFTs ", async () => {
        // console.log(program);
        if (!user1MintToTransfer) {
            // console.log(
            //     await program.provider.connection.requestAirdrop(user1.publicKey, LAMPORTS_PER_SOL)
            // );
            let { mintAddress } = await NeoSwap.createPnft2({
                program,
                signer: user1,
                standard: TokenStandard.Fungible,
                // destination: new PublicKey("5mG4wFjsnuuQWExTGqLN9ca2e5D1DBVZGDQKjGHJvJPQ"),
            });
            console.log("user1 mintAddress", mintAddress.toBase58());
        } else {
            console.log("user1 minting skipped");
        }
        if (!user2MintToTransfer) {
            let { mintAddress } = await NeoSwap.createPnft2({
                program,
                signer: user2,
                standard: TokenStandard.Fungible,
            });
            console.log("user2 mintAddress", mintAddress.toBase58());
        } else {
            console.log("user2 minting skipped");
        }
        if (!user3MintToTransfer) {
            let { mintAddress } = await NeoSwap.createPnft2({
                program,
                signer: user3,
                standard: TokenStandard.ProgrammableNonFungible,
            });
            console.log("user3 mintAddress", mintAddress.toBase58());
        } else {
            console.log("user3 minting skipped");
            // metaplex find mint
        }

        if (!user1NMintToTransfer) {
            let { mintAddress } = await NeoSwap.createPnft2({
                program,
                signer: user1N,
                standard: TokenStandard.FungibleAsset,
            });
            console.log("user1N mintAddress", mintAddress.toBase58());
        } else {
            console.log("user1N minting skipped");
        }
        if (!user2NMintToTransfer) {
            let { mintAddress } = await NeoSwap.createPnft2({
                program,
                signer: user2N,
                standard: TokenStandard.FungibleAsset,
            });
            console.log("user2N mintAddress", mintAddress.toBase58());
        } else {
            console.log("user2N minting skipped");
        }
        if (!user3NMintToTransfer) {
            let { mintAddress } = await NeoSwap.createPnft2({
                program,
                signer: user3N,
                standard: TokenStandard.NonFungible,
            });
            console.log("user3N mintAddress", mintAddress.toBase58());
        } else {
            console.log("user3N minting skipped");
        }
    });

    it("create SwapData", async () => {
        swapData.items.push({
            isNft: false,
            amount: new BN(200),
            mint: currency,
            status: ItemStatus.SolPending,
            owner: user1.publicKey,
            destinary: SystemProgram.programId,
        } as NftSwapItem);
        swapData.items.push({
            isNft: false,
            amount: new BN(-200),
            mint: currency,
            status: ItemStatus.SolToClaim,
            owner: user2.publicKey,
            destinary: SystemProgram.programId,
        } as NftSwapItem);

        // swapData.items.push({
        //     isNft: true,
        //     amount: new BN(1),
        //     mint: user1MintToTransfer,
        //     status: ItemStatus.NFTPending,
        //     owner: user1.publicKey,
        //     destinary: user2.publicKey,
        // } as NftSwapItem);

        // swapData.items.push({
        //     isNft: true,
        //     amount: new BN(1),
        //     mint: user2MintToTransfer,
        //     status: ItemStatus.NFTPending,
        //     owner: user2.publicKey,
        //     destinary: user3.publicKey,
        // } as NftSwapItem);

        // swapData.items.push({
        //     isNft: true,
        //     amount: new BN(1),
        //     mint: user3MintToTransfer,
        //     status: ItemStatus.NFTPending,
        //     owner: user3.publicKey,
        //     destinary: user1N.publicKey,
        // } as NftSwapItem);

        // swapData.items.push({
        //     isNft: true,
        //     amount: new BN(6),
        //     mint: user1NMintToTransfer,
        //     status: ItemStatus.NFTPending,
        //     owner: user1N.publicKey,
        //     destinary: user2N.publicKey,
        // } as NftSwapItem);

        // swapData.items.push({
        //     isNft: true,
        //     amount: new BN(6),
        //     mint: user2NMintToTransfer,
        //     status: ItemStatus.NFTPending,
        //     owner: user2N.publicKey,
        //     destinary: user3N.publicKey,
        // } as NftSwapItem);

        // swapData.items.push({
        //     isNft: true,
        //     amount: new BN(1),
        //     mint: user3NMintToTransfer,
        //     status: ItemStatus.NFTPending,
        //     owner: user3N.publicKey,
        //     destinary: user1.publicKey,
        // } as NftSwapItem);
        console.log("nb items :", swapData.items.length);
        swapData.nbItems = swapData.items.length;
    });

    it("initialize swapDataAccount", async () => {
        // console.log(swapData.items.length);
        try {
            if (!swapDataAccount) {
                const allInitData = await neoSwapNpm.initializeSwap({
                    cluster,
                    signer: signer,
                    swapData,
                });

                if (neoSwapNpm.utils.isErrorInitializeSwap(allInitData)) throw allInitData;
                console.log("initialized", allInitData);
            } else {
                console.log("initiaize skipped", swapDataAccount.toBase58());
            }
        } catch (error) {
            console.log(error);
        }
    });
    // it("initialize swapDataAccount2", async () => {
    //     // console.log(swapData.items.length);

    //     if (!swapDataAccount2) {
    //         swapData.preSeed = "00020";
    //         const allInitData = await neoSwapNpm.initializeSwap({
    //             cluster,
    //             signer: signer,
    //             swapData,
    //         });

    //         if (neoSwapNpm.utils.isErrorInitializeSwap(allInitData)) throw allInitData;
    //         console.log("initialized", allInitData);
    //     } else {
    //         console.log("initiaize skipped", swapDataAccount2.toBase58());
    //     }
    // });
    // it("fail initialize swapDataAccount", async () => {
    //     // console.log(swapData.items.length);
    //     // if (!swapDataAccount) {
    //     let wrongSwapData = swapData;
    //     wrongSwapData.items[0].amount = new BN(7);
    //     swapData.preSeed = "000020";

    //     // try {
    //     const allInitData = await neoSwapNpm.initializeSwap({
    //         cluster,
    //         signer: signer,
    //         swapData,
    //     });

    //     console.log("initialized", allInitData);
    //     if (neoSwapNpm.utils.isErrorInitializeSwap(allInitData)) {
    //         assert(String(allInitData[0].description).includes("in the associated token account"));
    //         // throw allInitData;
    //     }
    //     // } catch (error) {
    //     //     console.log(String(error), String(error).includes("0x1780"));
    //     //     assert(String(error).includes("in the associated token account"));
    //     //     console.log("error 0x1780 -> not enough funds to transfer");
    //     // }
    //     // } else {
    //     //     console.log("initiaize skipped", swapDataAccount.toBase58());
    //     // }
    // });
    // it("deposit NFT from user that doesn't have", async () => {
    //     if (swapDataAccount) {
    //         const swapDataRead = await neoSwapNpm.utils.getSwapDataAccountFromPublicKey(
    //             program,
    //             swapDataAccount
    //         );

    //         const swapIdentity = neoSwapNpm.utils.getSwapIdentityFromData({
    //             swapData: swapDataRead,
    //         });
    //         const depositSwapData = await NeoSwap.depositNft({
    //             ataList: [],
    //             mint: user2MintToTransfer,
    //             program,
    //             signer: user1N.publicKey,
    //             swapIdentity,
    //         });
    //         console.log("depositSwapData.mintAta", depositSwapData.mintAta);
    //         try {
    //             const { transactionHashes } = await neoSwapNpm.utils.sendBundledTransactions({
    //                 cluster,
    //                 signer: user1N,
    //                 txsWithoutSigners: [
    //                     { tx: new Transaction().add(...depositSwapData.instructions) },
    //                 ],
    //                 // skipPref
    //             });
    //             console.log("transactionhashes", transactionHashes);
    //         } catch (error) {
    //             console.log(String(error), String(error).includes("0x1780"));
    //             assert(String(error).includes("0x1780"));
    //             console.log("error 0x1780 -> not enough funds to transfer");
    //         }
    //     } else {
    //         console.log("swap not given");
    //     }
    // });
    it("deposit NFT to first swap", async () => {
        if (swapDataAccount) {
            const depositSwapDatauser = await neoSwapNpm.depositSwap({
                cluster,
                signer: user1,
                swapDataAccount,
            });

            console.log("transactionhashes", depositSwapDatauser);
        } else {
            console.log("swap not given");
        }
    });

    // it("Error deposit NFT to second swap", async () => {
    //     if (swapDataAccount2) {
    //         const swapDataRead = await neoSwapNpm.utils.getSwapDataAccountFromPublicKey(
    //             program,
    //             swapDataAccount2
    //         );
    //         const swapIdentity = neoSwapNpm.utils.getSwapIdentityFromData({
    //             swapData: swapDataRead,
    //         });
    //         const depositSwapData = await NeoSwap.depositNft({
    //             ataList: [],
    //             mint: user1MintToTransfer,
    //             program,
    //             signer: user1N.publicKey,
    //             swapIdentity,
    //         });
    //         console.log("depositSwapData.mintAta", depositSwapData.mintAta);
    //         try {
    //             const { transactionHashes } = await neoSwapNpm.utils.sendBundledTransactions({
    //                 cluster,
    //                 signer: user1N,
    //                 txsWithoutSigners: [
    //                     { tx: new Transaction().add(...depositSwapData.instructions) },
    //                 ],
    //                 // skipPref
    //             });
    //             console.log("transactionhashes", transactionHashes);
    //         } catch (error) {
    //             console.log(String(error), String(error).includes("0x1780"));
    //             assert(String(error).includes("0x1780"));
    //             console.log("error 0x1780 -> not enough funds to transfer");
    //         }
    //     } else {
    //         console.log("swap not given");
    //     }
    // });

    // // it("claim and close", async () => {
    // //     try {
    // //         const claimAndCloseData = await neoSwapNpm.claimAndCloseSwap({
    // //             cluster,
    // //             signer,
    // //             swapDataAccount,
    // //         });

    // //         console.log("claimAndCloseHash :", claimAndCloseData);
    // //     } catch (error) {
    // //         console.log("claimAndCloseHash :", error);
    // //     }
    // // });

    // // it("partial cancel and close from in trade user", async () => {
    // //     let transactionHashs: {
    // //         user: PublicKey;
    // //         error?: unknown;
    // //         txh?: ErrorFeedback | string[];
    // //     }[] = [];

    // //     for await (const user of [user1N, user2N, user3N, user1, user2, user3]) {
    // //         try {
    // //             const cancelAndCloseHash = await neoSwapNpm.cancelAndCloseSwap({
    // //                 cluster,
    // //                 signer: user,
    // //                 swapDataAccount: swapDataAccount,
    // //             });
    // //             console.log("transactionHashes", cancelAndCloseHash);
    // //             transactionHashs.push({ user: user.publicKey, txh: cancelAndCloseHash });
    // //         } catch (error) {
    // //             transactionHashs.push({ user: user.publicKey, error });
    // //         }
    // //     }
    // //     transactionHashs.forEach((v) => console.log("res", v));
    // // });
    // it("partial cancel from user", async () => {
    //     if (swapDataAccount) {
    //         const cancelAndCloseHash = await neoSwapNpm.cancelAndCloseSwap({
    //             cluster,
    //             signer: user1N,
    //             swapDataAccount: swapDataAccount,
    //         });
    //         console.log("transactionHashes", cancelAndCloseHash);
    //     } else {
    //         console.log("swap not given");
    //     }
    // });

    // it("deposit NFT to second swap", async () => {
    //     if (swapDataAccount2) {
    //         const swapDataRead = await neoSwapNpm.utils.getSwapDataAccountFromPublicKey(
    //             program,
    //             swapDataAccount2
    //         );
    //         const swapIdentity = neoSwapNpm.utils.getSwapIdentityFromData({
    //             swapData: swapDataRead,
    //         });
    //         const depositSwapData = await NeoSwap.depositNft({
    //             ataList: [],
    //             mint: user1MintToTransfer,
    //             program,
    //             signer: user1N.publicKey,
    //             swapIdentity,
    //         });
    //         // console.log("depositSwapData.mintAta", depositSwapData.mintAta);
    //         // try {
    //             const { transactionHashes } = await neoSwapNpm.utils.sendBundledTransactions({
    //                 cluster,
    //                 signer: user1N,
    //                 txsWithoutSigners: [
    //                     { tx: new Transaction().add(...depositSwapData.instructions) },
    //                 ],
    //                 // skipPref
    //             });
    //             console.log("transactionhashes", transactionHashes);
    //         // } catch (error) {
    //         //     // console.log(error, String(error).includes("6004"));
    //         //     assert(String(error).includes("6004"));
    //         //     console.log("error 6004 -> nothing to send");
    //         // }
    //     } else {
    //         console.log("swap not given");
    //     }
    // });

    // it("finish cancel and close from signer", async () => {
    //     if (swapDataAccount) {
    //         const cancelAndCloseHash = await neoSwapNpm.cancelAndCloseSwap({
    //             signer,
    //             cluster,
    //             swapDataAccount: swapDataAccount,
    //         });

    //         console.log("cancelAndCloseHash :", cancelAndCloseHash);
    //     } else {
    //         console.log("swap not given");
    //     }
    // });

    // it("finish cancel2 and close from signer", async () => {
    //     if (swapDataAccount2) {
    //         const cancelAndCloseHash = await neoSwapNpm.cancelAndCloseSwap({
    //             signer,
    //             cluster,
    //             swapDataAccount: swapDataAccount2,
    //         });

    //         console.log("cancelAndCloseHash :", cancelAndCloseHash);
    //     } else {
    //         console.log("swap not given");
    //     }
    // });

    //UTILS FOR INITIALIZING
    // it("Create keypair", async () => {
    //     console.log(Keypair.generate().secretKey.toString());
    //     console.log(Keypair.generate().secretKey.toString());
    //     console.log(Keypair.generate().secretKey.toString());
    // });
    // it("show PK", async () => {
    //     // console.log("signer", signer.publicKey.toBase58());
    //     console.log("user1", user1.publicKey.toBase58());
    //     console.log("user2", user2.publicKey.toBase58());
    //     console.log("user3", user3.publicKey.toBase58());
    //     console.log("user1N", user1N.publicKey.toBase58());
    //     console.log("user2N", user2N.publicKey.toBase58());
    //     console.log("user3N", user3N.publicKey.toBase58());
    // });
});
