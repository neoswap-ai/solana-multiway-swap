import { createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { splAssociatedTokenAccountProgramId } from './const.neoSwap';

/**
 * @notice creates instruction for creating PDA ATA related to mint
 * @param {PublicKey} mint 
 * @param {PublicKey} payer fee payer
 * @param {PublicKey} owner mint authority
 * @return {TransactionInstruction} ix => instruction for creating PDA ATA
 * @return {PublicKey} mintAta => PDA ATA related to mint
 */
export async function createPdaAta(
    mint: PublicKey,
    payer: PublicKey,
    owner: PublicKey
): Promise<{
    ix: TransactionInstruction;
    mintAta: PublicKey;
}> {
    const [mintAta] = await PublicKey.findProgramAddress(
        [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        splAssociatedTokenAccountProgramId
    );

    const ixCreateMintAta = createAssociatedTokenAccountInstruction(
        payer,
        mintAta,
        owner,
        mint,
        TOKEN_PROGRAM_ID,
        splAssociatedTokenAccountProgramId
    );
    return { ix: ixCreateMintAta, mintAta: mintAta };
}
export default createPdaAta;
