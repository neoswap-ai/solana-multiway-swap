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
export async function depositNftPresigned(Data: {
    program: Program;
    user: PublicKey;
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
    const [userPda, userBump] = PublicKey.findProgramAddressSync([Data.user.toBytes()], Data.program.programId);

    const { mintAta: userMintAta, instruction: ixCreateUserMintAta } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.user,
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
        console.log('CreateUserAta Deposit Tx added', userMintAta.toBase58());
        ixCreateUserMintAta.forEach((ixCreateUserMintAtaItem) => {
            instruction.push(ixCreateUserMintAtaItem);
        });
        mintAta.push(userMintAta);
    }

    const { mintAta: swapDataAccountAta, instruction: ixCreateswapDataAccountAta } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.swapDataAccount,
        mint: Data.mint,
        signer: Data.signer,
    });

    let addPdaTx = true;
    mintAta.forEach((ata) => {
        if (ata.equals(swapDataAccountAta)) {
            addPdaTx = false;
        }
    });
    if (ixCreateswapDataAccountAta && addPdaTx) {
        console.log('CreatePdaAta Deposit Tx added', swapDataAccountAta.toBase58());
        ixCreateswapDataAccountAta.forEach((ixCreateswapDataAccountAtaItem) => {
            instruction.push(ixCreateswapDataAccountAtaItem);
        });
        mintAta.push(swapDataAccountAta);
    }

    const depositIx = await Data.program.methods
        .depositNftPresigned(Data.swapDataAccount_seed, Data.swapDataAccount_bump, userBump)
        .accounts({
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccount: Data.swapDataAccount,
            signer: Data.signer,
            user:Data.user,
            userPda,
            delegatedItemAta: userMintAta,
            swapDataAccountAta,
        })
        .instruction();

    instruction.push(depositIx);
    console.log(
        'from: ',
        userMintAta.toBase58(),
        '\nto: ',
        swapDataAccountAta.toBase58(),
        '\nmint: ',
        Data.mint.toBase58()
    );
    // console.log('mintAta', mintAta);

    return { instruction, mintAta };
}
export default depositNftPresigned;
