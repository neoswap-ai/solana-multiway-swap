import { Program, web3 } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, Transaction } from '@solana/web3.js';
import { findOrCreateAta } from './solana.utils';

export async function cIdepositNft(
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
        ataList?.push(userMintAta);
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
        ataList?.push(pdaMintAta);
    }

    const depositIx = new Transaction().add(
        await program.methods
            .depositNft(seed, bump)
            .accounts({
                systemProgram: web3.SystemProgram.programId,
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

export async function cIdepositSol(
    program: Program,
    from: PublicKey,
    to: PublicKey,
    swapDataAccount_seed: Buffer,
    swapDataAccount_bump: number
): Promise<Transaction> {
    console.log('deposit Sol Tx added');
    return new Transaction().add(
        await program.methods
            .depositSol(swapDataAccount_seed, swapDataAccount_bump)
            .accounts({
                systemProgram: web3.SystemProgram.programId,
                swapDataAccount: to,
                signer: from,
            })
            .instruction()
    );
}

export async function cIclaimNft(
    program: Program,
    publicKey: PublicKey,
    user: PublicKey,
    mint: PublicKey,
    swapDataAccount: PublicKey,
    swapDataAccount_seed: Buffer,
    swapDataAccount_bump: number
): Promise<{ transaction: Transaction; userMintAta: PublicKey }> {
    let transaction: Transaction = new Transaction();
    if (!program.provider.sendAndConfirm) throw console.error('no provider');

    const { mintAta: userMintAta, transaction: userMintAtaTx } = await findOrCreateAta(program, user, mint, publicKey);

    if (userMintAtaTx) {
        transaction.add(userMintAtaTx);
        console.log('createUserAta ClaimNft Tx Added');
    }

    const { mintAta: swapDataAta, transaction: pdaMintAtaTx } = await findOrCreateAta(
        program,
        swapDataAccount,
        mint,
        publicKey
    );

    if (pdaMintAtaTx) {
        transaction.add(pdaMintAtaTx);
        console.log('createPdaAta ClaimNft Tx Added');
    }

    const claimNftTx = await program.methods
        .claimNft(swapDataAccount_seed, swapDataAccount_bump)
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
