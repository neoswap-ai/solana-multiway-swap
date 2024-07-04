import { AnchorProvider, Program, web3 } from '@project-serum/anchor';
import { createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { splAssociatedTokenAccountProgramId } from './solana.const';
import { SwapData } from './solana.types';
import NeoSwap from './neoSwap.module.v4.2';
import { CONST_PROGRAM } from './solana.test';

export async function findAtaUserFromMint(
    program: Program, // The anchor program instance to interact with the Solana blockchain
    mint: PublicKey, // The public key of the mint (token) to find the ATAs for
    publickey: PublicKey // The public key of the user whose ATAs are being searched
): Promise<
    Array<{
        pubkey: web3.PublicKey; // The public key of the found token account
        account: web3.AccountInfo<Buffer>; // The account information, including the balance, owner, and data
    }>
> {
    // Fetches and returns the associated token accounts by the owner's public key and the specified mint
    return (
        await program.provider.connection.getTokenAccountsByOwner(publickey, {
            mint: mint,
        })
    ).value; // Extracts the value from the response which contains the list of token accounts
}

export async function findOrCreateAta(
    program: Program, // The anchor program instance to interact with the Solana blockchain
    owner: PublicKey, // The public key of the owner for whom the ATA will be found or created
    mint: PublicKey, // The public key of the mint (token) for which the ATA is related
    payer: PublicKey // The public key of the payer who will pay for the transaction if a new ATA needs to be created
): Promise<{ mintAta: PublicKey; transaction?: Transaction }> {
    let mintAta; // Variable to store the mint's associated token account (ATA) public key
    let txCreate = new Transaction(); // Initialize a new transaction for creating an ATA, if necessary
    let ixCreateMintAta; // Instruction for creating the mint ATA

    try {
        // Attempt to find the existing ATA for the given mint and owner
        const mintAtaData = await findAtaUserFromMint(program, mint, owner);
        console.log('mintAtaData', mintAtaData[0].pubkey.toBase58());

        // If more than one ATA is found, log their public keys for debugging purposes
        if (mintAtaData.length > 1) {
            console.log('mintAtaData[1].pubkey.toBase58()', mintAtaData[1]?.pubkey.toBase58());
            console.log('mintAtaData[2].pubkey.toBase58()', mintAtaData[2]?.pubkey.toBase58());
        }
        return { mintAta: mintAtaData[0].pubkey };
    } catch (error) {
        // If no ATA is found, create a new one
        const res = await cIPdaAta(mint, payer, owner); // Call the function to create a new ATA
        mintAta = res.mintAta; // Store the new ATA's public key
        ixCreateMintAta = res.ix; // Store the instruction to create the new ATA
        console.log('mintAta other + txadd', mintAta.toBase58());

        txCreate.add(ixCreateMintAta); // Add the create ATA instruction to the transaction
        return { mintAta, transaction: txCreate }; // Return the new ATA's public key and the transaction
    }
}

export async function cIPdaAta(
    mint: PublicKey,
    payer: PublicKey,
    owner: PublicKey
): Promise<{ ix: TransactionInstruction; mintAta: PublicKey; mintAta_bump: number }> {
    const [mintAta, mintAta_bump] = await PublicKey.findProgramAddress(
        [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        splAssociatedTokenAccountProgramId
    );
    console.log('mintAta', mintAta.toBase58());

    const ixCreateMintAta = createAssociatedTokenAccountInstruction(payer, mintAta, owner, mint);
    return { ix: ixCreateMintAta, mintAta: mintAta, mintAta_bump: mintAta_bump };
}

export async function sendAllPopulateInstruction(
    program: Program,
    transactionList: Array<{
        tx: web3.Transaction;
        signers?: web3.Signer[] | undefined;
    }>
) {
    // Fetch the latest blockhash to use for the transactions
    const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
    let sendAllArray = transactionList;
    // Populate each transaction with the feePayer and recentBlockhash
    sendAllArray.forEach((element) => {
        element.tx.feePayer = program.provider.publicKey;
        element.tx.recentBlockhash = recentBlockhash;
    });
    return sendAllArray;
}

export async function getSwapData(
    swapDataAccount: PublicKey,
    program: Program
): Promise<{
    swapData: SwapData;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
}> {
    // Retrieve swap data from a Program Derived Address (PDA) using the NeoSwap module
    return await NeoSwap.getSwapDataFromPDA({
        swapDataAccount,
        provider: program.provider as AnchorProvider,
        CONST_PROGRAM,
    });
}

export async function getSeed(sentData: SwapData): Promise<{
    swapDataAccount: web3.PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
}> {
    // Generate a seed and bump for a new swap data account based on given swap data
    return await NeoSwap.getSeedFromData({
        swapDataGiven: sentData,
        CONST_PROGRAM: CONST_PROGRAM,
    });
}
