import { Program, web3 } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, Transaction } from '@solana/web3.js';
import { findOrCreateAta } from './solana.utils';

export async function cIdepositNft(
    program: Program,
    publicKey: PublicKey,
    mint: PublicKey,
    swapDataAccount: PublicKey
): Promise<{ transaction: Transaction; ata: PublicKey }> {
    let transaction: Transaction = new Transaction();

    const { mintAta: userMintAta, transaction: ixCreateUserMintAta } = await findOrCreateAta(
        program,
        publicKey,
        mint,
        publicKey
    );

    console.log('userMintAta', userMintAta.toBase58());
    if (ixCreateUserMintAta) {
        console.log('ixCreateUserMintAta added');
        transaction.add(ixCreateUserMintAta);
    }

    const { mintAta: pdaMintAta, transaction: ixCreatePdaMintAta } = await findOrCreateAta(
        program,
        swapDataAccount,
        mint,
        publicKey
    );

    console.log('pdaMintAta', pdaMintAta.toBase58());
    if (ixCreatePdaMintAta) {
        console.log('ixCreatePdaMintAta added');
        transaction.add(ixCreatePdaMintAta);
    }

    const depositIx = new Transaction().add(
        program.instruction.depositNft({
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

    console.log('depositIx', depositIx);
    transaction.add(depositIx);

    return { transaction, ata: pdaMintAta };
}

export async function cIdepositSol(
    program: Program,
    from: PublicKey,
    to: PublicKey,
    decimals?: number
): Promise<Transaction> {
    if (!decimals) {
        decimals = 9;
    }
    return new Transaction().add(
        program.instruction.depositSol({
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
        console.log('userAtaClaimNft Transaction Added');
    }

    const { mintAta: swapDataAta, transaction: pdaMintAtaTx } = await findOrCreateAta(
        program,
        swapDataAccount,
        mint,
        publicKey
    );
    if (pdaMintAtaTx) {
        transaction.add(pdaMintAtaTx);
        console.log('pdaAtaClaimNft Transaction Added');
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

    return { transaction, userMintAta };
}

export async function cIclaimSol(
    program: Program,
    publicKey: PublicKey,
    swapDataAccount: PublicKey
): Promise<{ transaction: Transaction }> {
    let transaction: Transaction = new Transaction();

    const claimNftTx = program.instruction.claimSol({
        accounts: {
            systemProgram: web3.SystemProgram.programId,
            swapDataAccount: swapDataAccount,
            signer: publicKey,
        },
    });

    transaction.add(claimNftTx);

    return { transaction };
}
