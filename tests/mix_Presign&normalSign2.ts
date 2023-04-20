import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
const { assert } = require("chai");
import SwapData from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/swapData.types.neoswap";
import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
import {
    createAssociatedTokenAccount,
    getAssociatedTokenAddress,
    createInitializeMintInstruction,
    TOKEN_PROGRAM_ID,
    MINT_SIZE,
    getMinimumBalanceForRentExemptMint,
    createMint,
    mintToChecked,
    createAssociatedTokenAccountInstruction,
    createMintToCheckedInstruction,
    NATIVE_MINT,
    createSyncNativeInstruction,
} from "@solana/spl-token";
import {
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Signer,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
} from "@solana/web3.js";
import NeoSwap from "../app/src/neoSwap.module.v4.2";
import {
    ItemStatus,
    ItemToBuy,
    ItemToSell,
    TradeStatus,
} from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/status.type.neoswap";
import { swapDataAccountGiven } from "../app/src/solana.test";
import { delay } from "../app/src/solana.utils";

describe("MIX pre-signing", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.NeoSwap as Program;
    const nbuser = 4;
    const nftNb = 2;
    let userKeypairs: { keypair: Keypair; tokens: { mint: PublicKey; ata: PublicKey }[] }[] = [];
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
                amount: new anchor.BN(-0.025 * nbuser * LAMPORTS_PER_SOL),
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
        Array.from(Array(nbuser).keys()).map(async () => {
            userKeypairs.push({ keypair: Keypair.generate(), tokens: [] });
        });

        await NeoSwap.airdropDev({
            connection: program.provider.connection,
            keypairs: [signer, feeCollector, unauthorizedKeypair, ...userKeypairs],
        });
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

        await Promise.all(
            userKeypairs.map(async (userKeypair) => {
                console.log(
                    "XXX XXX - user ",
                    userKeypair.keypair.publicKey.toBase58(),
                    " XXX XXX"
                );
                userKeypair.tokens = await NeoSwap.createNft({
                    program,
                    userKeypair,
                    nb: nftNb,
                });
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
                ...userKeypairs,
            ],
            signer: signer.keypair,
        });
        console.log("initialized", txhashs);
    });

    it("Update amount to topup", async () => {
        // console.log(swapData);
        const txhashs = await NeoSwap.updateAmountToTopupTest({ program, userKeypairs });
        console.log("amoutn topped up", txhashs);
    });

    it("add Item To Sell", async () => {
        // console.log(swapData);
        // await delay(5000);
        let sendArray: {
            tx: anchor.web3.Transaction;
            signers?: anchor.web3.Signer[];
        }[] = [];

        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

        await Promise.all(
            userKeypairs.map(async (userKeypair) => {
                await Promise.all(
                    userKeypair.tokens.map(async (token) => {
                        const { userAddItemToSellTransaction } = await NeoSwap.userAddItemToSell({
                            program,
                            itemToSell: {
                                mint: token.mint,
                                amountMini: new BN(0.1 * LAMPORTS_PER_SOL),
                            },
                            signer: userKeypair.keypair.publicKey,
                        });

                        userAddItemToSellTransaction.signers = [userKeypair.keypair];
                        userAddItemToSellTransaction.tx.feePayer = userKeypair.keypair.publicKey;
                        userAddItemToSellTransaction.tx.recentBlockhash = recentBlockhash;

                        sendArray.push(userAddItemToSellTransaction);
                    })
                );
            })
        );

        // console.log("sendArray", sendArray);

        if (!program.provider.sendAll) throw "noSendAll";
        const txhashs = await program.provider.sendAll(sendArray, {
            skipPreflight: true,
        });

        for await (const hash of txhashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("item added to sell", txhashs);
    });

    it("add Item To buy", async () => {
        let txhashs: string[] = [];

        for (let index = 0; index < userKeypairs.length; index++) {
            const userKeypair = userKeypairs[index];

            if (userKeypair.keypair.publicKey.equals(userKeypairs.at(-1).keypair.publicKey)) {
                console.log(" last item", index, userKeypair.keypair.publicKey.toBase58());
                swapData.items.push({
                    isNft: false,
                    isPresigning: false,
                    owner: userKeypair.keypair.publicKey,
                    mint: NATIVE_MINT,
                    destinary: NATIVE_MINT,
                    status: ItemStatus.SolPending,
                    amount: new anchor.BN(0.025 * LAMPORTS_PER_SOL),
                });
                userKeypairs[0].tokens.map(async (token) => {
                    swapData.items.push({
                        isNft: true,
                        isPresigning: false,
                        mint: token.mint,
                        owner: userKeypairs[0].keypair.publicKey,
                        status: ItemStatus.NFTPending,
                        destinary: userKeypair.keypair.publicKey,
                        amount: new BN(1),
                    });
                });
            } else if (index < userKeypairs.length - 2) {
                console.log(" presigned User", index, userKeypair.keypair.publicKey.toBase58());
                swapData.items.push({
                    isNft: false,
                    isPresigning: true,
                    owner: userKeypair.keypair.publicKey,
                    mint: NATIVE_MINT,
                    destinary: NATIVE_MINT,
                    status: ItemStatus.SolPresigningWaitingForApproval,
                    amount: new anchor.BN(0.025 * LAMPORTS_PER_SOL),
                });
                userKeypairs[index + 1].tokens.map(async (token) => {
                    // console.log("else Token", index, token.mint.toBase58());

                    const { userAddItemToBuyTransaction } = await NeoSwap.userAddItemToBuy({
                        program,
                        itemToBuy: { mint: token.mint, amountMaxi: new BN(0.1 * LAMPORTS_PER_SOL) },
                        signer: userKeypair.keypair.publicKey,
                    });

                    swapData.items.push({
                        isNft: true,
                        isPresigning: true,
                        mint: token.mint,
                        owner: userKeypairs[index + 1].keypair.publicKey,
                        status: ItemStatus.NFTPresigningWaitingForApproval,
                        destinary: userKeypair.keypair.publicKey,
                        amount: new BN(1),
                    });

                    const transactionHash = await NeoSwap.boradcastToBlockchain({
                        sendAllArray: [userAddItemToBuyTransaction],
                        provider: program.provider as anchor.AnchorProvider,
                        signer: userKeypair.keypair,
                    });
                    txhashs.push(...transactionHash);
                });
            } else {
                console.log(" not presigned ", index, userKeypair.keypair.publicKey.toBase58());
                swapData.items.push({
                    isNft: false,
                    isPresigning: false,
                    owner: userKeypair.keypair.publicKey,
                    mint: NATIVE_MINT,
                    destinary: NATIVE_MINT,
                    status: ItemStatus.SolPending,
                    amount: new anchor.BN(0.025 * LAMPORTS_PER_SOL),
                });
                userKeypairs[index + 1].tokens.map(async (token) => {
                    swapData.items.push({
                        isNft: true,
                        isPresigning: false,
                        mint: token.mint,
                        owner: userKeypairs[index + 1].keypair.publicKey,
                        status: ItemStatus.NFTPending,
                        destinary: userKeypair.keypair.publicKey,
                        amount: new BN(1),
                    });
                });
            }
        }

        console.log("item added to buy", txhashs);
    });

    it("initialize Swap for cancel", async () => {
        swapData.nb_items = swapData.items.length;

        const {
            allInitSendAllArray,
            pda: swapPda,
            // swapData: swapdataResult,
        } = await NeoSwap.allInitialize({
            provider: program.provider as anchor.AnchorProvider,
            CONST_PROGRAM,
            swapDataGiven: swapData,
            signer: signer.keypair.publicKey,
        });
        pda = swapPda;

        const txhashs = await NeoSwap.boradcastToBlockchain({
            sendAllArray: allInitSendAllArray,
            provider: program.provider as anchor.AnchorProvider,
            signer: signer.keypair,
        });

        console.log("swap", pda.toBase58(), "initialized", txhashs);
    });

    it("Deposit not presigned for claim", async () => {
        let transactionHashs: string[] = [];
        for await (const userKeypair of userKeypairs) {
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

        console.log("transactionHashs :", transactionHashs);
    });
});
