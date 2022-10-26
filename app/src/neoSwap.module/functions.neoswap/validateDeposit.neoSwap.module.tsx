import { Program, web3 } from '@project-serum/anchor';
import { PublicKey, Transaction } from '@solana/web3.js';
import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';

export const validateDeposit = async (Data: {
    program: Program;
    swapDataAccount: PublicKey;
    signer: PublicKey;
}): Promise<{
    validateDepositSendAll: Array<{
        tx: web3.Transaction;
        signers?: web3.Signer[] | undefined;
    }>;
}> => {
    const { swapDataAccount_seed, swapDataAccount_bump } = await getSwapDataFromPDA({
        swapDataAccount: Data.swapDataAccount,
        program: Data.program,
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

    const validateDepositSendAll = await convertAllTransaction(Data.program, [validateClaimedTransaction]);
    return { validateDepositSendAll };
};
