import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
const { assert } = require("chai");
// import SwapData from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/swapData.types.neoswap";
// import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
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
    Cluster,
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
// import NeoSwap from "../app/src/neoSwap.module.v4.2";
// import {
//     ItemStatus,
//     TradeStatus,
// } from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/status.type.neoswap";
import { swapDataAccountGiven } from "../app/src/solana.test";
import neoSwapNpm, {
    ErrorFeedback,
    ItemStatus,
    NftSwapItem,
    SwapData,
    TradeStatus,
} from "@biboux.neoswap/neo-swap-npm";

describe("swapCoontractTest", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.NeoSwap as Program;
    const CONST_PROGRAM = "0002";
    const cluster: Cluster = "devnet";
    const nbuser = 3;
    const nftNb = [0];
    let userKeypairs: Keypair[] = [];

    let signer = Keypair.generate();
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
        nbItems: 1,
        preSeed: CONST_PROGRAM,
        acceptedPayement: SystemProgram.programId,
    };

    it("Initializing accounts", async () => {
        console.log("programId", program.programId.toBase58());

        await program.provider.connection.requestAirdrop(signer.publicKey, 2 * LAMPORTS_PER_SOL);
        await program.provider.connection.requestAirdrop(
            new PublicKey("2esVA6hnjkeVv1cNmb1cZUMrTYXqsMUxGFSVVJpRG7YM"),
            2 * LAMPORTS_PER_SOL
        );

        console.log("signer airdrop done", signer.publicKey.toBase58());

        for (let userId = 0; userId < nbuser; userId++) {
            userKeypairs.push(Keypair.generate());
        }

        for await (const userKeypair of userKeypairs) {
            await program.provider.connection.confirmTransaction(
                await program.provider.connection.requestAirdrop(
                    userKeypair.publicKey,
                    1.2 * LAMPORTS_PER_SOL
                )
            );
            console.log("user airdrop done", userKeypair.publicKey.toBase58());
        }
        unauthorizedKeypair = Keypair.generate();
        await program.provider.connection.requestAirdrop(
            unauthorizedKeypair.publicKey,
            1.2 * LAMPORTS_PER_SOL
        );
    });

    it("users instruction", async () => {
        for await (const userKeypair of userKeypairs) {
            console.log("XXXXXXXXXXXXXXX - user ", userKeypair.publicKey.toBase58());

            swapData.items.push({
                isNft: false,
                amount: new BN(0.25 * 10 ** 9),
                mint: new PublicKey("11111111111111111111111111111111"),
                status: ItemStatus.SolPending,
                owner: userKeypair.publicKey,
                destinary: new PublicKey("11111111111111111111111111111111"),
            } as NftSwapItem);

            for await (let mintNb of nftNb) {
                let mintPubkey = await createMint(
                    program.provider.connection, // conneciton
                    userKeypair, // fee payer
                    userKeypair.publicKey, // mint authority
                    userKeypair.publicKey, // freeze authority
                    0 // decimals
                );

                let ata = await createAssociatedTokenAccount(
                    program.provider.connection, // conneciton
                    userKeypair, // fee payer
                    mintPubkey, // mint
                    userKeypair.publicKey // owner,
                );

                await mintToChecked(
                    program.provider.connection, // conneciton
                    userKeypair, // fee payer
                    mintPubkey, // mint
                    ata, // receiver
                    userKeypair.publicKey, // mint authority
                    10, // amount.
                    0 // decimals
                );

                for (let index = 0; index < userKeypairs.length; index++) {
                    if (!userKeypairs[index].publicKey.equals(userKeypair.publicKey)) {
                        swapData.items.push({
                            isNft: true,
                            amount: new BN(1),
                            mint: mintPubkey,
                            status: ItemStatus.NFTPending,
                            owner: userKeypair.publicKey,
                            destinary: userKeypairs[index].publicKey,
                        } as NftSwapItem);
                    }
                }
                const ataBalance = await program.provider.connection.getTokenAccountBalance(ata);
                console.log("mint ", mintPubkey.toBase58(), "\nwith ata: ", ata.toBase58(), "\n");
            }
        }
    });

    it("initialize", async () => {
        // console.log(swapData);

        const allInitData = await neoSwapNpm.initializeSwap({
            cluster,
            signer,
            swapData,
        });
        assert.strictEqual(neoSwapNpm.utils.isErrorInitializeSwap(allInitData), false);
        if (neoSwapNpm.utils.isErrorInitializeSwap(allInitData)) throw allInitData;
        swapData = allInitData.swapIdentity.swapData;
        pda = allInitData.swapIdentity.swapDataAccount_publicKey;
        console.log("XXX-XXX pda", pda.toBase58());

        console.log("initialized", allInitData.transactionHashes);
    });

    it("Deposit", async () => {
        const res: { user: PublicKey; res: ErrorFeedback | string[] }[] = [];

        for await (const userKeypair of userKeypairs) {
            const depositData = await neoSwapNpm.depositSwap({
                cluster,
                signer: userKeypair,
                swapDataAccount: pda,
            });
            assert.strictEqual(neoSwapNpm.utils.isError(depositData), false);

            res.push({ user: userKeypair.publicKey, res: depositData });
        }
        console.log("user depositing results:", res);
    });

    it("claim and close", async () => {
        const allClaimData = await neoSwapNpm.claimAndCloseSwap({
            cluster,
            signer,
            swapDataAccount: pda,
        });
        assert.strictEqual(neoSwapNpm.utils.isError(allClaimData), false);

        console.log("claimAndCloseResult :", allClaimData);
    });

    it("initialize for cancel", async () => {
        const allInitData = await neoSwapNpm.initializeSwap({
            cluster,
            signer,
            swapData,
        });
        assert.strictEqual(neoSwapNpm.utils.isErrorInitializeSwap(allInitData), false);

        console.log("initialized", allInitData);
    });
    it("Deposit for cancel", async () => {
        const res: { user: PublicKey; res: ErrorFeedback | string[] }[] = [];

        for await (const userKeypair of userKeypairs) {
            const depositData = await neoSwapNpm.depositSwap({
                cluster,
                signer: userKeypair,
                swapDataAccount: pda,
            });
            assert.strictEqual(neoSwapNpm.utils.isError(depositData), false);

            res.push({ user: userKeypair.publicKey, res: depositData });
        }
        console.log("deposited user ", res);
    });

    it("partial cancel and close from in trade user", async () => {
        const allCancelData = await neoSwapNpm.cancelAndCloseSwap({
            signer: userKeypairs[0],
            cluster,
            swapDataAccount: pda,
        });
        assert.strictEqual(neoSwapNpm.utils.isError(allCancelData), false);

        console.log("cancelAndCloseHash :", allCancelData);
    });

    it("finish cancel and close from signer", async () => {
        const allCancelData = await neoSwapNpm.cancelAndCloseSwap({
            cluster,
            signer,
            swapDataAccount: pda,
        });
        assert.strictEqual(neoSwapNpm.utils.isError(allCancelData), false);

        console.log("cancelAndCloseHash :", allCancelData);
    });

    it("initialize for mishandling", async () => {
        const allInitData = await neoSwapNpm.initializeSwap({
            cluster,
            signer,
            swapData,
        });
        assert.strictEqual(neoSwapNpm.utils.isErrorInitializeSwap(allInitData), false);

        console.log("initialized", allInitData);
    });

    it("reinitialize should fail", async () => {
        const allInitData = await neoSwapNpm.initializeSwap({
            cluster,
            signer,
            swapData,
        });
        assert.strictEqual(neoSwapNpm.utils.isErrorInitializeSwap(allInitData), true);
    });

    it("wrong claim and close", async () => {
        const allClaimSendAllData = await neoSwapNpm.claimAndCloseSwap({
            cluster,
            signer,
            swapDataAccount: pda,
        });

        assert.strictEqual(neoSwapNpm.utils.isError(allClaimSendAllData), true);
    });

    it("cancel from unAuthorized user", async () => {
        const depositData = await neoSwapNpm.depositSwap({
            cluster,
            signer: userKeypairs[0],
            swapDataAccount: pda,
        });
        assert.strictEqual(neoSwapNpm.utils.isError(depositData), false);

        const allCancelData = await neoSwapNpm.cancelAndCloseSwap({
            signer: unauthorizedKeypair,
            cluster,
            swapDataAccount: pda,
        });
        assert.strictEqual(neoSwapNpm.utils.isError(allCancelData), true);
    });
});
