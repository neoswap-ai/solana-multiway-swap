export enum TradeStatus {
    Initializing = 0,
    WaitingToDeposit = 1,
    WaitingToClaim = 2,
    Closed = 3,

    Cancelling = 100,
    Cancelled = 101,
}

export enum ItemStatus {
    NFTPending = 10,
    SolPending = 11,

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
