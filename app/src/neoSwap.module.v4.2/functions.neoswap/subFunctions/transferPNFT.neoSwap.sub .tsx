import { Program, utils, Wallet } from '@project-serum/anchor';
import {
    ComputeBudgetProgram,
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

import { appendTransactionToArray } from '../../utils.neoSwap/appendTransactionToArray.neosap';
import { convertAllTransaction } from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
import { TradeStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
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
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber, Pda } from '@metaplex-foundation/js';
import findOrCreateAta from '../../utils.neoSwap/findOrCreateAta.neoSwap';

// Use the RPC endpoint of your choice.
/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const transferPNFT = async (Data: {
    signer: Keypair;
    program: Program;
    mintToDeposit: PublicKey;
    destinary: PublicKey;
}) => {
    // INIT
    let ownerTo = Data.destinary;
    let depositAllIx: TransactionInstruction[] = [];
    const TOKEN_METADATA_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
    // find signer ata
    const { mintAta: itemFromDeposit, instruction: itemFromDepositTx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        mint: Data.mintToDeposit,
        owner: Data.signer.publicKey,
        signer: Data.signer.publicKey,
    });
    console.log('itemFromDeposit', itemFromDeposit.toBase58());

    // if (itemFromDepositTx) depositAllIx.push(...itemFromDepositTx);

    // find destinary ata
    const { mintAta: itemToDeposit, instruction: itemToDepositTx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        mint: Data.mintToDeposit,
        owner: ownerTo,
        signer: Data.signer.publicKey,
    });
    // if (itemToDepositTx) depositAllIx.push(...itemToDepositTx);
    console.log('itemToDeposit', itemToDeposit.toBase58());

    // metadata seeds & address
    // console.log(TOKEN_PROGRAM_ID.toBase58(), ' vs ', 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

    let metadata_seeds = [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM.toBuffer(), Data.mintToDeposit.toBuffer()];
    let [nftMetadata] = PublicKey.findProgramAddressSync(metadata_seeds, TOKEN_METADATA_PROGRAM);
    console.log('nftMetadata', nftMetadata.toBase58());

    // master edition seeds & address
    // console.log(TOKEN_PROGRAM_ID.toBase58(), ' vs ', 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

    let master_edition_seeds = [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM.toBuffer(),
        // TOKEN_PROGRAM_ID.toBuffer(),
        Data.mintToDeposit.toBuffer(),
        Buffer.from('edition'),
    ];
    let [nftMasterEdition] = PublicKey.findProgramAddressSync(master_edition_seeds, TOKEN_METADATA_PROGRAM);
    console.log('\nCou6RHLzfRRiGcPpG4o6LRSTaFf39FDmAbYf9RgfnWXk', ' vs ', nftMasterEdition.toBase58());
    // nftMasterEdition = new PublicKey('C9v4rru9AVCfWfjQXT1xUEN4XjfkYTFENfK3AKeGZpKs');

    let authRulesProgram_seeds = [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM.toBuffer(),
        // TOKEN_PROGRAM_ID.toBuffer(),
        Data.mintToDeposit.toBuffer(),
        Buffer.from('collection_authority'),
        Data.signer.publicKey.toBuffer(),
        // Data.mintToDeposit.toBuffer(),
        // Buffer.from('edition'),
    ];
    let [authRulesProgram] = PublicKey.findProgramAddressSync(authRulesProgram_seeds, TOKEN_METADATA_PROGRAM);
    console.log('\nauthRulesProgram', authRulesProgram.toBase58());
    authRulesProgram = new PublicKey('auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg');
    console.log('authRulesProgram', authRulesProgram.toBase58());

    let authRules_seeds = [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM.toBuffer(),
        // TOKEN_PROGRAM_ID.toBuffer(),
        Data.mintToDeposit.toBuffer(),
        Buffer.from('user'),
        Data.signer.publicKey.toBuffer(),
    ];
    
    let [authRules] = PublicKey.findProgramAddressSync(authRules_seeds, TOKEN_METADATA_PROGRAM);

    console.log('\nauthRules', authRules.toBase58());
    authRules = new PublicKey('eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9'); //eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9  metaplex authrulesAccount Cou6RHLzfRRiGcPpG4o6LRSTaFf39FDmAbYf9RgfnWXk
    console.log('authRules', authRules.toBase58());
    let ownerTokenRecord_seed = [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM.toBuffer(),
        // TOKEN_PROGRAM_ID.toBuffer(),
        Data.mintToDeposit.toBuffer(),
        Buffer.from('token_record'),
        itemFromDeposit.toBuffer(),
    ];

    let [ownerTokenRecord] = PublicKey.findProgramAddressSync(ownerTokenRecord_seed, TOKEN_METADATA_PROGRAM);
    console.log('\nownerTokenRecord', ownerTokenRecord.toBase58());

    let destinationTokenRecord_seed = [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM.toBuffer(),
        // TOKEN_PROGRAM_ID.toBuffer(),
        Data.mintToDeposit.toBuffer(),
        Buffer.from('token_record'),
        itemToDeposit.toBuffer(),
    ];
    let [destinationTokenRecord] = PublicKey.findProgramAddressSync(
        destinationTokenRecord_seed,
        TOKEN_METADATA_PROGRAM
    );
    console.log('destinationTokenRecord', destinationTokenRecord.toBase58());


    2	
