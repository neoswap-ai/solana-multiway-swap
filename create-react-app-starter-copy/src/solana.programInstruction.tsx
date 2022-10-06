import { BN, Program, web3 } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, Transaction } from '@solana/web3.js';
import { findOrCreateAta } from './solana.utils';

export async function cIdepositNFT(
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

export async function cIclaimNFT(
    program: Program,
    publicKey: PublicKey,
    mint: PublicKey,
    swapDataAccount: PublicKey,
    swapDataAccount_seed: Buffer,
    swapDataAccount_bump: number
): Promise<{ transaction: Transaction; ata: PublicKey }> {
    let txCreate: Transaction = new Transaction();

    const userMintAtaData = await findOrCreateAta(program, publicKey, mint, publicKey);
    const userMintAta = userMintAtaData.mintAta;
    if (userMintAtaData.transaction) {
        txCreate.add(userMintAtaData.transaction);
    }

    const swapDataAta = (await findOrCreateAta(program, swapDataAccount, mint, publicKey)).mintAta;

    const claimNftTx = program.instruction.claim(swapDataAccount_seed, swapDataAccount_bump, new BN(1), true, {
        accounts: {
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccount: swapDataAccount,
            pdaTokenAccount: swapDataAta,
            signer: publicKey,
            userTokenAccountToReceive: userMintAta,
        },
    });

    txCreate.add(claimNftTx);

    return { transaction: txCreate, ata: userMintAta };
}

// export async function depositTokenInstruction(
//     program: Program,
//     publicKey: PublicKey,
//     swapDataAccount: PublicKey,
//     amount: number
// ): Promise<Transaction> {
//     let txCreate: Transaction = new Transaction();
//     let ixCreateMintAta: Transaction;
//     let pdaMintAta: PublicKey;

//     const ceeatePdaSolAtaData = await createInstructionPdasolAta(publicKey, program.provider);

//     pdaMintAta = ceeatePdaSolAtaData.createdAccount;
//     ixCreateMintAta = new Transaction();
//     console.log('pdaMintAta other + txadd', pdaMintAta.toBase58());

//     txCreate.add(ixCreateMintAta);

//     const depositIx = createTransferInstruction(publicKey, pdaMintAta, publicKey, amount);
//     // program.instruction.deposit({
//     //     accounts: {
//     //         systemProgram: web3.SystemProgram.programId,
//     //         tokenProgram: TOKEN_PROGRAM_ID,
//     //         swapDataAccount: swapDataAccount,
//     //         signer: publicKey,
//     //         depositPdaTokenAccount: pdaMintAta,
//     //         userTokenAccountToDeposit: userMintAta,
//     //     },
//     // });
//     console.log('depositIx', depositIx);
//     txCreate.add(depositIx);

//     return txCreate;
// }
