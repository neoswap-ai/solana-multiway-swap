import { AnchorProvider, Program, web3 } from '@project-serum/anchor';
import { PublicKey, Transaction } from '@solana/web3.js';
import { convertAllTransaction } from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSwapDataFromPDA } from '../../utils.neoSwap/getSwapDataFromPDA.neoSwap';

/**
 * @notice creates instruction for validating deposited state of the swap's PDA and change status to claiming
 * @param {PublicKey} swapDataAccount Swap's PDA
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: web3.Signer[] | undefined;}>}validateDepositSendAll => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const validateDeposit = async (Data: {
    swapDataAccount: PublicKey;
    signer: PublicKey;
    CONST_PROGRAM: string;
    program: Program;
}): Promise<{
    validateDepositSendAll: Array<{
        tx: web3.Transaction;
        signers?: web3.Signer[] | undefined;
    }>;
}> => {
    const { swapDataAccount_seed, swapDataAccount_bump } = await getSwapDataFromPDA({
        swapDataAccount: Data.swapDataAccount,
        provider: Data.program.provider as AnchorProvider,
        CONST_PROGRAM: Data.CONST_PROGRAM,
    });

    const validateClaimedTransaction = new Transaction().add(
        await Data.program.methods
            .validateDeposit(swapDataAccount_seed, swapDataAccount_bump)
            .accounts({
                swapDataAccount: Data.swapDataAccount,
                signer: Data.signer,
            })
            .instruction()
    );

    const validateDepositSendAll = await convertAllTransaction([validateClaimedTransaction]);
    return { validateDepositSendAll };
};

export default validateDeposit;
