import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { types } from 'secretjs';
import { CONST_PROGRAM } from './const.neoSwap';
import { createPdaAta } from './createPdaAta.neoswap';
import { findAtaFromMint } from './findAtaFromMint.neoswap';

export async function findOrCreateAta(Data: {
    program: Program;
    owner: PublicKey;
    mint: PublicKey;
    signer: PublicKey;
}): Promise<{ mintAta: PublicKey; instruction?: TransactionInstruction[] }> {
    let mintAta;
    let txCreate: TransactionInstruction[] = [];
    let ixCreateMintAta;
    // Solana.
    try {
        const mintAtaData = await findAtaFromMint(Data.program, Data.mint, Data.owner);
        // if (mintAtaData.length > 1) {
        //     let count = 0;
        //     mintAtaData.forEach((element) => {
        //         console.log('mintAtaData n°', count, ' pubkey: ', element.pubkey.toBase58());
        //     });
        // } else {
        //     console.log('mintAta', mintAtaData[0].pubkey.toBase58());
        // }
        return { mintAta: mintAtaData[0].pubkey };
    } catch (error) {
        const res = await createPdaAta(Data.mint, Data.signer, Data.owner);
        mintAta = res.mintAta;
        ixCreateMintAta = res.ix;
        // console.log('mintAta', mintAta.toBase58());

        txCreate.push(ixCreateMintAta);
        return { mintAta, instruction: txCreate };
    }
}
