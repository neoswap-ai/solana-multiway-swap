import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { CONST_PROGRAM, splAssociatedTokenAccountProgramId } from './const.neoSwap';
import { SwapData } from './types.neoSwap';

export const getSeedFromSwapData = async (Data: {
    swapData: SwapData;
    programId: PublicKey;
}): Promise<{
    swapDataAccount: PublicKey;
    swapDataAccount_seed_string: string;
    swapDataAccount_seed_buffer: Buffer;
    swapDataAccount_bump: number;
}> => {
    let addSeed_temp: string = '';
    let temp_count: number = 0;
    let temp_string: string = '';
    for (let item = 0; item < Data.swapData.items.length; item++) {
        if (temp_count < 3) {
            temp_count += 1;
            temp_string += Data.swapData.items[item].mint.toString().slice(0, 1);
        } else {
            addSeed_temp += temp_string + Data.swapData.items[item].mint.toString().slice(0, 1);
            temp_count = 0;
            temp_string = '';
        }
    }

    const swapDataAccount_seed_string = CONST_PROGRAM + addSeed_temp;

    const swapDataAccount_seed_buffer: Buffer = utils.bytes.base64.decode(swapDataAccount_seed_string);

    const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
        [swapDataAccount_seed_buffer],
        Data.programId
    );

    return {
        swapDataAccount,
        swapDataAccount_seed_string,
        swapDataAccount_seed_buffer,
        swapDataAccount_bump,
    };
};

// export const getSeed = async (Data: {
//     swapData: SwapData;
//     // program: Program;
//     // programId: PublicKey;
//     // swapDataAccountGiven: PublicKey;
// }): Promise<{ validateClaimedTransaction: Transaction } | any> => {
//     const swapData: SwapData = (await Data.program.account.swapData.fetch(Data.swapDataAccountGiven)) as SwapData;
//     // console.log('swapData', swapData);
//     if (swapData.status !== 1) throw console.error('Trade not in waiting to be changed to claimed');

//     const tradeRef = getSeed(swapData);

//     const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);

//     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
//         [swapDataAccount_seed],
//         Data.programId
//     );

//     try {
//         const validateClaimedTransaction = new Transaction().add(
//             await Data.program.methods
//                 .validateClaimed(swapDataAccount_seed, swapDataAccount_bump)
//                 .accounts({
//                     systemProgram: web3.SystemProgram.programId,
//                     splTokenProgram: splAssociatedTokenAccountProgramId,
//                     swapDataAccount: swapDataAccount,
//                     signer: Data.userPublickey,
//                 })
//                 .instruction()
//         );

//         // console.log('validateClaimedTransaction :', validateClaimedTransaction);
//         return { validateClaimedTransaction };
//     } catch (error) {
//         return error;
//     }
// };
