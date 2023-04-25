import { BN, Program, web3 } from '@project-serum/anchor';
import { program } from '@project-serum/anchor/dist/cjs/spl/associated-token';
import { publicKey } from '@project-serum/anchor/dist/cjs/utils';
import { getAssociatedTokenAddress, NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import { appendTransactionToArray } from '../../utils.neoSwap/appendTransactionToArray.neosap';
import { splAssociatedTokenAccountProgramId } from '../../utils.neoSwap/const.neoSwap';
import { convertAllTransaction } from '../../utils.neoSwap/convertAllTransaction.neoswap';
import findOrCreateAta from '../../utils.neoSwap/findOrCreateAta.neoSwap';
import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
import { ItemToBuy, ItemToSell, TradeStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';

/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const userAddItemToBuy = async (Data: {
    signer: PublicKey;
    program: Program;
    itemToBuy: ItemToBuy;
}): Promise<{
    userAddItemToBuyTransaction: {
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    };
}> => {
    // if (Data.swapData.status !== TradeStatus.Initializing) throw console.error('Trade not in waiting for initialized state');
    const [userPda, userBump] = publicKey.findProgramAddressSync([Data.signer.toBytes()], Data.program.programId);
    const signerWsol = await getAssociatedTokenAddress(NATIVE_MINT, Data.signer);
    // const { mintAta: signerWsol2, instruction: addNativesolTx } = await findOrCreateAta({
    //     connection: Data.program.provider.connection,
    //     mint: NATIVE_MINT,
    //     owner: Data.signer,
    //     signer: Data.signer,
    // });
    // if (!signerWsol.equals(signerWsol2)) throw 'signerWsol not equal to signerWsol2';
    // let itemToSell = { mint: new PublicKey('5EJN7h5eUX8vhGcuZKPTkU9hRHn8zJJmcv6guqKQoUav'), amountMini: new BN(10000) };
    // console.log('Data.itemToSell', Data.itemToSell);

    console.log('userPda', userPda.toBase58());
    // console.log('signerWsol', signerWsol.toBase58());
    // console.log('Data.signer', Data.signer.toBase58());
    // console.log('Data.itemToSell.mint', Data.itemToSell.mint.toBase58());
    // console.log('splAssociatedTokenAccountProgramId', splAssociatedTokenAccountProgramId.toBase58());
    // console.log('TOKEN_PROGRAM_ID', TOKEN_PROGRAM_ID.toBase58());
    // console.log('web3.SystemProgram.programId', web3.SystemProgram.programId.toBase58());
    // let itemToDelegate = await getAssociatedTokenAddress(Data.itemToSell.mint, Data.signer);
    const addUserItemToAddIx = await Data.program.methods
        .userAddItemToBuy(userBump, Data.itemToBuy)
        .accounts({
            userPda,
            // signerWsol,
            signer: Data.signer,
            tokenProgram: TOKEN_PROGRAM_ID,
            // splTokenProgram: splAssociatedTokenAccountProgramId,
            // systemProgram: web3.SystemProgram.programId,
        })
        .instruction();

    let userAddItemToBuyTransaction: {
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    } = { tx: new Transaction() };

    // if (addNativesolTx) userAddItemToBuyTransaction.tx.add(...addNativesolTx);
    userAddItemToBuyTransaction.tx.add(addUserItemToAddIx);
    // userAddItemToBuyTransaction = appendTransactionToArray({
    //     mainArray: userAddItemToBuyTransaction,
    //     itemToAdd: [addUserItemToAddIx],
    // });

    // const userAddItemToBuyTransaction = await convertAllTransaction(userAddItemToBuyTransaction);

    return { userAddItemToBuyTransaction };
};

export default userAddItemToBuy;
