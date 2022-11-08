import { Signer, Transaction } from "@solana/web3.js";

/**
 * @notice Transforms an array of transaction into a type compatible with AnchorProvider.sendAll()
 * @param {Transaction[]} transactionList transaction list to transform
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>} object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export async function convertAllTransaction(
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

export default convertAllTransaction;
