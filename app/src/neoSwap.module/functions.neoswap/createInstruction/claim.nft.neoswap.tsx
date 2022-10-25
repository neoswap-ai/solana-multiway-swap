import { findOrCreateAta } from '../../utils.neoSwap/findOrCreateAta.neoSwap';
import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';

import { types } from 'secretjs';
import { CONST_PROGRAM } from '../../utils.neoSwap/const.neoSwap';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export async function claimNft(Data: {
    program: Program;
    signer: PublicKey;
    user: PublicKey;
    mint: PublicKey;
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
}): Promise<{ transaction: Transaction; userMintAta: PublicKey }> {
    let transaction: Transaction = new Transaction();
    if (!Data.program.provider.sendAndConfirm) throw console.error('no provider');

    const { mintAta: userMintAta, transaction: userMintAtaTx } = await findOrCreateAta(
        Data.program,
        Data.user,
        Data.mint,
        Data.signer
    );

    if (userMintAtaTx) {
        transaction.add(userMintAtaTx);
        console.log('createUserAta ClaimNft Tx Added');
    }

    const { mintAta: swapDataAta, transaction: pdaMintAtaTx } = await findOrCreateAta(
        Data.program,
        Data.swapDataAccount,
        Data.mint,
        Data.signer
    );

    if (pdaMintAtaTx) {
        transaction.add(pdaMintAtaTx);
        console.log('createPdaAta ClaimNft Tx Added');
    }

    const claimNftTx = await Data.program.methods
        .claimNft(Data.swapDataAccount_seed, Data.swapDataAccount_bump)
        .accounts({
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccount: Data.swapDataAccount,
            user: Data.user,
            signer: Data.signer,
            itemFromDeposit: swapDataAta,
            itemToDeposit: userMintAta,
        })
        .instruction();

    transaction.add(claimNftTx);
    console.log('claim NFT Tx added');

    //    transaction.feePayer = publicKey;
    // transaction.recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    // const hash = await program.provider.sendAndConfirm(transaction);
    // console.log('claim NFT transaction hash\n', hash);

    return { transaction, userMintAta };
}

export async function cIclaimSol(claimSolData: {
    program: Program;
    user: PublicKey;
    publicKey: PublicKey;
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
}): Promise<{ transaction: Transaction }> {
    console.log('claim Sol Tx added');
    return {
        transaction: new Transaction().add(
            await claimSolData.program.methods
                .claimSol(claimSolData.swapDataAccount_seed, claimSolData.swapDataAccount_bump)
                .accounts({
                    systemProgram: web3.SystemProgram.programId,
                    swapDataAccount: claimSolData.swapDataAccount,
                    user: claimSolData.user,
                    signer: claimSolData.publicKey,
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
