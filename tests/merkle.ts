import * as anchor from "@coral-xyz/anchor";

import {
    Keypair,
    Connection,
    clusterApiUrl,
    // PublicKey,
    Transaction,
    VersionedTransaction,
    SystemProgram,
    PublicKey,
} from "@solana/web3.js";
import { neoSwap } from "@neoswap/solana";
import {
    Collection,
    Creator,
    MPL_BUBBLEGUM_PROGRAM_ID,
    MetadataArgs,
    TokenProgramVersion,
    Uses,
    getMetadataArgsSerializer,
} from "@metaplex-foundation/mpl-bubblegum";
import { PublicKey as PpublicKey } from "@metaplex-foundation/umi-public-keys/dist/types/common";
import { Option } from "@metaplex-foundation/umi-options/src/common";
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
const user6 = Keypair.fromSecretKey(usk6);

// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import { idl } from "../tempIdl";
// import fetch from "node-fetch";
// import axios from "axios";
// import {} from "@metaplex-foundation/js";

import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { idl } from "../tempIdl";
import {
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { option } from "@metaplex-foundation/umi/serializers";
import { none, some } from "@metaplex-foundation/umi";

export async function delay(time: number) {
    // console.log('delay');

    return new Promise((resolve) => setTimeout(resolve, time));
}
// type MetadataArgs = {
//     /** The name of the asset */
//     name: string;
//     /** The symbol for the asset */
//     symbol: string;
//     /** URI pointing to JSON representing the asset */
//     uri: string;
//     /** Royalty basis points that goes to creators in secondary sales (0-10000) */
//     sellerFeeBasisPoints: number;
//     primarySaleHappened: boolean;
//     isMutable: boolean;
//     /** nonce for easy calculation of editions, if present */
//     editionNonce: Option<number>;
//     /** Since we cannot easily change Metadata, we add the new DataV2 fields here at the end. */
//     tokenStandard: Option<TokenStandard>;
//     /** Collection */
//     collection: Option<Collection>;
//     /** Uses */
//     uses: Option<Uses>;
//     tokenProgramVersion: TokenProgramVersion;
//     creators: Array<Creator>;
// };

const clusterOrUrl =
    "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/";
// "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/";
describe("MIX pre-signing", () => {
    anchor.setProvider(anchor.AnchorProvider.env());
    const connection = new Connection(clusterOrUrl);

    // const compressedNFTMetadata: MetadataArgs = {
    //     name: "NFT Name",
    //     symbol: "ANY",
    //     // specific json metadata for each NFT
    //     uri: "https://supersweetcollection.notarealurl/token.json",
    //     creators: null,
    //     editionNonce: 0,
    //     uses: null,
    //     collection: null,
    //     primarySaleHappened: false,
    //     sellerFeeBasisPoints: 0,
    //     isMutable: false,
    //     tokenProgramVersion: TokenProgramVersion.Original,
    //     tokenStandard: TokenStandard.NonFungible,
    //   };
    // it("cancel and close", async () => {
    //     console.log(bs58.encode(signer.secretKey));
    // });
    // it("cancel and close", async () => {
    //     let program = new anchor.Program(
    //         idl,
    //         new PublicKey("7H73hAEk1R1EXXgheDBdAn3Un3W7SQKMuKtwpfU67eet")
    //     );
    //     let tokenId = "CJbhEgXESCq49TeQhLS7RwSPwaJBJoZXgYKAqt6mbu2M";
    //     // const {
    //     //     merkleTree,
    //     //     creatorHash,
    //     //     dataHash,
    //     //     nonce,
    //     //     treeAuthority,
    //     //     canopyDepth,
    //     //     index,
    //     //     proofMeta,
    //     //     root,
    //     // } = await neoSwap.UTILS.NFT_ACCOUNTS.getCNFTData({
    //     //     Cluster: "mainnet-beta",
    //     //     tokenId,
    //     //     connection,
    //     // });

    //     let merkleTree = new PublicKey("28K4n3AZe2nJ7yNgRbfAcaEppq2N9zi2Sdu8BoP4qzFD");
    //     let creatorHash = Buffer.from([
    //         142, 120, 215, 238, 5, 231, 89, 235, 55, 122, 15, 36, 45, 63, 192, 124, 189, 175, 104,
    //         245, 20, 41, 223, 184, 69, 135, 136, 93, 51, 167, 91, 21,
    //     ]);
    //     let dataHash = Buffer.from([
    //         106, 73, 125, 43, 5, 111, 225, 183, 125, 18, 75, 37, 98, 33, 190, 251, 254, 215, 114,
    //         80, 178, 205, 26, 250, 21, 124, 252, 155, 36, 164, 11, 225,
    //     ]);
    //     let nonce = new anchor.BN(1001);
    //     let treeAuthority = new PublicKey("AQCwvz5oCrtCsxPwBDqaaFX6EuGBhk1kf6G6Pehrhvb1");
    //     // console.log("merkleTree", merkleTree);
    //     // console.log("creatorHash", creatorHash);
    //     // console.log("dataHash", dataHash);
    //     // console.log("nonce", nonce.toNumber());
    //     // console.log("treeAuthority", treeAuthority);
    //     // console.log("proofMeta", proofMeta);
    //     // console.log("root", root);
    //     // console.log("treeAuthority", treeAuthority.toString());
    //     // const response = await (
    //     //     await fetch(clusterApiUrl("mainnet-beta"), {
    //     //         method: "POST",
    //     //         headers: {
    //     //             "Content-Type": "application/json",
    //     //         },
    //     //         body: JSON.stringify({
    //     //             jsonrpc: "2.0",
    //     //             id: "rpd-op-123",
    //     //             method: "getAsset",
    //     //             params: {
    //     //                 id: tokenId,
    //     //             },
    //     //         }),
    //     //     })
    //     // ).json();

    //     // console.log("treeProofResponse", response);

    //     // let treeProof = response.result;
    //     let treeProof = {
    //         interface: "V1_NFT",
    //         id: "CJbhEgXESCq49TeQhLS7RwSPwaJBJoZXgYKAqt6mbu2M",
    //         content: {
    //             $schema: "https://schema.metaplex.com/nft1.0.json",
    //             json_uri:
    //                 "https://prod-tensor-creators-s3.s3.us-east-1.amazonaws.com/drop/e6ed698b-ae10-42f9-8d2e-16b8d844439e/5a5c32cf-1922-4dc5-8d01-ee6e21e26403",
    //             files: [[Object]],
    //             metadata: {
    //                 attributes: [Array],
    //                 description: "A long time ago in a Solaxy far, far away...",
    //                 name: "Tensorian #3502",
    //                 symbol: "TNSRNS",
    //             },
    //             links: {
    //                 image: "https://prod-tensor-creators-s3.s3.us-east-1.amazonaws.com/drop-metadata/24f27171-430f-42ca-b442-6a75a8daadad/images/4643.png",
    //                 external_url: "https://www.tensor.trade/",
    //             },
    //         },
    //         authorities: [
    //             {
    //                 address: "AQCwvz5oCrtCsxPwBDqaaFX6EuGBhk1kf6G6Pehrhvb1",
    //                 scopes: [Array],
    //             },
    //         ],
    //         compression: {
    //             eligible: false,
    //             compressed: true,
    //             data_hash: "89uDBH723hi2eBumPNGGbnoV4AH6Hi7KCNxEVm9JRB8L",
    //             creator_hash: "Ab9mXRaQEA1QuiGUgBj68siPSqZNwQ2F9izNtFkghudE",
    //             asset_hash: "99qjUWFzLZxeGDuhkRjxyVjDiqvf8FqihMPWcwytmiVo",
    //             tree: "28K4n3AZe2nJ7yNgRbfAcaEppq2N9zi2Sdu8BoP4qzFD",
    //             seq: 23780,
    //             leaf_id: 1001,
    //         },
    //         grouping: [
    //             {
    //                 group_key: "collection",
    //                 group_value: "5PA96eCFHJSFPY9SWFeRJUHrpoNF5XZL6RrE1JADXhxf",
    //             },
    //         ],
    //         royalty: {
    //             royalty_model: "creators",
    //             target: null,
    //             percent: 0.030000000000000002,
    //             basis_points: 300,
    //             primary_sale_happened: true,
    //             locked: false,
    //         },
    //         creators: [
    //             {
    //                 address: "6pZYD8qi7g8XT8pPg8L6NJs2znZkQ4CoPjTz6xqwnBWg",
    //                 share: 100,
    //                 verified: false,
    //             },
    //         ],
    //         ownership: {
    //             frozen: false,
    //             delegated: false,
    //             delegate: null,
    //             ownership_model: "single",
    //             owner: "BsKkdx1WPtdXQHsStXfTi1Cf3Wae6iWrt89UWLJxCA1E",
    //         },
    //         supply: { print_max_supply: 0, print_current_supply: 0, edition_nonce: null },
    //         mutable: true,
    //         burnt: false,
    //     };
    //     // console.log("treeProof", treeProof);

    //     let collectionPk = new PublicKey("5PA96eCFHJSFPY9SWFeRJUHrpoNF5XZL6RrE1JADXhxf");
    //     let leafOwner = new PublicKey("BsKkdx1WPtdXQHsStXfTi1Cf3Wae6iWrt89UWLJxCA1E");

    //     let cc: Collection = {
    //         key: collectionPk as any,
    //         verified: false,
    //     };

    //     let meta: MetadataArgs = {
    //         collection: cc as any,
    //         creators: treeProof.creators as Creator[],
    //         editionNonce: treeProof.supply.edition_nonce,
    //         isMutable: treeProof.mutable,
    //         name: treeProof.content.metadata.name,
    //         primarySaleHappened: treeProof.royalty.primary_sale_happened,
    //         sellerFeeBasisPoints: treeProof.royalty.basis_points,
    //         tokenProgramVersion: TokenProgramVersion.Original,
    //         tokenStandard: TokenStandard.NonFungible as any,
    //         uri: treeProof.content.json_uri,
    //         uses: null,
    //         symbol: treeProof.content.metadata.symbol,
    //     };

    //     const instruction = await program.methods
    //         .readMerkleTree(dataHash, creatorHash, nonce, collectionPk, meta)
    //         .accounts({
    //             signer: signer.publicKey,
    //             treeAuthority,
    //             leafOwner,
    //             leafDelegate: leafOwner,
    //             merkleTree,
    //             systemProgram: SystemProgram.programId,
    //             logWrapper: SPL_NOOP_PROGRAM_ID,
    //             compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    //             bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
    //         })
    //         .instruction();

    //     let tx = new Transaction().add(instruction);
    //     tx.feePayer = signer.publicKey;
    //     tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    //     let vtx = new VersionedTransaction(tx.compileMessage());
    //     const simulation = await connection.simulateTransaction(vtx);
    //     // const hash = await neoSwap.UTILS.sendBundledTransactions({
    //     //     clusterOrUrl,
    //     //     signer,
    //     //     txsWithoutSigners: [{ tx: new Transaction().add(instruction) }],
    //     // });
    //     console.log(simulation);
    // });
    it("cancel and close", async () => {
        let program = new anchor.Program(
            idl,
            new PublicKey("7H73hAEk1R1EXXgheDBdAn3Un3W7SQKMuKtwpfU67eet")
        );

        // let tokenId = "3mbhKFpVp88hdWKLJynih4Z7Lea8TFfsSNiSRPTFwj6P";
        let tokenId = "6oiNr9GSfKvQwqQtvytKGZML2NDvj7to4jq8XH5cmwW4";
        // const {
        //     merkleTree: merkleTree2,
        //     dataHash: dataHash2,
        //     treeAuthority: treeAuthority2,
        // } = await neoSwap.UTILS.NFT_ACCOUNTS.getCNFTData({
        //     Cluster: "mainnet-beta",
        //     tokenId,
        //     // connection,
        // });

        // console.log(
        //     // new PublicKey(creatorHash),
        //     new PublicKey(merkleTree2),
        //     new PublicKey(dataHash2),
        //     // nonce,
        //     new PublicKey(treeAuthority2)
        // );

        // const response = (await (
        //     await fetch("https://mainnet.helius-rpc.com/?api-key=3df6d163-6527-46bf-aa92-5f2e7af41aa4", {
        //         method: "POST",
        //         headers: {
        //             "Content-Type": "application/json",
        //         },
        //         body: JSON.stringify({
        //             jsonrpc: "2.0",
        //             id: "rpd-op-123",
        //             method: "getAsset",
        //             params: {
        //                 id: tokenId.toString(),
        //             },
        //         }),
        //     })
        // ).json()) as any;
        const response = await fetch(
            "https://mainnet.helius-rpc.com/?api-key=3df6d163-6527-46bf-aa92-5f2e7af41aa4",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: "rpd-op-123",
                    method: "getAsset",
                    params: {
                        id: tokenId,
                    },
                }),
            }
        ).then(async (res) => (await res.json()) as any);

        console.log("treeProofResponse", response.result);

        // console.log("treeProofResponse", response.result);
        // console.log("esponse.result.content.metadata", response.result.content.json_uri);
        // const response2 = (await (
        //     await fetch(
        //         "https://prod-tensor-creators-s3.s3.us-east-1.amazonaws.com/drop/e6ed698b-ae10-42f9-8d2e-16b8d844439e/5fa78dac-1ec9-4441-aa95-0b88cf453b82",
        //         {
        //             method: "GET",
        //             headers: {
        //                 "Content-Type": "application/json",
        //             },
        //             // body: JSON.stringify({
        //             //     jsonrpc: "2.0",
        //             //     id: "rpd-op-123",
        //             //     method: "getAsset",
        //             //     params: {
        //             //         id: tokenId,
        //             //     },
        //             // }),
        //         }
        //     )
        // ).json()) as any; // MetadataArgs;
        // console.log("response2", response2);
        // option(some(response2.collection), { prefix: null, fixed: false });
        // let tt = await getMetadataArgsSerializer();
        // let ttw = some(response2.collection);
        // console.log("tt", tt);
        // let creators: Creator[] = response2.creators.map((creator) => {
        //     return {
        //         address: creator.address as PpublicKey,
        //         share: creator.share,
        //         verified: creator.verified!,
        //     };
        // });
        // let uses: Option<Uses> = response2.uses ? some(response2.uses) : none();
        // let meta: MetadataArgs = {
        //     collection: some(response2.collection),
        //     creators,
        //     name: response2.name,
        //     symbol: response2.symbol,
        //     uri: response2.uri,
        //     sellerFeeBasisPoints: response2.sellerFeeBasisPoints,
        //     primarySaleHappened: response2.primarySaleHappened,
        //     isMutable: response2.isMutable,
        //     editionNonce: some(response2.editionNonce),
        //     tokenStandard: response2.tokenStandard,
        //     uses,
        //     tokenProgramVersion: response2.tokenProgramVersion,
        // };
        let mmeta: MetadataArgs = {
            name: "Tensorian #10000",
            symbol: "TNSRNS",
            uri: "https://prod-tensor-creators-s3.s3.us-east-1.amazonaws.com/drop/e6ed698b-ae10-42f9-8d2e-16b8d844439e/31d11fab-a6bf-4755-bf6c-4204a581e609",
            sellerFeeBasisPoints: 300,
            primarySaleHappened: true,
            isMutable: true,
            editionNonce: null,
            tokenStandard: null,
            collection: some({
                verified: false,
                key: "5PA96eCFHJSFPY9SWFeRJUHrpoNF5XZL6RrE1JADXhxf" as PpublicKey,
            }),
            uses: null,
            tokenProgramVersion: TokenProgramVersion.Original,
            creators: [
                {
                    address: "6pZYD8qi7g8XT8pPg8L6NJs2znZkQ4CoPjTz6xqwnBWg" as PpublicKey,
                    verified: false,
                    share: 100,
                },
            ],
        };
        let merkleTree = new PublicKey("28K4n3AZe2nJ7yNgRbfAcaEppq2N9zi2Sdu8BoP4qzFD");
        // let creatorHash = Buffer.from([
        //     142, 120, 215, 238, 5, 231, 89, 235, 55, 122, 15, 36, 45, 63, 192, 124, 189, 175, 104,
        //     245, 20, 41, 223, 184, 69, 135, 136, 93, 51, 167, 91, 21,
        // ]);

        let dataHash = Buffer.from([
            106, 73, 125, 43, 5, 111, 225, 183, 125, 18, 75, 37, 98, 33, 190, 251, 254, 215, 114,
            80, 178, 205, 26, 250, 21, 124, 252, 155, 36, 164, 11, 225,
        ]);
        // let nonce = new anchor.BN(1001);
        let treeAuthority = new PublicKey("AQCwvz5oCrtCsxPwBDqaaFX6EuGBhk1kf6G6Pehrhvb1");

        let collectionPk = new PublicKey("5PA96eCFHJSFPY9SWFeRJUHrpoNF5XZL6RrE1JADXhxf");
        let leafOwner = new PublicKey("6fpk8ALvxTyCdr6Bq3opNg9wxLjz2x2NXmeGtGXUSzJy");

        // let collection: Option<Collection> = {
        //     __option: "Some",
        //     value: {
        //         key: collectionPk.toString() as any,
        //         verified: false,
        //     },
        // };
        // let tokenStandard: Option<TokenStandard> = {
        //     __option: "Some",
        //     value: TokenStandard.NonFungible,
        // };
        // let editionNonce: Option<number> = {
        //     __option: "Some",
        //     value: treeProof.supply.edition_nonce,
        // };
        // let collection: Option<Collection> = {
        //     __option: "Some",
        //     value: { key: collectionPk.toString() as PpublicKey, verified: false },
        // };
        // response2.creators.map((c: any) => (c.address = c.address as PpublicKey));
        // let meta: MetadataArgs = {
        //     name: response2.name,
        //     symbol: response2.symbol,
        //     uri: response2.uri,
        //     sellerFeeBasisPoints: response2.sellerFeeBasisPoints,
        //     primarySaleHappened: response2.primarySaleHappened,
        //     isMutable: response2.isMutable,
        //     editionNonce: response2.editionNonce,
        //     tokenStandard: response2.tokenStandard,
        //     collection: response2.collection,
        //     uses: response2.uses,
        //     tokenProgramVersion: response2.tokenProgramVersion,
        //     creators: response2.creators,
        // };

        const instruction = await program.methods
            .readMerkleTree(dataHash, collectionPk, mmeta)
            .accounts({
                signer: signer.publicKey,
                treeAuthority,
                leafOwner,
                leafDelegate: leafOwner,
                merkleTree,
                logWrapper: SPL_NOOP_PROGRAM_ID,
                compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
            })
            .instruction();
        console.log(instruction);

        let tx = new Transaction().add(instruction);
        tx.feePayer = signer.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        let vtx = new VersionedTransaction(tx.compileMessage());
        const simulation = await connection.simulateTransaction(vtx);

        console.log(simulation);
    });

    // it("test hash", async () => {
    //     // let test = Buffer.from([
    //     //     121, 33, 62, 98, 62, 100, 107, 59, 96, 136, 222, 213, 45, 214, 63, 231, 244, 152, 245,
    //     //     172, 5, 88, 74, 118, 18, 64, 4, 164, 14, 249, 15, 90,
    //     // ]);
    //     let test = Buffer.from([
    //         152, 9, 217, 216, 218, 152, 218, 37, 106, 188, 91, 185, 140, 137, 203, 49, 21, 159, 168,
    //         223, 61, 67, 83, 62, 164, 89, 11, 32, 150, 15, 233, 209,
    //     ]);
    //     let leaf = new PublicKey(test);
    //     console.log(leaf.toString());
    // });
    // let ii = {
    //     interface: "V1_NFT",
    //     id: "CJbhEgXESCq49TeQhLS7RwSPwaJBJoZXgYKAqt6mbu2M",
    //     content: {
    //         $schema: "https://schema.metaplex.com/nft1.0.json",
    //         json_uri:
    //             "https://prod-tensor-creators-s3.s3.us-east-1.amazonaws.com/drop/e6ed698b-ae10-42f9-8d2e-16b8d844439e/5a5c32cf-1922-4dc5-8d01-ee6e21e26403",
    //         files: [[Object]],
    //         metadata: {
    //             attributes: [Array],
    //             description: "A long time ago in a Solaxy far, far away...",
    //             name: "Tensorian #3502",
    //             symbol: "TNSRNS",
    //         },
    //         links: {
    //             image: "https://prod-tensor-creators-s3.s3.us-east-1.amazonaws.com/drop-metadata/24f27171-430f-42ca-b442-6a75a8daadad/images/4643.png",
    //             external_url: "https://www.tensor.trade/",
    //         },
    //     },
    //     authorities: [
    //         {
    //             address: "AQCwvz5oCrtCsxPwBDqaaFX6EuGBhk1kf6G6Pehrhvb1",
    //             scopes: [Array],
    //         },
    //     ],
    //     compression: {
    //         eligible: false,
    //         compressed: true,
    //         data_hash: "89uDBH723hi2eBumPNGGbnoV4AH6Hi7KCNxEVm9JRB8L",
    //         creator_hash: "Ab9mXRaQEA1QuiGUgBj68siPSqZNwQ2F9izNtFkghudE",
    //         asset_hash: "99qjUWFzLZxeGDuhkRjxyVjDiqvf8FqihMPWcwytmiVo",
    //         tree: "28K4n3AZe2nJ7yNgRbfAcaEppq2N9zi2Sdu8BoP4qzFD",
    //         seq: 23780,
    //         leaf_id: 1001,
    //     },
    //     grouping: [
    //         {
    //             group_key: "collection",
    //             group_value: "5PA96eCFHJSFPY9SWFeRJUHrpoNF5XZL6RrE1JADXhxf",
    //         },
    //     ],
    //     royalty: {
    //         royalty_model: "creators",
    //         target: null,
    //         percent: 0.030000000000000002,
    //         basis_points: 300,
    //         primary_sale_happened: true,
    //         locked: false,
    //     },
    //     creators: [
    //         {
    //             address: "6pZYD8qi7g8XT8pPg8L6NJs2znZkQ4CoPjTz6xqwnBWg",
    //             share: 100,
    //             verified: false,
    //         },
    //     ],
    //     ownership: {
    //         frozen: false,
    //         delegated: false,
    //         delegate: null,
    //         ownership_model: "single",
    //         owner: "BsKkdx1WPtdXQHsStXfTi1Cf3Wae6iWrt89UWLJxCA1E",
    //     },
    //     supply: { print_max_supply: 0, print_current_supply: 0, edition_nonce: null },
    //     mutable: true,
    //     burnt: false,
    // };

    // let yy = {
    //     name: "Tensorian #3502",
    //     description: "A long time ago in a Solaxy far, far away...",
    //     symbol: "TNSRNS",
    //     image: "https://prod-tensor-creators-s3.s3.us-east-1.amazonaws.com/drop-metadata/24f27171-430f-42ca-b442-6a75a8daadad/images/4643.png",
    //     external_url: "https://www.tensor.trade/",
    //     seller_fee_basis_points: 300,
    //     attributes: [
    //         { trait_type: "Background", value: "Red" },
    //         { trait_type: "Back Accessory", value: "Drone" },
    //         { trait_type: "Base", value: "Point" },
    //         { trait_type: "Earring", value: "None" },
    //         { trait_type: "Body", value: "Track Jacket" },
    //         { trait_type: "Eyes", value: "AugMKI - Diagonal" },
    //         { trait_type: "Front Accessory", value: "None" },
    //         { trait_type: "Headgear", value: "Antennae" },
    //         { trait_type: "Faceplate", value: "None" },
    //         { trait_type: "Faction", value: "Android" },
    //     ],
    //     properties: { category: "image", collection: { name: "Tensorians", family: "TNSRNS" } },
    //     creators: [
    //         {
    //             address: "6pZYD8qi7g8XT8pPg8L6NJs2znZkQ4CoPjTz6xqwnBWg",
    //             share: 100,
    //             verified: true,
    //         },
    //     ],
    // };

    // it("get All Tree", async () => {
    //     // let program = new anchor.Program(
    //     //     idl,
    //     //     new PublicKey("7H73hAEk1R1EXXgheDBdAn3Un3W7SQKMuKtwpfU67eet")
    //     // );
    //     let merkleTrees = [];
    //     let treeAuthorities = [];
    //     let creatorHashs = [];
    //     let listOfTokenIds = [
    //         "67keSSVLkGn5GARYsrCrzL4FRM3Qz7dKmZABfaE4s91y",
    //         "CjQje6aF3pHi2i5tf1dXVRfA8gjAU2dvjvuiXq6JiYMv",
    //         "6btb2wD4sNoqe95YnUu7dEzC8tY3s87qj1XMuYfasCRV",
    //         "DM5KtGQXYfDk6sGJ8rCnc7Snz7HCXZk4fUrukQL3Sy8",
    //         "93A4gRXfHDFUULYfeVXTdyaqdQ5LyMvPr2jSdMmXC3bk",
    //         "FSGSwQwj97JARoxYwBP34k7yuH3uP1nDD6qKDKejTmAG",
    //         "zxog1QodQbP51GkYQsnanG5uNn7qFQUwX7uR5zQPbBB",
    //         "2s7QpRF2Zgb8N5Lf85meBGiGWbtvBYceFJtWRsEnKC2F",
    //         "BhvfTQcJwTo2JEyVscRuxXYGJh8SgY8roAmVkYgcfzpM",
    //         "8WPYAUtHGZDgK9pRXvv7Dg58MXaWjZseijVj8jbvciJq",
    //         "HRjNjmueeFHQcr5uWxrFX5Qpa6FFFQzgLKrteXrBxdfv",
    //         "Dq4vkC9cYyRdyRegWbFuNSmETosVfirmd2Die7FULzeQ",
    //         "8TnyNW2k4WsR2CC6sZUideoqt3X6ZvhzorTMDsPMqYTt",
    //         "6qF6qpWiM25cnMFXLXSb7yh26CL96CRJ94qPYeAh5vRv",
    //         "EkHX5kHV6FRPEvPcbokPj5mFSpS9FFV9mL7CkgJTR4wB",
    //         "Hxnmgt6RzGJp8uSJZDHrTb2Sw9q8Yyn4icEDTV4Ke2nt",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //         "1GwTqXDwKEtxYxuLhGW8xrNMYjpbp1CyGTd6tEdKLfy",
    //     ];
    //     let i = 0;
    //     const res = await Promise.all(
    //         listOfTokenIds.map(async (tokenId) => {
    //             await delay(200 * i++);

    //             const {
    //                 merkleTree,
    //                 treeAuthority,
    //                 creatorHash,
    //                 dataHash,
    //                 canopyDepth,
    //                 nonce,
    //                 root,
    //             } = await neoSwap.UTILS.NFT_ACCOUNTS.getCNFTData({
    //                 Cluster: "mainnet-beta",
    //                 tokenId,
    //                 connection,
    //             });
    //             if (!merkleTrees.includes(merkleTree.toString()))
    //                 merkleTrees.push(merkleTree.toString());
    //             if (!treeAuthorities.includes(treeAuthority.toString()))
    //                 treeAuthorities.push(treeAuthority.toString());

    //             if (!creatorHashs.includes(bs58.encode(creatorHash)))
    //                 creatorHashs.push(bs58.encode(creatorHash));
    //             // const treeProofResponse = await axios({
    //             //     method: "POST",
    //             //     url: clusterApiUrl("mainnet-beta"),
    //             //     headers: {
    //             //         "Content-Type": "application/json",
    //             //     },
    //             //     data: {
    //             //         jsonrpc: "2.0",
    //             //         id: "rpd-op-123",
    //             //         method: "getAssetProof",
    //             //         params: {
    //             //             id: tokenId,
    //             //         },
    //             //     },
    //             // });
    //             // // console.log("treeProofResponse", treeProofResponse.data);

    //             // //@ts-ignore
    //             // let treeProof = (await treeProofResponse.data)//.result.tree_id;
    //             // console.log("treeProof", treeProof);

    //             return {
    //                 merkleTree: merkleTree.toString(),
    //                 treeAuthority: treeAuthority.toString(),
    //                 creatorHash: bs58.encode(creatorHash),
    //                 dataHash: bs58.encode(dataHash),
    //                 canopyDepth: canopyDepth.toString(),
    //                 nonce: nonce.toString(),
    //                 root: bs58.encode(root),
    //                 tokenId,
    //             };
    //             // console.log("merkleTree", merkleTree);
    //         })
    //     );

    //     console.log("res", res);
    //     console.log("merkleTrees", merkleTrees);
    //     console.log("treeAuthorities", treeAuthorities);
    //     console.log("creatorHashs", creatorHashs);

    //     // const instruction = await program.methods
    //     //     .readMerkleTree()
    //     //     .accounts({
    //     //         signer: signer.publicKey,
    //     //         merkleTree,
    //     //     })
    //     //     .instruction();

    //     // let tx = new Transaction().add(instruction);
    //     // tx.feePayer = signer.publicKey;
    //     // tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    //     // let vtx = new VersionedTransaction(tx.compileMessage());
    //     // const simulation = await connection.simulateTransaction(vtx);
    //     // // const hash = await neoSwap.UTILS.sendBundledTransactions({
    //     // //     clusterOrUrl,
    //     // //     signer,
    //     // //     txsWithoutSigners: [{ tx: new Transaction().add(instruction) }],
    //     // // });
    //     // console.log(simulation);
    // });
});
