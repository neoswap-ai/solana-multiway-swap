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
} from "@solana/spl-token";
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Signer,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
    clusterApiUrl,
} from "@solana/web3.js";
import NeoSwap from "../app/src/neoSwap.module.v4.2";
import {
    ItemStatus,
    TradeStatus,
} from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/status.type.neoswap";
import { swapDataAccountGiven } from "../app/src/solana.test";
import Solana from "../app/src/solana";
import { getProgram } from "../app/src/neoSwap.module.v4.2/utils.neoSwap/getProgram.neoswap";
import { sk } from "../deleteme/signer";
describe("swapCoontractTest", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    let program = anchor.workspace.NeoSwap as Program;
    const CONST_PROGRAM = "0002";
    const nbuser = 3;
    const nftNb = [0];
    let userKeypairs: Keypair[] = [];

    let signer = Keypair.fromSecretKey(sk);
    let mintToTransfer = new PublicKey("BJ5TwcvJGuPTCUHZe38ksX17aPxcVrutkDF3rzjaZZ7y");
    let destinary = new PublicKey("5mG4wFjsnuuQWExTGqLN9ca2e5D1DBVZGDQKjGHJvJPQ");

    let unauthorizedKeypair: Keypair;
    let pda: PublicKey;
    let swapData: SwapData = {
        initializer: signer.publicKey,
        items: [
            {
                isNft: false,
                amount: new anchor.BN(-0.25 * nbuser * 10 ** 9),
                destinary: new PublicKey("11111111111111111111111111111111"),
                mint: new PublicKey("11111111111111111111111111111111"),
                owner: signer.publicKey,
                status: ItemStatus.SolToClaim,
            },
        ],
        status: TradeStatus.Initializing,
        nb_items: 1,
    };

    it("Initializing accounts", async () => {
        program = getProgram(
            new anchor.AnchorProvider(
                new Connection(clusterApiUrl("devnet")),
                new anchor.Wallet(signer),
                {
                    commitment: "confirmed",
                }
            )
        );
        console.log("programId", program.programId.toBase58());
    });

    it("Mint pNFT", async () => {
        if (!mintToTransfer) {
            let MintData = await NeoSwap.createPnft2({
                program,
                signer: signer,
            });
            mintToTransfer = MintData.mintAddress;
        } else {
            console.log("minting skipped");
        }
    });

    it("Transfer pNFT", async () => {
        // signer= Keypair.fromSeed()
        //  test writing dev code just here
        console.log("signer wallet", Keypair.fromSecretKey(sk).publicKey.toBase58());

        // console.log(Keypair.generate().secretKey.toString());
        let MintData = await NeoSwap.transferPNFT({
            destinary,
            mintToDeposit: mintToTransfer,
            program,
            signer: signer,
        });
    });

    //   it("users instruction", async () => {
    //     for await (const userKeypair of userKeypairs) {
    //       console.log("XXXXXXXXXXXXXXX - user ", userKeypair.publicKey.toBase58());

    //       swapData.items.push({
    //         isNft: false,
    //         amount: new BN(0.25 * 10 ** 9),
    //         mint: new PublicKey("11111111111111111111111111111111"),
    //         status: ItemStatus.SolPending,
    //         owner: userKeypair.publicKey,
    //         destinary: new PublicKey("11111111111111111111111111111111"),
    //       } as NftSwapItem);

    //       for await (let mintNb of nftNb) {
    //         // let mintPubkey = await createMint(
    //         //     program.provider.connection, // conneciton
    //         //     userKeypair, // fee payer
    //         //     userKeypair.publicKey, // mint authority
    //         //     userKeypair.publicKey, // freeze authority
    //         //     0 // decimals
    //         // );

    //         // await mintToChecked(
    //         //     program.provider.connection, // conneciton
    //         //     userKeypair, // fee payer
    //         //     mintPubkey, // mint
    //         //     ata, // receiver
    //         //     userKeypair.publicKey, // mint authority
    //         //     10, // amount.
    //         //     0 // decimals
    //         // );
    //         // let recentBlockhash = (
    //         //   await program.provider.connection.getLatestBlockhash()
    //         // ).blockhash;
    //         let MintData = await NeoSwap.createPnft2({
    //           program,
    //           signer: userKeypair,
    //         });
    //         // console.log("mMintData.signatureint : ", MintData.signature);
    //         // console.log("MintData.result : ", MintData.result);
    //         // MintData.addInitSendAllArray.forEach((element) => {
    //         //   element.signers = [userKeypair];
    //         //   element.tx.feePayer = userKeypair.publicKey;
    //         //   element.tx.recentBlockhash = recentBlockhash;
    //         // });

    //         // let tx = await program.provider.sendAll(MintData.addInitSendAllArray, {
    //         //   skipPreflight: true,
    //         // });
    //         // console.log("tx : ", tx);
    //         // for await (const hash of tx) {
    //         //   program.provider.connection.confirmTransaction(hash);
    //         // }
    //         // let ata = await createAssociatedTokenAccount(
    //         //   program.provider.connection, // conneciton
    //         //   userKeypair, // fee payer
    //         //   MintData.mint, // mint
    //         //   userKeypair.publicKey // owner,
    //         // );

    //         for (let index = 0; index < userKeypairs.length; index++) {
    //           if (!userKeypairs[index].publicKey.equals(userKeypair.publicKey)) {
    //             swapData.items.push({
    //               isNft: true,
    //               amount: new BN(1),
    //               //   mint: MintData.mint,
    //               status: ItemStatus.NFTPending,
    //               owner: userKeypair.publicKey,
    //               destinary: userKeypairs[index].publicKey,
    //             } as NftSwapItem);
    //           }
    //         }
    //         // const ataBalance =
    //         //   await program.provider.connection.getTokenAccountBalance(ata);
    //         // console.log(
    //         //   "mint ",
    //         //   MintData.mint.toBase58(),
    //         //   "\nwith ata: ",
    //         //   ata.toBase58(),
    //         //   "\n"
    //         // );
    //       }
    //     }
    //   });

    // it("initialize", async () => {
    //     // console.log(swapData);

    //     const allInitData = await NeoSwap.allInitialize({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.publicKey,
    //         swapDataGiven: swapData,
    //         CONST_PROGRAM,
    //     });
    //     swapData = allInitData.swapData;
    //     pda = allInitData.pda;
    //     const allInitSendAllArray = allInitData.allInitSendAllArray;
    //     console.log("XXX-XXX pda", pda.toBase58());

    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     for await (const transactionDeposit of allInitSendAllArray) {
    //         transactionDeposit.signers = [signer];
    //         transactionDeposit.tx.feePayer = signer.publicKey;
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     }

    //     const txhashs = await program.provider.sendAll(allInitSendAllArray);

    //     for await (const hash of txhashs) {
    //         program.provider.connection.confirmTransaction(hash);
    //     }

    //     console.log("initialized");
    // });

    // it("Deposit", async () => {
    //     let sendAllArray: {
    //         tx: anchor.web3.Transaction;
    //         signers?: anchor.web3.Signer[];
    //     }[] = [];
    //     for await (const userKeypair of userKeypairs) {
    //         const { depositSendAllArray } = await NeoSwap.deposit({
    //             provider: program.provider as anchor.AnchorProvider,
    //             signer: userKeypair.publicKey,
    //             swapDataAccount: pda,
    //             CONST_PROGRAM,
    //         });

    //         depositSendAllArray.forEach((transactionDeposit) => {
    //             transactionDeposit.signers = [userKeypair];
    //             transactionDeposit.tx.feePayer = userKeypair.publicKey;
    //         });
    //         sendAllArray.push(...depositSendAllArray);
    //     }
    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     sendAllArray.forEach((transactionDeposit) => {
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     });
    //     const transactionHashs = await program.provider.sendAll(sendAllArray);
    //     for await (const transactionHash of transactionHashs) {
    //         await program.provider.connection.confirmTransaction(transactionHash);
    //     }
    //     console.log("deposited users ", transactionHashs);
    // });

    // it("claim and close", async () => {
    //     const { allClaimSendAllArray } = await NeoSwap.claimAndClose({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.publicKey,
    //         swapDataAccount: pda,
    //         CONST_PROGRAM,
    //     });

    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     allClaimSendAllArray.forEach((transactionDeposit) => {
    //         transactionDeposit.signers = [signer];
    //         transactionDeposit.tx.feePayer = signer.publicKey;
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     });

    //     const claimAndCloseHash = await program.provider.sendAll(allClaimSendAllArray);

    //     for await (const hash of claimAndCloseHash) {
    //         program.provider.connection.confirmTransaction(hash);
    //     }

    //     console.log("claimAndCloseHash :", claimAndCloseHash);
    // });

    // it("initialize for cancel", async () => {
    //     const allInitData = await NeoSwap.allInitialize({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.publicKey,
    //         swapDataGiven: swapData,
    //         CONST_PROGRAM,
    //         // swapDataAccount: swapDataAccountGiven,
    //     });
    //     swapData = allInitData.swapData;
    //     pda = allInitData.pda;
    //     const allInitSendAllArray = allInitData.allInitSendAllArray;
    //     console.log("XXX-XXX pda", pda.toBase58());

    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     for await (const transactionDeposit of allInitSendAllArray) {
    //         transactionDeposit.signers = [signer];
    //         transactionDeposit.tx.feePayer = signer.publicKey;
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     }

    //     const txhashs = await program.provider.sendAll(allInitSendAllArray);

    //     for await (const hash of txhashs) {
    //         program.provider.connection.confirmTransaction(hash);
    //     }

    //     console.log("initialized");
    // });
    // it("Deposit for cancel", async () => {
    //     let sendAllArray: {
    //         tx: anchor.web3.Transaction;
    //         signers?: anchor.web3.Signer[];
    //     }[] = [];
    //     for await (const userKeypair of userKeypairs) {
    //         const { depositSendAllArray } = await NeoSwap.deposit({
    //             provider: program.provider as anchor.AnchorProvider,
    //             signer: userKeypair.publicKey,
    //             swapDataAccount: pda,
    //             CONST_PROGRAM,
    //         });

    //         depositSendAllArray.forEach((transactionDeposit) => {
    //             transactionDeposit.signers = [userKeypair];
    //             transactionDeposit.tx.feePayer = userKeypair.publicKey;
    //         });
    //         sendAllArray.push(...depositSendAllArray);
    //     }
    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     sendAllArray.forEach((transactionDeposit) => {
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     });
    //     const transactionHashs = await program.provider.sendAll(sendAllArray);
    //     for await (const transactionHash of transactionHashs) {
    //         await program.provider.connection.confirmTransaction(transactionHash);
    //     }
    //     console.log("deposited user ", transactionHashs);
    // });

    // it("partial cancel and close from in trade user", async () => {
    //     const { allCancelSendAllArray } = await NeoSwap.cancelAndClose({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: userKeypairs[0].publicKey,
    //         swapDataAccount: pda,
    //         CONST_PROGRAM,
    //     });

    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     allCancelSendAllArray.forEach((transactionDeposit) => {
    //         transactionDeposit.signers = [userKeypairs[0]];
    //         transactionDeposit.tx.feePayer = userKeypairs[0].publicKey;
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     });

    //     const cancelAndCloseHash = await program.provider.sendAll(
    //         allCancelSendAllArray.slice(0, 1)
    //     );

    //     for await (const hash of cancelAndCloseHash) {
    //         program.provider.connection.confirmTransaction(hash);
    //     }

    //     console.log("cancelAndCloseHash :", cancelAndCloseHash);
    // });

    // it("finish cancel and close from signer", async () => {
    //     const { allCancelSendAllArray } = await NeoSwap.cancelAndClose({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.publicKey,
    //         swapDataAccount: pda,
    //         CONST_PROGRAM,
    //     });

    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     allCancelSendAllArray.forEach((transactionDeposit) => {
    //         transactionDeposit.signers = [signer];
    //         transactionDeposit.tx.feePayer = signer.publicKey;
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     });

    //     const cancelAndCloseHash = await program.provider.sendAll(allCancelSendAllArray);

    //     for await (const hash of cancelAndCloseHash) {
    //         program.provider.connection.confirmTransaction(hash);
    //     }

    //     console.log("cancelAndCloseHash :", cancelAndCloseHash);
    // });

    // it("initialize for mishandling", async () => {
    //     const allInitData = await NeoSwap.allInitialize({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.publicKey,
    //         swapDataGiven: swapData,
    //         CONST_PROGRAM,
    //     });
    //     swapData = allInitData.swapData;
    //     pda = allInitData.pda;
    //     const allInitSendAllArray = allInitData.allInitSendAllArray;
    //     console.log("XXXXXXXXXXXXXXXXX-XXXXXXXXXX pda", pda.toBase58());

    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     for await (const transactionDeposit of allInitSendAllArray) {
    //         transactionDeposit.signers = [signer];
    //         transactionDeposit.tx.feePayer = signer.publicKey;
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     }

    //     const txhashs = await program.provider.sendAll(allInitSendAllArray);

    //     for await (const hash of txhashs) {
    //         program.provider.connection.confirmTransaction(hash);
    //     }

    //     console.log("initialized", txhashs);
    // });

    // it("reinitialize mishandling", async () => {
    //     const allInitData = await NeoSwap.allInitialize({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.publicKey,
    //         swapDataGiven: swapData,
    //         CONST_PROGRAM,
    //     });
    //     swapData = allInitData.swapData;
    //     pda = allInitData.pda;
    //     const allInitSendAllArray = allInitData.allInitSendAllArray;
    //     console.log("XXX-XXX pda", pda.toBase58());

    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     for await (const transactionDeposit of allInitSendAllArray) {
    //         transactionDeposit.signers = [signer];
    //         transactionDeposit.tx.feePayer = signer.publicKey;
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     }

    //     try {
    //         const txhashs = await program.provider.sendAll(allInitSendAllArray);

    //         for await (const hash of txhashs) {
    //             program.provider.connection.confirmTransaction(hash);
    //         }

    //         console.log("initialized", txhashs);
    //     } catch (error) {
    //         assert.strictEqual(
    //             String(error).toLowerCase().includes("custom program error: 0x0"),
    //             true
    //         );
    //     }

    //     console.log("initialized");
    // });

    // it("wrong reinitialize mishandling", async () => {
    //     const allInitData = await NeoSwap.allInitialize({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: userKeypairs[0].publicKey,
    //         swapDataGiven: swapData,
    //         CONST_PROGRAM,
    //     });
    //     swapData = allInitData.swapData;
    //     pda = allInitData.pda;
    //     const allInitSendAllArray = allInitData.allInitSendAllArray;
    //     console.log("XXX-XXX pda", pda.toBase58());

    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     for await (const transactionDeposit of allInitSendAllArray) {
    //         transactionDeposit.signers = [userKeypairs[0]];
    //         transactionDeposit.tx.feePayer = userKeypairs[0].publicKey;
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     }

    //     try {
    //         const txhashs = await program.provider.sendAll(allInitSendAllArray);

    //         for await (const hash of txhashs) {
    //             program.provider.connection.confirmTransaction(hash);
    //         }

    //         console.log("initialized", txhashs);
    //     } catch (error) {
    //         assert.strictEqual(
    //             String(error).toLowerCase().includes("custom program error: 0x0"),
    //             true
    //         );
    //     }
    // });

    // it("wrong claim and close", async () => {
    //     const { allClaimSendAllArray } = await NeoSwap.claimAndClose({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.publicKey,
    //         swapDataAccount: pda,
    //         CONST_PROGRAM,
    //     });

    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     allClaimSendAllArray.forEach((transactionDeposit) => {
    //         transactionDeposit.signers = [signer];
    //         transactionDeposit.tx.feePayer = signer.publicKey;
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     });
    //     try {
    //         const txhashs = await program.provider.sendAll(allClaimSendAllArray);

    //         for await (const hash of txhashs) {
    //             program.provider.connection.confirmTransaction(hash);
    //         }

    //         console.log("initialized", txhashs);
    //     } catch (error) {
    //         // console.log(error);
    //         assert.strictEqual(
    //             String(error).toLowerCase().includes("custom program error: 0x1776"),
    //             true
    //         );
    //     }
    // });

    // it("cancel from unAuthorized user", async () => {
    //     const { depositSendAllArray } = await NeoSwap.deposit({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: userKeypairs[0].publicKey,
    //         swapDataAccount: pda,
    //         CONST_PROGRAM,
    //     });

    //     depositSendAllArray.forEach((transactionDeposit) => {
    //         transactionDeposit.signers = [userKeypairs[0]];
    //         transactionDeposit.tx.feePayer = userKeypairs[0].publicKey;
    //     });
    //     let recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     depositSendAllArray.forEach((transactionDeposit) => {
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     });
    //     const transactionHashs = await program.provider.sendAll(depositSendAllArray.slice(0, 1));
    //     for await (const transactionHash of transactionHashs) {
    //         await program.provider.connection.confirmTransaction(transactionHash);
    //     }
    //     const { allCancelSendAllArray } = await NeoSwap.cancelAndClose({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: unauthorizedKeypair.publicKey,
    //         swapDataAccount: pda,
    //         CONST_PROGRAM,
    //     });

    //     recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
    //     try {
    //         allCancelSendAllArray.forEach((transactionDeposit) => {
    //             transactionDeposit.signers = [unauthorizedKeypair];
    //             transactionDeposit.tx.feePayer = unauthorizedKeypair.publicKey;
    //             transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //         });

    //         const txhashs = await program.provider.sendAll(allCancelSendAllArray);

    //         for await (const hash of txhashs) {
    //             program.provider.connection.confirmTransaction(hash);
    //         }

    //         console.log("initialized", txhashs);
    //     } catch (error) {
    //         console.log(error);
    //         assert.strictEqual(
    //             String(error).toLowerCase().includes("custom program error: 0x1770"),
    //             true
    //         );
    //     }
    // });
});
