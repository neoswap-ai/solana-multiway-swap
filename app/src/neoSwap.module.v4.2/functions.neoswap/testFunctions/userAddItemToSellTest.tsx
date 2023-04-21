import { AnchorProvider, BN, Program, Wallet } from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import NeoSwap from '../..';
import boradcastToBlockchain from './boradcastToBlockchain';

export const userAddItemToSellTest = async (Data: {
    // swapDataAccount: PublicKey;
    // user: PublicKey;
    // signer: PublicKey;
    // CONST_PROGRAM: string;
    userKeypairs: {
        keypair: Keypair;
        tokens: {
            mint: PublicKey;
            ata: PublicKey;
            value: number;
        }[];
    }[];
    program: Program;
    // userKeypairs: { keypair: Keypair[] };
    // signer: Keypair;
}): Promise<string[]> => {
    // console.log(swapData);
    // await delay(5000);
    let sendAllArray: {
        tx: Transaction;
        signers?: Signer[];
    }[] = [];

    const recentBlockhash = (await Data.program.provider.connection.getLatestBlockhash()).blockhash;

    await Promise.all(
        Data.userKeypairs.map(async (userKeypair) => {
            await Promise.all(
                userKeypair.tokens.map(async (token) => {
                    const { userAddItemToSellTransaction } = await NeoSwap.userAddItemToSell({
                        program: Data.program,
                        itemToSell: {
                            mint: token.mint,
                            amountMini: new BN(token.value),
                        },
                        signer: userKeypair.keypair.publicKey,
                    });

                    userAddItemToSellTransaction.signers = [userKeypair.keypair];
                    userAddItemToSellTransaction.tx.feePayer = userKeypair.keypair.publicKey;
                    userAddItemToSellTransaction.tx.recentBlockhash = recentBlockhash;

                    sendAllArray.push(userAddItemToSellTransaction);
                })
            );
        })
    );

    // console.log("sendArray", sendArray);

    // if (!program.provider.sendAll) throw "noSendAll";
    // const txhashs = await program.provider.sendAll(sendArray, {
    //     skipPreflight: true,
    // });

    // for await (const hash of txhashs) {
    //     program.provider.connection.confirmTransaction(hash);
    // }
    const txhashs = await boradcastToBlockchain({ provider: Data.program.provider as AnchorProvider, sendAllArray });

    return txhashs;
};

export default userAddItemToSellTest;
