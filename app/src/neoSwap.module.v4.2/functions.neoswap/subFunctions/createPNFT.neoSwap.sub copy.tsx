// import { Program, utils, Wallet } from '@project-serum/anchor';
// import {
//     Keypair,
//     LAMPORTS_PER_SOL,
//     PublicKey,
//     SYSVAR_INSTRUCTIONS_PUBKEY,
//     Signer,
//     SystemProgram,
//     Transaction,
//     TransactionInstruction,
// } from '@solana/web3.js';
// import { appendTransactionToArray } from '../../utils.neoSwap/appendTransactionToArray.neosap';
// import { convertAllTransaction } from '../../utils.neoSwap/convertAllTransaction.neoswap';
// import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
// import { TradeStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
// import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';
// import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
// import { SplTokenAccountsCoder } from '@project-serum/anchor/dist/cjs/coder/spl-token/accounts';
// import { SplAssociatedTokenAccountsCoder } from '@project-serum/anchor/dist/cjs/coder/spl-associated-token/accounts';
// import { splAssociatedTokenAccountProgramId } from '../../utils.neoSwap/const.neoSwap';

// // import { createNft, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';

// // import { create } from '@metaplex-foundation/mpl-candy-machine';
// // import {
// //     createSignerFromKeypair,
// //     generateSigner,
// //     percentAmount,
// //     signerIdentity,
// //     signerPayer,
// // } from '@metaplex-foundation/umi';
// // import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
// // import { mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine';


// import { Metaplex } from "@metaplex-foundation/js";
// import { Connection, clusterApiUrl } from "@solana/web3.js";

// import { toBigNumber } from "@metaplex-foundation/js";

// // Use the RPC endpoint of your choice.
// /**
//  * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
//  * @param {SwapData} swapData Given Swap Data sorted
//  * @param {PublicKey} signer /!\ signer should be initializer
//  * @param {string} CONST_PROGRAM 4 character string to initialize the seed
//  * @param {Program} program program linked to NeoSwap
//  * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
//  */
// export const createPnft = async (Data: {
//     // swapData: SwapData;

//     signer: Keypair;

//     // CONST_PROGRAM: string;
//     program: Program;
// }) => {

//     const connection = new Connection(clusterApiUrl("mainnet-beta"));
//     const metaplex = new Metaplex(connection);
//     // Create the Collection NFT.
//     const { nft: collectionNft } = await metaplex.nfts().create({
//       name: "My Collection NFT",
//       uri: "https://example.com/path/to/some/json/metadata.json",
//       sellerFeeBasisPoints: 0,
//       isCollection: true,
//     });
    
//     // Create the Candy Machine.
//     const { candyMachine } = await metaplex.candyMachines().create({
//       itemsAvailable: toBigNumber(5000),
//       sellerFeeBasisPoints: 333, // 3.33%
//       collection: {
//         address: collectionNft.address,
//         updateAuthority: metaplex.identity(),
//       },
//     });




//     const umi = createUmi('http://127.0.0.1:8899').use(mplCandyMachine());
//     //  umi.payer=   signerPayer(new Wallet(Data.signer)as unknown as Signer)  ;
//     // ({ publicKey: Data.signer.publicKey, secretKey: Data.signer.secretKey })
//     umi.payer = generateSigner(umi);
//     await Data.program.provider.connection.requestAirdrop(new PublicKey(umi.payer.publicKey), 2 * LAMPORTS_PER_SOL);

//     // umi.identity=   signerIdentity(new Wallet(Data.signer) as Signer)  ;
//     // new Signer(umi.identity.publicKey, umi.provider.connection.signer);
//     // mplCandyMachine().install()
//     // new Wallet(Data.signer)
//     // if (Data.swapData.status !== TradeStatus.Initializing) throw console.error('Trade not in waiting for initialized state');

//     // const seedSwapData = await getSeedFromData({
//     //     swapDataGiven: Data.swapData,
//     //     CONST_PROGRAM: Data.CONST_PROGRAM,
//     // });

//     // const candyMachinePublicKey = Keypair.generate().publicKey
//     // const candyMachine = await fetchCandyMachine(umi, candyMachinePublicKey);
//     // const candyGuard = await fetchCandyGuard(umi, candyMachine.mintAuthority);

//     const collectionUpdateAuthority = generateSigner(umi);
//     const collectionMint = generateSigner(umi);
//     await createNft(umi, {
//         mint: collectionMint,
//         authority: collectionUpdateAuthority,
//         name: 'My Collection NFT',
//         uri: 'https://example.com/path/to/some/json/metadata.json',
//         sellerFeeBasisPoints: percentAmount(9.99, 2), // 9.99%
//         isCollection: true,
//     }).sendAndConfirm(umi);

