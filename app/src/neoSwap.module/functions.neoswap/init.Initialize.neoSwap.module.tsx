import { Program } from '@project-serum/anchor';
import { PublicKey, Signer, SystemProgram, Transaction } from '@solana/web3.js';
import { splAssociatedTokenAccountProgramId } from '../utils.neoSwap/const.neoSwap';
import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { SwapData } from '../utils.neoSwap/types.neoSwap';

export const initInitialize = async (Data: {
    swapData: SwapData;
    signer: PublicKey;
    program: Program;
}): Promise<{
    initinitSendAllArray: Array<{
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }>;
}> => {
    Data.swapData.initializer = Data.signer;

    const seedSwapData = await getSeedFromData({
        swapData: Data.swapData,
        program: Data.program,
    });

    let sentData: SwapData = {
        initializer: Data.signer,
        items: [Data.swapData.items[0]],
        status: Data.swapData.status,
    };

    const initInitTransaction = new Transaction().add(
        await Data.program.methods
            .initInitialize(
                seedSwapData.swapDataAccount_seed,
                seedSwapData.swapDataAccount_bump,
                sentData,
                Data.swapData.items.length
            )
            .accounts({
                swapDataAccount: seedSwapData.swapDataAccount,
                signer: Data.signer,
                systemProgram: SystemProgram.programId,
                splTokenProgram: splAssociatedTokenAccountProgramId,
            })
            .instruction()
    );

    const initinitSendAllArray = await convertAllTransaction(Data.program, [initInitTransaction]);
    return { initinitSendAllArray };
};
