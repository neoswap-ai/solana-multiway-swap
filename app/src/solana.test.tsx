import { NftSwapItem, SwapData } from './solana.types';
import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

/// DEV
export const network = WalletAdapterNetwork.Devnet;
export const programId = new PublicKey('6jHJ2KFfGNLXJhni2VYQFTy7gBQ2QoAxLDRekqGiqK6W');

/// MAIN
// export const network = WalletAdapterNetwork.Mainnet;
// export const programId = new PublicKey('');

export const CONST_PROGRAM: String = '0114';
export const swapDataAccountGiven = new PublicKey('EdfKs6vRG6bDgSL4zYrinGyR35ozPLwd9WwiaEHi3epD');

const i1: NftSwapItem = {
    isNft: false,
    amount: new BN(-2 * 10 ** 9),
    owner: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    mint: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    status: 0,
};

const i2: NftSwapItem = {
    isNft: true,
    amount: new BN(1),
    owner: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    destinary: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    mint: new PublicKey('DxKz618SSAiswCsUPZkmKDU9kUxXkNUC9uDfZYNEF6mY'),
    status: 0,
};

const i3: NftSwapItem = {
    isNft: true,
    amount: new BN(1),
    owner: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    destinary: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    mint: new PublicKey('7CZRVmsPoTs4bDjLGs2jMunBg54Lv1bdvmtWQVrFur5G'),
    status: 0,
};
const i4: NftSwapItem = {
    isNft: false,
    amount: new BN(1 * 10 ** 9),
    owner: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    destinary: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    mint: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    status: 0,
};
const i5: NftSwapItem = {
    isNft: true,
    amount: new BN(1),
    owner: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    mint: new PublicKey('DwPKNrMPg3ocBvzhrpAZmcKAjUiFcA1okpRnBACrucew'),
    status: 0,
};
const i6: NftSwapItem = {
    isNft: false,
    amount: new BN(1 * 10 ** 9),
    owner: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    destinary: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    mint: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    status: 0,
};
const i7: NftSwapItem = {
    isNft: true,
    amount: new BN(1),
    owner: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    mint: new PublicKey('UUCjpbeFwockd4RKYj8DmxSWWcxHrG5cJW1uoAhjeDc'),
    status: 0,
};
export const fullData: SwapData = {
    initializer: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    status: 80,
    items: [
        i1,
        i2,
        i2,
        // i2,
        // i2,
        // i2,
        // i2,
        // i2,
        // i2,
        // i2,
        // i2,
        // i2,
        // i2,
        // i2,
        // i2,
        // i2,
        // i2,
        // i2,
        i3,
        i4,
        i5,
        i6,
        i7,
    ] as Array<NftSwapItem>,
};
export const sentData: SwapData = {
    initializer: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    status: 80,
    items: [i1] as Array<NftSwapItem>,
};
