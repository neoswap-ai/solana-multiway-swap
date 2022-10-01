import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

// export type NftSwap = {
//     nft: PublicKey;
//     destinary: PublicKey;
// // };
// export type SwapData = {
//     initializer: PublicKey;
//     isComplete: boolean;
//     userA: PublicKey;
//     userAAmount: BN;
//     userANft1: PublicKey;
//     userANft2: PublicKey;
//     userB: PublicKey;
//     userBAmount: BN;
//     userBNft: PublicKey;
//     userC: PublicKey;
//     userCAmount: BN;
//     userCNft: PublicKey;
// };

export type NftSwap = {
    mint: PublicKey;
    destinary: PublicKey;
};
export type SwapData = {
    initializer: PublicKey;
    isComplete: boolean;
    userA: PublicKey;
    userAAmount: BN;
    userANft: NftSwap;
    userB: PublicKey;
    userBAmount: BN;
    userBNft: NftSwap;
    userC: PublicKey;
    userCAmount: BN;
    userCNft: NftSwap;
};
