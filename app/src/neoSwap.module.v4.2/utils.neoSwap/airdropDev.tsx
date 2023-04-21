// import { createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
// import { splAssociatedTokenAccountProgramId } from './const.neoSwap';

/**
 * @notice creates instruction for creating PDA ATA related to mint
 * @param {PublicKey} mint
 * @param {PublicKey} payer fee payer
 * @param {PublicKey} owner mint authority
 * @return {TransactionInstruction} ix => instruction for creating PDA ATA
 * @return {PublicKey} mintAta => PDA ATA related to mint
 */
export async function airdropDev(Data: {
    connection: Connection;
    keypairs: {
        keypair: Keypair;
        tokens: any[];
    }[];
}): Promise<boolean> {
    // for await (const userKeypair of userKeypairs) {
    Promise.all(
        Data.keypairs.map(async (keypair) => {
            await Data.connection
                .confirmTransaction(
                    await Data.connection.requestAirdrop(keypair.keypair.publicKey, 2 * LAMPORTS_PER_SOL)
                )
                .catch((err) => {
                    throw new Error(`airdrop to ${keypair.keypair.publicKey} failed`);
                });
            console.log('user airdrop done', keypair.keypair.publicKey.toBase58());
        })
    );
    return true;
}
export default airdropDev;