//     const candyMachine = generateSigner(umi);
//     return await (
//         await create(umi, {
//             candyMachine,
//             collectionMint: collectionMint.publicKey,
//             collectionUpdateAuthority,
//             tokenStandard: TokenStandard.ProgrammableNonFungible,
//             sellerFeeBasisPoints: percentAmount(9.99, 2),
//             itemsAvailable: 5000,
//             creators: [
//                 {
//                     address: umi.identity.publicKey,
//                     verified: true,
//                     percentageShare: 100,
//                 },
//             ],
//             configLineSettings: {
//                 //@ts-ignore
//                 prefixName: 'test',
//                 nameLength: 32,
//                 prefixUri: '',
//                 uriLength: 200,
//                 isSequential: false,
//             },
//         })
//     ).sendAndConfirm(umi);

//     // Create the Collection NFT.
//     //   const collectionUpdateAuthority = Keypair.generate();
//     //   const collectionMint = Keypair.generate();
//     //   await createNft(Data.signer, {
//     //     mint: collectionMint,
//     //     authority: collectionUpdateAuthority,
//     //     name: "My Collection NFT",
//     //     uri: "https://example.com/path/to/some/json/metadata.json",
//     //     sellerFeeBasisPoints: percentAmount(9.99, 2), // 9.99%
//     //     isCollection: true,
//     //   }).sendAndConfirm(Data.signer);

//     //   // Create the Candy Machine.
//     //   const candyMachine = generateSigner(Data.signer);
//     //   await create(Data.signer, {
//     //     candyMachine,
//     //     collectionMint: collectionMint.publicKey,
//     //     collectionUpdateAuthority,
//     //     tokenStandard: TokenStandard.NonFungible,
//     //     sellerFeeBasisPoints: percentAmount(9.99, 2), // 9.99%
//     //     itemsAvailable: 5000,
//     //     creators: [
//     //       {
//     //         address: Data.signer.publicKey,
//     //         verified: true,
//     //         percentageShare: 100,
//     //       },
//     //     ],
//     //     configLineSettings: some({
//     //       prefixName: "",
//     //       nameLength: 32,
//     //       prefixUri: "",
//     //       uriLength: 200,
//     //       isSequential: false,
//     //     }),
//     //   }).sendAndConfirm(Data.signer);

//     ///////////////////::

//     // let addInitTransactionInstruction: Array<TransactionInstruction> = [];
//     // // for (let item = 1; item < Data.swapData.items.length; item++) {
//     // // console.log('XXXXXXX - added to init item n° ', item, ' XXXXXXX');
//     // let mint = Keypair.generate();

//     // let metadata_seeds = [
//     //     utils.bytes.utf8.encode("metadata"),
//     //     TOKEN_PROGRAM_ID.toBytes(),
//     //     mint.publicKey.toBytes()
//     // ];

//     // // master edition PDA address
//     // let master_edition_seeds = [
//     //     utils.bytes.utf8.encode("metadata"),
//     //     TOKEN_PROGRAM_ID.toBytes(),
//     //     mint.publicKey.toBytes(),
//     //     utils.bytes.utf8.encode("edition")
//     // ];

//     // let [nftMetadata] = PublicKey.findProgramAddressSync(metadata_seeds, Data.program.programId)
//     // let [nftMasterEdition] = PublicKey.findProgramAddressSync(master_edition_seeds, Data.program.programId)
//     // const instructionToAdd = await Data.program.methods
//     //     .createPnft(
//     //         // seedSwapData.swapDataAccount_seed,
//     //         // seedSwapData.swapDataAccount_bump,
//     //         // Data.swapData.items[item]
//     //         "nft" + Math.ceil(Math.random() * 10 ** 5)
//     //     )
//     //     .accounts({
//     //         systemProgram: SystemProgram.programId,
//     //         tokenProgram: TOKEN_PROGRAM_ID,
//     //         sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
//     //         splTokenProgram: TOKEN_PROGRAM_ID,
//     //         splAtaProgram: splAssociatedTokenAccountProgramId,
//     //         // swapDataAccount:seedSwapData.swapDataAccount,
//     //         signer: Data.signer,
//     //         // itemFromDeposit:
//     //         mint: mint.publicKey,
//     //         nftMetadata: nftMetadata,
//     //         nftMasterEdition: nftMasterEdition,
//     //     })
//     //     .instruction();
//     // addInitTransactionInstruction.push(instructionToAdd);
//     // // }
//     // let addInitTransaction: Transaction[] = [new Transaction()];
//     // addInitTransaction = appendTransactionToArray({
//     //     mainArray: addInitTransaction,
//     //     itemToAdd: addInitTransactionInstruction,
//     // });

//     // const addInitSendAllArray = await convertAllTransaction(addInitTransaction);

//     // return { addInitSendAllArray, mint: mint.publicKey };
// };

// export default createPnft;
