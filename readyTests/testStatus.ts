/// What to test:
// iterates over status items to be sure all cases are tackled
// test wrong data (mint / destinary being something else that NATIVE_MINT)
// test double entry
import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
// const { assert } = require("chai");
import SwapData from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/swapData.types.neoswap";
// import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
const { assert } = require("chai");
import {
    // createAssociatedTokenAccount,
    // getAssociatedTokenAddress,
    // createInitializeMintInstruction,
    // TOKEN_PROGRAM_ID,
    // MINT_SIZE,
    // getMinimumBalanceForRentExemptMint,
    // createMint,
    // mintToChecked,
    // createAssociatedTokenAccountInstruction,
    // createMintToCheckedInstruction,
    // createSyncNativeInstruction,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    // Signer,
    // SystemProgram,
    // Transaction,
    // TransactionInstruction,
    // TransactionMessage,
    // VersionedTransaction,
} from "@solana/web3.js";
import NeoSwap from "../app/src/neoSwap.module.v4.2";
import {
    ItemStatus,
    // ItemToBuy,
    // ItemToSell,
    TradeStatus,
} from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/status.type.neoswap";
import depositNft from "../app/src/neoSwap.module.v4.2/functions.neoswap/createInstruction/deposit.nft.neoswap.ci";
import { getSwapDataFromPDA } from "../app/src/neoSwap.module.v4.2/utils.neoSwap/getSwapDataFromPDA.neoSwap";
import findAtaFromMint from "../app/src/neoSwap.module.v4.2/utils.neoSwap/findAtaFromMint.neoswap";
import { findOrCreateAta } from "../app/src/solana.utils";
import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
import saddInitialize from "../app/src/neoSwap.module.v4.2/functions.neoswap/subFunctions/sadd.Initialize.neoSwap.sub";
import { getSeedFromData } from "../app/src/neoSwap.module.v4.2/utils.neoSwap/getSeedfromData.neoswap";
// import { swapDataAccountGiven } from "../app/src/solana.test";
// import { delay } from "../app/src/solana.utils";

