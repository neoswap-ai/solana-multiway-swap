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
    ItemToSell,
    TradeStatus,
} from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/status.type.neoswap";
import { swapDataAccountGiven } from "../app/src/solana.test";
import { delay } from "../app/src/solana.utils";

describe("pre-signing", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.NeoSwap as Program;
    const nbuser = 2;
    const nftNb = [0, 1];
    let userKeypairs: { keypair: Keypair; tokens: { mint: PublicKey; ata: PublicKey }[] }[] = [];

    let signer = Keypair.generate();
    let unauthorizedKeypair: Keypair;
    let pda: PublicKey;
    let signerNft: { ata: PublicKey; mint: PublicKey };
    // let swapData: SwapData = {
    //     initializer: signer.publicKey,
    //     items: [
    //         {
    //             isNft: false,
    //             amount: new anchor.BN(-0.25 * nbuser * 10 ** 9),
    //             destinary: new PublicKey("11111111111111111111111111111111"),
    //             mint: new PublicKey("11111111111111111111111111111111"),
    //             owner: signer.publicKey,
    //             status: ItemStatus.SolToClaim,
    //         },
    //     ],
    //     status: TradeStatus.Initializing,
    //     nb_items: 1,
    // };

    it("Initializing accounts", async () => {
        // await dnsPromises.setDefaultResultOrder('ipv4first')

        console.log("programId", program.programId.toBase58());

        await program.provider.connection.requestAirdrop(signer.publicKey, 2 * LAMPORTS_PER_SOL);
        await program.provider.connection.requestAirdrop(
            new PublicKey("FzLrcnCiC4yKuBuk2g7WrC8nn7DgCT6SC46NYhx2L5Fp"),
            2 * LAMPORTS_PER_SOL
        );
        console.log(
            "signer airdrop done",
            signer.publicKey.toBase58(),
            "with ",
            (await program.provider.connection.getBalance(signer.publicKey)) / LAMPORTS_PER_SOL
        );
        // console.log(
        //     "signer airdrop done",
        //     new PublicKey("FzLrcnCiC4yKuBuk2g7WrC8nn7DgCT6SC46NYhx2L5Fp").toBase58(),
        //     "with ",
        //     (await program.provider.connection.getBalance(
        //         new PublicKey("FzLrcnCiC4yKuBuk2g7WrC8nn7DgCT6SC46NYhx2L5Fp")
        //     )) / LAMPORTS_PER_SOL
        // );

        for (let userId = 0; userId < nbuser; userId++) {
            userKeypairs[userId] = { keypair: Keypair.generate(), tokens: [] };
        }

        for await (const userKeypair of userKeypairs) {
            await program.provider.connection.confirmTransaction(
                await program.provider.connection.requestAirdrop(
                    userKeypair.keypair.publicKey,
                    1.2 * LAMPORTS_PER_SOL
                )
            );
            console.log("user airdrop done", userKeypair.keypair.publicKey.toBase58());
        }
        unauthorizedKeypair = Keypair.generate();
        await program.provider.connection.requestAirdrop(
            unauthorizedKeypair.publicKey,
            1.2 * LAMPORTS_PER_SOL
        );
    });

    it("users instruction", async () => {
        let mintPubkey = await createMint(
            program.provider.connection, // conneciton
            signer, // fee payer
            signer.publicKey, // mint authority
            signer.publicKey, // freeze authority
            0 // decimals
        );

        let ata = await createAssociatedTokenAccount(
            program.provider.connection, // conneciton
            signer, // fee payer
            mintPubkey, // mint
            signer.publicKey // owner,
        );

        signerNft = { ata, mint: mintPubkey };
        console.log("signerNft", signerNft.mint.toBase58(), "\nata: ", signerNft.ata.toBase58());

        await mintToChecked(
            program.provider.connection, // conneciton
            signer, // fee payer
            mintPubkey, // mint
            ata, // receiver
            signer.publicKey, // mint authority
            1, // amount.
            0 // decimals
        );

        for await (const userKeypair of userKeypairs) {
            console.log("XXXXXXXXXXXXXXX - user ", userKeypair.keypair.publicKey.toBase58());

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
                    10, // amount.
                    0 // decimals
                );

                const ataBalance = await program.provider.connection.getTokenAccountBalance(ata);
                console.log(
                    "mint ",
                    mintPubkey.toBase58(),
                    "\nwith ata: ",
                    ata.toBase58(),
                    "\n balance:",
                    ataBalance.value.uiAmount
                );
            }
        }
    });

    it("create User Pda", async () => {
        // console.log(swapData);

        const createUserPdaData = await NeoSwap.createUserPda({
            program,
            signer: signer.publicKey,
        });

        let userPda = createUserPdaData.userPda;
        const allInitSendAllArray = createUserPdaData.addInitSendAllArray;
        console.log("XXX-XXX userPda", userPda.toBase58());

        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

        allInitSendAllArray.signers = [signer];
        allInitSendAllArray.tx.feePayer = signer.publicKey;
        allInitSendAllArray.tx.recentBlockhash = recentBlockhash;

        const txhashs = await program.provider.sendAll([allInitSendAllArray], {
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
        const { userAddItemToSellTransaction } = await NeoSwap.userAddItemToSell({
            program,
            signer: signer.publicKey,
            itemToSell: {
                mint: signerNft.mint,
                amountMini: new BN(LAMPORTS_PER_SOL * 0.1),
            } as ItemToSell,
        });

        console.log("signerNft.mint", signerNft.mint.toBase58());

        // let userPda = createUserPdaData.userPda;
        const allInitSendAllArray = userAddItemToSellTransaction;
        // console.log("XXX-XXX userPda", userPda.toBase58());

        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

        allInitSendAllArray.signers = [signer];
        allInitSendAllArray.tx.feePayer = signer.publicKey;
        allInitSendAllArray.tx.recentBlockhash = recentBlockhash;

        const txhashs = await program.provider.sendAll([allInitSendAllArray], {
            // skipPreflight: true,
        });

        for await (const hash of txhashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("item added to sell", txhashs);
    });

    it("Update amount to topup", async () => {
        // console.log(swapData);

        const { userTransaction } = await NeoSwap.userUpdateAmountTopUp({
            program,
            signer: signer.publicKey,
            amountToTopup: 0.2,
        });

        // console.log("signerNft.mint", signerNft.mint.toBase58());

        // let userPda = createUserPdaData.userPda;
        const allInitSendAllArray = userTransaction;
        // console.log("XXX-XXX userPda", userPda.toBase58());

        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
        allInitSendAllArray.forEach((txElement) => {
            txElement.signers = [signer];
            txElement.tx.feePayer = signer.publicKey;
            txElement.tx.recentBlockhash = recentBlockhash;
        });

        const txhashs = await program.provider.sendAll(allInitSendAllArray, {
            // skipPreflight: true,
        });

        for await (const hash of txhashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("amoutn topped up", txhashs);
    });

    it("Update amount to topup second time", async () => {
        // console.log(swapData);

        const { userTransaction } = await NeoSwap.userUpdateAmountTopUp({
            program,
            signer: signer.publicKey,
            amountToTopup: 0.3,
        });

        // console.log("signerNft.mint", signerNft.mint.toBase58());

        // let userPda = createUserPdaData.userPda;
        const allInitSendAllArray = userTransaction;
        // console.log("XXX-XXX userPda", userPda.toBase58());

        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
        allInitSendAllArray.forEach((txElement) => {
            txElement.signers = [signer];
            txElement.tx.feePayer = signer.publicKey;
            txElement.tx.recentBlockhash = recentBlockhash;
        });

        const txhashs = await program.provider.sendAll(allInitSendAllArray, {
            // skipPreflight: true,
        });

        for await (const hash of txhashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("amoutn topped up", txhashs);
    });

    it("Update amount to topup third time", async () => {
        // console.log(swapData);

        const { userTransaction } = await NeoSwap.userUpdateAmountTopUp({
            program,
            signer: signer.publicKey,
            amountToTopup: 0.1,
        });

        // console.log("signerNft.mint", signerNft.mint.toBase58());

        // let userPda = createUserPdaData.userPda;
        const allInitSendAllArray = userTransaction;
        // console.log("XXX-XXX userPda", userPda.toBase58());

        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
        allInitSendAllArray.forEach((txElement) => {
            txElement.signers = [signer];
            txElement.tx.feePayer = signer.publicKey;
            txElement.tx.recentBlockhash = recentBlockhash;
        });

        const txhashs = await program.provider.sendAll(allInitSendAllArray, {
            // skipPreflight: true,
        });

        for await (const hash of txhashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("amoutn topped up", txhashs);
    });

    it("transferUserApprovedNft", async () => {
        // console.log(swapData);

        console.log("signerNft.mint", signerNft.mint.toBase58());
        console.log(
            "userKeypairs[0].keypair.publicKey",
            userKeypairs[0].keypair.publicKey.toBase58()
        );
        console.log(
            "userKeypairs[1].keypair.publicKey",
            userKeypairs[1].keypair.publicKey.toBase58()
        );

        const { userTransaction } = await NeoSwap.transferUserApprovedNft({
            program,
            user: signer.publicKey,
            delegatedMint: signerNft.mint,
            destinary: userKeypairs[0].keypair.publicKey,
            signer: userKeypairs[1].keypair.publicKey,
        });

        // console.log("signerNft.mint", signerNft.mint.toBase58());

        // let userPda = createUserPdaData.userPda;
        const allInitSendAllArray = userTransaction;
        // console.log("XXX-XXX userPda", userPda.toBase58());

        const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
        allInitSendAllArray.signers = [userKeypairs[1].keypair];
        allInitSendAllArray.tx.feePayer = userKeypairs[1].keypair.publicKey;
        allInitSendAllArray.tx.recentBlockhash = recentBlockhash;
        // allInitSendAllArray.forEach((txElement) => {
        // });

        const txhashs = await program.provider.sendAll([allInitSendAllArray], {
            skipPreflight: true,
        });

        for await (const hash of txhashs) {
            program.provider.connection.confirmTransaction(hash);
        }

        console.log("transferUserApprovedNft", txhashs);
    });
});
