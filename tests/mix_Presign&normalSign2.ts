import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
// const { assert } = require("chai");
import SwapData from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/swapData.types.neoswap";
// import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
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
} from "@solana/spl-token";
import {
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
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
// import { swapDataAccountGiven } from "../app/src/solana.test";
// import { delay } from "../app/src/solana.utils";

describe("MIX pre-signing", () => {
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
    let signer = { keypair: Keypair.generate(), tokens: [] };
    let feeCollector = { keypair: Keypair.generate(), tokens: [] };
    let unauthorizedKeypair = { keypair: Keypair.generate(), tokens: [] };
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

        // unauthorizedKeypair.tokens = await NeoSwap.createNft({
        //     program,
        //     userKeypair: unauthorizedKeypair,
        //     nb: nftNb,
        // });
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
        const txhashs = await NeoSwap.updateAmountToTopupTest({
            program,
            userKeypairs: userKeypairsPresigned,
        });
        console.log("amoutn topped up", txhashs);
    });

    it("add Item To Sell", async () => {
        const txhashs = await NeoSwap.userAddItemToSellTest({
            program,
            userKeypairs: userKeypairsPresigned,
        });
        console.log("item added to sell", txhashs);
    });

    it("add Item To buy", async () => {
        const { txhashs, swapData: swapDataResult } = await NeoSwap.userAddItemToBuyTest({
            program,
            swapData,
            userKeypairsPresigned,
            userKeypairsNormal,
        });
        swapData = swapDataResult;
        console.log("item added to buy", txhashs);
    });

    it("initialize Swap for cancel", async () => {
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
        const txhashs = await NeoSwap.boradcastToBlockchain({
            sendAllArray: allInitSendAllArray,
            provider: program.provider as anchor.AnchorProvider,
            signer: signer.keypair,
        });

        console.log("swapPda", pda.toBase58(), "\ninitialized TransacrionHashs", txhashs);
    });

    it("Deposit not presigned for cancel", async () => {
        let transactionHashs: string[] = [];
        for await (const userKeypair of userKeypairsNormal) {
            const { depositSendAllArray } = await NeoSwap.depositUserOnly({
                provider: program.provider as anchor.AnchorProvider,
                signer: userKeypair.keypair.publicKey,
                swapDataAccount: pda,
                CONST_PROGRAM,
            });
            if (depositSendAllArray) {
                const transactionHash = await NeoSwap.boradcastToBlockchain({
                    sendAllArray: depositSendAllArray,
                    provider: program.provider as anchor.AnchorProvider,
                    signer: userKeypair.keypair,
                });

                transactionHashs.push(...transactionHash);
            }
        }

        console.log("deposited users transactionHashs", transactionHashs);
    });

    it("cancel and close", async () => {
        const { allCancelSendAllArray } = await NeoSwap.cancelAndClose({
            provider: program.provider as anchor.AnchorProvider,
            signer: signer.keypair.publicKey,
            swapDataAccount: pda,
            CONST_PROGRAM,
        });
        const txhashs = await NeoSwap.boradcastToBlockchain({
            sendAllArray: allCancelSendAllArray,
            provider: program.provider as anchor.AnchorProvider,
            signer: signer.keypair,
        });
        console.log("Cancel & close transactionHashs :", txhashs);
    });

    it("initialize Swap for claim", async () => {
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
        const txhashs = await NeoSwap.boradcastToBlockchain({
            sendAllArray: allInitSendAllArray,
            provider: program.provider as anchor.AnchorProvider,
            signer: signer.keypair,
        });

        console.log("swapPda :", pda.toBase58(), "\ninitialized transactionHashs:", txhashs);
    });

    it("Deposit not presigned for claim", async () => {
        let transactionHashs: string[] = [];
        for await (const userKeypair of userKeypairsNormal) {
            const { depositSendAllArray } = await NeoSwap.depositUserOnly({
                provider: program.provider as anchor.AnchorProvider,
                signer: userKeypair.keypair.publicKey,
                swapDataAccount: pda,
                CONST_PROGRAM,
            });
            if (depositSendAllArray) {
                const transactionHash = await NeoSwap.boradcastToBlockchain({
                    sendAllArray: depositSendAllArray,
                    provider: program.provider as anchor.AnchorProvider,
                    signer: userKeypair.keypair,
                });

                transactionHashs.push(...transactionHash);
            }
        }

        console.log("deposited users ", transactionHashs);
    });

    it("claim and close", async () => {
        const { allClaimSendAllArray } = await NeoSwap.claimAndClose({
            provider: program.provider as anchor.AnchorProvider,
            signer: signer.keypair.publicKey,
            swapDataAccount: pda,
            CONST_PROGRAM,
        });

        const transactionHashs = await NeoSwap.boradcastToBlockchain({
            sendAllArray: allClaimSendAllArray,
            provider: program.provider as anchor.AnchorProvider,
            signer: signer.keypair,
        });

        console.log("claim and close transactionHashs :", transactionHashs);
    });
});