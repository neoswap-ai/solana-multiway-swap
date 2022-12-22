import { NftSwapItem, SwapData } from './solana.types';
import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ItemStatus, TradeStatus } from './neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/status.type.neoswap';

/// DEV
export const network = WalletAdapterNetwork.Devnet;
export const programId = new PublicKey('DX1pLgDgRWgUCLHHDgVcnKkSnr5r6gokHprjYXo7eykZ');

/// MAIN
// export const network = WalletAdapterNetwork.Mainnet;
// export const programId = new PublicKey('');

export const CONST_PROGRAM: string = '0136';
export const swapDataAccountGiven = new PublicKey('AugUibUjvQg8nFLJLevJDFPj4zCeSwbpJ3TNJWSQMLqf');

const i11: NftSwapItem = {
    isNft: false,
    amount: new BN(-2 * 10 ** 9),
    owner: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    mint: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    status: ItemStatus.SolToClaim,
};

const i12: NftSwapItem = {
    isNft: true,
    amount: new BN(1),
    owner: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    destinary: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    mint: new PublicKey('7JFzB74JaLXD4YPvM7yMoaQ872YD6QQwvEWjLsMyi2cN'),
    status: ItemStatus.NFTPending,
};

// const i13: NftSwapItem = {
//     isNft: true,
//     amount: new BN(1),
//     owner: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//     destinary: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
//     mint: new PublicKey('7JFzB74JaLXD4YPvM7yMoaQ872YD6QQwvEWjLsMyi2cN'),
//     status: ItemStatus.NFTPending,
// };

const i21: NftSwapItem = {
    isNft: false,
    amount: new BN(1 * 10 ** 9),
    owner: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    destinary: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    mint: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    status: ItemStatus.SolPending,
};

const i22: NftSwapItem = {
    isNft: true,
    amount: new BN(1),
    owner: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    mint: new PublicKey('8dpsqhjtcmHij554Nsp7ZewaRThA3KGj9apgB89m35S7'),
    status: ItemStatus.NFTPending,
};

// const i23: NftSwapItem = {
//     isNft: true,
//     amount: new BN(1),
//     owner: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
//     destinary: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
//     mint: new PublicKey('8dpsqhjtcmHij554Nsp7ZewaRThA3KGj9apgB89m35S7'),
//     status: ItemStatus.NFTPending,
// };

const i31: NftSwapItem = {
    isNft: false,
    amount: new BN(1 * 10 ** 9),
    owner: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    destinary: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    mint: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    status: ItemStatus.SolPending,
};
const i32: NftSwapItem = {
    isNft: true,
    amount: new BN(1),
    owner: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    destinary: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    mint: new PublicKey('2RMVWVmXri4mR8d9zrxd8nQM8AQjpoCrjZZkEkfKaPEu'),
    status: ItemStatus.NFTPending,
};
const i33: NftSwapItem = {
    isNft: true,
    amount: new BN(1),
    owner: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    mint: new PublicKey('2RMVWVmXri4mR8d9zrxd8nQM8AQjpoCrjZZkEkfKaPEu'),
    status: ItemStatus.NFTPending,
};
export const fullData: SwapData = {
    initializer: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    status: TradeStatus.Initializing,
    items: [i11, i12, i21, i22, i31, i32] as Array<NftSwapItem>,
};
export const sentData: SwapData = {
    initializer: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    status: TradeStatus.Initializing,
    items: [i11] as Array<NftSwapItem>,
};
