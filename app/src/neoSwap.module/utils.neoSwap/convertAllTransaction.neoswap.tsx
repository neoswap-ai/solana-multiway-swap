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
    let sendAllArray = [{ tx: new Transaction().add(transactionList[0]) }];

    for (let trx = 1; trx < transactionList.length; trx++) {
        sendAllArray.push({
            tx: new Transaction().add(transactionList[trx]),
        });
    }

    return sendAllArray;
}
