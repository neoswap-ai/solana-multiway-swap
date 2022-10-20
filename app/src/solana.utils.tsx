import { Program, web3 } from '@project-serum/anchor';
import { createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { splAssociatedTokenAccountProgramId } from './solana.const';

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
        if (mintAtaData.length > 1) {
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
