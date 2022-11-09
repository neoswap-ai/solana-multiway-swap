import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { createPdaAta } from './createPdaAta.neoswap';
import { findAtaFromMint } from './findAtaFromMint.neoswap';

/**
 * @notice find token account by owner or create instruction to initialize it
 * @param {Connection} connection Connection with provider
 * @param {PublicKey} owner 
 * @param {PublicKey} mint
 * @param {PublicKey} signer user that will sign transaction and pay fees
 * @return {PublicKey} mintAta => ATA found or created
 * @return { TransactionInstruction[]} instruction => list of all possible instructions to create ATA
 */
export async function findOrCreateAta(Data: {
    connection: Connection;
    owner: PublicKey;
    mint: PublicKey;
    signer: PublicKey;
}): Promise<{ mintAta: PublicKey; instruction?: TransactionInstruction[] }> {
    let mintAta;
    let txCreate: TransactionInstruction[] = [];
    let ixCreateMintAta;
    try {
        const mintAtaData = await findAtaFromMint(Data.connection, Data.mint, Data.owner);
        return { mintAta: mintAtaData[0].pubkey };
    } catch (error) {
        const res = await createPdaAta(Data.mint, Data.signer, Data.owner);
        mintAta = res.mintAta;
        ixCreateMintAta = res.ix;

        txCreate.push(ixCreateMintAta);
        return { mintAta, instruction: txCreate };
    }
}

export default findOrCreateAta;
