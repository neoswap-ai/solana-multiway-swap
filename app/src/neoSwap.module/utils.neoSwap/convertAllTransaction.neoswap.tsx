import { Program } from '@project-serum/anchor';
import { Signer, Transaction } from '@solana/web3.js';

export async function convertAllTransaction(
    program: Program,
    transactionList: Array<Transaction>
): Promise<
    Array<{
        tx: Transaction;
        signers?: Signer[] | undefined;
    }>
> {
    transactionList[0].feePayer = program.provider.publicKey;
    transactionList[0].recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    let sendAllArray = [{ tx: new Transaction().add(transactionList[0]) }];

    console.log('itemtransactionList length222 ', transactionList.length);

    for (let trx = 1; trx < transactionList.length; trx++) {
        transactionList[trx].feePayer = program.provider.publicKey;
        transactionList[trx].recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

        sendAllArray.push({
            tx: new Transaction().add(transactionList[trx]),
        });
    }

    return sendAllArray;
}
