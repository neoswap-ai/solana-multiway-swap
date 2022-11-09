import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export type NftSwapItem = {
    isNft: boolean;
    mint: PublicKey;
    amount: BN;
    owner: PublicKey;
    destinary: PublicKey;
    status: number;
};
export type SwapData = {
    initializer: PublicKey;
    status: number;
    items: Array<NftSwapItem>;
};
