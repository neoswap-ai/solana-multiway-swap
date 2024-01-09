import * as anchor from "@coral-xyz/anchor";
// import { BN } from "bn.js";
// const { assert } = require("chai");
// import SwapData from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/swapData.types.neoswap";
// import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
// const { assert } = require("chai");

// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

// import {
//     // createAssociatedTokenAccount,
//     // getAssociatedTokenAddress,
//     // createInitializeMintInstruction,
//     // TOKEN_PROGRAM_ID,
//     // MINT_SIZE,
//     // getMinimumBalanceForRentExemptMint,
//     // createMint,
//     // mintToChecked,
//     // createAssociatedTokenAccountInstruction,
//     // createMintToCheckedInstruction,
//     // createSyncNativeInstruction,
//     NATIVE_MINT,
//     closeAccount,
//     createCloseAccountInstruction,
// } from "@solana/spl-token";

import {
    Keypair,
    PublicKey,
    Connection,
    SystemProgram,
    // LAMPORTS_PER_SOL,
    // Transaction,
    // Signer,
    // SystemProgram,
    // Transaction,
    // TransactionInstruction,
    // TransactionMessage,
    // VersionedTransaction,
} from "@solana/web3.js";
import { neoSwap, neoTypes } from "@neoswap/solana";
import {
    Metaplex,
    keypairIdentity,
    bundlrStorage,
    toMetaplexFile,
    toBigNumber,
    CreateCandyMachineInput,
    DefaultCandyGuardSettings,
    CandyMachineItem,
    toDateTime,
    sol,
    TransactionBuilder,
    CreateCandyMachineBuilderContext,
} from "@metaplex-foundation/js";

import usk1 from "../deleteme/user1";
const user1 = Keypair.fromSecretKey(usk1);
import usk2 from "../deleteme/user2";
const user2 = Keypair.fromSecretKey(usk2);
import usk3 from "../deleteme/user3";
const user3 = Keypair.fromSecretKey(usk3);
import usks from "../deleteme/signer";
const signer = Keypair.fromSecretKey(usks);
import usk4 from "../deleteme/user4";
const user4 = Keypair.fromSecretKey(usk4);
import usk5 from "../deleteme/user5";
const user5 = Keypair.fromSecretKey(usk5);
import usk6 from "../deleteme/user6";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
const user6 = Keypair.fromSecretKey(usk6);
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import usclisks from "/home/biboux/.config/solana/id.json";
// const usc = Keypair.fromSecretKey(usks);

const clusterOrUrl =
    // "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/";
    "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
describe("MIX pre-signing", () => {
    anchor.setProvider(anchor.AnchorProvider.env());
    const connection = new Connection(clusterOrUrl);
    const METAPLEX = Metaplex.make(connection).use(keypairIdentity(signer));
    const COLLECTION_METADATA =
        // "https://raw.githubusercontent.com/biboux-neoswap/test-metadata/main/collection%20Meta";
        "https://raw.githubusercontent.com/biboux-neoswap/test-metadata/main/meta-collection-2";
    const NFT_METADATA =
        "https://raw.githubusercontent.com/biboux-neoswap/test-metadata/main/PFNT-meta";
    const collection =
        // new PublicKey("5GzuKHXr7FBwZErdfsiUfrwsLpEcmLG8xNb4SmZ3UA1E");
        new PublicKey("8Jy6UQxitXCStK97t4Lb9AZ5DpHDDWpUXDygmnZY6Rkt");

    // it("create collection", async () => {
    //     const { nft: collectionNft } = await METAPLEX.nfts().create({
    //         name: "[DEVNET] Neoswap PNFT Collection",
    // symbol: "NSPNFT",
    //         uri: COLLECTION_METADATA,
    //         sellerFeeBasisPoints: 0,
    //         isCollection: true,
    //         updateAuthority: signer,
    //     });

    //     console.log(`✅ - Minted Collection NFT: ${collectionNft.address.toString()}`);
    //     console.log(
    //         `     https://explorer.solana.com/address/${collectionNft.address.toString()}?cluster=devnet`
    //     );
    // });

    it("mint pNFT to collection", async () => {
        const allData = await METAPLEX.nfts().create({
            name: "[DEVNET] Neoswap PNFT",
            symbol: "NSPNFT",
            uri: NFT_METADATA,
            sellerFeeBasisPoints: 0,
            isCollection: false,
            collection,
            updateAuthority: signer,
            collectionAuthority: signer,
            creators: [{ address: signer.publicKey, share: 100 }],
        });

        console.log(`✅ - Minted Collection NFT: ${allData}`);
    });

    // it("users", async () => {
    //     console.log("user1", user1.publicKey.toBase58());
    //     console.log("user2", user2.publicKey.toBase58());
    //     console.log("user3", user3.publicKey.toBase58());
    //     console.log("user4", user4.publicKey.toBase58());
    //     console.log("user5", user5.publicKey.toBase58());
    //     console.log("user6", user6.publicKey.toBase58());
    //     console.log("signer", signer.publicKey.toBase58());
    // });
});
