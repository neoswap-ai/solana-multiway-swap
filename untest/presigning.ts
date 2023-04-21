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

describe("pre-signing", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.NeoSwap as Program;
    const nbuser = 3;
    const nftNb = [0, 1];
    let userKeypairs: { keypair: Keypair; tokens: { mint: PublicKey; ata: PublicKey }[] }[] = [];
    let CONST_PROGRAM = "0000";
    let signer = Keypair.generate();
    let feeCollector = Keypair.generate();
    let unauthorizedKeypair = Keypair.generate();
    let pda: PublicKey;
    let swapData: SwapData = {
        initializer: signer.publicKey,
        items: [
            {
                isNft: false,
                isPresigning: false,
                amount: new anchor.BN(-0.025 * nbuser * LAMPORTS_PER_SOL),
                destinary: NATIVE_MINT,
                mint: NATIVE_MINT,
                owner: feeCollector.publicKey,
                status: ItemStatus.SolToClaim,
            },
        ],
        status: TradeStatus.Initializing,
        nb_items: 1,
    };

    it("Initializing accounts", async () => {
        console.log("programId", program.programId.toBase58());

        await program.provider.connection.requestAirdrop(signer.publicKey, 2 * LAMPORTS_PER_SOL);
        await program.provider.connection.requestAirdrop(
            feeCollector.publicKey,
            2 * LAMPORTS_PER_SOL
        );

        console.log(
            "signer airdrop done",
            signer.publicKey.toBase58(),
            "with ",
            (await program.provider.connection.getBalance(signer.publicKey)) / LAMPORTS_PER_SOL
        );

        for (let userId = 0; userId < nbuser; userId++) {
            userKeypairs[userId] = { keypair: Keypair.generate(), tokens: [] };
        }

        for await (const userKeypair of userKeypairs) {
            await program.provider.connection.confirmTransaction(
                await program.provider.connection.requestAirdrop(
                    userKeypair.keypair.publicKey,
                    2 * LAMPORTS_PER_SOL
                )
            );
            console.log("user airdrop done", userKeypair.keypair.publicKey.toBase58());
        }
        await program.provider.connection.requestAirdrop(
            unauthorizedKeypair.publicKey,
            2 * LAMPORTS_PER_SOL
        );
    });

    it("users instruction", async () => {
        for await (const userKeypair of userKeypairs) {
            console.log("XXX XXX - user ", userKeypair.keypair.publicKey.toBase58());

            for await (let mintNb of nftNb) {
                let mintPubkey = await createMint(
                    program.provider.connection, // conneciton
                    userKeypair.keypair, // fee payer
                    userKeypair.keypair.publicKey, // mint authority
                    userKeypair.keypair.publicKey, // freeze authority
                    0 // decimals
                );

                let ata = await createAssociatedTokenAccount(
                    program.provider.connection, // conneciton
                    userKeypair.keypair, // fee payer
                    mintPubkey, // mint
                    userKeypair.keypair.publicKey // owner,
                );
                userKeypair.tokens.push({ ata, mint: mintPubkey });
                await mintToChecked(
                    program.provider.connection, // conneciton
                    userKeypair.keypair, // fee payer
                    mintPubkey, // mint
                    ata, // receiver
                    userKeypair.keypair.publicKey, // mint authority
                    1, // amount.
                    0 // decimals
                );

                const ataBalance = await program.provider.connection.getTokenAccountBalance(ata);
                console.log(
                    "mint ",
                    mintPubkey.toBase58(),
                    "\nwith ata: ",
                    ata.toBase58(),
                    "\n balance:",
                    ataBalance.value.uiAmount,
                    " NFT"
                );
            }
        }
    });

    it("create Users Pda", async () => {
        // console.log(swapData);
        let sendArray: {
            tx: anchor.web3.Transaction;
            signers?: anchor.web3.Signer[];
        }[] = [];
        const createsignderPdaData = await NeoSwap.createUserPda({
            program,
            user: signer.publicKey,
            signer: signer.publicKey,
        });

        let signderPda = createsignderPdaData.userPda;
        const signerInitSendAllArray = createsignderPdaData.addInitSendAllArray;
        console.log("XXX-XXX signderPda", signderPda.toBase58());

        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

        signerInitSendAllArray.signers = [signer];
        signerInitSendAllArray.tx.feePayer = signer.publicKey;
        signerInitSendAllArray.tx.recentBlockhash = recentBlockhash;
        sendArray.push(signerInitSendAllArray);

        const createfeeCollectorPdaData = await NeoSwap.createUserPda({
            program,
            user: feeCollector.publicKey,
            signer: signer.publicKey,
        });

        let feeCollectorPda = createfeeCollectorPdaData.userPda;
        const feeCollectorInitSendAllArray = createfeeCollectorPdaData.addInitSendAllArray;
        console.log("XXX-XXX feeCollectorPda", feeCollectorPda.toBase58());

        feeCollectorInitSendAllArray.signers = [signer];
        feeCollectorInitSendAllArray.tx.feePayer = signer.publicKey;
        feeCollectorInitSendAllArray.tx.recentBlockhash = recentBlockhash;
        sendArray.push(feeCollectorInitSendAllArray);

        await Promise.all(
            userKeypairs.map(async (userKeypair) => {
                await program.provider.connection.requestAirdrop(
                    userKeypair.keypair.publicKey,
                    2 * LAMPORTS_PER_SOL
                );
                const createuserPdaData = await NeoSwap.createUserPda({
                    program,
                    user: userKeypair.keypair.publicKey,
                    signer: signer.publicKey,
                });

                let userPda = createuserPdaData.userPda;
                const allInitSendAllArrayUser = createuserPdaData.addInitSendAllArray;
                console.log("XXX-XXX userPda", userPda.toBase58());

                allInitSendAllArrayUser.signers = [signer];
                allInitSendAllArrayUser.tx.feePayer = signer.publicKey;
                allInitSendAllArrayUser.tx.recentBlockhash = recentBlockhash;

                sendArray.push(allInitSendAllArrayUser);
            })
        );
        if (!program.provider.sendAll) throw "Nosend"
        const txhashs = await program.provider.sendAll(sendArray, {
            skipPreflight: true,
        });

        for await (const hash of txhashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("initialized", txhashs);
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

        if (!program.provider.sendAll) throw "Nosend"
        const txhashs = await program.provider.sendAll(sendArray, {
            skipPreflight: true,
        });

        for await (const hash of txhashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("item added to sell", txhashs);
    });

    // it("feed Wsol accounts", async () => {
    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     let sendAlluserSwols: string[] = [];
    //     await Promise.all(
    //         userKeypairs.map(async (userKeypair) => {
    //             const userWsol = await getAssociatedTokenAddress(
    //                 NATIVE_MINT,
    //                 userKeypair.keypair.publicKey
    //             );
    //             console.log(
    //                 "userBalnce",
    //                 await program.provider.connection.getBalance(userKeypair.keypair.publicKey)
    //             );

    //             let swndWsolTx: Transaction = new Transaction();
    //             let userwSolbalanceAmount: number | undefined;
    //             try {
    //                 const userwSolbalance =
    //                     await program.provider.connection.getTokenAccountBalance(userWsol);
    //                 userwSolbalanceAmount = userwSolbalance.value.uiAmount;
    //             } catch (error) {
    //                 if (String(error).includes("could not find account")) {
    //                     console.log("could not find account");
    //                     swndWsolTx.add(
    //                         createAssociatedTokenAccountInstruction(
    //                             userKeypair.keypair.publicKey, // payer
    //                             userWsol, // ata
    //                             userKeypair.keypair.publicKey, // owner
    //                             NATIVE_MINT // mint
    //                         )
    //                     );
    //                 } else {
    //                     throw error;
    //                 }
    //             }

    //             if (userwSolbalanceAmount < LAMPORTS_PER_SOL || !userwSolbalanceAmount) {
    //                 console.log("not enough funds", userwSolbalanceAmount);

    //                 swndWsolTx.add(
    //                     // trasnfer SOL
    //                     SystemProgram.transfer({
    //                         fromPubkey: userKeypair.keypair.publicKey,
    //                         toPubkey: userWsol,
    //                         lamports: LAMPORTS_PER_SOL * 1.5 + 100,
    //                     }),
    //                     // sync wrapped SOL balance
    //                     createSyncNativeInstruction(userWsol)
    //                 );

    //                 let sendAlluserSwol: {
    //                     tx: anchor.web3.Transaction;
    //                     signers?: anchor.web3.Signer[];
    //                 } = {
    //                     tx: swndWsolTx,
    //                     signers: [userKeypair.keypair],
    //                 };
    //                 sendAlluserSwol.tx.feePayer = userKeypair.keypair.publicKey;
    //                 sendAlluserSwol.tx.recentBlockhash = recentBlockhash;
    //                 console.log(
    //                     "user:",
    //                     userKeypair.keypair.publicKey.toBase58(),
    //                     // "sendAlluserSwol",
    //                     // sendAlluserSwol
    //                 );
    //                 const uHash = await program.provider.sendAll([sendAlluserSwol], {
    //                     skipPreflight: true,
    //                 });
    //                 console.log("Wsol send up", uHash);
    //                 sendAlluserSwols.push(...uHash);
    //                 // sendAlluserSwols.push(sendAlluserSwol);
    //             }
    //         })
    //     );

    //     // const wsoltxhashs = await program.provider.sendAll(sendAlluserSwols, {
    //     //     skipPreflight: true,
    //     // });

    //     // for await (const hash of wsoltxhashs) {
    //     //     program.provider.connection.confirmTransaction(hash);
    //     // }

    //     console.log("Wsol send up", sendAlluserSwols);
    // });
    it("Update amount to topup", async () => {
        // console.log(swapData);
        let sendArray: {
            tx: anchor.web3.Transaction;
            signers?: anchor.web3.Signer[];
        }[] = [];

        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
        await Promise.all(
            userKeypairs.map(async (userKeypair) => {
                const { userTransaction } = await NeoSwap.userUpdateAmountTopUp({
                    program,
                    amountToTopup: 1.01,
                    signer: userKeypair.keypair.publicKey,
                });
                userTransaction.forEach((suserTransaction) => {
                    suserTransaction.signers = [userKeypair.keypair];
                    suserTransaction.tx.feePayer = userKeypair.keypair.publicKey;
                    suserTransaction.tx.recentBlockhash = recentBlockhash;
                });
                sendArray.push(...userTransaction);
            })
        );
        // console.log("sendArray", sendArray);

        if (!program.provider.sendAll) throw "Nosend"
        const txhashs = await program.provider.sendAll(sendArray, {
            skipPreflight: true,
        });

        for await (const hash of txhashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("amoutn topped up", txhashs);
    });

    it("add Item To buy", async () => {
        // console.log(swapData);
        // await delay(5000);
        let sendArray: {
            tx: anchor.web3.Transaction;
            signers?: anchor.web3.Signer[];
        }[] = [];

        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
        // let index = 0;
        // Promise.all(
        //     userKeypairs.map(async (userKeypair) => {
        for (let index = 0; index < userKeypairs.length; index++) {
            const userKeypair = userKeypairs[index];

            console.log(
                index,
                userKeypair.keypair.publicKey.toBase58(),
                userKeypairs.at(-1).keypair.publicKey.toBase58()
            );
            swapData.items.push({
                isNft: false,
                isPresigning: true,
                owner: userKeypair.keypair.publicKey,
                mint: NATIVE_MINT,
                destinary: NATIVE_MINT,
                status: ItemStatus.SolPresigningWaitingForApproval,
                amount: new anchor.BN(0.025 * LAMPORTS_PER_SOL),
            });

            if (userKeypair.keypair.publicKey.equals(userKeypairs.at(-1).keypair.publicKey)) {
                userKeypairs[0].tokens.map(async (token) => {
                    // console.log("else Token ", index, token.mint.toBase58());

                    const { userAddItemToBuyTransaction } = await NeoSwap.userAddItemToBuy({
                        program,
                        itemToBuy: {
                            mint: token.mint,
                            amountMaxi: new BN(0.01 * LAMPORTS_PER_SOL),
                        },
                        signer: userKeypair.keypair.publicKey,
                    });
                    swapData.items.push({
                        isNft: true,
                        isPresigning: true,
                        mint: token.mint,
                        owner: userKeypairs[0].keypair.publicKey,
                        status: ItemStatus.NFTPresigningWaitingForApproval,
                        destinary: userKeypair.keypair.publicKey,
                        amount: new BN(1),
                    });
                    userAddItemToBuyTransaction.signers = [userKeypair.keypair];
                    userAddItemToBuyTransaction.tx.feePayer = userKeypair.keypair.publicKey;
                    userAddItemToBuyTransaction.tx.recentBlockhash = recentBlockhash;

                    sendArray.push(userAddItemToBuyTransaction);
                });
            } else {
                // console.log("else");

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

                    userAddItemToBuyTransaction.signers = [userKeypair.keypair];
                    userAddItemToBuyTransaction.tx.feePayer = userKeypair.keypair.publicKey;
                    userAddItemToBuyTransaction.tx.recentBlockhash = recentBlockhash;

                    sendArray.push(userAddItemToBuyTransaction);
                });
            }
        }
        // )
        // );

        if (!program.provider.sendAll) throw "Nosend"
        const txhashs = await program.provider.sendAll(sendArray, {
            skipPreflight: true,
        });
        for await (const hash of txhashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("item added to buy", txhashs);
    });

    it("initialize Swap for cancel", async () => {
        swapData.nb_items = swapData.items.length;
        // await Promise.all(
        //     userKeypairs.map(async (userKeypair) => {
        //         const userPdaData = await NeoSwap.getUserPdaData({
        //             program,
        //             user: userKeypair.keypair.publicKey,
        //         });
        //         console.log("XXX-XXX userPdaData", userPdaData.userPdaData);
        //     })
        // );
        // // console.log("swapData", swapData);
        // await delay(5000);

        const {
            allInitSendAllArray,
            pda: swapPda,
            swapData: swapdataResult,
        } = await NeoSwap.allInitialize({
            provider: program.provider as anchor.AnchorProvider,
            CONST_PROGRAM,
            swapDataGiven: swapData,
            signer: signer.publicKey,
        });
        pda = swapPda;
        for (let index = 0; index < swapdataResult.items.length; index++) {
            const item = swapdataResult.items[index];

            console.log(
                index,
                "item",
                item.owner.toBase58(),
                item.mint.toBase58(),
                item.isPresigning
            );
        }
        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
        allInitSendAllArray.forEach((sendArray) => {
            sendArray.signers = [signer];
            sendArray.tx.feePayer = signer.publicKey;
            sendArray.tx.recentBlockhash = recentBlockhash;
        });

        if (!program.provider.sendAll) throw "Nosend"
        const txhashs = await program.provider.sendAll(allInitSendAllArray, {
            skipPreflight: true,
        });

        for await (const hash of txhashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("swap", pda.toBase58(), "initialized", txhashs);
    });

    it("Deposit for cancel", async () => {
        let transactionHashs: string[] = [];
        for await (const userKeypair of userKeypairs) {
            const { depositSendAllArray } = await NeoSwap.deposit({
                provider: program.provider as anchor.AnchorProvider,
                signer: signer.publicKey,
                user: userKeypair.keypair.publicKey,
                swapDataAccount: pda,
                CONST_PROGRAM,
            });

            const recentBlockhash = (await program.provider.connection.getLatestBlockhash())
                .blockhash;
            depositSendAllArray.forEach((transactionDeposit) => {
                transactionDeposit.signers = [signer];
                transactionDeposit.tx.feePayer = signer.publicKey;
                transactionDeposit.tx.recentBlockhash = recentBlockhash;
            });
            if (!program.provider.sendAll) throw "Nosend"
            const transactionHash = await program.provider.sendAll(depositSendAllArray, {
        skipPreflight: true,
            });
            console.log("transactionHash", transactionHash);

            for await (const transactionHashh of transactionHash) {
                await program.provider.connection.confirmTransaction(transactionHashh);
            }
            transactionHashs.push(...transactionHash);
        }

        console.log("deposited users ", transactionHashs);
    });

    it("cancel and close", async () => {
        const { allCancelSendAllArray } = await NeoSwap.cancelAndClose({
            provider: program.provider as anchor.AnchorProvider,
            signer: signer.publicKey,
            swapDataAccount: pda,
            CONST_PROGRAM,
        });

        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

        allCancelSendAllArray.forEach((transactionDeposit) => {
            transactionDeposit.signers = [signer];
            transactionDeposit.tx.feePayer = signer.publicKey;
            transactionDeposit.tx.recentBlockhash = recentBlockhash;
        });

        // const claimAndCloseHash = await program.provider.sendAll(allCancelSendAllArray);
        if (!program.provider.sendAll) throw "Nosend"
        const transactionHashs = await program.provider.sendAll(allCancelSendAllArray, {
            skipPreflight: true,
        });
        console.log("transactionHashs", transactionHashs);
        for await (const hash of transactionHashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("transactionHashs :", transactionHashs);
    });

    it("add Item To Sell for claim", async () => {
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

        if (!program.provider.sendAll) throw "Nosend"
        const txhashs = await program.provider.sendAll(sendArray, {
            skipPreflight: true,
        });

        for await (const hash of txhashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("item added to sell", txhashs);
    });
    it("initialize Swap for claim", async () => {
        swapData.nb_items = swapData.items.length;
        // await Promise.all(
        //     userKeypairs.map(async (userKeypair) => {
        //         const userPdaData = await NeoSwap.getUserPdaData({
        //             program,
        //             user: userKeypair.keypair.publicKey,
        //         });
        //         console.log("XXX-XXX userPdaData", userPdaData.userPdaData);
        //     })
        // );
        // // console.log("swapData", swapData);
        // await delay(5000);

        const {
            allInitSendAllArray,
            pda: swapPda,
            swapData: swapdataResult,
        } = await NeoSwap.allInitialize({
            provider: program.provider as anchor.AnchorProvider,
            CONST_PROGRAM,
            swapDataGiven: swapData,
            signer: signer.publicKey,
        });
        pda = swapPda;
        for (let index = 0; index < swapdataResult.items.length; index++) {
            const item = swapdataResult.items[index];

            console.log(
                index,
                "item",
                item.owner.toBase58(),
                item.mint.toBase58(),
                item.isPresigning
            );
        }
        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
        allInitSendAllArray.forEach((sendArray) => {
            sendArray.signers = [signer];
            sendArray.tx.feePayer = signer.publicKey;
            sendArray.tx.recentBlockhash = recentBlockhash;
        });

        if (!program.provider.sendAll) throw "Nosend"
        const txhashs = await program.provider.sendAll(allInitSendAllArray, {
            skipPreflight: true,
        });

        for await (const hash of txhashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("swap", pda.toBase58(), "initialized", txhashs);
    });

    it("Deposit for claim", async () => {
        let transactionHashs: string[] = [];
        for await (const userKeypair of userKeypairs) {
            const { depositSendAllArray } = await NeoSwap.deposit({
                provider: program.provider as anchor.AnchorProvider,
                signer: signer.publicKey,
                user: userKeypair.keypair.publicKey,
                swapDataAccount: pda,
                CONST_PROGRAM,
            });

            const recentBlockhash = (await program.provider.connection.getLatestBlockhash())
                .blockhash;
            depositSendAllArray.forEach((transactionDeposit) => {
                transactionDeposit.signers = [signer];
                transactionDeposit.tx.feePayer = signer.publicKey;
                transactionDeposit.tx.recentBlockhash = recentBlockhash;
            });
        if (!program.provider.sendAll) throw "Nosend"
        const transactionHash = await program.provider.sendAll(depositSendAllArray, {
                skipPreflight: true,
            });
            console.log("transactionHash", transactionHash);

            for await (const transactionHashh of transactionHash) {
                await program.provider.connection.confirmTransaction(transactionHashh);
            }
            transactionHashs.push(...transactionHash);
        }

        console.log("deposited users ", transactionHashs);
    });

    it("claim and close", async () => {
        const { allClaimSendAllArray } = await NeoSwap.claimAndClose({
            provider: program.provider as anchor.AnchorProvider,
            signer: signer.publicKey,
            swapDataAccount: pda,
            CONST_PROGRAM,
        });

        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

        allClaimSendAllArray.forEach((transactionDeposit) => {
            transactionDeposit.signers = [signer];
            transactionDeposit.tx.feePayer = signer.publicKey;
            transactionDeposit.tx.recentBlockhash = recentBlockhash;
        });

        // const claimAndCloseHash = await program.provider.sendAll(allClaimSendAllArray);
        if (!program.provider.sendAll) throw "Nosend"
        const transactionHashs = await program.provider.sendAll(allClaimSendAllArray, {
            skipPreflight: true,
        });
        console.log("transactionHashs", transactionHashs);
        for await (const hash of transactionHashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("transactionHashs :", transactionHashs);
    });
});