import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
const { assert } = require("chai");

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
import { neoTypes, neoSwapNpm } from "@neoswap/solana";

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
import { ErrorFeedback, NftSwapItem, SwapData, TradeStatus } from "../deleteme/types";
const user6 = Keypair.fromSecretKey(user6Sk);

describe("FongibleTokens Test Unit", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    let program = anchor.workspace.NeoSwap as Program;
    let clusterOrUrl = "devnet" as Cluster;
    // let cluster = "devnet";

    //normal
    let swapDataAccount: PublicKey = new PublicKey("Hd5N6GLptV78mHB7UB5MjcpT8JwSsGzEajiupXaYCdWX");
    let swapDataAccount2: PublicKey = new PublicKey("41GTvm51EGLRPGCMfoFXbCjkVHoeCr8sF6J5Uf9qZLf2");

    //reverse
    // let swapDataAccount: PublicKey = new PublicKey("6CJSFDUYeuwyCpQjPJmwnv8DHKuUzeavhiMZQvCGUmrh");
    // let swapDataAccount2: PublicKey = new PublicKey("6T26p7NSyfCP2fggoD99A6ziHdLEuMTiJ2b5XLW7btkG");

    // let swapDataAccount: PublicKey | undefined = undefined;
    // let swapDataAccount2: PublicKey | undefined = undefined;

    let currency = new PublicKey("CV3V3qmvXuWfzdSMk5rWcamNEgCGgqcv7t1FJkkM5dkV");

    let user1MintToTransfer = new PublicKey("HxTSyfj37Vq2e1jdHcXa9b6rTFrRh3R9BTngnwhUciMp");
    // let user1MintToTransfer = undefined;

    let user2MintToTransfer = new PublicKey("H9YsFbkJxpJaABkWu6kweErV6r2THxULkpyMPNuR6DWE");
    // let user2MintToTransfer = undefined;

    let user3MintToTransfer = new PublicKey("A37ALYcjH4xzez8dnaqztN3Bmejr5E11VfR8GSC4D21j");
    // let user3MintToTransfer = undefined;

    let user4MintToTransfer = new PublicKey("612uMGVcfMY7nXUJc6kyaSne1dKhPhXKzAyUfrMwVoyW");
    // let user4MintToTransfer = undefined;

    let user5MintToTransfer = new PublicKey("F7qhgjV2cbAcPEgsiDdRw1joSaP4LToekkpGQkYhjYDX");
    // let user5MintToTransfer = undefined;

    let user6MintToTransfer = new PublicKey("AGnofFQzPEk9uSbEyPHnMRSEZ6x51kbicAbupDynensR");
    // let user6MintToTransfer = undefined;

    let swapData: SwapData = {
        initializer: signer.publicKey,
        items: [],
        status: neoTypes.TradeStatus.Initializing,
        nbItems: 1,
        preSeed: "0032",
        acceptedPayement: currency,
    };

    it("Initializing Program", async () => {
        program = neoSwapNpm.utils.getProgram({ clusterOrUrl: "devnet", signer }); //as unknown as Program;
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
                standard: TokenStandard.ProgrammableNonFungible,
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
                standard: TokenStandard.ProgrammableNonFungible,
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

        if (!user4MintToTransfer) {
            let { mintAddress } = await NeoSwap.createPnft2({
                program,
                signer: user4,
                standard: TokenStandard.FungibleAsset,
            });
            console.log("user4 mintAddress", mintAddress.toBase58());
        } else {
            console.log("user4 minting skipped");
        }
        if (!user5MintToTransfer) {
            let { mintAddress } = await NeoSwap.createPnft2({
                program,
                signer: user5,
                standard: TokenStandard.FungibleAsset,
            });
            console.log("user5 mintAddress", mintAddress.toBase58());
        } else {
            console.log("user5 minting skipped");
        }
        if (!user6MintToTransfer) {
            let { mintAddress } = await NeoSwap.createPnft2({
                program,
                signer: user6,
                standard: TokenStandard.NonFungible,
            });
            console.log("user6 mintAddress", mintAddress.toBase58());
        } else {
            console.log("user6 minting skipped");
        }
        if (!currency) {
            let { mintAddress } = await NeoSwap.createPnft2({
                program,
                signer: user1,
                standard: TokenStandard.Fungible,
            });
            console.log("currency", mintAddress.toBase58());
        } else {
            console.log("user1 minting currency skipped");
        }
    });

    it("create SwapData", async () => {
        swapData.items.push({
            isNft: false,
            amount: new BN(200),
            mint: currency,
            status: neoTypes.ItemStatus.SolPending,
            owner: user1.publicKey,
            destinary: SystemProgram.programId,
        } as NftSwapItem);
        swapData.items.push({
            isNft: false,
            amount: new BN(-200),
            mint: currency,
            status: neoTypes.ItemStatus.SolToClaim,
            owner: user2.publicKey,
            destinary: SystemProgram.programId,
        } as NftSwapItem);

        swapData.items.push({
            isNft: true,
            amount: new BN(1),
            mint: user1MintToTransfer,
            status: neoTypes.ItemStatus.NFTPending,
            owner: user1.publicKey,
            destinary: user2.publicKey,
        } as NftSwapItem);

        swapData.items.push({
            isNft: true,
            amount: new BN(1),
            mint: user2MintToTransfer,
            status: neoTypes.ItemStatus.NFTPending,
            owner: user2.publicKey,
            destinary: user3.publicKey,
        } as NftSwapItem);

        swapData.items.push({
            isNft: true,
            amount: new BN(1),
            mint: user3MintToTransfer,
            status: neoTypes.ItemStatus.NFTPending,
            owner: user3.publicKey,
            destinary: user4.publicKey,
        } as NftSwapItem);

        swapData.items.push({
            isNft: true,
            amount: new BN(6),
            mint: user4MintToTransfer,
            status: neoTypes.ItemStatus.NFTPending,
            owner: user4.publicKey,
            destinary: user5.publicKey,
        } as NftSwapItem);

        swapData.items.push({
            isNft: true,
            amount: new BN(6),
            mint: user5MintToTransfer,
            status: neoTypes.ItemStatus.NFTPending,
            owner: user5.publicKey,
            destinary: user6.publicKey,
        } as NftSwapItem);

        swapData.items.push({
            isNft: true,
            amount: new BN(1),
            mint: user6MintToTransfer,
            status: neoTypes.ItemStatus.NFTPending,
            owner: user6.publicKey,
            destinary: user1.publicKey,
        } as NftSwapItem);

        console.log("nb items :", swapData.items.length);
        swapData.nbItems = swapData.items.length;
    });

    // it("create reverse SwapData", async () => {
    //     swapData.items.push({
    //         isNft: false,
    //         amount: new BN(-200),
    //         mint: currency,
    //         status: neoTypes.ItemStatus.SolPending,
    //         owner: user1.publicKey,
    //         destinary: SystemProgram.programId,
    //     } as NftSwapItem);
    //     swapData.items.push({
    //         isNft: false,
    //         amount: new BN(200),
    //         mint: currency,
    //         status: neoTypes.ItemStatus.SolToClaim,
    //         owner: user2.publicKey,
    //         destinary: SystemProgram.programId,
    //     } as NftSwapItem);

    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(1),
    //         mint: user1MintToTransfer,
    //         status: neoTypes.ItemStatus.NFTPending,
    //         destinary: user1.publicKey,
    //         owner: user2.publicKey,
    //     } as NftSwapItem);

    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(1),
    //         mint: user2MintToTransfer,
    //         status: neoTypes.ItemStatus.NFTPending,
    //         destinary: user2.publicKey,
    //         owner: user3.publicKey,
    //     } as NftSwapItem);

    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(1),
    //         mint: user3MintToTransfer,
    //         status: neoTypes.ItemStatus.NFTPending,
    //         destinary: user3.publicKey,
    //         owner: user4.publicKey,
    //     } as NftSwapItem);

    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(6),
    //         mint: user4MintToTransfer,
    //         status: neoTypes.ItemStatus.NFTPending,
    //         destinary: user4.publicKey,
    //         owner: user5.publicKey,
    //     } as NftSwapItem);

    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(6),
    //         mint: user5MintToTransfer,
    //         status: neoTypes.ItemStatus.NFTPending,
    //         destinary: user5.publicKey,
    //         owner: user6.publicKey,
    //     } as NftSwapItem);

    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(1),
    //         mint: user6MintToTransfer,
    //         status: neoTypes.ItemStatus.NFTPending,
    //         destinary: user6.publicKey,
    //         owner: user1.publicKey,
    //     } as NftSwapItem);

    //     console.log("nb items :", swapData.items.length);
    //     swapData.nbItems = swapData.items.length;
    // });

    it("initialize swapDataAccount", async () => {
        try {
            if (!swapDataAccount) {
                const allInitData = await neoSwapNpm.initializeSwap({
                    clusterOrUrl,
                    signer: signer,
                    swapData,
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

    it("initialize swapDataAccount2", async () => {
        // console.log(swapData.items.length);

        if (!swapDataAccount2) {
            swapData.preSeed = swapData.preSeed + "0";
            const allInitData = await neoSwapNpm.initializeSwap({
                clusterOrUrl,
                signer: signer,
                swapData,
            });

            // if (neoSwapNpm.utils.isErrorInitializeSwap(allInitData)) throw allInitData.error;
            console.log("initialized", allInitData);
        } else {
            console.log("initiaize skipped", swapDataAccount2.toBase58());
        }
    });
    it("fail initialize swapDataAccount", async () => {
        // let wrongSwapData = swapData;
        // wrongSwapData.items[0].amount = new BN(7);
        try {
            const allInitData = await neoSwapNpm.initializeSwap({
                clusterOrUrl,
                signer: signer,
                swapData,
            });
        } catch (error) {
            console.log(error);

            assert(String(error.description).includes(`"Custom":6013`));
        }

        // console.log("initialized", allInitData);
        // if (neoSwapNpm.utils.isErrorInitializeSwap(allInitData)) {
        //     console.log("initialized", String(allInitData.error[0].description));
        //     // console.log("initialized", (allInitData.error[0].description));
        //     console.log("error 6013 -> Incorrect status of swap");

        //     // throw allInitData;
        // } else throw "should have failed";
    });

    it("fail initialize wrong length", async () => {
        let wrongSwapData = swapData;
        wrongSwapData.items[0].amount = new BN(7);
        wrongSwapData.preSeed += "0";
        try {
            const allInitData = await neoSwapNpm.initializeSwap({
                clusterOrUrl,
                signer: signer,
                swapData,
            });
        } catch (error) {
            console.log(error);

            assert(
                String(error.description).includes(`"Custom":6015`) ||
                    String(error.description).includes(`"Custom":6013`)
            );
        }
        // console.log("initialized", allInitData);
        // if (neoSwapNpm.utils.isErrorInitializeSwap(allInitData)) {
        //     console.log("initialized", String(allInitData.error[0].description));
        //     // console.log("initialized", (allInitData.error[0].description));
        //     console.log("error 6015 -> Incorrect Length");
        //     assert(
        //         String(allInitData.error[0].description).includes(`"Custom":6015`) ||
        //             String(allInitData.error[0].description).includes(`"Custom":6013`)
        //     );

        //     // throw allInitData;
        // } else throw "should have failed";
    });

    it("deposit wrong NFT", async () => {
        if (swapDataAccount) {
            const swapDataRead = await neoSwapNpm.utils.getSwapDataAccountFromPublicKey({
                program,
                swapDataAccount_publicKey: swapDataAccount,
            });
            if (!swapDataRead) return;

            const swapIdentity = neoSwapNpm.utils.getSwapIdentityFromData({
                swapData: swapDataRead,
            });
            const depositSwapData = await NeoSwap.depositNft({
                ataList: [],
                mint: user1MintToTransfer,
                program,
                signer: user6.publicKey,
                swapIdentity,
            });
            console.log("depositSwapData.mintAta", depositSwapData.mintAta);
            try {
                const transactionHashs = await neoSwapNpm.utils.sendBundledTransactions({
                    clusterOrUrl,
                    signer: user6,
                    txsWithoutSigners: [
                        { tx: new Transaction().add(...depositSwapData.instructions) },
                    ],
                    // skipPref
                });
                console.log("transactionHashs", transactionHashs);
            } catch (error) {
                console.log(String(error), String(error).includes(`"Custom":6004`));
                console.log("error 6004 -> Nothing to send to the swap");
                assert(String(error).includes(`"Custom":6004`));
            }
        } else {
            console.log("swap not given");
        }
    });

    it("deposit NFT to first swap", async () => {
        if (swapDataAccount) {
            let data: { user: PublicKey; hashs: string[] | ErrorFeedback }[] = [];
            for await (const user of [user1, user2, user3, user4, user5, user6]) {
                try {
                    const depositSwapDatauser = await neoSwapNpm.depositSwap({
                        clusterOrUrl,
                        signer: user,
                        swapDataAccount,
                    });
                    // if (neoSwapNpm.utils.isErrorDeposit(depositSwapDatauser))throw depositSwapDatauser
                    data.push({ user: user.publicKey, hashs: depositSwapDatauser });
                    console.log("transactionhashes", depositSwapDatauser);
                } catch (error) {
                    data.push({ user: user.publicKey, hashs: error });
                }
            }
            console.log("deposit datas :", data);
        } else {
            console.log("swap not given");
        }
    });

    // it("Error deposit incorrect user NFT to second swap", async () => {
    //     if (swapDataAccount2) {
    //         const swapDataRead = await neoSwapNpm.utils.getSwapDataAccountFromPublicKey({
    //             program,
    //             swapDataAccount_publicKey: swapDataAccount2,
    //         });
    //         if (!swapDataRead) return;
    //         // console.log("swapDataRead", swapDataRead);

    //         const swapIdentity = neoSwapNpm.utils.getSwapIdentityFromData({
    //             swapData: swapDataRead,
    //         });
    //         // console.log("swapIdentity", swapIdentity);

    //         const depositSwapData = await NeoSwap.depositNft({
    //             ataList: [],
    //             mint: user5MintToTransfer,
    //             program,
    //             signer: user1.publicKey,
    //             swapIdentity,
    //         });
    //         console.log("depositSwapData.mintAta", depositSwapData.mintAta);
    //         try {
    //             const { transactionHashes } = await neoSwapNpm.utils.sendBundledTransactions({
    //                 clusterOrUrl,
    //                 signer: user1,
    //                 txsWithoutSigners: [
    //                     { tx: new Transaction().add(...depositSwapData.instructions) },
    //                 ],
    //                 // skipPref
    //             });
    //             console.log("transactionhashes", transactionHashes);
    //         } catch (error) {
    //             console.log(String(error), String(error).includes(`"Custom":6004`));
    //             console.log("error 6004 -> Nothing to send");
    //             assert(String(error).includes(`"Custom":6004`));
    //         }
    //     } else {
    //         console.log("swap not given");
    //     }
    // });

    it("Error no have NFT deposit to second swap", async () => {
        if (swapDataAccount2) {
            const swapDataRead = await neoSwapNpm.utils.getSwapDataAccountFromPublicKey({
                program,
                swapDataAccount_publicKey: swapDataAccount2,
            });
            if (!swapDataRead) return;
            // console.log("swapDataRead", swapDataRead);

            const swapIdentity = neoSwapNpm.utils.getSwapIdentityFromData({
                swapData: swapDataRead,
            });
            // console.log("swapIdentity", swapIdentity);

            const depositSwapData = await NeoSwap.depositNft({
                ataList: [],
                mint: user1MintToTransfer,
                program,
                signer: user1.publicKey,
                swapIdentity,
            });
            console.log("depositSwapData.mintAta", depositSwapData.mintAta);
            try {
                const transactionHashs = await neoSwapNpm.utils.sendBundledTransactions({
                    clusterOrUrl,
                    signer: user1,
                    txsWithoutSigners: [
                        { tx: new Transaction().add(...depositSwapData.instructions) },
                    ],
                    // skipPref
                });
                console.log("transactionHashs", transactionHashs);
            } catch (error) {
                console.log(String(error), String(error).includes(`"Custom":6016`));
                console.log("error 6016 -> nothing to send ");
                assert(String(error).includes(`"Custom":6016`));
            }
        } else {
            console.log("swap not given");
        }
    });
    // it("claim and close", async () => {
    //     if (swapDataAccount) {
    //         try {
    //             const claimAndCloseData = await neoSwapNpm.claimAndCloseSwap({
    //                 clusterOrUrl,
    //                 signer,
    //                 swapDataAccount,
    //             });

    //             console.log("claimAndCloseHash :", claimAndCloseData);
    //         } catch (error) {
    //             console.log("claimAndCloseHash :", error);
    //         }
    //     } else {
    //         console.log("swap not given");
    //     }
    // });

    // it("partial cancel and close from in trade user", async () => {
    //     let transactionHashs: {
    //         user: PublicKey;
    //         error?: unknown;
    //         txh?: ErrorFeedback | string[];
    //     }[] = [];

    //     for await (const user of [user4, user5, user6, user1, user2, user3]) {
    //         try {
    //             const cancelAndCloseHash = await neoSwapNpm.cancelAndCloseSwap({
    //                 clusterOrUrl,
    //                 signer: user,
    //                 swapDataAccount: swapDataAccount,
    //             });
    //             console.log("transactionHashes", cancelAndCloseHash);
    //             transactionHashs.push({ user: user.publicKey, txh: cancelAndCloseHash });
    //         } catch (error) {
    //             transactionHashs.push({ user: user.publicKey, error });
    //         }
    //     }
    //     transactionHashs.forEach((v) => console.log("res", v));
    // });

    it("partial cancel from user", async () => {
        if (swapDataAccount) {
            const cancelAndCloseHash = await neoSwapNpm.cancelAndCloseSwap({
                clusterOrUrl,
                signer: user1,
                swapDataAccount: swapDataAccount,
            });
            console.log("transactionHashes", cancelAndCloseHash);
        } else {
            console.log("swap not given");
        }
    });

    it("cancel from signer", async () => {
        if (swapDataAccount) {
            const cancelAndCloseHash = await neoSwapNpm.cancelAndCloseSwap({
                clusterOrUrl,
                signer: signer,
                swapDataAccount: swapDataAccount,
            });
            console.log("transactionHashes", cancelAndCloseHash);
        } else {
            console.log("swap not given");
        }
    });

    it("deposit NFT to second swap", async () => {
        if (swapDataAccount) {
            let data: { user: PublicKey; hashs: string[] | ErrorFeedback }[] = [];
            for await (const user of [user1, user2, user3, user4, user5, user6]) {
                try {
                    const depositSwapDatauser = await neoSwapNpm.depositSwap({
                        clusterOrUrl,
                        signer: user,
                        swapDataAccount: swapDataAccount2,
                    });
                    // if (neoSwapNpm.utils.isErrorDeposit(depositSwapDatauser))throw depositSwapDatauser
                    data.push({ user: user.publicKey, hashs: depositSwapDatauser });
                    console.log("transactionhashes", depositSwapDatauser);
                } catch (error) {
                    data.push({ user: user.publicKey, hashs: error });
                }
            }
            console.log("deposit datas :", data);
        } else {
            console.log("swap not given");
        }
    });

    // it("finish cancel and close from signer", async () => {
    //     if (swapDataAccount) {
    //         const cancelAndCloseHash = await neoSwapNpm.cancelAndCloseSwap({
    //             signer,
    //             clusterOrUrl,
    //             swapDataAccount: swapDataAccount,
    //         });

    //         console.log("cancelAndCloseHash :", cancelAndCloseHash);
    //     } else {
    //         console.log("swap not given");
    //     }
    // });

    it("claim 2 and close from signer", async () => {
        if (swapDataAccount2) {
            const cancelAndCloseHash = await neoSwapNpm.claimAndCloseSwap({
                signer,
                clusterOrUrl,
                swapDataAccount: swapDataAccount2,
            });

            console.log("cancelAndCloseHash :", cancelAndCloseHash);
        } else {
            console.log("swap not given");
        }
    });
});
