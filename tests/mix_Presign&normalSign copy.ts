import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
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
    closeAccount,
    createCloseAccountInstruction,
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
import { neoSwap, neoTypes } from "@neoswap/solana";
import {
    ItemStatus,
    // ItemToBuy,
    // ItemToSell,
    TradeStatus,
} from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/status.type.neoswap";
// import { swapDataAccountGiven } from "../app/src/solana.test";
// import { delay } from "../app/src/solana.utils";
import usk1 from "../deleteme/user1";
const user1 = Keypair.fromSecretKey(usk1);
import usk2 from "../deleteme/user2";
const user2 = Keypair.fromSecretKey(usk2);
import usk3 from "../deleteme/user3";
const user3 = Keypair.fromSecretKey(usk3);
import usks from "../deleteme/signer";
const signer = Keypair.fromSecretKey(usks);
// import usclisks from "/home/biboux/.config/solana/id.json";
// const usc = Keypair.fromSecretKey(usks);

const clusterOrUrl =
    "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";

describe("MIX pre-signing", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = neoSwap.UTILS.getProgram({
        clusterOrUrl,
        signer,
    });
    // const nbuserPresigned = 3;
    // const nbuserNormal = 3;
    // const nftNb = 2;
    // let userKeypairsPresigned: {
    //     keypair: Keypair;
    //     tokens: { mint: PublicKey; ata: PublicKey; value: number }[];
    // }[] = [];
    // let userKeypairsNormal: {
    //     keypair: Keypair;
    //     tokens: { mint: PublicKey; ata: PublicKey; value: number }[];
    // }[] = [];
    // let pda: PublicKey;
    let swapData: neoTypes.SwapData = {
        initializer: signer.publicKey,
        items: [
            {
                isNft: false,
                isPresigning: false,
                isCompressed: false,
                index: new BN(0),
                merkleTree: NATIVE_MINT,
                amount: new anchor.BN(-0.025 * 2 * LAMPORTS_PER_SOL),
                destinary: NATIVE_MINT,
                mint: NATIVE_MINT,
                owner: signer.publicKey,
                status: ItemStatus.SolToClaim,
            },
            {
                isNft: false,
                isPresigning: false,
                isCompressed: false,
                index: new BN(0),
                merkleTree: NATIVE_MINT,
                amount: new anchor.BN(0.025 * LAMPORTS_PER_SOL),
                destinary: NATIVE_MINT,
                mint: NATIVE_MINT,
                owner: user1.publicKey,
                status: ItemStatus.SolToClaim,
            },
            {
                isNft: false,
                isPresigning: false,
                isCompressed: false,
                index: new BN(0),
                merkleTree: NATIVE_MINT,
                amount: new anchor.BN(0.025 * LAMPORTS_PER_SOL),
                destinary: NATIVE_MINT,
                mint: NATIVE_MINT,
                owner: user2.publicKey,
                status: ItemStatus.SolToClaim,
            },
            {
                isNft: false,
                isPresigning: true,
                isCompressed: false,
                index: new BN(0),
                merkleTree: NATIVE_MINT,
                amount: new anchor.BN(0.025 * LAMPORTS_PER_SOL),
                destinary: NATIVE_MINT,
                mint: NATIVE_MINT,
                owner: user1.publicKey,
                status: ItemStatus.SolToClaim,
            },
        ],
        status: TradeStatus.Initializing,
        nbItems: 2,
        acceptedPayement: NATIVE_MINT,
        preSeed: "0000",
    };

    // it("del pda", async () => {
    //     const account = PublicKey.findProgramAddressSync(
    //         [signer.publicKey.toBuffer()],
    //         program.programId
    //     )[0];
    //     console.log("del pda", account.toBase58());

    //     const destination = signer.publicKey;
    //     const authority = signer.publicKey;
    //     const multiSigners = [signer];
    //     const programId = program.programId;

    //     //  use build-in function

    //     let txhash = await closeAccount(
    //         program.provider.connection, // connection
    //         multiSigners[0], // payer
    //         account, // token account which you want to close
    //         destination, // destination
    //         authority, // owner of token account
    //         // multiSigners // [], // multi signers
    //         undefined,
    //         { skipPreflight: true }
    //     );

    //     console.log("del pda", txhash);

    //     // const txs = new Transaction().add(
    //     //     createCloseAccountInstruction(account, destination, authority, multiSigners)
    //     // );
    //     // txs.feePayer = signer.publicKey;
    //     // txs.recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
    //     // const hash = await neoSwap.UTILS.sendBundledTransactions({
    //     //     clusterOrUrl,
    //     //     signer: signer,
    //     //     txsWithoutSigners: [{ tx: txs }],
    //     //     simulation: false,
    //     //     skipConfirmation: true,
    //     // });

    //     // console.log("del pda", hash);
    // });

    /// create specific testing functions
    it("remove Item Users Pda", async () => {
        // console.log(swapData);
        // const txhashs = await neoSwap.createOrModifyUserPda({
        //     clusterOrUrl,
        //     signer,
        //     amountToTopUp: 0.01,
        // });
        // console.log("initialized", txhashs);

        const txhashs2 = await neoSwap.createOrModifyUserPda({
            clusterOrUrl,
            signer: user1,
            user: user1.publicKey,
            // amountToTopUp: 0.1,
            REMOVEitemsToBuy: [
                {
                    mint: new PublicKey("H9YsFbkJxpJaABkWu6kweErV6r2THxULkpyMPNuR6DWE"),
                    amountMaxi: new BN(0.03 * LAMPORTS_PER_SOL),
                },
            ],
        });
        console.log("initialized", txhashs2);
        //     const txhashs3 = await neoSwap.createOrModifyUserPda({
        //         clusterOrUrl,
        //         signer: user2,
        //         // amountToTopUp: 0.1,
        //         itemsToSell: [
        //             {
        //                 mint: new PublicKey("H9YsFbkJxpJaABkWu6kweErV6r2THxULkpyMPNuR6DWE"),
        //                 amountMini: new BN(0.02 * LAMPORTS_PER_SOL),
        //             },
        //         ],
        //     });
        //     console.log("initialized", txhashs3);
        // });
        // it("create Users Pda", async () => {
        //     // console.log(swapData);
        //     // const txhashs = await neoSwap.createOrModifyUserPda({
        //     //     clusterOrUrl,
        //     //     signer,
        //     //     amountToTopUp: 0.01,
        //     // });
        //     // console.log("initialized", txhashs);

        //     const txhashs2 = await neoSwap.createOrModifyUserPda({
        //         clusterOrUrl,
        //         signer: user1,
        //         // amountToTopUp: 0.1,
        //         itemsToBuy: [
        //             {
        //                 mint: new PublicKey("H9YsFbkJxpJaABkWu6kweErV6r2THxULkpyMPNuR6DWE"),
        //                 amountMaxi: new BN(0.03 * LAMPORTS_PER_SOL),
        //             },
        //         ],
        //     });
        //     console.log("initialized", txhashs2);
        //     const txhashs3 = await neoSwap.createOrModifyUserPda({
        //         clusterOrUrl,
        //         signer: user2,
        //         // amountToTopUp: 0.1,
        //         itemsToSell: [
        //             {
        //                 mint: new PublicKey("H9YsFbkJxpJaABkWu6kweErV6r2THxULkpyMPNuR6DWE"),
        //                 amountMini: new BN(0.02 * LAMPORTS_PER_SOL),
        //             },
        //         ],
        //     });
        //     console.log("initialized", txhashs3);
    });

    // it("initialize Swap for cancel", async () => {
    //     swapData.nb_items = swapData.items.length;

    //     const {
    //         allInitSendAllArray,
    //         pda: swapPda,
    //         // txhashs,
    //         swapData: swapdataResult,
    //     } = await NeoSwap.allInitialize({
    //         provider: program.provider as anchor.AnchorProvider,
    //         CONST_PROGRAM,
    //         swapDataGiven: swapData,
    //         signer: signer.keypair.publicKey,
    //     });
    //     pda = swapPda;
    //     swapData = swapdataResult;
    //     const txhashs = await NeoSwap.boradcastToBlockchain({
    //         sendAllArray: allInitSendAllArray,
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.keypair,
    //     });

    //     console.log("swapPda", pda.toBase58(), "\ninitialized TransacrionHashs", txhashs);
    // });

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

    // it("cancel and close", async () => {
    //     const { allCancelSendAllArray } = await NeoSwap.cancelAndClose({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.keypair.publicKey,
    //         swapDataAccount: pda,
    //         CONST_PROGRAM,
    //     });
    //     const txhashs = await NeoSwap.boradcastToBlockchain({
    //         sendAllArray: allCancelSendAllArray,
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.keypair,
    //     });
    //     console.log("Cancel & close transactionHashs :", txhashs);
    // });

    // it("initialize Swap for claim", async () => {
    //     swapData.nb_items = swapData.items.length;

    //     const {
    //         allInitSendAllArray,
    //         pda: swapPda,
    //         // txhashs,
    //         swapData: swapdataResult,
    //     } = await NeoSwap.allInitialize({
    //         provider: program.provider as anchor.AnchorProvider,
    //         CONST_PROGRAM,
    //         swapDataGiven: swapData,
    //         signer: signer.keypair.publicKey,
    //     });
    //     pda = swapPda;
    //     swapData = swapdataResult;
    //     const txhashs = await NeoSwap.boradcastToBlockchain({
    //         sendAllArray: allInitSendAllArray,
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.keypair,
    //     });

    //     console.log("swapPda :", pda.toBase58(), "\ninitialized transactionHashs:", txhashs);
    // });

    // it("Deposit not presigned for claim", async () => {
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

    //     console.log("deposited users ", transactionHashs);
    // });

    // it("claim and close", async () => {
    //     const { allClaimSendAllArray } = await NeoSwap.claimAndClose({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.keypair.publicKey,
    //         swapDataAccount: pda,
    //         CONST_PROGRAM,
    //     });

    //     const transactionHashs = await NeoSwap.boradcastToBlockchain({
    //         sendAllArray: allClaimSendAllArray,
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.keypair,
    //     });

    //     console.log("claim and close transactionHashs :", transactionHashs);
    // });
});
