import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { clusterApiUrl, Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { types } from 'secretjs';
import { CONST_PROGRAM, splAssociatedTokenAccountProgramId } from './const.neoSwap';

export function appendTransactionToArray(
    mainArray: Array<Transaction>,
    itemToAdd: Array<Transaction>
): Array<Transaction> {
    let row = mainArray.length-1;
    
    // mainArray.forEach((element) => {
    //     row++;
    // });
    itemToAdd.forEach((element) => {
        if (mainArray[row].instructions.length >= 6) {
            mainArray.push(new Transaction());
            row++;
        }
        mainArray[row].add(element);
        console.log('mainArray.length', mainArray.length);
    });
    // console.log('mainArray', mainArray);

    return mainArray;
}
