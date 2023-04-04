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
export const transferUserApprovedWsol = async (Data: {
    signer: PublicKey;
    program: Program;
    user: PublicKey;
    destinary: PublicKey;
    number: number;
}): Promise<{
    userTransaction: {
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    };
}> => {
    // if (Data.swapData.status !== TradeStatus.Initializing) throw console.error('Trade not in waiting for initialized state');
    // const mintAccountData = await Data.program.provider.connection.get(Data.delegatedMint);
    // console.log('mintAccountData owner', mintAccountData?.data.toBase58());
    // if (!mintAccountData?.owner) throw '';
    // console.log('userPda', userPda.toBase58());
    const [userPda, userBump] = publicKey.findProgramAddressSync([Data.user.toBytes()], Data.program.programId);
    console.log('userPda', userPda.toBase58());

    const userPdaData = await Data.program.account.userPdaData.fetch(userPda);
    console.log('userPdaData', userPdaData);
    const { mintAta: destinaryAta, instruction: destinaryAtaIx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        mint: NATIVE_MINT,
        owner: Data.destinary,
        signer: Data.signer,
    });

    // let itemToSell = { mint: new PublicKey('5EJN7h5eUX8vhGcuZKPTkU9hRHn8zJJmcv6guqKQoUav'), amountMini: new BN(10000) };
    // console.log('Data.itemToSell', Data.itemToSell);
    // console.log('userPda', userPda.toBase58());
    // console.log('Data.signer', Data.signer.toBase58());
    // console.log('Data.itemToSell.mint', Data.itemToSell.mint.toBase58());
    // console.log('splAssociatedTokenAccountProgramId', splAssociatedTokenAccountProgramId.toBase58());
    // console.log('TOKEN_PROGRAM_ID', TOKEN_PROGRAM_ID.toBase58());
    // console.log('web3.SystemProgram.programId', web3.SystemProgram.programId.toBase58());
    let delegatedItem = await getAssociatedTokenAddress(NATIVE_MINT, Data.user);
    console.log('delegatedItem', delegatedItem.toBase58());

    const addUserItemToAddIx = await Data.program.methods
        .transferUserApprovedNft(userBump, new BN(Data.number))
        .accounts({
            userPda,
            user: Data.user,
            delegatedItem,
            destinary: destinaryAta,
            signer: Data.signer,
            tokenProgram: TOKEN_PROGRAM_ID,
            // splTokenProgram: splAssociatedTokenAccountProgramId,
            // systemProgram: web3.SystemProgram.programId,
        })
        .instruction();
    if (!destinaryAtaIx) throw 'no destinaryAtaIx';

    let userTransaction: {
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    } = { tx: new Transaction().add(...destinaryAtaIx, addUserItemToAddIx) };
    // userTransaction = appendTransactionToArray({
    //     mainArray: userTransaction,
    //     itemToAdd: [addUserItemToAddIx],
    // });

    // const userTransaction = await convertAllTransaction(userTransaction);

    return { userTransaction };
};

export default transferUserApprovedWsol;
