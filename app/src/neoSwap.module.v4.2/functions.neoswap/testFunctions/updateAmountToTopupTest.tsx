import { AnchorProvider, Program, Wallet } from '@project-serum/anchor';
import { Keypair, PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import NeoSwap from '../..';
import boradcastToBlockchain from './boradcastToBlockchain';

export const updateAmountToTopupTest = async (Data: {
    // swapDataAccount: PublicKey;
    // user: PublicKey;
    // signer: PublicKey;
    // CONST_PROGRAM: string;
    userKeypairs: {
        keypair: Keypair;
        tokens: {
            mint: PublicKey;
            ata: PublicKey;
        }[];
    }[];
    // userKeypairs: { keypair: Keypair[] };
    program: Program;
    // signer: Keypair;
}): Promise<string[]> => {
    let sendAllArray: {
        tx: Transaction;
        signers?: Signer[];
    }[] = [];

    const recentBlockhash = (await Data.program.provider.connection.getLatestBlockhash()).blockhash;
    await Promise.all(
        Data.userKeypairs.map(async (userKeypair) => {
            const { userTransaction } = await NeoSwap.userUpdateAmountTopUp({
                program: Data.program,
                amountToTopup: 1.01,
                signer: userKeypair.keypair.publicKey,
            });
            userTransaction.forEach((suserTransaction) => {
                suserTransaction.signers = [userKeypair.keypair];
                suserTransaction.tx.feePayer = userKeypair.keypair.publicKey;
                suserTransaction.tx.recentBlockhash = recentBlockhash;
            });
            sendAllArray.push(...userTransaction);
        })
    );
    // console.log("sendArray", sendArray);
    const txhashs = await boradcastToBlockchain({ provider: Data.program.provider as AnchorProvider, sendAllArray });

    return txhashs;
};

export default updateAmountToTopupTest;
