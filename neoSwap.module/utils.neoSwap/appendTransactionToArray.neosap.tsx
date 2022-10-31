import { Transaction, TransactionInstruction } from '@solana/web3.js';

export function appendTransactionToArray(Data: {
    mainArray: Array<Transaction>;
    itemToAdd: Array<TransactionInstruction>;
}): Array<Transaction> {
    let row = Data.mainArray.length - 1;

    Data.itemToAdd.forEach((element) => {
        if (Data.mainArray[row].instructions.length >= 5) {
            Data.mainArray.push(new Transaction());
            row++;
        }
        Data.mainArray[row].add(element);
    });

    return Data.mainArray;
}
