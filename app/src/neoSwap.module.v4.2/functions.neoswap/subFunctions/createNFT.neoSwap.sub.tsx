import { BN, Program, utils, Wallet } from '@project-serum/anchor';
import {
    Keypair,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    Signer,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import { TokenStandard, Uses } from '@metaplex-foundation/mpl-token-metadata';
// import { createInitializeV2Instruction } from '@metaplex-foundation/mpl-candy-machine-core';
// import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";

import { appendTransactionToArray } from '../../utils.neoSwap/appendTransactionToArray.neosap';
import { convertAllTransaction } from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
import { TradeStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';
import { createAssociatedTokenAccount, createMint, mintToChecked, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SplTokenAccountsCoder } from '@project-serum/anchor/dist/cjs/coder/spl-token/accounts';
import { SplAssociatedTokenAccountsCoder } from '@project-serum/anchor/dist/cjs/coder/spl-associated-token/accounts';
import { splAssociatedTokenAccountProgramId } from '../../utils.neoSwap/const.neoSwap';

// import { createNft, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
// import { create } from '@metaplex-foundation/mpl-candy-machine';
// import {
//     createSignerFromKeypair,
//     generateSigner,
//     percentAmount,
//     signerIdentity,
//     signerPayer,
// } from '@metaplex-foundation/umi';
// import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
// import { mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine';

import { Connection } from '@solana/web3.js';
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber } from '@metaplex-foundation/js';
// i { Token } = require('@solana/spl-token');
const splToken = require('@solana/spl-token');

// Use the RPC endpoint of your choice.
/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const createNft = async (Data: { program: Program; signer: Keypair }) => {
    const metaplex = new Metaplex(Data.program.provider.connection);

    // const mintNFTResponse = await metaplex.nfts().create({
    //     uri: 'https://',
    //     maxSupply: toBigNumber("1"),
    // });

    let mintPubkey = await createMint(
        Data.program.provider.connection, // conneciton
        Data.signer, // fee payer
        Data.signer.publicKey, // mint authority
        Data.signer.publicKey, // freeze authority
        0, // decimals
        undefined,
        undefined,
        TOKEN_PROGRAM_ID
    );
    console.log('mintPubkey', mintPubkey.toBase58());

    let ata = await createAssociatedTokenAccount(
        Data.program.provider.connection, // conneciton
        Data.signer, // fee payer
        mintPubkey, // mint
        Data.signer.publicKey // owner,
    );
    console.log('ata created');

    await mintToChecked(
        Data.program.provider.connection, // conneciton
        Data.signer, // fee payer
        mintPubkey, // mint
        ata, // receiver
        Data.signer.publicKey, // mint authority
        10, // amount.
        0 // decimals
    );
    console.log('minted');

    return mintPubkey;
    // mintProgrammableNft(
    //     CONFIG.metadata,
    //     CONFIG.imgName,
    //     CONFIG.sellerFeeBasisPoints,
    //     CONFIG.symbol,
    //     CONFIG.creators
    // );
};

export default createNft;
