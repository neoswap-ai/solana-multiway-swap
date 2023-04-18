import { BN, Program, web3 } from '@project-serum/anchor';
import { program } from '@project-serum/anchor/dist/cjs/spl/associated-token';
import { publicKey } from '@project-serum/anchor/dist/cjs/utils';
import {
    createAssociatedTokenAccountInstruction,
    createSyncNativeInstruction,
    getAssociatedTokenAddress,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
    LAMPORTS_PER_SOL,
    PublicKey,
    Signer,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import { appendTransactionToArray } from '../../utils.neoSwap/appendTransactionToArray.neosap';
import { splAssociatedTokenAccountProgramId } from '../../utils.neoSwap/const.neoSwap';
import { convertAllTransaction } from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
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
export const userUpdateAmountTopUp = async (Data: {
    signer: PublicKey;
    program: Program;
    amountToTopup: number;
}): Promise<{
    userTransaction: {
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }[];
}> => {
    // if (Data.swapData.status !== TradeStatus.Initializing) throw console.error('Trade not in waiting for initialized state');
    const [userPda, userBump] = publicKey.findProgramAddressSync([Data.signer.toBytes()], Data.program.programId);
    let userTransaction: {
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }[] = [];
    // let itemToSell = { mint: new PublicKey('5EJN7h5eUX8vhGcuZKPTkU9hRHn8zJJmcv6guqKQoUav'), amountMini: new BN(10000) };
    // console.log('Data.itemToSell', Data.amountToTopup);
    // console.log('userPda', userPda.toBase58());
    // console.log('Data.signer', Data.signer.toBase58());
    // console.log('Data.itemToSell.mint', Data.itemToSell.mint.toBase58());
    // console.log('TOKEN_PROGRAM_ID', TOKEN_PROGRAM_ID.toBase58());
    // console.log('splAssociatedTokenAccountProgramId', splAssociatedTokenAccountProgramId.toBase58());
    // console.log('web3.SystemProgram.programId', web3.SystemProgram.programId.toBase58());

    const signerWsol = await getAssociatedTokenAddress(NATIVE_MINT, Data.signer);
    // console.log('signerWsol', signerWsol.toBase58());
    let balance: (number | null) | undefined = undefined;
    try {
        balance = (await Data.program.provider.connection.getTokenAccountBalance(signerWsol)).value.uiAmount;
        
    } catch (error) {
        if (!String(error).includes('could not find account')) {
            throw 'error';
        }
        console.log('could not find account');
    }
    let nativeIx: TransactionInstruction[] = [];
    // console.log('Balance', balance);
    // console.log('Data.amountToTopup', Data.amountToTopup);

    if (balance === undefined || balance === null) {
        nativeIx.push(
            createAssociatedTokenAccountInstruction(Data.signer, signerWsol, Data.signer, NATIVE_MINT),
            SystemProgram.transfer({
                fromPubkey: Data.signer,
                toPubkey: signerWsol,
                lamports: Data.amountToTopup * LAMPORTS_PER_SOL,
            }),
            createSyncNativeInstruction(signerWsol)
        );
        userTransaction.push({ tx: new Transaction().add(...nativeIx) });
    } else if (balance < Data.amountToTopup) {
        nativeIx.push(
            SystemProgram.transfer({
                fromPubkey: Data.signer,
                toPubkey: signerWsol,
                lamports: Math.ceil((Data.amountToTopup - balance) * LAMPORTS_PER_SOL),
            }),
            createSyncNativeInstruction(signerWsol)
        );
        userTransaction.push({ tx: new Transaction().add(...nativeIx) });
    }

    // console.log('userBump', userBump);
    console.log('Data.amountToTopup * LAMPORTS_PER_SOL', Data.amountToTopup * LAMPORTS_PER_SOL);
    // console.log('userPda', userPda);
    // console.log('signerWsol', signerWsol);
    // console.log('Balance', balance);
    // console.log('Balance', balance);
    // console.log('Balance', balance);

    const addUserItemToAddIx = await Data.program.methods
        .userUpdateAmountTopUp(userBump, new BN(Data.amountToTopup * LAMPORTS_PER_SOL))
        .accounts({
            userPda,
            signerWsol,
            signer: Data.signer,
            tokenProgram: TOKEN_PROGRAM_ID,
            // splTokenProgram: splAssociatedTokenAccountProgramId,
            // systemProgram: web3.SystemProgram.programId,
        })
        .instruction();

    userTransaction.push({ tx: new Transaction().add(addUserItemToAddIx) });
    // userTransaction = appendTransactionToArray({
    //     mainArray: userTransaction,
    //     itemToAdd: [addUserItemToAddIx],
    // });

    // const userTransaction = await convertAllTransaction(userTransaction);

    return { userTransaction };
};

export default userUpdateAmountTopUp;
