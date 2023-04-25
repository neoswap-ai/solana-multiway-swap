import { AnchorProvider, Program, Wallet } from '@project-serum/anchor';
import { createAssociatedTokenAccount, createMint, mintToChecked } from '@solana/spl-token';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import NeoSwap from '../..';
import boradcastToBlockchain from './boradcastToBlockchain';

export const createNft = async (Data: {
    // swapDataAccount: PublicKey;
    // user: PublicKey;
    // signer: PublicKey;
    // CONST_PROGRAM: string;
    userKeypair: {
        keypair: Keypair;
        tokens: {
            mint: PublicKey;
            ata: PublicKey;
            value: number;
        }[];
    };
    // userKeypairs: { keypair: Keypair[] };
    program: Program;
    nb: number;
}): Promise<
    {
        mint: PublicKey;
        ata: PublicKey;
        value: number;
    }[]
> => {
    await Promise.all(
        Array.from(Array(Data.nb).keys()).map(async () => {
            try {
                let mintPubkey = await createMint(
                    Data.program.provider.connection, // conneciton
                    Data.userKeypair.keypair, // fee payer
                    Data.userKeypair.keypair.publicKey, // mint authority
                    Data.userKeypair.keypair.publicKey, // freeze authority
                    0 // decimals
                );
                // console.log('mintPubkey', mintPubkey.toBase58());

                let ata = await createAssociatedTokenAccount(
                    Data.program.provider.connection, // conneciton
                    Data.userKeypair.keypair, // fee payer
                    mintPubkey, // mint
                    Data.userKeypair.keypair.publicKey // owner,
                );
                // console.log('ata', ata.toBase58());

                Data.userKeypair.tokens.push({
                    ata,
                    mint: mintPubkey,
                    value: LAMPORTS_PER_SOL / 100,
                });

                await mintToChecked(
                    Data.program.provider.connection, // conneciton
                    Data.userKeypair.keypair, // fee payer
                    mintPubkey, // mint
                    ata, // receiver
                    Data.userKeypair.keypair, // mint authority
                    1, // amount.
                    0 // decimals
                );

                const ataBalance = await Data.program.provider.connection.getTokenAccountBalance(ata);
                console.log(
                    'mint ',
                    mintPubkey.toBase58(),
                    '\nwith ata: ',
                    ata.toBase58(),
                    '\n balance:',
                    ataBalance.value.uiAmount,
                    ' NFT \n\n'
                );
            } catch (error) {
                console.log('info', Data.userKeypair.keypair.publicKey.toBase58(), 'error', error);
            }
            // const txhashs = await boradcastToBlockchain({ provider: Data.program.provider as AnchorProvider, sendAllArray });
        })
    );
    return Data.userKeypair.tokens;
};

export default createNft;
