import { AnchorProvider, Wallet } from '@project-serum/anchor';
import { Keypair, PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import appendTransactionToArray from '../../utils.neoSwap/appendTransactionToArray.neosap';
import convertAllTransaction from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getProgram } from '../../utils.neoSwap/getProgram.neoswap';
import { getSwapDataFromPDA } from '../../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { ItemStatus, TradeStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
import depositNft from '../createInstruction/deposit.nft.neoswap.ci';
import depositNftPresigned from '../createInstruction/deposit.nft.presigned.neoswap.ci';
import depositSol from '../createInstruction/deposit.sol.neoswap.ci';
import depositSolPresigned from '../createInstruction/deposit.sol.presigned.neoswap.ci';

/**
 * @notice creates depositing instructions related to user
 * @dev fetch information from PDA, creates all instruction for depositing assets related to signer.
 * @param {PublicKey} swapDataAccount Swap's PDA account to cancel.
 * @param {PublicKey} signer user that deposits
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {AnchorProvider} provider with active Connection
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}depositSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const boradcastToBlockchain = async (Data: {
    // swapDataAccount: PublicKey;
    // user: PublicKey;
    // signer: PublicKey;
    // CONST_PROGRAM: string;
    provider: AnchorProvider;
    signer?: Keypair;
    sendAllArray: Array<{
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }>;
}): Promise<string[]> => {
    const recentBlockhash = (await Data.provider.connection.getLatestBlockhash()).blockhash;
    if (Data.signer === undefined) {
        Data.sendAllArray.forEach((transactionDeposit) => {
            transactionDeposit.tx.recentBlockhash = recentBlockhash;
        });
    } else {
        Data.sendAllArray.forEach((transactionDeposit) => {
            transactionDeposit.signers = [Data.signer!];
            transactionDeposit.tx.feePayer = Data.signer!.publicKey;
            transactionDeposit.tx.recentBlockhash = recentBlockhash;
        });
    }

    const transactionHashs = await Data.provider.sendAll(Data.sendAllArray, {
        skipPreflight: true,
    });

    console.log('transactionHashs', transactionHashs);

    for await (const hash of transactionHashs) {
        Data.provider.connection.confirmTransaction(hash);
    }
    return transactionHashs;
};

export default boradcastToBlockchain;
