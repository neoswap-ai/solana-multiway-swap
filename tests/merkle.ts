import * as anchor from "@coral-xyz/anchor";

import { Keypair, Connection, clusterApiUrl } from "@solana/web3.js";
import { neoSwap } from "@neoswap/solana";

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
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import { idl } from "../tempIdl";
// import fetch from "node-fetch";
// import {} from axios
// import {} from "@metaplex-foundation/js";

import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
const user6 = Keypair.fromSecretKey(usk6);
export async function delay(time: number) {
    // console.log('delay');

    return new Promise((resolve) => setTimeout(resolve, time));
}

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
    it("cancel and close", async () => {
        console.log(bs58.encode(signer.secretKey));
    });
    // it("cancel and close", async () => {
    //     let program = new anchor.Program(
    //         idl,
    //         new PublicKey("7H73hAEk1R1EXXgheDBdAn3Un3W7SQKMuKtwpfU67eet")
    //     );

    //     const { merkleTree } = await neoSwap.UTILS.NFT_ACCOUNTS.getCNFTData({
    //         Cluster: "mainnet-beta",
    //         tokenId: "CJbhEgXESCq49TeQhLS7RwSPwaJBJoZXgYKAqt6mbu2M",
    //         connection,
    //     });
    //     console.log("merkleTree", merkleTree);

    //     const instruction = await program.methods
    //         .readMerkleTree()
    //         .accounts({
    //             signer: signer.publicKey,
    //             merkleTree,
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
