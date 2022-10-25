import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { types } from 'secretjs';
import { CONST_PROGRAM } from './const.neoSwap';
// import { CONST_PROGRAM, splAssociatedTokenAccountProgramId } from './const.neoSwap';
import { SwapData } from './types.neoSwap';

export const getSwapDataFromPDA = async (Data: {
    swapDataAccount: PublicKey;
    program: Program;
}): Promise<{
    swapData: SwapData;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
}> => {
    try {
        let swapData = (await Data.program.account.swapData.fetch(Data.swapDataAccount)) as SwapData;

        let swapDataAccount_seed = Buffer.from(CONST_PROGRAM);

        const [__, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            Data.program.programId
        );
        // let temp_ArrayBuffer: Array<Buffer> = [Buffer.from(CONST_PROGRAM)];

        // for (let item = 0; item < swapData.items.length; item++) {
        //     temp_ArrayBuffer = [...temp_ArrayBuffer, swapData.items[item].mint.toBuffer()];
        // }
        // // const arraySize = 4 + 32 * swapData.items.length;

        // // let toSendSeed: Buffer = Buffer.alloc(arraySize);

        // console.log('toSendSeed', toSendSeed);
        // for (let index = 0; index < temp_ArrayBuffer.length; index++) {
        //     toSendSeed.set(temp_ArrayBuffer[index], temp_ArrayBuffer.length);
        // }
        // console.log('Buffer.from(seedSwapData.swapDataAccount_seed.join())', Buffer.from(temp_ArrayBuffer.join()));
        // console.log('seedSwapData.temp_ArrayBuffer', temp_ArrayBuffer);
        // // const [join] = await PublicKey.findProgramAddress(
        // //     [Buffer.from(temp_ArrayBuffer.join())],
        // //     Data.program.programId
        // // );
        // const [normal] = await PublicKey.findProgramAddress(temp_ArrayBuffer, Data.program.programId);
        // // console.log('join', join.toBase58());
        // console.log('normal', normal.toBase58());

        return {
            swapData,
            // swapDataAccount,
            swapDataAccount_seed,
            swapDataAccount_bump,
        };
    } catch (error) {
        // swapData = undefined;
        throw console.error('PDA not initialized, try function getSeedFromPda');
    }
};

export const getSeedFromData = async (Data: {
    swapData: SwapData;
    program: Program;
}): Promise<{
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
}> => {
    // let aaa = 4;

    let swapDataAccount_seed = Buffer.from(CONST_PROGRAM);
    // temp_ArrayBuffer.set(Buffer.from(CONST_PROGRAM));
    // let offset = Data.swapData.items[1].mint.toBytes();
    // swapDataAccount_seed.push(temp_ArrayBuffer);
    // Data.swapData.items.forEach((element) => {
    //     swapDataAccount_seed.push(element.mint.toBuffer());

    //     // const tempLength = temp_ArrayBuffer.length + element.mint.toBuffer().length;
    //     // let temp_ArrayBuffer2: Buffer = Buffer.of(tempLength);
    //     // temp_ArrayBuffer2.set(temp_ArrayBuffer);
    //     // temp_ArrayBuffer2.set(element.mint.toBuffer());
    //     // temp_ArrayBuffer = Buffer.from(swapDataAccount_seed.join());
    // });
    // console.log('temp_ArrayBuffer', temp_ArrayBuffer);

    // let SDA_seeds = [];
    // Data.swapData.items.forEach((item) => {
    //     SDA_seeds.push(item.owner.toBuffer());
    //     SDA_seeds.push(item.mint.toBuffer());
    //     SDA_seeds.push(item.destinary.toBuffer());
    // });

    // console.log('Buffer.from(seedSwapData.swapDataAccount_seed.join())', Buffer.from(swapDataAccount_seed.join()));
    // console.log('seedSwapData.swapDataAccount_seed', swapDataAccount_seed);
    // const [join] = await PublicKey.findProgramAddress(
    //     [Buffer.from(swapDataAccount_seed.join())],
    //     Data.program.programId
    // );
    // const [normal] = await PublicKey.findProgramAddress(swapDataAccount_seed, Data.program.programId);
    // console.log('join', join.toBase58());
    // console.log('normal', normal.toBase58());

    // for (let item = 0; item < Data.swapData.items.length; item++) {
    //     let test = [...temp_ArrayBuffer, Data.swapData.items[item].mint.toBuffer()].concat(); //= new Uint8Array([...temp_ArrayBuffer, Data.swapData.items[item].mint.toBytes()]);
    //     // console.log(Data.swapData.items[item].mint.toBytes().length);
    //     temp_ArrayBuffer(Data.swapData.items[item].mint.toBuffer())
    //     // Data.swapData.items[item].mint.toBuffer().forEach(temp_ArrayBuffer.join)
    //     console.log('test\n',test);

    //     // offset += Data.swapData.items[item].mint.toBytes().slice(0, aaa).length;
    //     // let test2 = test.concat()
    // }

    // let swapDataAccount_seed = temp_ArrayBuffer;
    // const arraySize = 4 + (32 * temp_ArrayBuffer.length - 1);

    // let toSendSeed: Buffer = Buffer.alloc(arraySize);

    // console.log('toSendSeed', toSendSeed);
    // for (let index = 0; index < temp_ArrayBuffer.length; index++) {
    //     toSendSeed.set(temp_ArrayBuffer[index], temp_ArrayBuffer.length);
    // }
    // PublicKey
    console.log('swapDataAccount_seed', swapDataAccount_seed);

    try {
        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            Data.program.programId
        );
        return {
            swapDataAccount,
            swapDataAccount_seed,
            swapDataAccount_bump,
        };
    } catch (error) {
        throw console.error('PDA not initialized, try function getSeedFromPda22', error);
    }
};
