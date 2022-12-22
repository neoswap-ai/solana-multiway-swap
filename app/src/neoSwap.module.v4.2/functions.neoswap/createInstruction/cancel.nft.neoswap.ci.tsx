import findOrCreateAta from '../../utils.neoSwap/findOrCreateAta.neoSwap';
import { Program, web3 } from '@project-serum/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

/**
 * @notice creates instruction for cancelling a NFT Item for a user.
 * @param {Program} program program linked to NeoSwap
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {PublicKey} user user that receives NFT
 * @param {PublicKey} mint mint addtress of the NFT to transfer
 * @param {PublicKey} swapDataAccount Swap's PDA
 * @param {Buffer} swapDataAccount_seed Seed linked to PDA
 * @param {number} swapDataAccount_bump Bump linked to PDA
 * @param {Array<PublicKey>} ataList list of ATA created until now
 * @return {TransactionInstruction[]}instruction => list of instruction created for cancelling NFT
 * @return {PublicKey[]}mintAta => updated list of ATA created until now
 */
export async function cancelNft(Data: {
    program: Program;
    signer: PublicKey;
    user: PublicKey;
    mint: PublicKey;
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
    ataList: Array<PublicKey>;
}): Promise<{ instruction: TransactionInstruction[]; mintAta: PublicKey[] }> {
    let instruction: TransactionInstruction[] = [];
    // let mintAta: PublicKey[] = [];

    const { mintAta: userMintAta, instruction: userMintAtaTx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.user,
        mint: Data.mint,
        signer: Data.signer,
    });
    let addUserTx = true;
    Data.ataList.forEach((ata) => {
        if (ata.toString() === userMintAta.toString()) {
            addUserTx = false;
        }
    });
    if (userMintAtaTx && addUserTx) {
        userMintAtaTx.forEach((userMintAtaTxItem) => {
            instruction.push(userMintAtaTxItem);
        });
        Data.ataList.push(userMintAta);
        console.log('createUserAta Cancel Nft Tx Added', userMintAta);
    }

    const { mintAta: pdaMintAta, instruction: pdaMintAtaTx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.swapDataAccount,
        mint: Data.mint,
        signer: Data.signer,
    });
    let addPdaTx = true;
    Data.ataList.forEach((ata) => {
        if (ata.toString() === pdaMintAta.toString()) {
            addPdaTx = false;
        }
    });
    if (pdaMintAtaTx && addPdaTx) {
        pdaMintAtaTx.forEach((pdaMintAtaTxItem) => {
            instruction.push(pdaMintAtaTxItem);
        });
        Data.ataList.push(pdaMintAta);
        console.log('createPdaAta Cancel Nft Tx Added', pdaMintAta);
    }

    const cancelNftTx = await Data.program.methods
        .cancelNft(Data.swapDataAccount_seed, Data.swapDataAccount_bump)
        .accounts({
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccount: Data.swapDataAccount,
            user: Data.user,
            signer: Data.signer,
            itemFromDeposit: pdaMintAta,
            itemToDeposit: userMintAta,
        })
        .instruction();

    instruction.push(cancelNftTx);
    return { instruction, mintAta: Data.ataList };
}

export default cancelNft;
