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
    const CONST_PROGRAM = "0007";
    const nbuser = 3;

    // let pda: PublicKey | undefined = new PublicKey("DczDC54mLnVsC7igCHn5HsfnWbQVnnHPbdzGPSrXMDzw"); //new PublicKey("DjzPCDEVwwqgAo7SfdE1paugvSreQMsVv57co8WdHJgM"); //new PublicKey("GNg66w1XyQG3jMT1rMxrApU4ggJR3LokJLfqmVGg8myt"); // new PublicKey("8khwnKwc97MiSPPCtz42Q3NAwfyHa2WYnjYt4Dg3sphs"); //new PublicKey("A87ZnUTVPKVT9o9pANf9WLSkXkhQsM3qc3EL9RobYP8m"); //
    let pda: PublicKey | undefined = undefined;

    let signer = Keypair.fromSecretKey(signerSk);
    let user1 = Keypair.fromSecretKey(user1Sk);
    // let user1MintToTransfer = new PublicKey("AjWL8bSJDoe11nxk7JdD8MS4gNjXgmYwE1zW7kpy39kX");
    // let user1MintToTransfer = new PublicKey("Bz54u3Uzb3cxC68V1d2zxj8ZWnCwyXBb13ZiBbqWWmkm");
    let user1MintToTransfer = undefined;

    let user2 = Keypair.fromSecretKey(user2Sk);
    // let user2MintToTransfer = new PublicKey("J1rY2JDHG7SJFn481HUcBEQkJfzu4GovPybtXESP7ZKv");
    // let user2MintToTransfer = new PublicKey("9CDQeqmzSvYE2nRKwUJwv3ytDyWWwNy4gvxmfViGWCAn");
    let user2MintToTransfer = undefined;

    let user3 = Keypair.fromSecretKey(user3Sk);
    // let user3MintToTransfer = new PublicKey("H4MuQ7xLYNXwjFBCxe3ZfJRAXvrVsXQBpQV8gqhu44fw");
    // let user3MintToTransfer = new PublicKey("5odVzLS98jP7xCHykR6VfAzB8GYax7roeq5oowj2MVS6");
    let user3MintToTransfer = undefined;

    let user1N = Keypair.fromSecretKey(user1NSk);
    let user1NMintToTransfer = new PublicKey("CkyMvR8NtsByLVV44aLsTRzwgQZtkvCcZW1Amr9DiM3B");
    // let user1NMintToTransfer = new PublicKey("AaQBnNU11cauy6kCsKiU6VN6HGe8xZ2nV6hRNxy5PyS8");
    // let user1NMintToTransfer = undefined;

    let user2N = Keypair.fromSecretKey(user2NSk);
    let user2NMintToTransfer = new PublicKey("8TMsB3Bn9bF6eAKMuksMC1y1snFEy4PuTy242nS2aGdc");
    // let user2NMintToTransfer = new PublicKey("6pmU8pFjGEJHhbPhRErmPMWgREVmUgVA2dQsM6SghmXS");
    // let user2NMintToTransfer = undefined;

    let user3N = Keypair.fromSecretKey(user3NSk);
    let user3NMintToTransfer = new PublicKey("AM5YqXfm7ZoXvjKaZwNy9cAEogzwwSwdn3U2FaZgVWLn");
    // let user3NMintToTransfer = new PublicKey("DMUaX5iKGs29hU2KzPhQ7XBjNhBks3dxquLampY5wKMj");
    // let user3NMintToTransfer = undefined;

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

    it("Mint NFTs ", async () => {
        if (!user1MintToTransfer) {
            let MintData = await NeoSwap.createPnft2({
                program,
                signer: user1,
                // destination: new PublicKey("5mG4wFjsnuuQWExTGqLN9ca2e5D1DBVZGDQKjGHJvJPQ"),
            });
            console.log("user1 MintData", MintData.mintAddress.toBase58());
        } else {
            console.log("user1 minting skipped");
        }
        if (!user2MintToTransfer) {
            let MintData = await NeoSwap.createPnft2({
                program,
                signer: user2,
                // destination: new PublicKey("AkKM7KKpe5KMkL4RnV4WYFvMwNyxx5vSEbdRCZhBSPfk"),
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
            // metaplex find mint

        }

        // if (!user1NMintToTransfer) {
        //     let mintPk = await NeoSwap.createNft({
        //         program,
        //         signer: user1,
        //     });
        //     console.log("user1N mintPk", mintPk.toBase58());
        // } else {
        //     console.log("user1N minting skipped");
        // }
        // if (!user2NMintToTransfer) {
        //     let mintPk = await NeoSwap.createNft({
        //         program,
        //         signer: user2,
        //     });
        //     console.log("user2N mintPk", mintPk.toBase58());
        // } else {
        //     console.log("user2N minting skipped");
        // }
        // if (!user3NMintToTransfer) {
        //     let mintPk = await NeoSwap.createNft({
        //         program,
        //         signer: user3,
        //     });
        //     console.log("user3N mintPk", mintPk.toBase58());
        // } else {
        //     console.log("user3N minting skipped");
        // }
    });

    // it("create SwapData", async () => {
    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(1),
    //         mint: user3NMintToTransfer,
    //         status: ItemStatus.NFTPending,
    //         owner: user1.publicKey,
    //         destinary: user2.publicKey,
    //     } as NftSwapItem);

    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(1),
    //         mint: user1MintToTransfer,
    //         status: ItemStatus.NFTPending,
    //         owner: user2.publicKey,
    //         destinary: user3.publicKey,
    //     } as NftSwapItem);

    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(1),
    //         mint: user2MintToTransfer,
    //         status: ItemStatus.NFTPending,
    //         owner: user3.publicKey,
    //         destinary: user1N.publicKey,
    //     } as NftSwapItem);

    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(1),
    //         mint: user3MintToTransfer,
    //         status: ItemStatus.NFTPending,
    //         owner: user1N.publicKey,
    //         destinary: user2N.publicKey,
    //     } as NftSwapItem);

    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(1),
    //         mint: user1NMintToTransfer,
    //         status: ItemStatus.NFTPending,
    //         owner: user2N.publicKey,
    //         destinary: user3N.publicKey,
    //     } as NftSwapItem);

    //     swapData.items.push({
    //         isNft: true,
    //         amount: new BN(1),
    //         mint: user2NMintToTransfer,
    //         status: ItemStatus.NFTPending,
    //         owner: user3N.publicKey,
    //         destinary: user1.publicKey,
    //     } as NftSwapItem);
    //     console.log(swapData.items);
    // });

    // it("initialize", async () => {
    //     // console.log(swapData.items.length);

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

    //         const txhashs = await program.provider.sendAll(allInitSendAllArray, {
    //             skipPreflight: true,
    //         });

    //         for await (const hash of txhashs) {
    //             console.log(hash);
    //             program.provider.connection.confirmTransaction(hash);
    //         }

    //         console.log("initialized");
    //     } else {
    //         console.log("initiaize skipped", pda.toBase58());
    //     }
    // });
    // it("deposit NFT", async () => {
    //     let transactionHashs: string[] = [];

    //     for await (const user of [user1N, user2N, user3N, user1, user2, user3]) {
    //         const { depositSendAllArray } = await NeoSwap.deposit({
    //             provider: program.provider as anchor.AnchorProvider,
    //             signer: user.publicKey,
    //             swapDataAccount: pda,
    //             CONST_PROGRAM,
    //         });
    //         if (depositSendAllArray[0].tx.instructions.length > 0) {
    //             let recentBlockhash = (await program.provider.connection.getLatestBlockhash())
    //                 .blockhash;
    //             depositSendAllArray.forEach((transactionDeposit) => {
    //                 transactionDeposit.signers = [user];
    //                 transactionDeposit.tx.feePayer = user.publicKey;
    //                 transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //             });
    //             const transactionHash = await program.provider.sendAll(depositSendAllArray, {
    //                 skipPreflight: true,
    //             });
    //             for await (const transactionHash of transactionHashs) {
    //                 console.log(transactionHash);
    //                 await program.provider.connection.confirmTransaction(transactionHash);
    //             }
    //             transactionHashs.push(...transactionHash);
    //         } else {
    //             console.log("skipped");
    //         }
    //     }
    //     console.log("transactionhashes", transactionHashs);
    // });

    // it("claim and close", async () => {
    // const { allClaimSendAllArray } = await NeoSwap.claimAndClose({
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

    //     const claimAndCloseHash = await program.provider.sendAll(allClaimSendAllArray, {
    //         skipPreflight: true,
    //     });
    //     console.log("claimAndCloseHash", claimAndCloseHash);

    //     for await (const hash of claimAndCloseHash) {
    // console.log(hash);
    //         program.provider.connection.confirmTransaction(hash);

    //     }

    //     console.log("claimAndCloseHash :", claimAndCloseHash);
    // });

    // it("partial cancel and close from in trade user", async () => {
    //     const { allCancelSendAllArray } = await NeoSwap.cancelAndClose({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: user1.publicKey,
    //         swapDataAccount: pda,
    //         CONST_PROGRAM,
    //     });

    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     allCancelSendAllArray.forEach((transactionDeposit) => {
    //         transactionDeposit.signers = [user1];
    //         transactionDeposit.tx.feePayer = user1.publicKey;
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     });

    //     const cancelAndCloseHash = await program.provider.sendAll(
    //         allCancelSendAllArray.slice(0, 1),
    //         { skipPreflight: true }
    //     );

    //     for await (const hash of cancelAndCloseHash) {
    // console.log(hash);
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

    //     const cancelAndCloseHash = await program.provider.sendAll(allCancelSendAllArray, {
    //         skipPreflight: true,
    //     });

    //     for await (const hash of cancelAndCloseHash) {
    // console.log(hash);
    //         program.provider.connection.confirmTransaction(hash);

    //     }

    //     console.log("cancelAndCloseHash :", cancelAndCloseHash);
    // });

    //UTILS FOR INITIALIZING
    // it("Create keypair", async () => {
    //     console.log(Keypair.generate().secretKey.toString());
    //     console.log(Keypair.generate().secretKey.toString());
    //     console.log(Keypair.generate().secretKey.toString());
    // });
    // it("show PK", async () => {
    //     // console.log("signer", signer.publicKey.toBase58());
    //     console.log("user1", user1.publicKey.toBase58());
    //     console.log("user2", user2.publicKey.toBase58());
    //     console.log("user3", user3.publicKey.toBase58());
    //     console.log("user1N", user1N.publicKey.toBase58());
    //     console.log("user2N", user2N.publicKey.toBase58());
    //     console.log("user3N", user3N.publicKey.toBase58());
    // });
});
