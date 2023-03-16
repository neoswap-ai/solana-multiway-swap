import { BN, Program, web3 } from '@project-serum/anchor';
import { program } from '@project-serum/anchor/dist/cjs/spl/associated-token';
import { publicKey } from '@project-serum/anchor/dist/cjs/utils';
import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import { appendTransactionToArray } from '../../utils.neoSwap/appendTransactionToArray.neosap';
import { splAssociatedTokenAccountProgramId } from '../../utils.neoSwap/const.neoSwap';
import { convertAllTransaction } from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
import { TradeStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';

/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const userAddItemToSell = async (Data: {
    signer: PublicKey;
    program: Program;
}): Promise<{
    userAddItemToSellSendAllArray: Array<{
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }>;
}> => {
    // if (Data.swapData.status !== TradeStatus.Initializing) throw console.error('Trade not in waiting for initialized state');
    const [userPda, userBump] = publicKey.findProgramAddressSync([Data.signer.toBytes()], Data.program.programId);
    let itemToSell = { mint: new PublicKey('5EJN7h5eUX8vhGcuZKPTkU9hRHn8zJJmcv6guqKQoUav'), amountMini: new BN(10000) };
    const addUserItemToAddIx = await Data.program.methods
        .userAddItemToSell(userBump, itemToSell)
        .accounts({
            userPda,
            signer: Data.signer,
            itemToDelegate: itemToSell.mint,
            // systemProgram: web3.SystemProgram.programId,

            // splTokenProgram: splAssociatedTokenAccountProgramId,
        })
        .instruction();

    let userAddItemToSellTransaction: Transaction[] = [new Transaction()];
    userAddItemToSellTransaction = appendTransactionToArray({
        mainArray: userAddItemToSellTransaction,
        itemToAdd: [addUserItemToAddIx],
    });

    const userAddItemToSellSendAllArray = await convertAllTransaction(userAddItemToSellTransaction);

    return { userAddItemToSellSendAllArray };
};

export default userAddItemToSell;
