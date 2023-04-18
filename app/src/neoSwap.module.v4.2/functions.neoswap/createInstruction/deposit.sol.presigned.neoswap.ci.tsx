import findOrCreateAta from '../../utils.neoSwap/findOrCreateAta.neoSwap';
import { Program } from '@project-serum/anchor';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token';

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
export async function depositSolPresigned(Data: {
    program: Program;
    user: PublicKey;
    signer: PublicKey;
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
    ataList: Array<PublicKey>;
}): Promise<{ instruction: TransactionInstruction[]; mintAta: PublicKey[] }> {
    let instruction: TransactionInstruction[] = [];
    let mintAta: PublicKey[] = Data.ataList;
    // console.log('mintAta', mintAta);
    const [userPda, userBump] = PublicKey.findProgramAddressSync([Data.user.toBytes()], Data.program.programId);

    const { mintAta: userWsol, instruction: ixCreateuserWsol } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.user,
        mint: NATIVE_MINT,
        signer: Data.signer,
    });

    let addUserTx = true;
    mintAta.forEach((ata) => {
        if (ata.equals(userWsol)) {
            addUserTx = false;
        }
    });

    if (ixCreateuserWsol && addUserTx) {
        console.log('CreateUserAta Deposit Tx added', userWsol);
        ixCreateuserWsol.forEach((ixCreateuserWsolItem) => {
            instruction.push(ixCreateuserWsolItem);
        });
        mintAta.push(userWsol);
    }

    const { mintAta: swapDataAccountWsol, instruction: ixCreateswapDataAccountWsol } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.swapDataAccount,
        mint: NATIVE_MINT,
        signer: Data.signer,
    });

    let addPdaTx = true;
    mintAta.forEach((ata) => {
        if (ata.equals(swapDataAccountWsol)) {
            addPdaTx = false;
        }
    });
    if (ixCreateswapDataAccountWsol && addPdaTx) {
        console.log('CreatePdaAta Deposit Tx added', swapDataAccountWsol.toBase58());
        ixCreateswapDataAccountWsol.forEach((ixCreateswapDataAccountWsolItem) => {
            instruction.push(ixCreateswapDataAccountWsolItem);
        });
        mintAta.push(swapDataAccountWsol);
    }

    const depositIx = await Data.program.methods
        .depositSolPresigned(Data.swapDataAccount_seed, Data.swapDataAccount_bump, userBump)
        .accounts({
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccount: Data.swapDataAccount,
            swapDataAccountWsol,
            user:Data.user,
            userPda,
            userWsol,
            signer: Data.signer,
        })
        .instruction();

    instruction.push(depositIx);
    console.log(
        'from: ',
        userWsol.toBase58(),
        '\nto: ',
        swapDataAccountWsol.toBase58(),
        '\nmint: ',
        NATIVE_MINT.toBase58()
    );
    // console.log('mintAta', mintAta);

    return { instruction, mintAta };
}
export default depositSolPresigned;
