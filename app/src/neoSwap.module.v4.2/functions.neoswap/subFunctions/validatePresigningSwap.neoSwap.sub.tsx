import { AnchorProvider, BN, Program, web3 } from '@project-serum/anchor';
import { program } from '@project-serum/anchor/dist/cjs/spl/associated-token';
import { publicKey } from '@project-serum/anchor/dist/cjs/utils';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import { appendTransactionToArray } from '../../utils.neoSwap/appendTransactionToArray.neosap';
import { splAssociatedTokenAccountProgramId } from '../../utils.neoSwap/const.neoSwap';
import { convertAllTransaction } from '../../utils.neoSwap/convertAllTransaction.neoswap';
import findOrCreateAta from '../../utils.neoSwap/findOrCreateAta.neoSwap';
import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
import { getSwapDataFromPDA } from '../../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { ItemToSell, TradeStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';

/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const validatePresigningSwap = async (Data: {
    signer: PublicKey;
    program: Program;
    swapData: SwapData;
    CONST_PROGRAM: string;
}): Promise<{
    validatePresigningSwapTransaction: {
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }[];
}> => {
    const { swapDataAccount_bump, swapDataAccount_seed, swapDataAccount } = await getSeedFromData({
        swapDataGiven: Data.swapData,
        CONST_PROGRAM: Data.CONST_PROGRAM,
    });

    const validatePresigningSwapIx = await Data.program.methods
        .validatePresigningSwap(swapDataAccount_seed, swapDataAccount_bump)
        .accounts({
            swapDataAccount,
            signer: Data.signer,
        })
        .instruction();

    let validatePresigningSwapTransaction = await convertAllTransaction(
        appendTransactionToArray({ mainArray: [new Transaction()], itemToAdd: [validatePresigningSwapIx] })
    );
    return { validatePresigningSwapTransaction };
};

export default validatePresigningSwap;
