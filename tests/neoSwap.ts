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
import signerSk from "../deleteme/signer";
import user1Sk from "../deleteme/user1";
import user2Sk from "../deleteme/user2";
import user3Sk from "../deleteme/user3";
import user1NSk from "../deleteme/user1Normal";
import user2NSk from "../deleteme/user2Normal";
import user3NSk from "../deleteme/user3Normal";
describe("swapCoontractTest", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    let program = anchor.workspace.NeoSwap as Program;
    const CONST_PROGRAM = "0002";
    const nbuser = 3;

    let pda: PublicKey | undefined = new PublicKey("A87ZnUTVPKVT9o9pANf9WLSkXkhQsM3qc3EL9RobYP8m"); //

    let signer = Keypair.fromSecretKey(signerSk);
    let user1 = Keypair.fromSecretKey(user1Sk);
    // let user1MintToTransfer = new PublicKey("6kUW6eGLQ9ddwWojw2arLA5j3nJyKeKhxid1fMvSveAv");
    let user1MintToTransfer = new PublicKey("6kUW6eGLQ9ddwWojw2arLA5j3nJyKeKhxid1fMvSveAv");
    // let user1MintToTransfer = undefined;

    let user2 = Keypair.fromSecretKey(user2Sk);
    // let user2MintToTransfer = new PublicKey("5ynxAkf5xFVk299vVuWjZdzHzWQAnDP5UoR32bYZEG9s");
    let user2MintToTransfer = new PublicKey("5ynxAkf5xFVk299vVuWjZdzHzWQAnDP5UoR32bYZEG9s");
    // let user2MintToTransfer = undefined;

    let user3 = Keypair.fromSecretKey(user3Sk);
    // let user3MintToTransfer = new PublicKey("6Ho8NdHfap57QosEavvmr6LG6pyvYorZ6p2Z7ymREBCp");
    let user3MintToTransfer = new PublicKey("6Ho8NdHfap57QosEavvmr6LG6pyvYorZ6p2Z7ymREBCp");
    // let user3MintToTransfer = undefined;

    let user1N = Keypair.fromSecretKey(user1NSk);
    // let user1NMintToTransfer = new PublicKey("6kUW6eGLQ9ddwWojw2arLA5j3nJyKeKhxid1fMvSveAv");
    let user1NMintToTransfer = undefined;

    let user2N = Keypair.fromSecretKey(user2NSk);
    // let user2NMintToTransfer = new PublicKey("5ynxAkf5xFVk299vVuWjZdzHzWQAnDP5UoR32bYZEG9s");
    let user2NMintToTransfer = undefined;

    let user3N = Keypair.fromSecretKey(user3NSk);
    // let user3NMintToTransfer = new PublicKey("6Ho8NdHfap57QosEavvmr6LG6pyvYorZ6p2Z7ymREBCp");
    let user3NMintToTransfer = undefined;

    // let mintToTransfer = new PublicKey("BJ5TwcvJGuPTCUHZe38ksX17aPxcVrutkDF3rzjaZZ7y");
    // let mintToTransfer = new PublicKey("3WVAyCKNypAv99xCW7ZpFrjzg8GTgRmg4cgRbAbYcRDo");
    // let mintToTransfer = undefined
    // let mintToTransfer = new PublicKey("HBYWeF2VtsTe6yF6QyzE9wRTt9kV8jbEwsC4HRbgPQoM");
    // let mintToTransfer = new PublicKey("HBYWeF2VtsTe6yF6QyzE9wRTt9kV8jbEwsC4HRbgPQoM");
    // let mintToTransfer = new PublicKey("EDzmVDKmRB8dnKkhVzo8pGrhYpC9QdYpBYcy7wsj13P9");

    let swapData: SwapData = {
        initializer: signer.publicKey,
        items: [] as NftSwapItem[],
        status: TradeStatus.Initializing,
        nb_items: 1,
    };

    it("Initializing Program", async () => {
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
        console.log("signer", signer.publicKey.toBase58());
    });

    it("Mint pNFT", async () => {
        if (!user1MintToTransfer) {
            let MintData = await NeoSwap.createPnft2({
                program,
                signer: user1,
            });
            console.log("user1 MintData", MintData.mintAddress.toBase58());
        } else {
            console.log("user1 minting skipped");
        }
        if (!user2MintToTransfer) {
            let MintData = await NeoSwap.createPnft2({
                program,
                signer: user2,
            });
            console.log("user2 MintData", MintData.mintAddress.toBase58());
        } else {
            console.log("user2 minting skipped");
        }
        if (!user3MintToTransfer) {
            let MintData = await NeoSwap.createPnft2({
                program,
                signer: user3,
            });
            console.log("user3 MintData", MintData.mintAddress.toBase58());
        } else {
            console.log("user3 minting skipped");
        }

        if (!user1NMintToTransfer) {
            let mintPk = await NeoSwap.createNft({
                program,
                signer: user1,
            });
            console.log("user1N mintPk", mintPk.toBase58());
        } else {
            console.log("user1N minting skipped");
        }
        if (!user2NMintToTransfer) {
            let mintPk = await NeoSwap.createNft({
                program,
                signer: user2,
            });
            console.log("user2N mintPk", mintPk.toBase58());
        } else {
            console.log("user2N minting skipped");
        }
        if (!user3NMintToTransfer) {
            let mintPk = await NeoSwap.createNft({
                program,
                signer: user3,
            });
            console.log("user3N mintPk", mintPk.toBase58());
        } else {
            console.log("user3N minting skipped");
        }
    });

    // it("create SwapData", async () => {
    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(1),
    //         mint: user1MintToTransfer,
    //         status: ItemStatus.NFTPending,
    //         owner: user1.publicKey,
    //         destinary: user2.publicKey,
    //     } as NftSwapItem);

    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(1),
    //         mint: user2MintToTransfer,
    //         status: ItemStatus.NFTPending,
    //         owner: user2.publicKey,
    //         destinary: user3.publicKey,
    //     } as NftSwapItem);

    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(1),
    //         mint: user3MintToTransfer,
    //         status: ItemStatus.NFTPending,
    //         owner: user3.publicKey,
    //         destinary: user1.publicKey,
    //     } as NftSwapItem);
    // });

    // it("initialize", async () => {
    //     // console.log(swapData);
    //     if (!pda) {
    //         const allInitData = await NeoSwap.allInitialize({
    //             provider: program.provider as anchor.AnchorProvider,
    //             signer: signer.publicKey,
    //             swapDataGiven: swapData,
    //             CONST_PROGRAM,
    //         });
    //         swapData = allInitData.swapData;
    //         pda = allInitData.pda;
    //         const allInitSendAllArray = allInitData.allInitSendAllArray;
    //         console.log("XXX-XXX pda", pda.toBase58());

    //         const recentBlockhash = (await program.provider.connection.getLatestBlockhash())
    //             .blockhash;

    //         for await (const transactionDeposit of allInitSendAllArray) {
    //             transactionDeposit.signers = [signer];
    //             transactionDeposit.tx.feePayer = signer.publicKey;
    //             transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //         }

    //         const txhashs = await program.provider.sendAll(allInitSendAllArray);

    //         for await (const hash of txhashs) {
    //             program.provider.connection.confirmTransaction(hash);
    //         }

    //         console.log("initialized");
    //     } else {
    //         console.log("initiaize skipped", pda.toBase58());
    //     }
    // });
    // it("Transfer pNFT", async () => {
    //     let sendAllArray: {
    //         tx: anchor.web3.Transaction;
    //         signers?: anchor.web3.Signer[];
    //     }[] = [];
    //     await Promise.all(
    //         [user1, user2, user3].map(async (userKeypair) => {
    //             const { depositSendAllArray } = await NeoSwap.deposit({
    //                 provider: program.provider as anchor.AnchorProvider,
    //                 signer: userKeypair.publicKey,
    //                 swapDataAccount: pda,
    //                 CONST_PROGRAM,
    //             });

    //             depositSendAllArray.forEach((transactionDeposit) => {
    //                 transactionDeposit.signers = [userKeypair];
    //                 transactionDeposit.tx.feePayer = userKeypair.publicKey;
    //             });

    //             sendAllArray.push(...depositSendAllArray);
    //         })
    //     );

    //     for (let index = 0; index < sendAllArray.length; index++) {
    //         const element = sendAllArray[index];

    //         let recentBlockhash = (await program.provider.connection.getLatestBlockhash())
    //             .blockhash;
    //         sendAllArray.forEach((transactionDeposit) => {
    //             transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //         });

    //         const transactionHashs = await program.provider.sendAll([element], {
    //             skipPreflight: true,
    //         });
    //         console.log(transactionHashs);

    //         for await (const transactionHash of transactionHashs) {
    //             await program.provider.connection.confirmTransaction(transactionHash);
    //         }
    //         console.log("deposited users ", transactionHashs);
    //     }
    // });
    // it("Transfer pNFT", async () => {
    //     // signer= Keypair.fromSeed()
    //     //  test writing dev code just here
    //     console.log("signer wallet", Keypair.fromSecretKey(sk).publicKey.toBase58());

    //     let MintData = await NeoSwap.transferPNFT({
    //         destinary,
    //         mintToDeposit: mintToTransfer,
    //         program,
    //         signer: signer,
    //     });
    // });

    //UTILS FOR INITIALIZING
    // it("Create keypair", async () => {
    //     console.log(Keypair.generate().secretKey.toString());
    //     console.log(Keypair.generate().secretKey.toString());
    //     console.log(Keypair.generate().secretKey.toString());
    // });
    // it("show PK", async () => {
    //     // console.log("signer", signer.publicKey.toBase58());
    //     console.log("user1", user1N.publicKey.toBase58());
    //     console.log("user2", user2N.publicKey.toBase58());
    //     console.log("user3", user3N.publicKey.toBase58());
    // });
});