// BJ5TwcvJGuPTCUHZe38ksX17aPxcVrutkDF3rzjaZZ7y
// 9u4HC6Gp4cxTA1ADUzomYBzZ9hfYnSP65swXcSBDRKHr

// 3SQohJPy33tFmDSMKc8aqandqSZ34uWrQJea8AvVogjQ
// C9v4rru9AVCfWfjQXT1xUEN4XjfkYTFENfK3AKeGZpKs
// Cou6RHLzfRRiGcPpG4o6LRSTaFf39FDmAbYf9RgfnWXk

    //     Metadata
    // Literal: metadata
    // The program's prefix for PDA seeds.
    // Token Metadata Program	:metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
    // Program ID
    // The public key of the program.
    // Mint
    // Variable
    // The public key of the Mint Account to derive from.
    // Collection Authority Prefix
    // Literal: collection_authority
    // A literal to differentiate the Collection Authority Record accounts.
    // Collection Authority

    // console.log('systemProgram:', SystemProgram.programId.toBase58());
    // console.log('tokenProgram:', TOKEN_PROGRAM_ID.toBase58());
    // console.log('sysvarInstructions:', SYSVAR_INSTRUCTIONS_PUBKEY.toBase58());
    // console.log('splTokenProgram:', TOKEN_PROGRAM_ID.toBase58());
    // console.log('/nsplAtaProgram:', splAssociatedTokenAccountProgramId.toBase58());
    console.log("\n\nsigner:", Data.signer.publicKey.toBase58());
    console.log("itemFromDeposit:", itemFromDeposit.toBase58());
    console.log("\nmint:", Data.mintToDeposit.toBase58());
    console.log("nftMetadata:", nftMetadata.toBase58());
    console.log("\nitemToDeposit:", itemToDeposit.toBase58());
    console.log("ownerTo:", ownerTo.toBase58());
    console.log("\nnftMasterEdition:", nftMasterEdition.toBase58());
    console.log("\nownerTokenRecord:", ownerTokenRecord.toBase58());
    console.log("destinationTokenRecord:", destinationTokenRecord.toBase58());
    // console.log('authRulesProgram:', authRulesProgram.toBase58());
    // console.log('authRules:', authRules.toBase58());

    const depositIx = await Data.program.methods
        .transferPnft()
        .accounts({
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            splTokenProgram: TOKEN_PROGRAM_ID,
            splAtaProgram: splAssociatedTokenAccountProgramId,
            signer: Data.signer.publicKey,
            itemFromDeposit,
            mint: Data.mintToDeposit,
            nftMetadata,
            itemToDeposit,
            ownerTo,
            nftMasterEdition,
            ownerTokenRecord,
            destinationTokenRecord,
            authRulesProgram, // metaplex - eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9
            authRules,
            metadataProgram: TOKEN_METADATA_PROGRAM,
        })

        .instruction();

    depositAllIx.push(depositIx);

    let depositAllTx: {
        tx: Transaction;
        signers?: Signer[] | undefined;
    }[] = [];

    for (let index = 0; index < depositAllIx.length; index++) {
        const ix = depositAllIx[index];

        depositAllTx = [{ tx: new Transaction().add(ix), signers: [Data.signer] }];
        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
            units: 600000,
        });

        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 1,
        });

        depositAllTx[0].tx.add(modifyComputeUnits);
        depositAllTx[0].tx.add(addPriorityFee);
        depositAllTx[0].tx.recentBlockhash = (await Data.program.provider.connection.getLatestBlockhash()).blockhash;

        if (!Data.program.provider.sendAll) throw '';
        const sendallTx = await Data.program.provider.sendAll(depositAllTx, { skipPreflight: true });
        console.log('sendallTx :', sendallTx);
    }

    // return { mintAddress, signature };
    // mintProgrammableNft(
    //     CONFIG.metadata,
    //     CONFIG.imgName,
    //     CONFIG.sellerFeeBasisPoints,
    //     CONFIG.symbol,
    //     CONFIG.creators
    // );
};

export default transferPNFT;
