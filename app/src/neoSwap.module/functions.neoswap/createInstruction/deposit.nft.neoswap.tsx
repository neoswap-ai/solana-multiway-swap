import { findOrCreateAta } from "../../utils.neoSwap/findOrCreateAta.neoSwap";
import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { types } from 'secretjs';
import { CONST_PROGRAM } from '../../utils.neoSwap/const.neoSwap';

export async function depositNft(
    program: Program,
    publicKey: PublicKey,
    mint: PublicKey,
    swapDataAccount: PublicKey,
    seed: Buffer,
    bump: number,
    ataList?: Array<PublicKey>
): Promise<{ transaction: Transaction; ata: PublicKey }> {
    let transaction: Transaction = new Transaction();
    if (!program.provider.sendAndConfirm) throw console.error('no provider');

    const { mintAta: userMintAta, transaction: ixCreateUserMintAta } = await findOrCreateAta(
        program,
        publicKey,
        mint,
        publicKey
    );

    let addUserTx = true;
    ataList?.forEach((ata) => {
        if (ata === userMintAta) {
            addUserTx = false;
        }
    });

    if (ixCreateUserMintAta && addUserTx) {
        console.log('CreateUserAta Deposit Tx added');
        transaction.add(ixCreateUserMintAta);
    }

    const { mintAta: pdaMintAta, transaction: ixCreatePdaMintAta } = await findOrCreateAta(
        program,
        swapDataAccount,
        mint,
        publicKey
    );

    let addPdaTx = true;
    ataList?.forEach((ata) => {
        console.log(pdaMintAta.toString());
        console.log(ata.toString());

        if (ata.toString() === pdaMintAta.toString()) {
            addPdaTx = false;
            console.log('already added earlier');
        }
    });
    if (ixCreatePdaMintAta && addPdaTx) {
        console.log('CreatePdaAta Deposit Tx added');
        transaction.add(ixCreatePdaMintAta);
    }

    const depositIx = new Transaction().add(
        await program.methods
            .depositNft(seed, bump)
            .accounts({
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                swapDataAccount: swapDataAccount,
                signer: publicKey,
                itemFromDeposit: userMintAta,
                itemToDeposit: pdaMintAta,
            })
            .instruction()
    );

    transaction.add(depositIx);
    console.log('deposit NFT Tx added');
    return { transaction, ata: pdaMintAta };
}
