import { Program } from '@project-serum/anchor';
import { createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { splAssociatedTokenAccountProgramId } from './solana.const';

export async function findAtaUserFromMint(program: Program, mint: PublicKey, publickey: PublicKey): Promise<PublicKey> {
    return (
        await program.provider.connection.getTokenAccountsByOwner(publickey, {
            mint: mint,
        })
    ).value[0].pubkey;
}

export async function createInstructionPdaAta(
    program: Program,
    mint: PublicKey,
    payer: PublicKey,
    pda: PublicKey
): Promise<{ ix: TransactionInstruction; pdaMintAta: PublicKey }> {
    const [pidMintAta, pidMintAta_bump] = await PublicKey.findProgramAddress(
        [pda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        splAssociatedTokenAccountProgramId
    );
    console.log('pidMintAta', pidMintAta.toBase58());

    const ixCreateMintAta = createAssociatedTokenAccountInstruction(
        payer,
        pidMintAta,
        pda,
        mint
        // programId
    );
    return { ix: ixCreateMintAta, pdaMintAta: pidMintAta };
}
