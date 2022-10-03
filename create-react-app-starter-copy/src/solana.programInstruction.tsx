import { BN, Program, web3 } from '@project-serum/anchor';
import {
    TOKEN_PROGRAM_ID,
    createTransferInstruction,
    createAssociatedTokenAccountInstruction,
    transferInstructionData,
} from '@solana/spl-token';
import { SystemProgram } from '@solana/web3.js';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { createInstructionPdaAta, createInstructionPdasolAta, findAtaUserFromMint } from './solana.utils';

export async function depositNFTInstruction(
    program: Program,
    publicKey: PublicKey,
    mint: PublicKey,
    swapDataAccount: PublicKey
): Promise<{ transaction: Transaction; ata: PublicKey }> {
    const userMintAta = await findAtaUserFromMint(program, mint, publicKey);
    console.log('userMintAta', userMintAta.toBase58());
    let transaction: Transaction = new Transaction();
    const { mintAta: pdaMintAta, transaction: ixCreateMintAta } = await findOrCreateAta(
        program,
        swapDataAccount,
        mint,
        publicKey
    );

    const depositIx = createTransferInstruction(userMintAta, pdaMintAta, publicKey, 1);
    console.log('depositIx', depositIx);

    if (ixCreateMintAta) {
        transaction.add(ixCreateMintAta);
    }
    transaction.add(depositIx);

    return { transaction, ata: pdaMintAta };
}

export async function claimNFTInstruction(
    program: Program,
    publicKey: PublicKey,
    mint: PublicKey,
    swapDataAccount: PublicKey,
    swapDataAccount_seed: Buffer,
    swapDataAccount_bump: number
): Promise<{ transaction: Transaction; ata: PublicKey }> {
    let txCreate: Transaction = new Transaction();

    const userMintAtaData = await findOrCreateAta(program, publicKey, mint, publicKey);
    const userMintAta = userMintAtaData.mintAta;
    if (userMintAtaData.transaction) {
        txCreate.add(userMintAtaData.transaction);
    }

    let swapDataAtaData = await findOrCreateAta(program, swapDataAccount, mint, publicKey);
    const swapDataAta = swapDataAtaData.mintAta;
    if (swapDataAtaData.transaction) {
        txCreate.add(swapDataAtaData.transaction);
    }

    const claimNftTx = program.instruction.claim(swapDataAccount_seed, swapDataAccount_bump, new BN(1), true, {
        accounts: {
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccount: swapDataAccount,
            pdaTokenAccount: swapDataAta,
            signer: publicKey,
            userTokenAccountToReceive: userMintAta,
        },
    });

    txCreate.add(claimNftTx);

    return { transaction: txCreate, ata: userMintAta };
}

export async function depositTokenInstruction(
    program: Program,
    publicKey: PublicKey,
    // mint: PublicKey,
    swapDataAccount: PublicKey,
    amount: number
): Promise<Transaction> {
    // const userMintAta = await findAtaUserFromMint(program, mint, publicKey);
    // console.log('userMintAta', userMintAta.toBase58());
    let txCreate: Transaction = new Transaction();
    let ixCreateMintAta: Transaction;
    let pdaMintAta: PublicKey;

    const res = await createInstructionPdasolAta(publicKey, program.provider);

    pdaMintAta = res.createdAccount;
    ixCreateMintAta = new Transaction();
    console.log('pdaMintAta other + txadd', pdaMintAta.toBase58());

    txCreate.add(ixCreateMintAta);

    const depositIx = createTransferInstruction(publicKey, pdaMintAta, publicKey, amount);
    // program.instruction.deposit({
    //     accounts: {
    //         systemProgram: web3.SystemProgram.programId,
    //         tokenProgram: TOKEN_PROGRAM_ID,
    //         swapDataAccount: swapDataAccount,
    //         signer: publicKey,
    //         depositPdaTokenAccount: pdaMintAta,
    //         userTokenAccountToDeposit: userMintAta,
    //     },
    // });
    console.log('depositIx', depositIx);
    txCreate.add(depositIx);

    return txCreate;
}

export async function findOrCreateAta(
    program: Program,
    owner: PublicKey,
    mint: PublicKey,
    payer: PublicKey
): Promise<{ mintAta: PublicKey; transaction?: Transaction }> {
    let mintAta;
    let txCreate = new Transaction();
    let ixCreateMintAta;
    try {
        mintAta = await findAtaUserFromMint(program, mint, owner);
        console.log('mintAta', mintAta.toBase58());
        return { mintAta };
    } catch (error) {
        const res = await createInstructionPdaAta(mint, payer, owner);
        mintAta = res.mintAta;
        ixCreateMintAta = res.ix;
        console.log('mintAta other + txadd', mintAta.toBase58());

        txCreate.add(ixCreateMintAta);
        return { mintAta, transaction: txCreate };
    }
}
