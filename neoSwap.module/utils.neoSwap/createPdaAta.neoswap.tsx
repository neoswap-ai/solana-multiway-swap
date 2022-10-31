import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { clusterApiUrl, Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { types } from 'secretjs';
import { CONST_PROGRAM, splAssociatedTokenAccountProgramId } from './const.neoSwap';

export async function createPdaAta(
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