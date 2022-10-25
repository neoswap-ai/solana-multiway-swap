import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { CONST_PROGRAM } from './const.neoSwap';

export async function findAtaFromMint(
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