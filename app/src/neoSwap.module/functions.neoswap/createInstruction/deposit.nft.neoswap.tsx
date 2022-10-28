import { findOrCreateAta } from '../../utils.neoSwap/findOrCreateAta.neoSwap';
import { Program } from '@project-serum/anchor';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export async function depositNft(Data: {
    program: Program;
    signer: PublicKey;
    mint: PublicKey;
    swapDataAccount: PublicKey;
    seed: Buffer;
    bump: number;
    ataList: Array<PublicKey>;
}): Promise<{ instruction: TransactionInstruction[]; mintAta: PublicKey[] }> {
    let instruction: TransactionInstruction[] = [];
    let mintAta: PublicKey[] = [];

    const { mintAta: userMintAta, instruction: ixCreateUserMintAta } = await findOrCreateAta({
        program: Data.program,
        owner: Data.signer,
        mint: Data.mint,
        signer: Data.signer,
    });
    mintAta.push(userMintAta);
    let addUserTx = true;
    Data.ataList.forEach((ata) => {
        if (ata === userMintAta) {
            addUserTx = false;
        }
    });

    if (ixCreateUserMintAta && addUserTx) {
        console.log('CreateUserAta Deposit Tx added');
        ixCreateUserMintAta.forEach((ixCreateUserMintAtaItem) => {
            instruction.push(ixCreateUserMintAtaItem);
        });
    }

    const { mintAta: pdaMintAta, instruction: ixCreatePdaMintAta } = await findOrCreateAta({
        program: Data.program,
        owner: Data.swapDataAccount,
        mint: Data.mint,
        signer: Data.signer,
    });
    mintAta.push(pdaMintAta);

    let addPdaTx = true;
    Data.ataList.forEach((ata) => {
        console.log(pdaMintAta.toString());
        console.log(ata.toString());

        if (ata.toString() === pdaMintAta.toString()) {
            addPdaTx = false;
            // console.log('already added earlier');
        }
    });
    if (ixCreatePdaMintAta && addPdaTx) {
        console.log('CreatePdaAta Deposit Tx added');
        ixCreatePdaMintAta.forEach((ixCreatePdaMintAtaItem) => {
            instruction.push(ixCreatePdaMintAtaItem);
        });
    }

    const depositIx = await Data.program.methods
        .depositNft(Data.seed, Data.bump)
        .accounts({
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccount: Data.swapDataAccount,
            signer: Data.signer,
            itemFromDeposit: userMintAta,
            itemToDeposit: pdaMintAta,
        })
        .instruction();

    instruction.push(depositIx);
    // console.log('deposit NFT Tx added');
    return { instruction, mintAta };
}
