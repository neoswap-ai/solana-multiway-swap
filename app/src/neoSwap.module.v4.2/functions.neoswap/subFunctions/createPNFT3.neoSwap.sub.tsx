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
//     clusterApiUrl,
// } from '@solana/web3.js';
// import { TokenStandard, Uses } from '@metaplex-foundation/mpl-token-metadata';
// // import { createInitializeV2Instruction } from "@metaplex-foundation/mpl-candy-machine-core";

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

// import { Connection } from '@solana/web3.js';
// import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber, token } from '@metaplex-foundation/js';
// import { log } from 'console';

// // Use the RPC endpoint of your choice.
// /**
//  * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
//  * @param {SwapData} swapData Given Swap Data sorted
//  * @param {PublicKey} signer /!\ signer should be initializer
//  * @param {string} CONST_PROGRAM 4 character string to initialize the seed
//  * @param {Program} program program linked to NeoSwap
//  * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
//  */
// export const createPnft3 = async (Data: {
//     // swapData: SwapData;

//     signer: Keypair;

//     // CONST_PROGRAM: string;
//     program: Program;
// }) => {

//     const connection = new Connection("https://api.devnet.solana.com", "confirmed");
//     // const mintingWallet = Keypair.generate();

//     const metadata = {
//         name: "My NFT",
//         symbol: "NFT",
//         uri: "https://example.com/nft-metadata.json",
//         sellerFeeBasisPoints: 100,
//         creators: [{ address: Data.signer.publicKey.toBase58(), share: 100 }],
//       };
      
//       const metadataFile = new File([JSON.stringify(metadata)], "metadata.json");
      
//       const content = Buffer.from(await metadataFile.arrayBuffer());
      
//       const instruction = await Metaplex.create(
//         content,
//         Data.signer.publicKey,
//         Data.signer.publicKey,
//         null,
//         true
//       );
      
//       await connection.sendTransaction(
//         new Transaction().add(instruction),
//         [Data.signer],
//         { skipPreflight: false, preflightCommitment: "singleGossip" }
//       );


//     // const connection = new Connection('https://api.devnet.solana.com');
//     // // const metaplex = new Metaplex(connection);
//     // // await connection.requestAirdrop(new PublicKey('2esVA6hnjkeVv1cNmb1cZUMrTYXqsMUxGFSVVJpRG7YM'), 2 * LAMPORTS_PER_SOL);
//     // const metaplex = Metaplex.make(connection).use(keypairIdentity(Data.signer)).use(bundlrStorage());

//     // const { nft } = await metaplex.nfts().create({
//     //     uri: 'https://arweave.net/123',
//     //     name: 'My NFT',
//     //     sellerFeeBasisPoints: 500, // Represents 5.00%.
//     //     tokenStandard: TokenStandard.ProgrammableNonFungible,
//     // });

//     // console.log('nft', nft);

//     // const nftOut = await metaplex.nfts().mint({
//     //     nftOrSft: nft,
//     //     toOwner: Data.signer.publicKey,
//     //     amount: token(1),
//     // });
//     // log('nftOut', nftOut);
// };

// export default createPnft3;
