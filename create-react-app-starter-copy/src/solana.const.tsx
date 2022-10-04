import { BN } from '@project-serum/anchor';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PublicKey } from '@solana/web3.js';
import { NftSwap, SwapData } from './solana.types';

export const programId = new PublicKey('BRBpGfF6xmQwAJRfx7MKPZq1KEgTvVMfcNXHbs42w8Tz');
export const splAssociatedTokenAccountProgramId = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const CONST_PROGRAM: String = '0009';
export const opts = {
    preflightCommitment: 'confirmed' as any,
};

export const sentData: SwapData = {
    initializer: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    isComplete: false,
    userA: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    userAAmount: new BN(-1),
    userANft: {
        mint: new PublicKey('7CZRVmsPoTs4bDjLGs2jMunBg54Lv1bdvmtWQVrFur5G'),
        destinary: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    } as NftSwap,
    userB: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    userBAmount: new BN(1),
    userBNft: {
        mint: new PublicKey('DwPKNrMPg3ocBvzhrpAZmcKAjUiFcA1okpRnBACrucew'),
        destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    } as NftSwap,

    userC: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
    userCAmount: new BN(2),
    userCNft: {
        mint: new PublicKey('UUCjpbeFwockd4RKYj8DmxSWWcxHrG5cJW1uoAhjeDc'),
        destinary: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
    } as NftSwap,
};

/// DEV
export const network = WalletAdapterNetwork.Devnet;

/// MAIN

// const sentData: SwapData = {
//     initializer: PublicKey,
//     isComplete: false,
//     userA: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//     userAAmount: new BN(-1),
//     userANft: [
//         {
//             nft: new PublicKey('DxKz618SSAiswCsUPZkmKDU9kUxXkNUC9uDfZYNEF6mY'),
//             destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//         },
//         {
//             nft: new PublicKey('7CZRVmsPoTs4bDjLGs2jMunBg54Lv1bdvmtWQVrFur5G'),
//             destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//         },
//     ],

//     userB: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//     userBAmount: new BN(1),
//     userBNft: [
//         {
//             nft: new PublicKey('DwPKNrMPg3ocBvzhrpAZmcKAjUiFcA1okpRnBACrucew'),
//             destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//         },
//     ],

//     userC: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//     userCAmount: new BN(2),
//     userCNft: [
//         {
//             nft: new PublicKey('UUCjpbeFwockd4RKYj8DmxSWWcxHrG5cJW1uoAhjeDc'),
//             destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//         },
//     ],
// };
