import findOrCreateAta from '../../utils.neoSwap/findOrCreateAta.neoSwap';
import { Program } from '@project-serum/anchor';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

/**
 * @notice creates instruction for depositing a NFT Item
 * @param {Program} program program linked to NeoSwap
 * @param {PublicKey} signer user that sends NFT
 * @param {PublicKey} mint mint addtress of the NFT to transfer
 * @param {PublicKey} swapDataAccount Swap's PDA
 * @param {Buffer} swapDataAccount_seed Seed linked to PDA
 * @param {number} swapDataAccount_bump Bump linked to PDA
 * @param {Array<PublicKey>} ataList list of ATA created until now
 * @return {TransactionInstruction[]}instruction => list of instruction created for depositing NFT
 * @return {PublicKey[]}mintAta => updated list of ATA created until now
 */
export async function depositNft(Data: {
    program: Program;
    signer: PublicKey;
    mint: PublicKey;
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
    ataList: Array<PublicKey>;
}): Promise<{ instruction: TransactionInstruction[]; mintAta: PublicKey[] }> {
    let instruction: TransactionInstruction[] = [];
    let mintAta: PublicKey[] = Data.ataList;
    // console.log('mintAta', mintAta);

    const { mintAta: userMintAta, instruction: ixCreateUserMintAta } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.signer,
        mint: Data.mint,
        signer: Data.signer,
    });

    let addUserTx = true;
    mintAta.forEach((ata) => {
        if (ata.equals(userMintAta)) {
            addUserTx = false;
        }
    });

    if (ixCreateUserMintAta && addUserTx) {
        console.log('CreateUserAta Deposit Tx added', userMintAta);
        ixCreateUserMintAta.forEach((ixCreateUserMintAtaItem) => {
            instruction.push(ixCreateUserMintAtaItem);
        });
        mintAta.push(userMintAta);
    }

    const { mintAta: pdaMintAta, instruction: ixCreatePdaMintAta } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.swapDataAccount,
        mint: Data.mint,
        signer: Data.signer,
    });

    let addPdaTx = true;
    mintAta.forEach((ata) => {
        if (ata.equals(pdaMintAta)) {
            addPdaTx = false;
        }
    });
    if (ixCreatePdaMintAta && addPdaTx) {
        console.log('CreatePdaAta Deposit Tx added', pdaMintAta.toBase58());
        ixCreatePdaMintAta.forEach((ixCreatePdaMintAtaItem) => {
            instruction.push(ixCreatePdaMintAtaItem);
        });
        mintAta.push(pdaMintAta);
    }

    const depositIx = await Data.program.methods
        .depositNft(Data.swapDataAccount_seed, Data.swapDataAccount_bump)
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
    console.log('from: ', userMintAta.toBase58(), '\nto: ', pdaMintAta.toBase58(), '\nmint: ', Data.mint.toBase58());
    // console.log('mintAta', mintAta);

    return { instruction, mintAta };
}
export default depositNft;
