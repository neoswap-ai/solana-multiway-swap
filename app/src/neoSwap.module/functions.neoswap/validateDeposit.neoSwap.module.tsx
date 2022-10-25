import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Signer, Transaction } from '@solana/web3.js';
import { convertAllTransaction } from '../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData, getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';

export const validateDeposit = async (Data: {
    program: Program;
    swapDataAccount: PublicKey;
    signer: PublicKey;
}): Promise<{
    validateDepositSendAll: Array<{
        tx: web3.Transaction;
        signers?: web3.Signer[] | undefined;
    }>;
}> => {
    const { swapData, swapDataAccount_seed, swapDataAccount_bump } = await getSwapDataFromPDA({
        swapDataAccount: Data.swapDataAccount,
        program: Data.program,
    });

    // if (swapData.status !== 1) throw console.error('Trade not in waiting to be changed to claimed');

        const validateClaimedTransaction = new Transaction().add(
            await Data.program.methods
                .validateDeposit(swapDataAccount_seed, swapDataAccount_bump)
                .accounts({
                    swapDataAccount: Data.swapDataAccount,
                    signer: Data.signer,
                })
                .instruction()
        );

        const validateDepositSendAll = await convertAllTransaction(Data.program, [validateClaimedTransaction]);
        return { validateDepositSendAll };
};

// const validateDeposit = async () => {
//     if (!publicKey) throw new WalletNotConnectedError();
//     sentData.initializer = publicKey;
//     // console.log('sentData', sentData);

//     const program = await getProgram();
//     // console.log('program', program);

//     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
//     console.log('swapData', swapData);
//     if (swapData.status !== 0) throw console.error('Trade not in waiting to be validated');

//     const tradeRef = getSeed(swapData);

//     // console.log('tradeRef', tradeRef);

//     const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
//     // console.log('swapDataAccount_seed', swapDataAccount_seed);

//     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
//         [swapDataAccount_seed],
//         programId
//     );

//     console.log('swapDataAccount', swapDataAccount.toBase58());
//     console.log('swapDataAccount_bump', swapDataAccount_bump);

//     try {
//         const transactionHash = await program.methods
//             .validateDeposit(swapDataAccount_seed, swapDataAccount_bump)
//             .accounts({
//                 // accounts: {
//                 swapDataAccount: swapDataAccount,
//                 signer: publicKey,
//                 // },
//             })
//             .rpc();

//         console.log('transactionHash', transactionHash);
//     } catch (error) {
//         programCatchError(error);
//     }
// };
