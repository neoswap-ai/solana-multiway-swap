import { web3 } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

/**
 * @notice find token accounts by owner
 * @param {Connection} connection Connection with provider
 * @param {PublicKey} mint
 * @param {PublicKey} owner
 * @return { Array<{pubkey: web3.PublicKey,account: web3.AccountInfo<Buffer>}>} allTokenAccounts => all associated token account linked to the mint and user
 */
export async function findAtaFromMint(
    connection: Connection,
    mint: PublicKey,
    owner: PublicKey
): Promise<
    Array<{
        pubkey: web3.PublicKey;
        account: web3.AccountInfo<Buffer>;
    }>
> {
    return (
        await connection.getTokenAccountsByOwner(owner, {
            mint: mint,
        })
    ).value;
}
export default findAtaFromMint;
