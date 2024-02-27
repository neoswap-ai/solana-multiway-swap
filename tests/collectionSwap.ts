import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
const { assert } = require("chai");
import {
    getAccountMetasAndSigners,
    createNft,
    findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    fromWeb3JsPublicKey,
    toWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";

// import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
import {
    Cluster,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    VersionedTransaction,
} from "@solana/web3.js";
// import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
// import NeoSwap from "../app/src/neoSwap.module.v4.2";
import { neoTypes, neoSwap, neoConst } from "@neoswap/solana";
// import { ErrorFeedback, NftSwapItem, SwapData, TradeStatus } from "../deleteme/types";

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
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AnchorProvider, Idl, Wallet } from "@coral-xyz/anchor";
const user6 = Keypair.fromSecretKey(user6Sk);

import { idlSwap } from "./idl";

describe("compressed NFT Test Unit", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    // let program = anchor.workspace.NeoSwap as Program;
    let clusterOrUrl =
        "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
    // "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/";
    // let clusterOrUrl = "devnet";
    let connection = new Connection(clusterOrUrl);
    let pidPk = new PublicKey("CtZHiWNnLu5rQuTN3jo7CmYDR8Wns6qXHn7taPvmnACp");
    let program = new Program(
        idlSwap as anchor.Idl,
        pidPk,
        new AnchorProvider(connection, new Wallet(signer), { maxRetries: 3 })
    );

    let swapDataAccount = new PublicKey(
        "7Vnt8ifj2w3NrLcbt5dyyqpPnJxsvh7V9x1q7eL1tNw6"
    );
    // let swapDataAccount: PublicKey | undefined = undefined;
    let mint = new PublicKey("8n6EL6wceWymYJdfJvfRxiXWmcfX9tySsRXDRqZxSe1f");
    let collection = new PublicKey(
        "BamRUYoLsaomADRMdE2HXdpu9N8CUdCWwswup3yDjjBF"
    );
    let paymentMint = new PublicKey(
        "VkW2xoKYRe8zVJgtX6otepGpw7cVvVMF2jVBPxDopw3"
    );
    let duration = new BN(0);

    it("DatUsers", async () => {
        console.log("signer", signer.publicKey.toBase58());
        console.log("user1", user1.publicKey.toBase58());
        console.log("user2", user2.publicKey.toBase58());
        if (swapDataAccount)
            console.log("swapDataAccount", swapDataAccount.toBase58());
    });

    // it("initialize swapDataAccount", async () => {
    //     try {
    //         if (!swapDataAccount) {
    //             let maker = user1;
    //             let swapDataAccount = PublicKey.findProgramAddressSync(
    //                 [
    //                     Buffer.from(
    //                         maker.publicKey.toString().slice(0, 16) +
    //                             mint.toString().slice(0, 16)
    //                     ),
    //                 ],
    //                 pidPk
    //             )[0];
    //             console.log("swapDataAccount", swapDataAccount.toBase58());

    //             const initIx = await program.methods
    //                 .initialize(mint, paymentMint, duration)
    //                 .accounts({
    //                     swapDataAccount,
    //                     systemProgram: SystemProgram.programId.toBase58(),
    //                     maker: maker.publicKey,
    //                 })
    //                 .instruction();

    //             const tx = new Transaction().add(initIx);
    //             tx.feePayer = maker.publicKey;
    //             tx.recentBlockhash = (
    //                 await connection.getLatestBlockhash()
    //             ).blockhash;
    //             let vTx = new VersionedTransaction(tx.compileMessage());
    //             vTx.sign([maker]);
    //             const txSig = await connection.sendTransaction(vTx);
    //             console.log("txSig", txSig);
    //         } else {
    //             console.log("initiaize skipped", swapDataAccount.toBase58());
    //         }
    //     } catch (error) {
    //         console.log(error);
    //         throw error;
    //     }
    // });

    it("Deposit Initial Bid", async () => {
        try {
            if (swapDataAccount) {
                let maker = user1;
                let bidToAdd: Bid = {
                    collection,
                    amount: new BN(100),
                    fee: {
                        makerNeoswapFee: 1,
                        makerRoyalties: 2,
                        takerNeoswapFee: 3,
                        takerRoyalties: 4,
                    },
                };
                let instructions: TransactionInstruction[] = [];
                let {
                    mintAta: swapDataAccountNftAta,
                    instruction: swapDataAccountNftAtaIx,
                } = await neoSwap.UTILS.findOrCreateAta({
                    connection,
                    mint,
                    owner: swapDataAccount,
                    signer: maker.publicKey,
                });
                if (swapDataAccountNftAtaIx) {
                    instructions.push(swapDataAccountNftAtaIx);
                    console.log(
                        "swapDataAccountNftAta",
                        swapDataAccountNftAta.toBase58()
                    );
                }

                let {
                    mintAta: swapDataAccountTokenAta,
                    instruction: swapDataAccountTokenAtaIx,
                } = await neoSwap.UTILS.findOrCreateAta({
                    connection,
                    mint: paymentMint,
                    owner: swapDataAccount,
                    signer: maker.publicKey,
                });
                if (swapDataAccountTokenAtaIx) {
                    instructions.push(swapDataAccountTokenAtaIx);
                    console.log(
                        "swapDataAccountTokenAta",
                        swapDataAccountTokenAta.toBase58()
                    );
                }

                let { mintAta: makerNftAta, instruction: mn } =
                    await neoSwap.UTILS.findOrCreateAta({
                        connection,
                        mint,
                        owner: maker.publicKey,
                        signer: maker.publicKey,
                    });
                if (!mn) console.log("makerNftAta", makerNftAta.toBase58());

                let { mintAta: makerTokenAta, instruction: mt } =
                    await neoSwap.UTILS.findOrCreateAta({
                        connection,
                        mint: paymentMint,
                        owner: maker.publicKey,
                        signer: maker.publicKey,
                    });
                if (!mt) console.log("makerTokenAta", makerTokenAta.toBase58());

                const nftMetadata = PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("metadata"),
                        neoConst.TOKEN_METADATA_PROGRAM.toBuffer(),
                        mint.toBuffer(),
                    ],
                    neoConst.TOKEN_METADATA_PROGRAM
                )[0];

                console.log("nftMetadata", nftMetadata.toBase58());
                console.log("SYSv", SYSVAR_INSTRUCTIONS_PUBKEY.toBytes());

                const initIx = await program.methods
                    .makeSwap(bidToAdd)
                    .accounts({
                        swapDataAccount,
                        swapDataAccountNftAta,
                        swapDataAccountTokenAta,

                        maker: maker.publicKey,
                        makerNftAta,
                        makerTokenAta,

                        mintNft: mint,
                        mintToken: paymentMint,

                        nftMetadata,
                        nftMasterEdition: maker.publicKey,
                        ownerTokenRecord: maker.publicKey,
                        destinationTokenRecord: maker.publicKey,
                        authRules: maker.publicKey,

                        systemProgram: SystemProgram.programId,
                        metadataProgram: neoConst.TOKEN_METADATA_PROGRAM,
                        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                        // new PublicKey(
                        //     "Sysvar1111111111111111111111111111111111111"
                        // ),
                        tokenProgram: TOKEN_PROGRAM_ID,
                        ataProgram: neoConst.SOLANA_SPL_ATA_PROGRAM_ID,
                        authRulesProgram: neoConst.METAPLEX_AUTH_RULES_PROGRAM,
                    })
                    .instruction();
                instructions.push(initIx);
                const tx = new Transaction().add(...instructions);
                tx.feePayer = maker.publicKey;
                tx.recentBlockhash = (
                    await connection.getLatestBlockhash()
                ).blockhash;
                // let simu = await connection.simulateTransaction(tx);
                // console.log("simu", simu);
                tx.sign(maker);
                const txSig = await connection.sendRawTransaction(
                    tx.serialize()
                );
                console.log("txSig", txSig);

                // let vTx = new VersionedTransaction(tx.compileMessage());
                // vTx.signatures.pop();
                // vTx.signatures.pop();
                // console.log("vTx", vTx);

                // vTx.sign([maker]);
                // console.log("vTx", vTx);

                // const txSig = await connection.sendRawTransaction(
                //     vTx.serialize()
                // );
            } else {
                console.log("initiaize skipped", swapDataAccount.toBase58());
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    });
    // const initIx = await program.methods
    // .depositNft(Data.swapIdentity.swapDataAccount_seed)
    // .accounts({
    //     systemProgram: SystemProgram.programId.toBase58(),
    //     metadataProgram: TOKEN_METADATA_PROGRAM,
    //     sysvarInstructions:
    //         SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
    //     splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
    //     splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
    //     swapDataAccount:
    //         Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
    //     signer: Data.signer.toBase58(),
    //     itemFromDeposit: userAta.toBase58(),
    //     mint: Data.mint.toBase58(),
    //     nftMetadata: nftMetadata.toBase58(),
    //     itemToDeposit: pdaAta.toBase58(),
    //     nftMasterEdition: nftMasterEdition.toBase58(),
    //     ownerTokenRecord: ownerTokenRecord.toBase58(),
    //     destinationTokenRecord:
    //         destinationTokenRecord.toBase58(),
    //     authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
    //     authRules,
    // })
    // .instruction();
    // it("readData", async () => {
    //     const swapdaata = await neoSwap.UTILS.getSwapDataAccountFromPublicKey({
    //         program: neoSwap.UTILS.getProgram({ clusterOrUrl }),
    //         swapDataAccount_publicKey: swapDataAccount,
    //     });
    //     console.log("swapdaata", swapdaata);
    // });
});

type Bid = {
    collection: PublicKey;
    amount: BN;
    fee: Fees;
};
type Fees = {
    makerNeoswapFee: number;
    takerNeoswapFee: number;
    takerRoyalties: number;
    makerRoyalties: number;
};
