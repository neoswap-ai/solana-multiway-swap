import { Program, web3 } from '@project-serum/anchor';
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
    let txCreate: Transaction = new Transaction();
    let ixCreateMintAta: TransactionInstruction;
    let pdaMintAta: PublicKey;

    try {
        pdaMintAta = await findAtaUserFromMint(program, mint, swapDataAccount);
        console.log('pdaMintAta', pdaMintAta.toBase58());
    } catch (error) {
        const res = await createInstructionPdaAta(mint, publicKey, swapDataAccount);
        pdaMintAta = res.pdaMintAta;
        ixCreateMintAta = res.ix;
        console.log('pdaMintAta other + txadd', pdaMintAta.toBase58());

        txCreate.add(ixCreateMintAta);
    }

    const depositIx = createTransferInstruction(userMintAta, pdaMintAta, publicKey, 1);
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

    return { transaction: txCreate, ata: pdaMintAta };
}
export async function claimNFTInstruction(
    program: Program,
    publicKey: PublicKey,
    mint: PublicKey,
): Promise<{ transaction: Transaction; ata: PublicKey }> {
    let userMintAta;

    let txCreate: Transaction = new Transaction();
    let ixCreateMintAta: TransactionInstruction;

    try {
        userMintAta = await findAtaUserFromMint(program, mint, publicKey);
        console.log('userMintAta', userMintAta.toBase58());
    } catch (error) {
        const res = await createInstructionPdaAta(mint, publicKey, publicKey);
        userMintAta = res.pdaMintAta;
        ixCreateMintAta = res.ix;
        console.log('userMintAta other + txadd', userMintAta.toBase58());

        txCreate.add(ixCreateMintAta);
    }

    // const depositIx = createTransferInstruction(userMintAta, pdaMintAta, publicKey, 1);
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
    // console.log('depositIx', depositIx);
    // txCreate.add(depositIx);

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
