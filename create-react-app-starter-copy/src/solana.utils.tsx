import { Program, Provider, web3 } from '@project-serum/anchor';
import {
    createAssociatedTokenAccountInstruction,
    createInitializeAccountInstruction,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { splAssociatedTokenAccountProgramId } from './solana.const';
// const TokenInstructions = require('@project-serum/serum').TokenInstructions;

export async function findAtaUserFromMint(program: Program, mint: PublicKey, publickey: PublicKey): Promise<PublicKey> {
    return (
        await program.provider.connection.getTokenAccountsByOwner(publickey, {
            mint: mint,
        })
    ).value[0].pubkey;
}
export async function createInstructionPdaAta(
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
export function transferSol(from: PublicKey, to: PublicKey, amount: number, decimals?: number) {
    if (!decimals) {
        decimals = 1;
    }
    return web3.SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: amount * 10 ** decimals,
    });
}
// export async function createInstructionPdasolAta(
//     program: Program,
//     mint: PublicKey,
//     payer: PublicKey,
//     pda: PublicKey
// ): Promise<{ ix: TransactionInstruction; pdaMintAta: PublicKey }> {
// createAccount(program.provider.connection, payer, SystemProgram.programId, pda);
//     const [pidMintAta, pidMintAta_bump] = await PublicKey.findProgramAddress(
//         [pda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
//         splAssociatedTokenAccountProgramId
//     );
//     console.log('pidMintAta', pidMintAta.toBase58());

//     const ixCreateMintAta = createAssociatedTokenAccountInstruction(
//         payer,
//         pidMintAta,
//         pda,
//         mint
//         // programId
//     );
//     return { ix: ixCreateMintAta, pdaMintAta: pidMintAta };
// }

export async function createInstructionPdasolAta(
    payer: PublicKey,
    provider: Provider
): Promise<{ signature: any; createdAccount: PublicKey }> {
    const lamports = await provider.connection.getMinimumBalanceForRentExemption(165);

    const vault = web3.Keypair.generate();
    const tx = new web3.Transaction();
    tx.add(
        SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: vault.publicKey,
            space: 0,
            lamports,
            programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeAccountInstruction(vault.publicKey, SystemProgram.programId, payer, TOKEN_PROGRAM_ID)
    );
    const signature = await provider.send(tx, [vault]);
    return { signature, createdAccount: vault.publicKey };
}

export async function createTokenAccountCustom(provider: Provider, owner: PublicKey) {
    const vault = web3.Keypair.generate();
    const tx = new web3.Transaction();
    tx.add(...(await createTokenAccountInstrs(provider, vault.publicKey, owner)));
    await provider.send(tx, [vault]);
    return vault.publicKey;
}

export async function createTokenAccountInstrs(
    provider: Provider,
    newAccountPubkey: PublicKey,
    owner: PublicKey,
    lamports?: number
) {
    if (lamports === undefined) {
        lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
    }
    return [
        web3.SystemProgram.createAccount({
            fromPubkey: provider.wallet.publicKey,
            newAccountPubkey,
            space: 165,
            lamports,
            programId: TOKEN_PROGRAM_ID,
        }),
        // createInitializeAccount3Instruction(newAccountPubkey, SystemProgram.programId, owner),
    ];
}
