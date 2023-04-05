import { Program, web3 } from '@project-serum/anchor';
import { createSyncNativeInstruction, NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import findOrCreateAta from '../../utils.neoSwap/findOrCreateAta.neoSwap';
import NftSwapItem from '../../utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap';

/**
 * @notice creates instruction for depositing a Sol Item
 * @param {Program} program program linked to NeoSwap
 * @param {PublicKey} from user that sends sol
 * @param {PublicKey} to destinaru of sol transfer (should be PDA)
 * @param {Buffer} swapDataAccount_seed Seed linked to PDA
 * @param {number} swapDataAccount_bump Bump linked to PDA
 * @return {TransactionInstruction}instruction => TransactionInstruction for depositing sol.
 */
export async function depositSol(Data: {
    program: Program;
    signer: PublicKey;
    ItemToDeposit: NftSwapItem;
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
    ataList: PublicKey[];
}): Promise<{ instruction: TransactionInstruction[]; mintAta: PublicKey[] }> {
    // console.log('deposit Sol Tx added');

    let instruction: TransactionInstruction[] = [];
    let mintAta: PublicKey[] = Data.ataList;

    // mintAta.forEach((v) => console.log('. ', v.toBase58));
    // console.log('\n');

    const { mintAta: userWsol, instruction: ixCreateuserWsol } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.signer,
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

    const [userPda, userBump] = PublicKey.findProgramAddressSync([Data.signer.toBytes()], Data.program.programId);
    // let wsolBalanceUser = 0;
    let amountToAddToWsol = 0;
    try {
        let wsolBalanceUser = (await Data.program.provider.connection.getTokenAccountBalance(userWsol)).value.uiAmount;
        if (!wsolBalanceUser) wsolBalanceUser = 0;
        if (wsolBalanceUser < Data.ItemToDeposit.amount.toNumber()) {
            amountToAddToWsol = Data.ItemToDeposit.amount.toNumber();
        }
    } catch (error) {
        amountToAddToWsol = Data.ItemToDeposit.amount.toNumber();
    }
    if (amountToAddToWsol !== 0) {
        console.log('added', amountToAddToWsol / LAMPORTS_PER_SOL, ' Wsol to account', userWsol.toBase58());

        instruction.push(
            ...[
                SystemProgram.transfer({
                    fromPubkey: Data.signer,
                    toPubkey: userWsol,
                    lamports: amountToAddToWsol,
                }),
                createSyncNativeInstruction(userWsol),
            ]
        );
    }

    let depositInstruction = await Data.program.methods
        .depositSol(Data.swapDataAccount_seed, Data.swapDataAccount_bump, userBump)
        .accounts({
            systemProgram: web3.SystemProgram.programId,
            swapDataAccount: Data.swapDataAccount,
            signer: Data.signer,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccountWsol,
            userPda,
            user: Data.signer,
            userWsol,
        })
        .instruction();

    instruction.push(depositInstruction);
    console.log('mintAta', mintAta);

    return { instruction, mintAta };
}
export default depositSol;
