import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export enum TradeStatus {
    Initializing = 0,
    WaitingToValidatePresigning=10,
    WaitingToDeposit = 1,
    WaitingToClaim = 2,
    Closed = 3,

    Cancelling = 100,
    Cancelled = 101,
}

export enum ItemStatus {
    NFTPresigningWaitingForApproval = 0,
    SolPresigningWaitingForApproval = 1,

    NFTPending = 10,
    SolPending = 11,
    NFTPendingPresign = 12,
    SolPendingPresig = 13,

    NFTDeposited = 20,
    SolDeposited = 21,
    SolToClaim = 22,

    NFTClaimed = 30,
    SolClaimed = 31,

    NFTCancelled = 100,
    SolCancelled = 101,

    NFTCancelledRecovered = 110,
    SolCancelledRecovered = 111,
}

export type ItemToSell = {
    mint: PublicKey;
    amountMini: BN;
};

export type ItemToBuy = {
    mint: PublicKey;
    amountMaxi: BN;
};
