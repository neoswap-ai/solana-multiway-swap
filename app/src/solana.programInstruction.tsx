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
    bump: number
): Promise<{ transaction: Transaction; ata: PublicKey }> {
    let transaction: Transaction = new Transaction();

    const { mintAta: userMintAta, transaction: ixCreateUserMintAta } = await findOrCreateAta(
        program,
        publicKey,
        mint,
        publicKey
    );

    // console.log('userMintAta', userMintAta.toBase58());
    if (ixCreateUserMintAta) {
        console.log('CreateUserAta Deposit Tx added');
        transaction.add(ixCreateUserMintAta);
    }

    const { mintAta: pdaMintAta, transaction: ixCreatePdaMintAta } = await findOrCreateAta(
        program,
        swapDataAccount,
        mint,
        publicKey
    );

    // console.log('pdaMintAta', pdaMintAta.toBase58());
    if (ixCreatePdaMintAta) {
        console.log('CreatePdaAta Deposit Tx added');
        transaction.add(ixCreatePdaMintAta);
    }
    // transaction.feePayer = publicKey;
    // transaction.recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
    // const hash = await program.provider.send(transaction);
    // console.log('hash\n', hash);
    // const DataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);

    const depositIx = new Transaction().add(
        program.instruction.depositNft(seed, bump, {
            accounts: {
                systemProgram: web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                swapDataAccount: swapDataAccount,
                signer: publicKey,
                itemFromDeposit: userMintAta,
                itemToDeposit: pdaMintAta,
            },
        })
    );

    transaction.add(depositIx);
    console.log('deposit NFT Tx added');

    return { transaction, ata: pdaMintAta };
}

export async function cIdepositSol(
    program: Program,
    from: PublicKey,
    to: PublicKey,
    seed: Buffer,
    bump: number
): Promise<Transaction> {
    console.log('deposit Sol Tx added');
    return new Transaction().add(
        program.instruction.depositSol(seed, bump, {
            accounts: {
                systemProgram: web3.SystemProgram.programId,
                swapDataAccount: to,
                signer: from,
            },
        })
    );
}

export async function cIclaimNft(
    program: Program,
    publicKey: PublicKey,
    mint: PublicKey,
    swapDataAccount: PublicKey,
    swapDataAccount_seed: Buffer,
    swapDataAccount_bump: number
): Promise<{ transaction: Transaction; userMintAta: PublicKey }> {
    let transaction: Transaction = new Transaction();

    const { mintAta: userMintAta, transaction: userMintAtaTx } = await findOrCreateAta(
        program,
        publicKey,
        mint,
        publicKey
    );

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

    const claimNftTx = program.instruction.claimNft(swapDataAccount_seed, swapDataAccount_bump, {
        accounts: {
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccount: swapDataAccount,
            signer: publicKey,
            itemFromDeposit: swapDataAta,
            itemToDeposit: userMintAta,
        },
    });
    // console.log(claimNftTx);

    transaction.add(claimNftTx);
    console.log('claim NFT Tx added');

    return { transaction, userMintAta };
}

export async function cIclaimSol(
    program: Program,
    publicKey: PublicKey,
    swapDataAccount: PublicKey,
    seed: Buffer,
    bump: number
): Promise<{ transaction: Transaction }> {
    console.log('claim Sol Tx added');
    return {
        transaction: new Transaction().add(
            program.instruction.claimSol(seed, bump, {
                accounts: {
                    systemProgram: web3.SystemProgram.programId,
                    swapDataAccount: swapDataAccount,
                    signer: publicKey,
                },
            })
        ),
    };
}

export async function cIcancelNft(
    program: Program,
    publicKey: PublicKey,
    mint: PublicKey,
    swapDataAccount: PublicKey,
    swapDataAccount_seed: Buffer,
    swapDataAccount_bump: number
): Promise<{ transaction: Transaction; userMintAta: PublicKey }> {
    let transaction: Transaction = new Transaction();

    const { mintAta: userMintAta, transaction: userMintAtaTx } = await findOrCreateAta(
        program,
        publicKey,
        mint,
        publicKey
    );
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

    const cancelNftTx = program.instruction.cancelNft(swapDataAccount_seed, swapDataAccount_bump, {
        accounts: {
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccount: swapDataAccount,
            signer: publicKey,
            itemFromDeposit: swapDataAta,
            itemToDeposit: userMintAta,
        },
    });

    transaction.add(cancelNftTx);
    console.log('cancel NFT Tx added');

    return { transaction, userMintAta };
}

export async function cIcancelSol(
    program: Program,
    publicKey: PublicKey,
    swapDataAccount: PublicKey,
    seed: Buffer,
    bump: number
): Promise<{ transaction: Transaction }> {
    console.log('cancel Sol Tx added');
    return {
        transaction: new Transaction().add(
            program.instruction.cancelSol(seed, bump, {
                accounts: {
                    systemProgram: web3.SystemProgram.programId,
                    swapDataAccount: swapDataAccount,
                    signer: publicKey,
                },
            })
        ),
    };
}
