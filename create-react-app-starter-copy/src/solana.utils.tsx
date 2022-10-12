import { Program, Provider, web3 } from '@project-serum/anchor';
import {
    createAssociatedTokenAccountInstruction,
    createInitializeAccountInstruction,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { splAssociatedTokenAccountProgramId } from './solana.const';
// const TokenInstructions = require('@project-serum/serum').TokenInstructions;

export async function findAtaUserFromMint(
    program: Program,
    mint: PublicKey,
    publickey: PublicKey
): Promise<
    Array<{
        pubkey: web3.PublicKey;
        account: web3.AccountInfo<Buffer>;
    }>
> {
    return (
        await program.provider.connection.getTokenAccountsByOwner(publickey, {
            mint: mint,
        })
    ).value;
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
        const mintAtaData = await findAtaUserFromMint(program, mint, owner);
        console.log('mintAtaData', mintAtaData[0].pubkey.toBase58());
        if (mintAtaData.length > 1){
            console.log('mintAtaData[1].pubkey.toBase58()', mintAtaData[1]?.pubkey.toBase58());
            console.log('mintAtaData[2].pubkey.toBase58()', mintAtaData[2]?.pubkey.toBase58());
        }
        return { mintAta: mintAtaData[0].pubkey };
    } catch (error) {
        const res = await cIPdaAta(mint, payer, owner);
        mintAta = res.mintAta;
        ixCreateMintAta = res.ix;
        console.log('mintAta other + txadd', mintAta.toBase58());

        txCreate.add(ixCreateMintAta);
        return { mintAta, transaction: txCreate };
    }
    // return {mintAta};
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

export async function cIPdasolAta(
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

// export async function createTokenAccountCustom(provider: Provider, owner: PublicKey) {
//     const vault = web3.Keypair.generate();
//     const tx = new web3.Transaction();
//     tx.add(...(await cITokenAccount(provider, vault.publicKey, owner)));
//     await provider.send(tx, [vault]);
//     return vault.publicKey;
// }

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
// export async function cITokenAccount(
//     provider: Provider,
//     newAccountPubkey: PublicKey,
//     owner: PublicKey,
//     lamports?: number
// ) {
//     if (lamports === undefined) {
//         lamports = await provider.connection.getMinimumBalanceForRentExemption(165);
//     }
//     return [
//         web3.SystemProgram.createAccount({
//             fromPubkey: provider.wallet.publicKey,
//             newAccountPubkey,
//             space: 165,
//             lamports,
//             programId: TOKEN_PROGRAM_ID,
//         }),
//         // createInitializeAccount3Instruction(newAccountPubkey, SystemProgram.programId, owner),
//     ];
// }
