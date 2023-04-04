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
export const validateUserPdaItems = async (Data: {
    signer: PublicKey;
    program: Program;
    user: PublicKey;
    delegatedMint: PublicKey;
    destinary: PublicKey;
    swapDataAccount: PublicKey;
    CONST_PROGRAM: string;
}): Promise<{
    userTransaction: {
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    };
}> => {
    const { swapDataAccount_seed, swapDataAccount_bump } = await getSwapDataFromPDA({
        swapDataAccount: Data.swapDataAccount,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        provider: Data.program.provider as AnchorProvider,
    });

    const [userPda, userBump] = publicKey.findProgramAddressSync([Data.user.toBytes()], Data.program.programId);
    console.log('userPda', userPda.toBase58());

    const userPdaData = await Data.program.account.userPdaData.fetch(userPda);
    console.log('userPdaData', userPdaData);

    let delegatedItem = await getAssociatedTokenAddress(Data.delegatedMint, Data.user);
    console.log('delegatedItem', delegatedItem.toBase58());

    const validateUserPdaItemsIx = await Data.program.methods
        .validateUserPdaItemsIx(swapDataAccount_seed, swapDataAccount_bump, userBump)
        .accounts({
            swapDataAccount: Data.swapDataAccount,
            userPda,
            user: Data.user,
            signer: Data.signer,
            // splTokenProgram: splAssociatedTokenAccountProgramId,
            // systemProgram: web3.SystemProgram.programId,
        })
        .instruction();

    let userTransaction: {
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    } = { tx: new Transaction().add(validateUserPdaItemsIx) };
    // userTransaction = appendTransactionToArray({
    //     mainArray: userTransaction,
    //     itemToAdd: [validateUserPdaItemsIx],
    // });

    // const userTransaction = await convertAllTransaction(userTransaction);

    return { userTransaction };
};

export default validateUserPdaItems;
