import { Program, web3 } from '@project-serum/anchor';
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import findOrCreateAta from '../../utils.neoSwap/findOrCreateAta.neoSwap';

/**
 * @notice creates instruction for claiming a Sol Item for a specific user
 * @param {Program} program program linked to NeoSwap
 * @param {PublicKey} user user that receives sol
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {PublicKey} swapDataAccount Swap's PDA
 * @param {Buffer} swapDataAccount_seed Seed linked to PDA
 * @param {number} swapDataAccount_bump Bump linked to PDA
 * @return {TransactionInstruction}instruction => TransactionInstruction for claiming sol for a specific User.
 */
export async function claimSol(Data: {
    program: Program;
    user: PublicKey;
    signer: PublicKey;
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
    ataList: PublicKey[];
}): Promise<{ instruction: TransactionInstruction[] }> {
    let mintAta = Data.ataList;
    let instruction: TransactionInstruction[] = [];

    // const [userPda, userBump] = PublicKey.findProgramAddressSync([Data.user.toBytes()], Data.program.programId);

    const { mintAta: userWsol, instruction: ixCreateuserWsol } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.user,
        mint: NATIVE_MINT,
        signer: Data.signer,
    });
    // console.log('userWsol', userWsol.toBase58());

    let addUserTx = true;
    mintAta.forEach((ata) => {
        if (ata.equals(userWsol)) {
            addUserTx = false;
        }
    });

    if (ixCreateuserWsol && addUserTx) {
        console.log('userWsol Deposit Tx added', userWsol.toBase58());
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
        console.log('swapDataAccountWsol Deposit Tx added', swapDataAccountWsol.toBase58());
        ixCreateswapDataAccountWsol.forEach((ixCreateswapDataAccountWsolItem) => {
            instruction.push(ixCreateswapDataAccountWsolItem);
        });
        mintAta.push(swapDataAccountWsol);
    }
    instruction.push(
        await Data.program.methods
            .claimSol(Data.swapDataAccount_seed, Data.swapDataAccount_bump)//, userBump)
            .accounts({
                systemProgram: web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                swapDataAccount: Data.swapDataAccount,
                // userPda,
                swapDataAccountWsol,
                user: Data.user,
                userWsol,
                signer: Data.signer,
            })
            .instruction()
    );
    return { instruction };
}

export default claimSol;
