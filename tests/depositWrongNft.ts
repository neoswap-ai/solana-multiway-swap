/// What to test:
// testing if incorrect user can deposit correct / incorrect NFT
// testing if correct user can deposit incorrect NFT

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
} from "@solana/spl-token";
import {
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
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
// import { swapDataAccountGiven } from "../app/src/solana.test";
// import { delay } from "../app/src/solana.utils";

describe("DataRemovedFronUserPda", () => {
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
        // console.log("LENswapdata2", swapData.items.length);
        const txhashs = await NeoSwap.boradcastToBlockchain({
            sendAllArray: allInitSendAllArray,
            provider: program.provider as anchor.AnchorProvider,
            signer: signer.keypair,
        });

        console.log("swapPda", pda.toBase58(), "\ninitialized TransacrionHashs", txhashs);
    });

    // it("Deposit not presigned for cancel", async () => {
    //     let transactionHashs: string[] = [];
    //     for await (const userKeypair of userKeypairsNormal) {
    //         const { depositSendAllArray } = await NeoSwap.depositUserOnly({
    //             provider: program.provider as anchor.AnchorProvider,
    //             signer: userKeypair.keypair.publicKey,
    //             swapDataAccount: pda,
    //             CONST_PROGRAM,
    //         });
    //         if (depositSendAllArray) {
    //             const transactionHash = await NeoSwap.boradcastToBlockchain({
    //                 sendAllArray: depositSendAllArray,
    //                 provider: program.provider as anchor.AnchorProvider,
    //                 signer: userKeypair.keypair,
    //             });

    //             transactionHashs.push(...transactionHash);
    //         }
    //     }

    //     console.log("deposited users transactionHashs", transactionHashs);
    // });
    it("bad user owns bad nft", async () => {
        let transactionHashs: string[] = [];
        // for await (const userKeypair of userKeypairsNormal) {
        const swapData = await getSwapDataFromPDA({
            provider: program.provider as anchor.AnchorProvider,
            CONST_PROGRAM: CONST_PROGRAM,
            swapDataAccount: pda,
        }).catch((error) => {
            throw console.error(error);
        });

        const { instruction: depositUnauthorizedInstruction } = await depositNft({
            program,
            signer: unauthorizedKeypair.keypair.publicKey,
            swapDataAccount: pda,
            ataList: [],
            mint: unauthorizedKeypair.tokens[0].mint,
            swapDataAccount_bump: swapData.swapDataAccount_bump,
            swapDataAccount_seed: swapData.swapDataAccount_seed,
        });
        try {
            const transactionHash = await NeoSwap.boradcastToBlockchain({
                sendAllArray: [{ tx: new Transaction().add(...depositUnauthorizedInstruction) }],
                provider: program.provider as anchor.AnchorProvider,
                signer: unauthorizedKeypair.keypair,
            });
            transactionHashs.push(...transactionHash);

            // }

            console.log("deposited users transactionHashs", transactionHashs);
            // "Custom":6004
        } catch (error) {
            console.log("Claim & close  :", error);
            assert.ok(String(error).includes(`"Custom":6X`), true);
        }
    });
    it("bad user not owns good nft", async () => {
        let transactionHashs: string[] = [];
        // for await (const userKeypair of userKeypairsNormal) {
        const swapData = await getSwapDataFromPDA({
            provider: program.provider as anchor.AnchorProvider,
            CONST_PROGRAM: CONST_PROGRAM,
            swapDataAccount: pda,
        }).catch((error) => {
            throw console.error(error);
        });

        console.log("unauthorized user", unauthorizedKeypair.keypair.publicKey.toBase58());

        console.log("mint", userKeypairsNormal[0].tokens[0].mint.toBase58());

        const { instruction: depositUnauthorizedInstruction } = await depositNft({
            program,
            signer: unauthorizedKeypair.keypair.publicKey,
            swapDataAccount: pda,
            ataList: [],
            mint: userKeypairsNormal[0].tokens[0].mint,
            swapDataAccount_bump: swapData.swapDataAccount_bump,
            swapDataAccount_seed: swapData.swapDataAccount_seed,
        });
        try {
            const transactionHash = await NeoSwap.boradcastToBlockchain({
                sendAllArray: [{ tx: new Transaction().add(...depositUnauthorizedInstruction) }],
                provider: program.provider as anchor.AnchorProvider,
                signer: unauthorizedKeypair.keypair,
            });
            transactionHashs.push(...transactionHash);

            // }

            console.log("deposited users transactionHashs", transactionHashs);
            // "Custom":6004
        } catch (error) {
            console.log("Claim & close  :", error);
            assert.ok(String(error).includes(`"Custom":60X`), true);
        }
    });
    it("good user owns deposit wrong nft", async () => {
        let transactionHashs: string[] = [];
        // for await (const userKeypair of userKeypairsNormal) {
        const swapData = await getSwapDataFromPDA({
            provider: program.provider as anchor.AnchorProvider,
            CONST_PROGRAM: CONST_PROGRAM,
            swapDataAccount: pda,
        }).catch((error) => {
            throw console.error(error);
        });

        const { instruction: depositUnauthorizedInstruction } = await depositNft({
            program,
            signer: userKeypairsNormal[0].keypair.publicKey,
            swapDataAccount: pda,
            ataList: [],
            mint: unauthorizedKeypair.tokens[0].mint,
            swapDataAccount_bump: swapData.swapDataAccount_bump,
            swapDataAccount_seed: swapData.swapDataAccount_seed,
        });
        try {
            const transactionHash = await NeoSwap.boradcastToBlockchain({
                sendAllArray: [{ tx: new Transaction().add(...depositUnauthorizedInstruction) }],
                provider: program.provider as anchor.AnchorProvider,
                signer: userKeypairsNormal[0].keypair,
            });
            transactionHashs.push(...transactionHash);

            // }

            console.log("deposited users transactionHashs", transactionHashs);
            // "Custom":6004
        } catch (error) {
            console.log("Claim & close  :", error);
            assert.ok(String(error).includes(`"Custom":60X`), true);
        }
    });
});
