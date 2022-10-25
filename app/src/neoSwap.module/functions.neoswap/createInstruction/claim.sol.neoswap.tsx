import { findOrCreateAta } from "../../utils.neoSwap/findOrCreateAta.neoSwap";
import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { types } from 'secretjs';
import { CONST_PROGRAM } from '../../utils.neoSwap/const.neoSwap';




export async function claimSol(Data: {
    program: Program;
    user: PublicKey;
    signer: PublicKey;
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
}): Promise<{ transaction: Transaction }> {
    console.log('claim Sol Tx added');
    return {
        transaction: new Transaction().add(
            await Data.program.methods
                .claimSol(Data.swapDataAccount_seed, Data.swapDataAccount_bump)
                .accounts({
                    systemProgram: web3.SystemProgram.programId,
                    swapDataAccount: Data.swapDataAccount,
                    user: Data.user,
                    signer: Data.signer,
                })
                .instruction()
        ),
    };
}

export async function cIcancelNft(
    program: Program,
    publicKey: PublicKey,
    user: PublicKey,
    mint: PublicKey,
    swapDataAccount: PublicKey,
    swapDataAccount_seed: Buffer,
    swapDataAccount_bump: number
): Promise<{ transaction: Transaction; userMintAta: PublicKey }> {
    let transaction: Transaction = new Transaction();

    const { mintAta: userMintAta, transaction: userMintAtaTx } = await findOrCreateAta(program, user, mint, publicKey);
    if (userMintAtaTx) {
        transaction.add(userMintAtaTx);
        console.log('createUserAta Cancel Nft Tx Added');
    }

    const { mintAta: swapDataAta, transaction: pdaMintAtaTx } = await findOrCreateAta(
        program,
        swapDataAccount,
        mint,
        publicKey
    );
    if (pdaMintAtaTx) {
        transaction.add(pdaMintAtaTx);
        console.log('createPdaAta Cancel Nft Tx Added');
    }

    const cancelNftTx = await program.methods
        .cancelNft(swapDataAccount_seed, swapDataAccount_bump)
        .accounts({
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccount: swapDataAccount,
            user: user,
            signer: publicKey,
            itemFromDeposit: swapDataAta,
            itemToDeposit: userMintAta,
        })
        .instruction();

    transaction.add(cancelNftTx);
    console.log('cancel NFT Tx added');

    return { transaction, userMintAta };
}

export async function cIcancelSol(
    program: Program,
    user: PublicKey,
    publicKey: PublicKey,
    swapDataAccount: PublicKey,
    swapDataAccount_seed: Buffer,
    swapDataAccount_bump: number
): Promise<{ transaction: Transaction }> {
    console.log('cancel Sol Tx added');
    return {
        transaction: new Transaction().add(
            await program.methods
                .cancelSol(swapDataAccount_seed, swapDataAccount_bump)
                .accounts({
                    systemProgram: web3.SystemProgram.programId,
                    swapDataAccount: swapDataAccount,
                    user: user,
                    signer: publicKey,
                })
                .instruction()
        ),
    };
}
