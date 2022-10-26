import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { CONST_PROGRAM } from './const.neoSwap';
import { createPdaAta } from './createPdaAta.neoswap';
import { findAtaFromMint } from './findAtaFromMint.neoswap';

export async function findOrCreateAta(
    program: Program,
    owner: PublicKey,
    mint: PublicKey,
    payer: PublicKey
): Promise<{ mintAta: PublicKey; transaction?: Transaction }> {
    let mintAta;
    let txCreate = new Transaction();
    let ixCreateMintAta;
    // Solana.
    try {
        const mintAtaData = await findAtaFromMint(program, mint, owner);
        if (mintAtaData.length > 1) {
            let count = 0;
            mintAtaData.forEach((element) => {
                console.log('mintAtaData n°', count, ' pubkey: ', element.pubkey.toBase58());
            });
        } else {
            console.log('mintAta', mintAtaData[0].pubkey.toBase58());
        }
        return { mintAta: mintAtaData[0].pubkey };
    } catch (error) {
        const res = await createPdaAta(mint, payer, owner);
        mintAta = res.mintAta;
        ixCreateMintAta = res.ix;
        console.log('mintAta', mintAta.toBase58());

        txCreate.add(ixCreateMintAta);
        return { mintAta, transaction: txCreate };
    }
}
