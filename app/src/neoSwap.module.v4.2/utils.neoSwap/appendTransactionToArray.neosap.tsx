import { Transaction, TransactionInstruction } from "@solana/web3.js";
/**
 * @notice add instruction to transaction
 * @dev add up to 5 instruction per transaction then creates a new transaction
 * @param {Array<Transaction>} mainArray Transaction array to add instruction to
 * @param {Array<TransactionInstruction>} itemToAdd TransactionInstructions to add to the main array
 * @return {Array<Transaction>} New Transacition array populated
 */
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

export default appendTransactionToArray;