describe("DataRemovedFronUserPda", async () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.NeoSwap as Program;
    const nbuserPresigned = 3;
    const nbuserNormal = 3;
    const nftNb = 2;
    let userKeypairsPresigned: {
        keypair: Keypair;
        tokens: { mint: PublicKey; ata: PublicKey; value: number }[];
    }[] = [];
    let userKeypairsNormal: {
        keypair: Keypair;
        tokens: { mint: PublicKey; ata: PublicKey; value: number }[];
    }[] = [];
    let CONST_PROGRAM = "0000";
    let signer: {
        keypair: Keypair;
        tokens: { mint: PublicKey; ata: PublicKey; value: number }[];
    } = {
        keypair: Keypair.generate(),
        tokens: [],
    };
    let feeCollector: {
        keypair: Keypair;
        tokens: { mint: PublicKey; ata: PublicKey; value: number }[];
    } = { keypair: Keypair.generate(), tokens: [] };
    let unauthorizedKeypair: {
        keypair: Keypair;
        tokens: { mint: PublicKey; ata: PublicKey; value: number }[];
    } = { keypair: Keypair.generate(), tokens: [] };
    let pda: PublicKey;
    let swapData: SwapData = {
        initializer: signer.keypair.publicKey,
        items: [
            {
                isNft: false,
                isPresigning: false,
                amount: new anchor.BN(-0.025 * (nbuserPresigned + nbuserNormal) * LAMPORTS_PER_SOL),
                destinary: NATIVE_MINT,
                mint: NATIVE_MINT,
                owner: feeCollector.keypair.publicKey,
                status: ItemStatus.SolToClaim,
            },
        ],
        status: TradeStatus.Initializing,
        nb_items: 1,
    };

    //create specific testing functions

    it("Initializing accounts", async () => {
        console.log("programId", program.programId.toBase58());
        if (!program.provider.publicKey) throw "no publicKey";
        console.log(
            program.provider.publicKey.toBase58(),
            "balance deployer",
            (await program.provider.connection.getBalance(program.provider.publicKey)) /
                LAMPORTS_PER_SOL
        );
        if (nbuserPresigned > 0) {
            Array.from(Array(nbuserPresigned).keys()).map(async () => {
                userKeypairsPresigned.push({ keypair: Keypair.generate(), tokens: [] });
            });
        }
        if (nbuserNormal > 0) {
            Array.from(Array(nbuserNormal).keys()).map(async () => {
                userKeypairsNormal.push({ keypair: Keypair.generate(), tokens: [] });
            });
        }
        await program.provider.connection.requestAirdrop(
            new PublicKey("FzLrcnCiC4yKuBuk2g7WrC8nn7DgCT6SC46NYhx2L5Fp"),
            2 * LAMPORTS_PER_SOL
        );
        await NeoSwap.airdropDev({
            connection: program.provider.connection,
            keypairs: [
                signer,
                feeCollector,
                unauthorizedKeypair,
                ...userKeypairsPresigned,
                ...userKeypairsNormal,
            ],
        });
        console.log("accounts initialized");
    });

    it("users instruction", async () => {
        // signer.tokens = await NeoSwap.createNft({
        //     program,
        //     userKeypair: signer,
        //     nb: nftNb,
        // });

        unauthorizedKeypair.tokens = await NeoSwap.createNft({
            program,
            userKeypair: unauthorizedKeypair,
            nb: nftNb,
        });

        [...userKeypairsPresigned, ...userKeypairsNormal].forEach((userKeypair) => {
            console.log("userKeypair", userKeypair.keypair.publicKey.toBase58());
        });
        // console.log("[...userKeypairsPresigned, ...userKeypairsNormal]", [
        //     ...userKeypairsPresigned,
        //     ...userKeypairsNormal,
        // ]);

        await Promise.all(
            [...userKeypairsPresigned, ...userKeypairsNormal].map(async (userKeypair) => {
                userKeypair.tokens = await NeoSwap.createNft({
                    program,
                    userKeypair,
                    nb: nftNb,
                });
                let mints = [];
                // userKeypair.tokens.forEach((token) => mints.push(token.mint.toBase58()));
                console.log(
                    "XXX XXX - Create NFT user ",
                    userKeypair.keypair.publicKey.toBase58(),
                    " XXX XXX"
                    // mints
                    // userKeypair.tokens
                );
            })
        );
    });

    it("create Users Pda", async () => {
        // console.log(swapData);
        const txhashs = await NeoSwap.createUserPdaTest({
            program,
            userKeypairs: [
                { keypair: signer.keypair, tokens: [] },
                { keypair: feeCollector.keypair, tokens: [] },
                ...userKeypairsPresigned,
            ],
            signer: signer.keypair,
        });
        console.log("initialized", txhashs);
    });

    it("Update amount to topup", async () => {
        // console.log(swapData);
        const sendAllArray = await NeoSwap.updateAmountToTopupTest({
            program,
            userKeypairs: userKeypairsPresigned,
            value: 0.5,
        });
        const txhashs = await NeoSwap.boradcastToBlockchain({
            provider: program.provider as anchor.AnchorProvider,
            sendAllArray,
        });
        console.log("amount topped up", txhashs);
    });

    it("add Item To Sell", async () => {
        const sendAllArray = await NeoSwap.userAddItemToSellTest({
            program,
            userKeypairs: userKeypairsPresigned,
        });
        const txhashs = await NeoSwap.boradcastToBlockchain({
            provider: program.provider as anchor.AnchorProvider,
            sendAllArray,
        });
        console.log("item added to sell", txhashs);
    });

    it("add Item To buy", async () => {
        const { sendAllArray, swapData: swapDataResult } = await NeoSwap.userAddItemToBuyTest({
            program,
            swapData,
            userKeypairsPresigned,
            userKeypairsNormal,
            buyLamportMoreThanSell: 0,
        });
        swapData = swapDataResult;
        // console.log("LENswapdata1", swapData.items.length);
        const txhashs = await NeoSwap.boradcastToBlockchain({
            sendAllArray,
            provider: program.provider as anchor.AnchorProvider,
            // signer: signer.keypair,
        });
        console.log("item added to buy", txhashs);
    });

    it("initialize Swap ", async () => {
        swapData.nb_items = swapData.items.length;

        const {
            allInitSendAllArray,
            pda: swapPda,
            // txhashs,
            swapData: swapdataResult,
        } = await NeoSwap.allInitialize({
            provider: program.provider as anchor.AnchorProvider,
            CONST_PROGRAM,
            swapDataGiven: swapData,
            signer: signer.keypair.publicKey,
        });

        pda = swapPda;
        swapData = swapdataResult;
        // console.log("LENswapdata2", swapData.items.length);
        const txhashs = await NeoSwap.boradcastToBlockchain({
            sendAllArray: [allInitSendAllArray[0]],
            provider: program.provider as anchor.AnchorProvider,
            signer: signer.keypair,
        });

        console.log("swapPda", pda.toBase58(), "\ninitialized TransacrionHashs", txhashs);
    });
    let swapDataItems: NftSwapItem[] = [];

    it("create swapDataItems", async () => {
        for (const statu in ItemStatus) {
            if (Object.prototype.hasOwnProperty.call(ItemStatus, statu)) {
                const element = ItemStatus[statu];
                if (typeof element === "number") {
                    swapDataItems.push({
                        isNft: true,
                        isPresigning: false,
                        owner: userKeypairsNormal[0].keypair.publicKey,
                        destinary: userKeypairsNormal[1].keypair.publicKey,
                        mint: userKeypairsNormal[0].tokens[0].mint,
                        amount: new BN(1),
                        status: element,
                    });
                    swapDataItems.push({
                        isNft: false,
                        isPresigning: false,
                        owner: userKeypairsNormal[0].keypair.publicKey,
                        destinary: NATIVE_MINT,
                        mint: NATIVE_MINT,
                        amount: new BN(LAMPORTS_PER_SOL / 2),
                        status: element,
                    });
                    swapDataItems.push({
                        isNft: true,
                        isPresigning: true,
                        owner: userKeypairsPresigned[0].keypair.publicKey,
                        destinary: userKeypairsPresigned[1].keypair.publicKey,
                        mint: userKeypairsPresigned[0].tokens[0].mint,
                        amount: new BN(1),
                        status: element,
                    });
                    swapDataItems.push({
                        isNft: false,
                        isPresigning: true,
                        owner: userKeypairsPresigned[0].keypair.publicKey,
                        destinary: NATIVE_MINT,
                        mint: NATIVE_MINT,
                        amount: new BN(LAMPORTS_PER_SOL / 2),
                        status: element,
                    });
                }
            }
        }
        // presigning destinary not nativeMint
        swapDataItems.push({
            isNft: false,
            isPresigning: true,
            owner: userKeypairsPresigned[0].keypair.publicKey,
            destinary: userKeypairsPresigned[0].keypair.publicKey,
            mint: NATIVE_MINT,
            amount: new BN(LAMPORTS_PER_SOL / 2),
            status: ItemStatus.SolPendingPresig,
        });

        // presigning mint not nativeMint
        swapDataItems.push({
            isNft: false,
            isPresigning: true,
            owner: userKeypairsPresigned[0].keypair.publicKey,
            destinary: NATIVE_MINT,
            mint: userKeypairsPresigned[0].keypair.publicKey,
            amount: new BN(LAMPORTS_PER_SOL / 2),
            status: ItemStatus.SolPendingPresig,
        });

        //normal destinary not nativeMint
        swapDataItems.push({
            isNft: false,
            isPresigning: false,
            owner: userKeypairsPresigned[0].keypair.publicKey,
            destinary: userKeypairsPresigned[0].keypair.publicKey,
            mint: NATIVE_MINT,
            amount: new BN(LAMPORTS_PER_SOL / 2),
            status: ItemStatus.SolPending,
        });
        //normal mint not nativeMint
        swapDataItems.push({
            isNft: false,
            isPresigning: false,
            owner: userKeypairsPresigned[0].keypair.publicKey,
            destinary: NATIVE_MINT,
            mint: userKeypairsPresigned[0].keypair.publicKey,
            amount: new BN(LAMPORTS_PER_SOL / 2),
            status: ItemStatus.SolPending,
        });
        // negative amount
        swapDataItems.push({
            isNft: true,
            isPresigning: false,
            owner: userKeypairsNormal[0].keypair.publicKey,
            destinary: userKeypairsNormal[1].keypair.publicKey,
            mint: userKeypairsNormal[0].tokens[0].mint,
            amount: new BN(-1),
            status: ItemStatus.NFTPending,
        });
        console.log("swapDataItems.length", swapDataItems.length);
    });

    it("Double entry", async () => {
        // for await (let swapDataItem of swapDataItems) {
        // const { addInitSendAllArray } = await saddInitialize({
        //     CONST_PROGRAM,
        //     program,
        //     signer: signer.keypair.publicKey,
        //     swapData: {
        //         initializer: signer.keypair.publicKey,
        //         items: [swapDataItem],
        //         nb_items: swapDataItems.length,
        //         status: TradeStatus.Initializing,
        //     },
        // });
        CONST_PROGRAM = CONST_PROGRAM + "1";
        const {
            allInitSendAllArray,
            pda: swapPda,
            // txhashs,
            swapData: swapdataResult,
        } = await NeoSwap.allInitialize({
            provider: program.provider as anchor.AnchorProvider,
            CONST_PROGRAM,
            swapDataGiven: {
                initializer: signer.keypair.publicKey,
                items: [swapDataItems[0]],
                nb_items: swapDataItems.length,
                status: TradeStatus.Initializing,
            },
            signer: signer.keypair.publicKey,
        });

        // pda = swapPda;
        // swapData = swapdataResult;
        // console.log("LENswapdata2", swapData.items.length);
        const txhashs = await NeoSwap.boradcastToBlockchain({
            sendAllArray: [allInitSendAllArray[0]],
            provider: program.provider as anchor.AnchorProvider,
            signer: signer.keypair,
        });

        const seedSwapData = await getSeedFromData({
            swapDataGiven: {
                initializer: signer.keypair.publicKey,
                items: [swapDataItems[0]],
                nb_items: swapDataItems.length,
                status: TradeStatus.Initializing,
            },
            CONST_PROGRAM: CONST_PROGRAM,
        });
        let instructionToAdd = await program.methods
            .initializeAdd(
                seedSwapData.swapDataAccount_seed,
                seedSwapData.swapDataAccount_bump,
                swapDataItems[0]
            )
            .accounts({
                swapDataAccount: seedSwapData.swapDataAccount,
                signer: signer.keypair.publicKey.toString(),
            })
            .instruction();

        const transactionHash = await NeoSwap.boradcastToBlockchain({
            sendAllArray: [{ tx: new Transaction().add(instructionToAdd) }],
            provider: program.provider as anchor.AnchorProvider,
            signer: signer.keypair,
        });
        console.log("deposited users transactionHashs", transactionHash);

        // instructionToAdd = await program.methods
        //     .initializeAdd(
        //         seedSwapData.swapDataAccount_seed,
        //         seedSwapData.swapDataAccount_bump,
        //         swapDataItems[0]
        //     )
        //     .accounts({
        //         swapDataAccount: seedSwapData.swapDataAccount,
        //         signer: signer.keypair.publicKey.toString(),
        //     })
        //     .instruction();
        try {
            const transactionHash = await NeoSwap.boradcastToBlockchain({
                sendAllArray: [{ tx: new Transaction().add(instructionToAdd) }],
                provider: program.provider as anchor.AnchorProvider,
                signer: signer.keypair,
            });
            console.log("deposited users transactionHashs", transactionHash);
        } catch (error) {
            console.log("error ", error);
            // console.log("error given data isnt fitting", String(error).includes(`"Custom":6007`));
            console.log("error double entry", String(error).includes(`"Custom":6019`));
            assert.ok(String(error).includes(`"Custom":6019`), true);
        }
        // }
    });

    it("add Item to swap", async () => {
        for await (let swapDataItem of swapDataItems) {
            // const { addInitSendAllArray } = await saddInitialize({
            //     CONST_PROGRAM,
            //     program,
            //     signer: signer.keypair.publicKey,
            //     swapData: {
            //         initializer: signer.keypair.publicKey,
            //         items: [swapDataItem],
            //         nb_items: swapDataItems.length,
            //         status: TradeStatus.Initializing,
            //     },
            // });
            CONST_PROGRAM = CONST_PROGRAM + "1";
            const {
                allInitSendAllArray,
                pda: swapPda,
                // txhashs,
                swapData: swapdataResult,
            } = await NeoSwap.allInitialize({
                provider: program.provider as anchor.AnchorProvider,
                CONST_PROGRAM,
                swapDataGiven: {
                    initializer: signer.keypair.publicKey,
                    items: [swapDataItem],
                    nb_items: swapDataItems.length,
                    status: TradeStatus.Initializing,
                },
                signer: signer.keypair.publicKey,
            });

            // pda = swapPda;
            // swapData = swapdataResult;
            // console.log("LENswapdata2", swapData.items.length);
            // const txhashs = await NeoSwap.boradcastToBlockchain({
            //     sendAllArray: [allInitSendAllArray[0]],
            //     provider: program.provider as anchor.AnchorProvider,
            //     signer: signer.keypair,
            // });

            const seedSwapData = await getSeedFromData({
                swapDataGiven: {
                    initializer: signer.keypair.publicKey,
                    items: [swapDataItem],
                    nb_items: swapDataItems.length,
                    status: TradeStatus.Initializing,
                },
                CONST_PROGRAM: CONST_PROGRAM,
            });
            const instructionToAdd = await program.methods
                .initializeAdd(
                    seedSwapData.swapDataAccount_seed,
                    seedSwapData.swapDataAccount_bump,
                    swapDataItem
                )
                .accounts({
                    swapDataAccount: seedSwapData.swapDataAccount,
                    signer: signer.keypair.publicKey.toString(),
                })
                .instruction();

            try {
                const transactionHash = await NeoSwap.boradcastToBlockchain({
                    sendAllArray: [
                        allInitSendAllArray[0],
                        { tx: new Transaction().add(instructionToAdd) },
                    ],
                    provider: program.provider as anchor.AnchorProvider,
                    signer: signer.keypair,
                });
                console.log("deposited users transactionHashs", transactionHash);
            } catch (error) {
                // console.log("error ", error);
                console.log(
                    "error given data isnt fitting",
                    String(error).includes(`"Custom":6007`)
                );
                // console.log("error Item Already exist", String(error).includes(`"Custom":6019`));
                assert.ok(
                    // String(error).includes(`"Custom":6019`) ||
                    String(error).includes(`"Custom":6007`),
                    true
                );
            }
        }
    });
});
