import { Program } from '@project-serum/anchor';
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey';
import { getAssociatedTokenAddress, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { AccountInfo, LAMPORTS_PER_SOL, PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import { appendTransactionToArray } from '../../utils.neoSwap/appendTransactionToArray.neosap';
import { convertAllTransaction } from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
import { TradeStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';

/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const saddInitialize = async (Data: {
    swapData: SwapData;
    signer: PublicKey;
    CONST_PROGRAM: string;
    program: Program;
}): Promise<{
    addInitSendAllArray: Array<{
        tx: Transaction;
        signers?: Array<Signer> | undefined;
    }>;
}> => {
    // if (Data.swapData.status !== TradeStatus.Initializing) throw console.error('Trade not in waiting for initialized state');

    const seedSwapData = await getSeedFromData({
        swapDataGiven: Data.swapData,
        CONST_PROGRAM: Data.CONST_PROGRAM,
    });

    let addInitTransactionInstruction: Array<TransactionInstruction> = [];
    for (let item = 0; item < Data.swapData.items.length; item++) {
        console.log('\nXXXXXXX - added to init item n° ', item, ' XXXXXXX');
        let userAta = getAssociatedTokenAddressSync(
            seedSwapData.swapData.items[item].mint,
            seedSwapData.swapData.items[item].owner
        );
        // let [userPda, _] = findProgramAddressSync(
        //     [seedSwapData.swapData.items[item].owner.toBytes()],
        //     Data.program.programId
        // );
        const [userPda, userBump] = PublicKey.findProgramAddressSync(
            [seedSwapData.swapData.items[item].owner.toBytes()],
            Data.program.programId
        );
        console.log('userPda', userPda.toBase58());
        const userPdaAta = await getAssociatedTokenAddress(seedSwapData.swapData.items[item].mint, userPda, true);
        console.log('userPdaAta', userPdaAta.toBase58());

        try {
            if (seedSwapData.swapData.items[item].isPresigning === true) {
                const presigningAccount = await Data.program.provider.connection.getAccountInfo(userAta); //, {encoding:"jsonParsed"});
                //         // const presigningAccount = await Data.program.provider.connection.(seedSwapData.swapData.items[item].mint);
                //         // console.log('presigningAccount', presigningAccount?.data);
                //         // const accountInfo = await Data.program.provider.connection.getAccountInfo(userAta);
                // console.log('accountInfo', presigningAccount);

                if (presigningAccount === null) throw new Error('Failed to find the associated token account');
                //         // console.log('presigningAccount.data', presigningAccount.data);
                const data = presigningAccount.data;
                //         // const ownerOffset1 = 1; // mint (32 bytes) + owner (32 bytes) + state (1 byte)
                //         // const mintoffser = 32; // mint (32 bytes) + owner (32 bytes) + state (1 byte)
                //         // const owneroffser = 32 + 32; // mint (32 bytes) + owner (32 bytes) + state (1 byte)
                //         // const amountoffset = 32 + 32 + 8; // mint (32 bytes) + owner (32 bytes) + state (1 byte)
                //         // const ownerOffset5 = 32 + 32 + 32 + 8 + 1; // mint (32 bytes) + owner (32 bytes) + state (1 byte)
                //         // const ownerOffset6 = 32 + 32 + 32 + 32 + 8 + 1; // mint (32 bytes) + owner (32 bytes) + state (1 byte)
                //         // // const ownerPublicKey1 = new PublicKey(data.slice(ownerOffset1, ownerOffset1 + 32));
                //         // const ownerPublicKey2 = new PublicKey(data.slice(mintoffser, mintoffser + 32));
                //         // const ownerPublicKey3 = new PublicKey(data.slice(owneroffser, owneroffser + 32));
                //         // const ownerPublicKey4 = Number(data.slice(amountoffset, amountoffset + 8));
                //         // const ownerPublicKey5 = new PublicKey(data.slice(ownerOffset5, ownerOffset5 + 32));
                //         // const ownerPublicKey6 = new PublicKey(data.slice(ownerOffset6, ownerOffset6 + 32));
                        // // console.log('ownerPublicKey1', ownerPublicKey1.toBase58(), 'vs', userAta.toBase58());
                //         // console.log('ownerPublicKey2', ownerPublicKey2.toBase58(), 'vs', userAta.toBase58());
                //         // console.log('ownerPublicKey3', ownerPublicKey3.toBase58(), 'vs', userAta.toBase58());
                //         // console.log('ownerPublicKey4', ownerPublicKey4, 'vs', userAta.toBase58());
                //         // console.log('T1', ownerPublicKey5.toBase58(), 'vs', userAta.toBase58());
                //         // console.log('T2', ownerPublicKey6.toBase58(), 'vs', userAta.toBase58());
                //         // const userpdaAta = getAssociatedTokenAddressSync(seedSwapData.swapData.items[item].mint, userPda);
                //         // console.log('userpdaAta', userpdaAta.toBase58());

                // const mint = new PublicKey(data.slice(0, 32));
                // console.log('mint', mint.toBase58(), 'vs', seedSwapData.swapData.items[item].mint.toBase58());
                
                // const owner = new PublicKey(data.slice(32, 64));
                // console.log('owner', owner.toBase58(), 'vs', seedSwapData.swapData.items[item].owner.toBase58());
                
                // const tokenBalanceBigInt = parseInt(data.slice(64, 76).toString('hex'));
                // const tokenBalanceBigInt = Number(data.slice(64, 72).readBigUInt64LE());
                // console.log('tokenBalanceBigInt', tokenBalanceBigInt);
                
                const delegate = new PublicKey(data.slice(76, 108));
                // console.log('delegate', delegate.toBase58(), 'vs', userPda.toBase58());
                
                // const delegatedAmountBigInt = Number(data.slice(121, 129).toString('hex')) / LAMPORTS_PER_SOL;
                const delegatedAmountBigInt = Number(data.slice(121, 129).readBigUInt64LE());
                // console.log('should be 500000000', Buffer.from(Number('500000000').toString()));
                // console.log('delegatedAmountBigInt', delegatedAmountBigInt);

                if (seedSwapData.swapData.items[item].amount.toNumber() > delegatedAmountBigInt)
                    throw 'not enough delegatedAmountBigInt';

                if (!delegate.equals(userPda)) throw 'incorrect delegated pda';
              
            }
        } catch (error) {
            console.log('XXXXX delegated check', error);
        }
        const instructionToAdd = await Data.program.methods
            .initializeAdd(
                seedSwapData.swapDataAccount_seed,
                seedSwapData.swapDataAccount_bump,
                seedSwapData.swapData.items[item]
            )
            .accounts({
                swapDataAccount: seedSwapData.swapDataAccount,
                signer: Data.signer.toString(),
            })
            .instruction();
        addInitTransactionInstruction.push(instructionToAdd);
    }
    let addInitTransaction: Transaction[] = [new Transaction()];
    addInitTransaction = appendTransactionToArray({
        mainArray: addInitTransaction,
        itemToAdd: addInitTransactionInstruction,
    });

    const addInitSendAllArray = await convertAllTransaction(addInitTransaction);

    return { addInitSendAllArray };
};

export default saddInitialize;
