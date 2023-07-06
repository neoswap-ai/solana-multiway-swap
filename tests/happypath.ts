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
import { ErrorFeedback, NftSwapItem, SwapData, TradeStatus } from "../deleteme/types";

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

describe("FongibleTokens Test Unit", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    let program = anchor.workspace.NeoSwap as Program;
    let clusterOrUrl = "devnet" as Cluster;
    // let clusterOrUrl = "devnet";

    //normal
    let swapDataAccount: PublicKey = new PublicKey("FQCpVK2QfZ2hEHnNHCbKhHAedZQBk8A3BYTia6HCCTGv");
    // let swapDataAccount: PublicKey | undefined = undefined;
    //reverse
    // let swapDataAccount: PublicKey = new PublicKey("9o3ZJiwwqtUDjo4EuhnVmxAyGiSr3erjfZXZxQf5cEwa");

    let currency = new PublicKey("CV3V3qmvXuWfzdSMk5rWcamNEgCGgqcv7t1FJkkM5dkV");

    let user1MintToTransfer = new PublicKey("oHQLsX83ZJ1B4n8FLN7nUXLeCVKbY2SeJfAyRntdFp3");
    // let user1MintToTransfer = undefined;

    let user2MintToTransfer = new PublicKey("EUfX3BURFeyMMLXe7DMGD55RyFQtks7rmib7UFBEa9XR");
    // let user2MintToTransfer = undefined;

    let user3MintToTransfer = new PublicKey("C68KMesiaDGmqP1LRehahvvfYsKuq4DYERTXfNNTg3Lq");
    // let user3MintToTransfer = undefined;

    let user4MintToTransfer = new PublicKey("5fnTxDpaqJ1sL9YWoMZaDdfX3KWkbU4rQMpxTVPEgDhm");
    // let user4MintToTransfer = undefined;

    let user5MintToTransfer = new PublicKey("22Da2WFKVVdmA7nPtnh7UC7LzQKkjVyAVd6n3gUp5nSn");
    // let user5MintToTransfer = undefined;

    let user6MintToTransfer = new PublicKey("GBHrbaZV9fN5Z1Sv5vA1c2XjidWmvjd5wAJLEHhw6QQP");
    // let user6MintToTransfer = undefined;

    let swapData: SwapData = {
        initializer: signer.publicKey,
        items: [],
        status: neoTypes.TradeStatus.Initializing,
        nbItems: 1,
        preSeed: "0032",
        // acceptedPayement: currency,
        acceptedPayement: SystemProgram.programId,
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
            mint: SystemProgram.programId,
            // mint: currency,
            status: neoTypes.ItemStatus.SolPending,
            owner: user1.publicKey,
            destinary: SystemProgram.programId,
        } as NftSwapItem);
        swapData.items.push({
            isNft: false,
            amount: new BN(-200),
            mint: SystemProgram.programId,
            // mint: currency,
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
            amount: new BN(1),
            mint: user4MintToTransfer,
            status: neoTypes.ItemStatus.NFTPending,
            owner: user4.publicKey,
            destinary: user5.publicKey,
        } as NftSwapItem);

        swapData.items.push({
            isNft: true,
            amount: new BN(1),
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

    it("deposit NFT to first swap", async () => {
        if (swapDataAccount) {
            const depositSwapDatauser = await neoSwapNpm.depositSwap({
                clusterOrUrl,
                signer: user1,
                swapDataAccount,
                // simulation: true,
            });
            // if (neoSwapNpm.utils.isErrorDeposit(depositSwapDatauser))throw depositSwapDatauser
            // data.push({ user: user.publicKey, hashs: depositSwapDatauser });
            console.log("transactionhashes", depositSwapDatauser);
        } else {
            console.log("swap not given");
        }
    });

    it("deposit all NFT to  swap", async () => {
        if (swapDataAccount) {
            let data: { user: PublicKey; hashs: string[] | ErrorFeedback }[] = [];
            await Promise.all(
                [user1, user2, user3, user4, user5, user6].map(async (user) => {
                    try {
                        const depositSwapDatauser = await neoSwapNpm.depositSwap({
                            clusterOrUrl,
                            signer: user,
                            swapDataAccount,
                            // skipSimulation: true,
                        });
                        // if (neoSwapNpm.utils.isErrorDeposit(depositSwapDatauser))throw depositSwapDatauser
                        data.push({ user: user.publicKey, hashs: depositSwapDatauser });
                        console.log("transactionhashes", depositSwapDatauser);
                    } catch (error) {
                        data.push({ user: user.publicKey, hashs: error });
                    }
                })
            );
            // for await (const user of [user1, user2, user3, user4, user5, user6]) {
            // }
            // console.log("deposit datas :", data);
            data.forEach((v) => console.log("deposit datas :", v.hashs));
        } else {
            console.log("swap not given");
        }
    });

    // it("finish cancel and close from signer", async () => {
    //     if (swapDataAccount) {
    //         const cancelAndCloseHash = await neoSwapNpm.cancelAndCloseSwap({
    //             signer,
    //             clusterOrUrl,
    //             swapDataAccount,
    //         });

    //         console.log("cancelAndCloseHash :", cancelAndCloseHash);
    //     } else {
    //         console.log("swap not given");
    //     }
    // });

    // it("claim 2 and close from signer", async () => {
    //     if (swapDataAccount) {
    //         const claimAndCloseHash = await neoSwapNpm.claimAndCloseSwap({
    //             signer,
    //             clusterOrUrl,
    //             swapDataAccount,
    //             // skipSimulation: true,
    //         });

    //         console.log("claimAndCloseHash :", claimAndCloseHash);
    //     } else {
    //         console.log("swap not given");
    //     }
    // });
});
