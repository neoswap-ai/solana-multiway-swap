import { NftSwapItem, SwapData } from './solana.types';
import { BN } from '@project-serum/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

/// DEV
export const network = WalletAdapterNetwork.Devnet;
export const programId = new PublicKey('6jHJ2KFfGNLXJhni2VYQFTy7gBQ2QoAxLDRekqGiqK6W');

/// MAIN
// export const network = WalletAdapterNetwork.Mainnet;
// export const programId = new PublicKey('');

// export const CONST_PROGRAM: string = '0121';
export const swapDataAccountGiven = new PublicKey('9gxEYk9C8qZhDJMn1cXi8zApjTREejARUj3xzUZxUiHF');

const i0101: NftSwapItem = {
    isNft: false,
    amount: new BN(-2 * 10 ** 9),
    owner: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    mint: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    status: 1,
};

const i0102: NftSwapItem = {
    isNft: true,
    amount: new BN(1 * 10 ** 9),
    owner: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    destinary: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    mint: new PublicKey('DxKz618SSAiswCsUPZkmKDU9kUxXkNUC9uDfZYNEF6mY'),
    status: 0,
};

const i0103: NftSwapItem = {
    isNft: true,
    amount: new BN(1 * 10 ** 9),
    owner: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    destinary: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    mint: new PublicKey('DxKz618SSAiswCsUPZkmKDU9kUxXkNUC9uDfZYNEF6mY'),
    status: 0,
};

const i0201: NftSwapItem = {
    isNft: false,
    amount: new BN(1 * 10 ** 9),
    owner: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    destinary: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    mint: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    status: 0,
};

const i0202: NftSwapItem = {
    isNft: true,
    amount: new BN(1 * 10 ** 9),
    owner: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    mint: new PublicKey('DwPKNrMPg3ocBvzhrpAZmcKAjUiFcA1okpRnBACrucew'),
    status: 0,
};

const i0203: NftSwapItem = {
    isNft: true,
    amount: new BN(1),
    owner: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    destinary: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    mint: new PublicKey('DwPKNrMPg3ocBvzhrpAZmcKAjUiFcA1okpRnBACrucew'),
    status: 0,
};

const i0301: NftSwapItem = {
    isNft: false,
    amount: new BN(1 * 10 ** 9),
    owner: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    destinary: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    mint: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    status: 0,
};
const i0302: NftSwapItem = {
    isNft: true,
    amount: new BN(1),
    owner: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    destinary: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    mint: new PublicKey('UUCjpbeFwockd4RKYj8DmxSWWcxHrG5cJW1uoAhjeDc'),
    status: 0,
};
const i0303: NftSwapItem = {
    isNft: true,
    amount: new BN(1 * 10 ** 9),
    owner: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    mint: new PublicKey('UUCjpbeFwockd4RKYj8DmxSWWcxHrG5cJW1uoAhjeDc'),
    status: 0,
};
const multiTestData: NftSwapItem[] = [];
for (let index = 0; index < 70; index++) {
    // const element = array[index];
    multiTestData.push({
        amount: new BN(1),
        destinary: PublicKey.unique(),
        isNft: true,
        mint: PublicKey.unique(),
        owner: PublicKey.unique(),
        status: 0,
    } as NftSwapItem);
}
// export const fullData: SwapData = {
//     initializer: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//     status: 80,
//     items: [i11, i12, i13, i21, i22, i23, i31, i32, i33] as Array<NftSwapItem>,
// };

export const userKeypairs: Keypair[] = [];
for (let userId = 0; userId < 4; userId++) {
    userKeypairs.push(Keypair.generate());
}

export const fullData: SwapData = { initializer: PublicKey.unique(), status: 80, items: multiTestData };
export const sentData: SwapData = {
    initializer: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    status: 80,
    items: [i0101] as Array<NftSwapItem>,
};
