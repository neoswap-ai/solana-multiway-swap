import { AnchorProvider, Program, web3 } from '@project-serum/anchor';
import { PublicKey, Transaction } from '@solana/web3.js';
import { splAssociatedTokenAccountProgramId } from '../../utils.neoSwap/const.neoSwap';
import convertAllTransaction from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSwapDataFromPDA } from '../../utils.neoSwap/getSwapDataFromPDA.neoSwap';

/**
 * @notice creates instruction for validating claimed state of the swap's PDA and closing it
 * @param {PublicKey} swapDataAccount Swap's PDA
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: web3.Signer[] | undefined;}>}validateClaimedSendAll => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const validateClaimed = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    program: Program;
    CONST_PROGRAM: string;
}): Promise<{
    validateClaimedSendAll: {
        tx: web3.Transaction;
        signers?: web3.Signer[] | undefined;
    }[];
}> => {
    const { swapDataAccount_seed, swapDataAccount_bump, swapData } = await getSwapDataFromPDA({
        swapDataAccount: Data.swapDataAccount,
        provider: Data.program.provider as AnchorProvider,
        CONST_PROGRAM: Data.CONST_PROGRAM,
    });
    // console.log('swapData from validate', swapData);

    const validateClaimedTransaction = new Transaction().add(
        await Data.program.methods
            .validateClaimed(swapDataAccount_seed, swapDataAccount_bump)
            .accounts({
                systemProgram: web3.SystemProgram.programId,
                splTokenProgram: splAssociatedTokenAccountProgramId,
                swapDataAccount: Data.swapDataAccount,
                signer: Data.signer,
            })
            .instruction()
    );

    const validateClaimedSendAll = await convertAllTransaction([validateClaimedTransaction]);
    return { validateClaimedSendAll };
};

export default validateClaimed;
