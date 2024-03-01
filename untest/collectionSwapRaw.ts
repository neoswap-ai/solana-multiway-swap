import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
const { assert } = require("chai");
import {
    getAccountMetasAndSigners,
    createNft,
    findMetadataPda,
    TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsPublicKey, toWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";

// import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
import {
    Cluster,
    ComputeBudgetProgram,
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

import { idlSwap } from "../tests/idl";
import { Metaplex } from "@metaplex-foundation/js";
import { none, some } from "@metaplex-foundation/umi";

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

    let nsFee = new PublicKey("FjecsBcSXQh4rjPSksh2eBiXUswcMpAwU25ykcr842j8");
    // let swapDataAccount = new PublicKey("7Vnt8ifj2w3NrLcbt5dyyqpPnJxsvh7V9x1q7eL1tNw6"); // one way
    let swapDataAccount = new PublicKey("AbJJYus1SBmXtDBJeRGezFhaoHonSrkDEJCHYLUAKdzr"); // reverse
    
    // let swapDataAccount: PublicKey | undefined = undefined;

    // let maker_mint = new PublicKey("8n6EL6wceWymYJdfJvfRxiXWmcfX9tySsRXDRqZxSe1f");
    // let maker_collection = new PublicKey("BamRUYoLsaomADRMdE2HXdpu9N8CUdCWwswup3yDjjBF");

    // let taker_mint = new PublicKey("EtmJDdHMpd8aC1SAnFodzY9GRMmMgDw5zKscRvjCVjcP");
    // let taker_collection = new PublicKey("DvwXZN69F8eRVSoac2qMzSdceDQCBWQWVWqWjpbcG8o4");

    //reverse
    let taker_mint = new PublicKey("8n6EL6wceWymYJdfJvfRxiXWmcfX9tySsRXDRqZxSe1f");
    let taker_collection = new PublicKey("BamRUYoLsaomADRMdE2HXdpu9N8CUdCWwswup3yDjjBF");

    let maker_mint = new PublicKey("EtmJDdHMpd8aC1SAnFodzY9GRMmMgDw5zKscRvjCVjcP");
    let maker_collection = new PublicKey("DvwXZN69F8eRVSoac2qMzSdceDQCBWQWVWqWjpbcG8o4");

    let paymentMint = new PublicKey("VkW2xoKYRe8zVJgtX6otepGpw7cVvVMF2jVBPxDopw3");
    let endBid = new BN(0);

    let bid: Bid = {
        collection: taker_collection,
        amount: new BN(10 ** 9),

        makerNeoswapFee: new BN(1 * 10 ** 7),
        makerRoyalties: new BN(2 * 10 ** 7),
        takerNeoswapFee: new BN(3 * 10 ** 7),
        takerRoyalties: new BN(4 * 10 ** 7),
    };

    it("DatUsers", async () => {
        console.log("signer", signer.publicKey.toBase58());
        console.log("user1", user1.publicKey.toBase58());
        console.log("user2", user2.publicKey.toBase58());
        if (swapDataAccount) console.log("swapDataAccount", swapDataAccount.toBase58());
    });

    it("MakeSwap", async () => {
        try {
            if (!swapDataAccount) {
                let maker = user1;

                swapDataAccount = PublicKey.findProgramAddressSync(
                    [
                        Buffer.from(
                            maker.publicKey.toString().slice(0, 16) +
                                maker_mint.toString().slice(0, 16)
                        ),
                    ],
                    pidPk
                )[0];
                console.log("swapDataAccount", swapDataAccount.toBase58());

                let instructions: TransactionInstruction[] = [
                    ComputeBudgetProgram.setComputeUnitLimit({
                        units: 300000,
                    }),
                ];
                let { mintAta: swapDataAccountNftAta, instruction: swapDataAccountNftAtaIx } =
                    await neoSwap.UTILS.findOrCreateAta({
                        connection,
                        mint: maker_mint,
                        owner: swapDataAccount,
                        signer: maker.publicKey,
                    });
                if (swapDataAccountNftAtaIx) {
                    instructions.push(swapDataAccountNftAtaIx);
                    console.log("swapDataAccountNftAta", swapDataAccountNftAta.toBase58());
                }

                let { mintAta: swapDataAccountTokenAta, instruction: swapDataAccountTokenAtaIx } =
                    await neoSwap.UTILS.findOrCreateAta({
                        connection,
                        mint: paymentMint,
                        owner: swapDataAccount,
                        signer: maker.publicKey,
                    });
                if (swapDataAccountTokenAtaIx) {
                    instructions.push(swapDataAccountTokenAtaIx);
                    console.log("swapDataAccountTokenAta", swapDataAccountTokenAta.toBase58());
                }

                let { mintAta: makerNftAta, instruction: mn } = await neoSwap.UTILS.findOrCreateAta(
                    {
                        connection,
                        mint: maker_mint,
                        owner: maker.publicKey,
                        signer: maker.publicKey,
                    }
                );
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
                        maker_mint.toBuffer(),
                    ],
                    neoConst.TOKEN_METADATA_PROGRAM
                )[0];

                console.log("nftMetadata", nftMetadata.toBase58());

                const metaplex = new Metaplex(connection);
                const nft = await metaplex.nfts().findByMint({ mintAddress: maker_mint });
                let nftMasterEdition = user1.publicKey;
                let ownerTokenRecord = user1.publicKey;
                let destinationTokenRecord = user1.publicKey;
                let authRules = user1.publicKey;

                if (nft.tokenStandard == TokenStandard.ProgrammableNonFungible) {
                    const nftMasterEditionF = neoSwap.UTILS.NFT_ACCOUNTS.findNftMasterEdition({
                        mint: maker_mint,
                    });

                    const ownerTokenRecordF = neoSwap.UTILS.NFT_ACCOUNTS.findUserTokenRecord({
                        mint: maker_mint,
                        userMintAta: makerNftAta,
                    });

                    const destinationTokenRecordF = neoSwap.UTILS.NFT_ACCOUNTS.findUserTokenRecord({
                        mint: maker_mint,
                        userMintAta: makerNftAta,
                    });

                    const authRulesF = await neoSwap.UTILS.NFT_ACCOUNTS.findRuleSet({
                        connection,
                        mint: maker_mint,
                    });
                    nftMasterEdition = nftMasterEditionF;
                    ownerTokenRecord = ownerTokenRecordF;
                    destinationTokenRecord = destinationTokenRecordF;
                    authRules = authRulesF;
                }
                console.log("bid", bid);

                const initIx = await program.methods
                    .makeSwap(bid, endBid)
                    .accounts({
                        swapDataAccount,
                        swapDataAccountNftAta,
                        swapDataAccountTokenAta,

                        maker: maker.publicKey,
                        makerNftAta,
                        makerTokenAta,

                        mintNft: maker_mint,
                        mintToken: paymentMint,

                        nftMetadata,
                        nftMasterEdition,
                        ownerTokenRecord,
                        destinationTokenRecord,
                        authRules,

                        systemProgram: SystemProgram.programId,
                        metadataProgram: neoConst.TOKEN_METADATA_PROGRAM,
                        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        ataProgram: neoConst.SOLANA_SPL_ATA_PROGRAM_ID,
                        authRulesProgram: neoConst.METAPLEX_AUTH_RULES_PROGRAM,
                    })
                    .instruction();
                instructions.push(initIx);
                const tx = new Transaction().add(...instructions);
                tx.feePayer = maker.publicKey;
                tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                // let simu = await connection.simulateTransaction(tx);
                // console.log("simu", simu.value);
                const txSig = await connection.sendTransaction(tx, [maker]);
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
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    });

    // it("cancelSwap", async () => {
    //     let maker = user1;
    //     let instructions: TransactionInstruction[] = [];
    //     let { mintAta: swapDataAccountNftAta, instruction: sn } =
    //         await neoSwap.UTILS.findOrCreateAta({
    //             connection,
    //             mint: maker_mint,
    //             owner: swapDataAccount,
    //             signer: maker.publicKey,
    //         });
    //     if (!sn) {
    //         console.log("swapDataAccountNftAta", swapDataAccountNftAta.toBase58());
    //     }

    //     let { mintAta: swapDataAccountTokenAta, instruction: st } =
    //         await neoSwap.UTILS.findOrCreateAta({
    //             connection,
    //             mint: paymentMint,
    //             owner: swapDataAccount,
    //             signer: maker.publicKey,
    //         });
    //     if (!st) {
    //         console.log("swapDataAccountTokenAta", swapDataAccountTokenAta.toBase58());
    //     }

    //     let { mintAta: makerNftAta, instruction: mn } = await neoSwap.UTILS.findOrCreateAta({
    //         connection,
    //         mint: maker_mint,
    //         owner: maker.publicKey,
    //         signer: maker.publicKey,
    //     });
    //     if (!mn) console.log("makerNftAta", makerNftAta.toBase58());

    //     let { mintAta: makerTokenAta, instruction: mt } = await neoSwap.UTILS.findOrCreateAta({
    //         connection,
    //         mint: paymentMint,
    //         owner: maker.publicKey,
    //         signer: maker.publicKey,
    //     });
    //     if (!mt) console.log("makerTokenAta", makerTokenAta.toBase58());
    //     const nftMetadata = PublicKey.findProgramAddressSync(
    //         [
    //             Buffer.from("metadata"),
    //             neoConst.TOKEN_METADATA_PROGRAM.toBuffer(),
    //             maker_mint.toBuffer(),
    //         ],
    //         neoConst.TOKEN_METADATA_PROGRAM
    //     )[0];
    //     console.log("nftMetadata", nftMetadata.toBase58());

    //     // const { metadataAddress: ndftMetadata, tokenStandard } =
    //     //     await neoSwap.UTILS.NFT_ACCOUNTS.findNftDataAndMetadataAccount({
    //     //         connection,
    //     //         mint: maker_mint,
    //     //     });
    //     const metaplex = new Metaplex(connection);
    //     const nft = await metaplex.nfts().findByMint({ mintAddress: maker_mint });
    //     // console.log("nft", nft);
    //     // console.log("nftMetadata", nftMetadata.toBase58());

    //     let nftMasterEdition = user1.publicKey;
    //     let ownerTokenRecord = user1.publicKey;
    //     let destinationTokenRecord = user1.publicKey;
    //     let authRules = user1.publicKey;

    //     if (nft.tokenStandard == TokenStandard.ProgrammableNonFungible) {
    //         const nftMasterEditionF = neoSwap.UTILS.NFT_ACCOUNTS.findNftMasterEdition({
    //             mint: maker_mint,
    //         });

    //         const ownerTokenRecordF = neoSwap.UTILS.NFT_ACCOUNTS.findUserTokenRecord({
    //             mint: maker_mint,
    //             userMintAta: makerNftAta,
    //         });

    //         const destinationTokenRecordF = neoSwap.UTILS.NFT_ACCOUNTS.findUserTokenRecord({
    //             mint: maker_mint,
    //             userMintAta: makerNftAta,
    //         });

    //         const authRulesF = await neoSwap.UTILS.NFT_ACCOUNTS.findRuleSet({
    //             connection,
    //             mint: maker_mint,
    //         });
    //         nftMasterEdition = nftMasterEditionF;
    //         ownerTokenRecord = ownerTokenRecordF;
    //         destinationTokenRecord = destinationTokenRecordF;
    //         authRules = authRulesF;
    //     }

    //     const initIx = await program.methods
    //         .cancelSwap()
    //         .accounts({
    //             swapDataAccount,
    //             swapDataAccountNftAta,
    //             swapDataAccountTokenAta,

    //             maker: user1.publicKey,
    //             makerNftAta,
    //             makerTokenAta,

    //             mintNft: maker_mint,
    //             mintToken: paymentMint,

    //             nftMetadata,
    //             nftMasterEdition,
    //             ownerTokenRecord,
    //             destinationTokenRecord,
    //             authRules,

    //             systemProgram: SystemProgram.programId,
    //             metadataProgram: neoConst.TOKEN_METADATA_PROGRAM,
    //             sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    //             tokenProgram: TOKEN_PROGRAM_ID,
    //             ataProgram: neoConst.SOLANA_SPL_ATA_PROGRAM_ID,
    //             authRulesProgram: neoConst.METAPLEX_AUTH_RULES_PROGRAM,
    //         })
    //         .instruction();
    //     instructions.push(initIx);

    //     const tx = new Transaction().add(...instructions);
    //     tx.feePayer = user1.publicKey;
    //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    //     // let simu = await connection.simulateTransaction(tx);
    //     // console.log("simu", simu.value);
    //     // tx.sign(user1);
    //     const txSig = await connection.sendTransaction(tx, [user1]);
    //     console.log("txSig", txSig);
    // });

    // it("TakeSwap", async () => {
    //     try {
    //         if (swapDataAccount) {
    //             let taker = user2;
    //             let maker = user1.publicKey;

    //             let instructions: TransactionInstruction[] = [
    //                 ComputeBudgetProgram.setComputeUnitLimit({
    //                     units: 250000,
    //                 }),
    //             ];
    //             let { mintAta: takerNftAta, instruction: takerNftAtaIx } =
    //                 await neoSwap.UTILS.findOrCreateAta({
    //                     connection,
    //                     mint: taker_mint,
    //                     owner: taker.publicKey,
    //                     signer: taker.publicKey,
    //                 });
    //             if (takerNftAtaIx) {
    //                 instructions.push(takerNftAtaIx);
    //                 console.log("takerNftAta", takerNftAta.toBase58());
    //             }

    //             let { mintAta: takerTokenAta, instruction: takerTokenAtaIx } =
    //                 await neoSwap.UTILS.findOrCreateAta({
    //                     connection,
    //                     mint: paymentMint,
    //                     owner: taker.publicKey,
    //                     signer: taker.publicKey,
    //                 });
    //             if (takerTokenAtaIx) {
    //                 instructions.push(takerTokenAtaIx);
    //                 console.log("takerTokenAta", takerTokenAta.toBase58());
    //             }

    //             let { mintAta: makerNftAta, instruction: mn } = await neoSwap.UTILS.findOrCreateAta(
    //                 {
    //                     connection,
    //                     mint: taker_mint,
    //                     owner: maker,
    //                     signer: taker.publicKey,
    //                 }
    //             );
    //             if (mn) {
    //                 instructions.push(mn);
    //                 console.log("makerNftAta", makerNftAta.toBase58());
    //             }

    //             let { mintAta: makerTokenAta, instruction: mt } =
    //                 await neoSwap.UTILS.findOrCreateAta({
    //                     connection,
    //                     mint: paymentMint,
    //                     owner: maker,
    //                     signer: taker.publicKey,
    //                 });
    //             if (mt) {
    //                 instructions.push(mt);
    //                 console.log("makerTokenAta", makerTokenAta.toBase58());
    //             }
    //             let { mintAta: swapDataAccountTokenAta, instruction: sdata } =
    //                 await neoSwap.UTILS.findOrCreateAta({
    //                     connection,
    //                     mint: paymentMint,
    //                     owner: swapDataAccount,
    //                     signer: taker.publicKey,
    //                 });
    //             if (sdata) {
    //                 instructions.push(sdata);
    //                 console.log("swapDataAccountTokenAta", swapDataAccountTokenAta.toBase58());
    //             }
    //             let { mintAta: nsFeeTokenAta, instruction: nsfta } =
    //                 await neoSwap.UTILS.findOrCreateAta({
    //                     connection,
    //                     mint: paymentMint,
    //                     owner: nsFee,
    //                     signer: taker.publicKey,
    //                 });
    //             if (nsfta) {
    //                 instructions.push(nsfta);
    //                 console.log("nsFeeTokenAta", nsFeeTokenAta.toBase58());
    //             }

    //             const nftMetadata = PublicKey.findProgramAddressSync(
    //                 [
    //                     Buffer.from("metadata"),
    //                     neoConst.TOKEN_METADATA_PROGRAM.toBuffer(),
    //                     taker_mint.toBuffer(),
    //                 ],
    //                 neoConst.TOKEN_METADATA_PROGRAM
    //             )[0];
    //             console.log("nftMetadata", nftMetadata.toBase58());

    //             const metaplex = new Metaplex(connection);
    //             const nft = await metaplex.nfts().findByMint({ mintAddress: maker_mint });
    //             let nftMasterEdition = user1.publicKey;
    //             let ownerTokenRecord = user1.publicKey;
    //             let destinationTokenRecord = user1.publicKey;
    //             let authRules = user1.publicKey;

    //             if (nft.tokenStandard == TokenStandard.ProgrammableNonFungible) {
    //                 const nftMasterEditionF = neoSwap.UTILS.NFT_ACCOUNTS.findNftMasterEdition({
    //                     mint: maker_mint,
    //                 });

    //                 const ownerTokenRecordF = neoSwap.UTILS.NFT_ACCOUNTS.findUserTokenRecord({
    //                     mint: maker_mint,
    //                     userMintAta: makerNftAta,
    //                 });

    //                 const destinationTokenRecordF = neoSwap.UTILS.NFT_ACCOUNTS.findUserTokenRecord({
    //                     mint: maker_mint,
    //                     userMintAta: makerNftAta,
    //                 });

    //                 const authRulesF = await neoSwap.UTILS.NFT_ACCOUNTS.findRuleSet({
    //                     connection,
    //                     mint: maker_mint,
    //                 });
    //                 nftMasterEdition = nftMasterEditionF;
    //                 ownerTokenRecord = ownerTokenRecordF;
    //                 destinationTokenRecord = destinationTokenRecordF;
    //                 authRules = authRulesF;
    //             }

    //             const initIx = await program.methods
    //                 .takeSwap(bid)
    //                 .accounts({
    //                     swapDataAccount,
    //                     swapDataAccountTokenAta,

    //                     maker,
    //                     makerNftAta,
    //                     makerTokenAta,

    //                     taker: taker.publicKey,
    //                     takerNftAta,
    //                     takerTokenAta,

    //                     nsFee,
    //                     nsFeeTokenAta,

    //                     nftMintTaker: taker_mint,
    //                     mintToken: paymentMint,

    //                     nftMetadata,
    //                     nftMasterEdition,
    //                     ownerTokenRecord,
    //                     destinationTokenRecord,
    //                     authRules,

    //                     systemProgram: SystemProgram.programId,
    //                     metadataProgram: neoConst.TOKEN_METADATA_PROGRAM,
    //                     sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    //                     tokenProgram: TOKEN_PROGRAM_ID,
    //                     ataProgram: neoConst.SOLANA_SPL_ATA_PROGRAM_ID,
    //                     authRulesProgram: neoConst.METAPLEX_AUTH_RULES_PROGRAM,
    //                 })
    //                 .instruction();
    //             instructions.push(initIx);

    //             const tx = new Transaction().add(...instructions);
    //             tx.feePayer = taker.publicKey;
    //             tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    //             // let simu = await connection.simulateTransaction(tx);
    //             // console.log("simu", simu.value);
    //             // tx.sign(taker);
    //             const txSig = await connection.sendTransaction(tx, [taker]);
    //             console.log("txSig", txSig);
    //         } else {
    //             console.log("takeswap skipped");
    //         }
    //     } catch (error) {
    //         console.log(error);
    //         throw error;
    //     }
    // });

    //
    //
    //
    //

    // it("payRoyaltes", async () => {
    //     try {
    //         if (swapDataAccount) {
    //             let taker = user2;
    //             let maker = user1.publicKey;

    //             let instructions: TransactionInstruction[] = [
    //                 ComputeBudgetProgram.setComputeUnitLimit({
    //                     units: 300000,
    //                 }),
    //             ];
    //             let { mintAta: takerNftAta, instruction: takerNftAtaIx } =
    //                 await neoSwap.UTILS.findOrCreateAta({
    //                     connection,
    //                     mint: taker_mint,
    //                     owner: taker.publicKey,
    //                     signer: taker.publicKey,
    //                 });
    //             if (takerNftAtaIx) {
    //                 instructions.push(takerNftAtaIx);
    //                 console.log("takerNftAta", takerNftAta.toBase58());
    //             }

    //             let { mintAta: takerTokenAta, instruction: takerTokenAtaIx } =
    //                 await neoSwap.UTILS.findOrCreateAta({
    //                     connection,
    //                     mint: paymentMint,
    //                     owner: taker.publicKey,
    //                     signer: taker.publicKey,
    //                 });
    //             if (takerTokenAtaIx) {
    //                 instructions.push(takerTokenAtaIx);
    //                 console.log("takerTokenAta", takerTokenAta.toBase58());
    //             }

    //             let { mintAta: makerNftAta, instruction: mn } = await neoSwap.UTILS.findOrCreateAta(
    //                 {
    //                     connection,
    //                     mint: taker_mint,
    //                     owner: maker,
    //                     signer: taker.publicKey,
    //                 }
    //             );
    //             if (mn) {
    //                 instructions.push(mn);
    //                 console.log("makerNftAta", makerNftAta.toBase58());
    //             }

    //             let { mintAta: makerTokenAta, instruction: mt } =
    //                 await neoSwap.UTILS.findOrCreateAta({
    //                     connection,
    //                     mint: paymentMint,
    //                     owner: maker,
    //                     signer: taker.publicKey,
    //                 });
    //             if (mt) {
    //                 instructions.push(mt);
    //                 console.log("makerTokenAta", makerTokenAta.toBase58());
    //             }
    //             let { mintAta: swapDataAccountTokenAta, instruction: sdata } =
    //                 await neoSwap.UTILS.findOrCreateAta({
    //                     connection,
    //                     mint: paymentMint,
    //                     owner: swapDataAccount,
    //                     signer: taker.publicKey,
    //                 });
    //             if (sdata) {
    //                 instructions.push(sdata);
    //                 console.log("swapDataAccountTokenAta", swapDataAccountTokenAta.toBase58());
    //             }
    //             let { mintAta: nsFeeTokenAta, instruction: nsfta } =
    //                 await neoSwap.UTILS.findOrCreateAta({
    //                     connection,
    //                     mint: paymentMint,
    //                     owner: nsFee,
    //                     signer: taker.publicKey,
    //                 });
    //             if (nsfta) {
    //                 instructions.push(nsfta);
    //                 console.log("nsFeeTokenAta", nsFeeTokenAta.toBase58());
    //             }

    //             const takerNftMetadata = PublicKey.findProgramAddressSync(
    //                 [
    //                     Buffer.from("metadata"),
    //                     neoConst.TOKEN_METADATA_PROGRAM.toBuffer(),
    //                     taker_mint.toBuffer(),
    //                 ],
    //                 neoConst.TOKEN_METADATA_PROGRAM
    //             )[0];
    //             console.log("takerNftMetadata", takerNftMetadata.toBase58());

    //             const makerNftMetadata = PublicKey.findProgramAddressSync(
    //                 [
    //                     Buffer.from("metadata"),
    //                     neoConst.TOKEN_METADATA_PROGRAM.toBuffer(),
    //                     maker_mint.toBuffer(),
    //                 ],
    //                 neoConst.TOKEN_METADATA_PROGRAM
    //             )[0];
    //             console.log("makerNftMetadata", makerNftMetadata.toBase58());
    //             const metaplex = new Metaplex(connection);
    //             const nftMaker = await metaplex.nfts().findByMint({ mintAddress: maker_mint });
    //             const tftMaker = await metaplex.nfts().findByMint({ mintAddress: taker_mint });
    //             console.log("taker.publicKey", taker.publicKey);

    //             let makerCreator = [taker.publicKey, taker.publicKey, taker.publicKey];
    //             let takerAta = (
    //                 await neoSwap.UTILS.findOrCreateAta({
    //                     connection,
    //                     mint: paymentMint,
    //                     owner: taker.publicKey,
    //                     signer: taker.publicKey,
    //                 })
    //             ).mintAta;
    //             let makerCreatorTokenAta = [takerAta, takerAta, takerAta];

    //             let takerCreator = makerCreator;
    //             let takerCreatorTokenAta = makerCreatorTokenAta;
    //             let mintAtaList: string[] = [];
    //             // let makerI = 0;
    //             await Promise.all(
    //                 nftMaker.creators.map(async (c, i) => {
    //                     if (c.verified) {
    //                         makerCreator[i] = c.address;
    //                         let ataData = await neoSwap.UTILS.findOrCreateAta({
    //                             connection,
    //                             mint: paymentMint,
    //                             owner: c.address,
    //                             signer: taker.publicKey,
    //                         });
    //                         if (
    //                             ataData.instruction &&
    //                             !!c.verified &&
    //                             !mintAtaList.includes(ataData.mintAta.toString())
    //                         ) {
    //                             instructions.push(ataData.instruction);
    //                             mintAtaList.push(ataData.mintAta.toString());
    //                         }
    //                         makerCreatorTokenAta[i] = ataData.mintAta;
    //                     }
    //                 })
    //             );
    //             console.log(
    //                 "makerCreator",
    //                 makerCreator.map((m) => m.toBase58())
    //             );
    //             console.log(
    //                 "makerCreatorTokenAta",
    //                 makerCreatorTokenAta.map((m) => m.toBase58())
    //             );

    //             // let takerI = 0;
    //             await Promise.all(
    //                 tftMaker.creators.map(async (c, i) => {
    //                     if (c.verified) {
    //                         takerCreator[i] = c.address;
    //                         let ataData = await neoSwap.UTILS.findOrCreateAta({
    //                             connection,
    //                             mint: paymentMint,
    //                             owner: c.address,
    //                             signer: taker.publicKey,
    //                         });
    //                         takerCreatorTokenAta[i] = ataData.mintAta;
    //                         if (
    //                             ataData.instruction &&
    //                             !mintAtaList.includes(ataData.mintAta.toString())
    //                         ) {
    //                             instructions.push(ataData.instruction);
    //                             mintAtaList.push(ataData.mintAta.toString());
    //                         }
    //                     }
    //                 })
    //             );
    //             console.log(
    //                 "makerCreator",
    //                 makerCreator.map((m) => m.toBase58())
    //             );
    //             console.log(
    //                 "takerCreatorTokenAta",
    //                 takerCreatorTokenAta.map((m) => m.toBase58())
    //             );
    //             const initIx = await program.methods
    //                 .payRoyalties()
    //                 .accounts({
    //                     swapDataAccount,
    //                     swapDataAccountTokenAta,

    //                     maker,
    //                     makerNftAta,
    //                     makerTokenAta,

    //                     taker: taker.publicKey,
    //                     takerNftAta,
    //                     takerTokenAta,

    //                     nsFee,
    //                     nsFeeTokenAta,

    //                     takerMintNft: taker_mint,
    //                     mintToken: paymentMint,

    //                     takerNftMetadata,
    //                     makerNftMetadata,

    //                     systemProgram: SystemProgram.programId,
    //                     metadataProgram: neoConst.TOKEN_METADATA_PROGRAM,
    //                     sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    //                     tokenProgram: TOKEN_PROGRAM_ID,
    //                     ataProgram: neoConst.SOLANA_SPL_ATA_PROGRAM_ID,
    //                     authRulesProgram: neoConst.METAPLEX_AUTH_RULES_PROGRAM,

    //                     makerCreator0: makerCreator[0],
    //                     makerCreator0TokenAta: makerCreatorTokenAta[0],
    //                     makerCreator1: makerCreator[1],
    //                     makerCreator1TokenAta: makerCreatorTokenAta[1],
    //                     makerCreator2: makerCreator[2],
    //                     makerCreator2TokenAta: makerCreatorTokenAta[2],
    //                     takerCreator0: takerCreator[0],
    //                     takerCreator0TokenAta: takerCreatorTokenAta[0],
    //                     takerCreator1: takerCreator[1],
    //                     takerCreator1TokenAta: takerCreatorTokenAta[1],
    //                     takerCreator2: takerCreator[2],
    //                     takerCreator2TokenAta: takerCreatorTokenAta[2],
    //                 })
    //                 .instruction();
    //             instructions.push(initIx);

    //             const tx = new Transaction().add(...instructions);
    //             tx.feePayer = taker.publicKey;
    //             tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    //             // let simu = await connection.simulateTransaction(tx);
    //             // console.log("simu", simu.value);
    //             // tx.sign(taker);
    //             const txSig = await connection.sendTransaction(tx, [taker]);
    //             console.log("txSig", txSig);
    //         } else {
    //             console.log("initiaize skipped", swapDataAccount.toBase58());
    //         }
    //     } catch (error) {
    //         console.log(error);
    //         throw error;
    //     }
    // });

    //
    //
    //
    //
    //
    //
    //
    //

    it("claimSwap", async () => {
        try {
            if (swapDataAccount) {
                let taker = user2;
                let maker = user1.publicKey;

                let instructions: TransactionInstruction[] = [
                    ComputeBudgetProgram.setComputeUnitLimit({
                        units: 250000,
                    }),
                ];
                let { mintAta: takerMakerNftAta, instruction: takerNftAtaIx } =
                    await neoSwap.UTILS.findOrCreateAta({
                        connection,
                        mint: maker_mint,
                        owner: taker.publicKey,
                        signer: taker.publicKey,
                    });
                if (takerNftAtaIx) {
                    instructions.push(takerNftAtaIx);
                    console.log("takerNftAta", takerMakerNftAta.toBase58());
                }

                let { mintAta: takerTokenAta, instruction: takerTokenAtaIx } =
                    await neoSwap.UTILS.findOrCreateAta({
                        connection,
                        mint: paymentMint,
                        owner: taker.publicKey,
                        signer: taker.publicKey,
                    });
                if (takerTokenAtaIx) {
                    instructions.push(takerTokenAtaIx);
                    console.log("takerTokenAta", takerTokenAta.toBase58());
                }

                let { mintAta: makerNftAta, instruction: mn } = await neoSwap.UTILS.findOrCreateAta(
                    {
                        connection,
                        mint: maker_mint,
                        owner: maker,
                        signer: taker.publicKey,
                    }
                );
                if (mn) {
                    instructions.push(mn);
                    console.log("makerNftAta", makerNftAta.toBase58());
                }

                let { mintAta: makerTokenAta, instruction: mt } =
                    await neoSwap.UTILS.findOrCreateAta({
                        connection,
                        mint: paymentMint,
                        owner: maker,
                        signer: taker.publicKey,
                    });
                if (mt) {
                    instructions.push(mt);
                    console.log("makerTokenAta", makerTokenAta.toBase58());
                }
                let { mintAta: nsFeeTokenAta, instruction: nsfta } =
                    await neoSwap.UTILS.findOrCreateAta({
                        connection,
                        mint: paymentMint,
                        owner: nsFee,
                        signer: taker.publicKey,
                    });
                if (nsfta) {
                    instructions.push(nsfta);
                    console.log("nsFeeTokenAta", nsFeeTokenAta.toBase58());
                }
                let { mintAta: swapDataAccountMakerNftAta, instruction: swapDataAccountNftAtaIx } =
                    await neoSwap.UTILS.findOrCreateAta({
                        connection,
                        mint: maker_mint,
                        owner: swapDataAccount,
                        signer: taker.publicKey,
                    });
                if (swapDataAccountNftAtaIx) {
                    instructions.push(swapDataAccountNftAtaIx);
                    console.log("swapDataAccountNftAta", swapDataAccountMakerNftAta.toBase58());
                }
                let { mintAta: swapDataAccountTokenAta, instruction: sdata } =
                    await neoSwap.UTILS.findOrCreateAta({
                        connection,
                        mint: paymentMint,
                        owner: swapDataAccount,
                        signer: taker.publicKey,
                    });
                if (sdata) {
                    instructions.push(sdata);
                    console.log("swapDataAccountTokenAta", swapDataAccountTokenAta.toBase58());
                }

                const makerNftMetadata = PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("metadata"),
                        neoConst.TOKEN_METADATA_PROGRAM.toBuffer(),
                        maker_mint.toBuffer(),
                    ],
                    neoConst.TOKEN_METADATA_PROGRAM
                )[0];
                console.log("makerNftMetadata", makerNftMetadata.toBase58());

                const metaplex = new Metaplex(connection);
                const nft = await metaplex.nfts().findByMint({ mintAddress: maker_mint });
                let makerNftMasterEdition = user1.publicKey;
                let ownerTokenRecord = user1.publicKey;
                let destinationTokenRecord = user1.publicKey;
                let authRules = user1.publicKey;

                if (nft.tokenStandard == TokenStandard.ProgrammableNonFungible) {
                    const makerNftMasterEditionF = neoSwap.UTILS.NFT_ACCOUNTS.findNftMasterEdition({
                        mint: maker_mint,
                    });

                    const ownerTokenRecordF = neoSwap.UTILS.NFT_ACCOUNTS.findUserTokenRecord({
                        mint: maker_mint,
                        userMintAta: makerNftAta,
                    });

                    const destinationTokenRecordF = neoSwap.UTILS.NFT_ACCOUNTS.findUserTokenRecord({
                        mint: maker_mint,
                        userMintAta: makerNftAta,
                    });

                    const authRulesF = await neoSwap.UTILS.NFT_ACCOUNTS.findRuleSet({
                        connection,
                        mint: maker_mint,
                    });
                    makerNftMasterEdition = makerNftMasterEditionF;
                    ownerTokenRecord = ownerTokenRecordF;
                    destinationTokenRecord = destinationTokenRecordF;
                    authRules = authRulesF;
                }

                const initIx = await program.methods
                    .claimSwap()
                    .accounts({
                        swapDataAccount,
                        swapDataAccountMakerNftAta,
                        swapDataAccountTokenAta,

                        nsFee,
                        nsFeeTokenAta,

                        taker: taker.publicKey,
                        takerMakerNftAta,
                        takerTokenAta,

                        maker,
                        // makerNftAta,
                        makerTokenAta,

                        nftMintMaker: maker_mint,
                        mintToken: paymentMint,

                        makerNftMetadata,
                        makerNftMasterEdition,
                        ownerTokenRecord,
                        destinationTokenRecord,
                        authRules,

                        systemProgram: SystemProgram.programId,
                        metadataProgram: neoConst.TOKEN_METADATA_PROGRAM,
                        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        ataProgram: neoConst.SOLANA_SPL_ATA_PROGRAM_ID,
                        authRulesProgram: neoConst.METAPLEX_AUTH_RULES_PROGRAM,
                    })
                    .instruction();
                instructions.push(initIx);

                const tx = new Transaction().add(...instructions);
                tx.feePayer = taker.publicKey;
                tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                // let simu = await connection.simulateTransaction(tx);
                // console.log("simu", simu.value);
                // tx.sign(taker);
                const txSig = await connection.sendTransaction(tx, [taker]);
                console.log("txSig", txSig);
            } else {
                console.log("initiaize skipped", swapDataAccount.toBase58());
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    });

    //
    // const initIx = await program.methods
    //     .depositNft(Data.swapIdentity.swapDataAccount_seed)
    //     .accounts({
    //         systemProgram: SystemProgram.programId.toBase58(),
    //         metadataProgram: TOKEN_METADATA_PROGRAM,
    //         sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
    //         splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
    //         splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
    //         swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
    //         signer: Data.signer.toBase58(),
    //         itemFromDeposit: userAta.toBase58(),
    //         mint: Data.mint.toBase58(),
    //         nftMetadata: nftMetadata.toBase58(),
    //         itemToDeposit: pdaAta.toBase58(),
    //         nftMasterEdition: nftMasterEdition.toBase58(),
    //         ownerTokenRecord: ownerTokenRecord.toBase58(),
    //         destinationTokenRecord: destinationTokenRecord.toBase58(),
    //         authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
    //         authRules,
    //     })
    //     .instruction();
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
    makerNeoswapFee: BN;
    takerNeoswapFee: BN;
    takerRoyalties: BN;
    makerRoyalties: BN;
};
