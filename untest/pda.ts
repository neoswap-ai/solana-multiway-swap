import * as anchor from "@coral-xyz/anchor";
import {
    Keypair,
    PublicKey,
    Connection,
    SystemProgram,
    Transaction,
    Cluster,
} from "@solana/web3.js";
import { neoSwap, neoTypes } from "@neoswap/solana";

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

const clusterOrUrl =
    "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/";
// "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";

describe("PDA testing", () => {
    anchor.setProvider(anchor.AnchorProvider.env());
    const connection = new Connection(clusterOrUrl);
    let cluster = "mainnet-beta" as Cluster;

    let programId = new PublicKey("2vumtPDSVo3UKqYYxMVbDaQz1K4foQf6A31KiUaii1M7");
    let program = neoSwap.UTILS.getProgram({
        clusterOrUrl,
        programId: programId ? programId : undefined,
    });

    // let collection = new PublicKey("WoMbiTtXKwUtf4wosoffv45khVF8yA2mPkinGosCFQ4");
    let collection = new PublicKey("2WRn18ZiHji4ww3bsn2RUE2DDy2V45jChCR5mZHkbt6N");

    let tokenId = "6bxDcis8PwRMXiv37XvNTMw6dMqUbxXeawFRGqAZJK3";
    {        // Admin
        // it("create Admin", async () => {
        //     const createIx = await neoSwap.PDA.ADMIN.createAdminInitIx({
        //         program,
        //         signer: signer.publicKey,
        //         nb: 10,
        //     });
        //     let tx = new Transaction().add(createIx);
        //     tx.feePayer = signer.publicKey;
        //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        //     const hash = await neoSwap.UTILS.sendBundledTransactions({
        //         clusterOrUrl,
        //         signer,
        //         txsWithoutSigners: [{ tx }],
        //     });
        //     console.log("hash", hash);
        // });
        // it("add Admin", async () => {
        //     const createIx = await neoSwap.PDA.ADMIN.createAdminModIx({
        //         program: neoSwap.UTILS.getProgram({ clusterOrUrl }),
        //         signer: signer.publicKey,
        //         adminToAdd: user1.publicKey,
        //         is_delete: false,
        //         // nb: 10,
        //     });
        //     let tx = new Transaction().add(createIx);
        //     tx.feePayer = signer.publicKey;
        //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        //     const hash = await neoSwap.UTILS.sendBundledTransactions({
        //         clusterOrUrl,
        //         signer,
        //         txsWithoutSigners: [{ tx }],
        //     });
        //     console.log("hash", hash);
        // });
        // it("remove Admin", async () => {
        //     const createIx = await neoSwap.PDA.ADMIN.createAdminModIx({
        //         program: neoSwap.UTILS.getProgram({ clusterOrUrl }),
        //         signer: user1.publicKey,
        //         adminToAdd: user1.publicKey,
        //         is_delete: true,
        //     });
        //     let tx = new Transaction().add(createIx);
        //     tx.feePayer = user1.publicKey;
        //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        //     const hash = await neoSwap.UTILS.sendBundledTransactions({
        //         clusterOrUrl,
        //         signer: user1,
        //         txsWithoutSigners: [{ tx }],
        //     });
        //     console.log("hash", hash);
        // });
        // it("get Admin", async () => {
        //     const adminPda = neoSwap.PDA.ADMIN.getAdminPda({
        //         cluster,
        //         programId,
        //     });
        //     // let program = neoSwap.UTILS.getProgram({ clusterOrUrl });
        //     let admindata = (await program.account.adminPda.fetch(adminPda)) as any;
        //     console.log(
        //         "admindata",
        //         admindata.adminList.map((x) => x.toBase58())
        //     );
        // });
    }

    // it("Create collection", async () => {
    //     const createIx = await neoSwap.PDA.COLLECTION.createCollectionInitIx({
    //         program,
    //         signer: signer.publicKey,
    //         collection,
    //         nb: 10,
    //     });
    //     let tx = new Transaction().add(createIx);
    //     tx.feePayer = signer.publicKey;
    //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    //     const hash = await neoSwap.UTILS.sendBundledTransactions({
    //         clusterOrUrl,
    //         signer,
    //         txsWithoutSigners: [{ tx }],
    //     });
    //     console.log("hash", hash);
    // });
    // it("add merkle to collection", async () => {
    //     let { merkleTree: merkleToAdd } = await neoSwap.UTILS.NFT_ACCOUNTS.getCNFTData({
    //         cluster,
    //         connection,
    //         tokenId,
    //     });
    //     const createIx = await neoSwap.PDA.COLLECTION.createCollectionModIx({
    //         program,
    //         signer: signer.publicKey,
    //         collection,
    //         merkleToAdd,
    //         is_delete: false,
    //     });
    //     let tx = new Transaction().add(createIx);
    //     tx.feePayer = signer.publicKey;
    //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    //     const hash = await neoSwap.UTILS.sendBundledTransactions({
    //         clusterOrUrl,
    //         signer,
    //         txsWithoutSigners: [{ tx }],
    //     });
    //     console.log("hash", hash);
    // });

    it("get Collection", async () => {
        const collectionPda = neoSwap.PDA.COLLECTION.getCollectionPda({
            cluster,
            collection,
            programId,
        });
        // let program = neoSwap.UTILS.getProgram({ clusterOrUrl });
        let collectiondata = (await program.account.collectionPda.fetch(collectionPda)) as any;
        console.log(
            collectiondata.collection.toBase58(),
            "collectiondata",
            collectiondata.merkleList.map((x) => x.toBase58())
        );
    });
});
