import { Idl } from '@project-serum/anchor';
export const idl = {
    version: '0.1.0',
    name: 'neo_swap',
    instructions: [
        {
            name: 'initInitialize',
            accounts: [
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'splTokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'seed',
                    type: 'bytes',
                },
                {
                    name: 'bump',
                    type: 'u8',
                },
                {
                    name: 'sentData',
                    type: {
                        defined: 'SwapData',
                    },
                },
                {
                    name: 'nbOfItems',
                    type: 'u32',
                },
            ],
        },
        {
            name: 'initializeAdd',
            accounts: [
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: 'seed',
                    type: 'bytes',
                },
                {
                    name: 'bump',
                    type: 'u8',
                },
                {
                    name: 'tradeToAdd',
                    type: {
                        defined: 'NftSwapItem',
                    },
                },
            ],
        },
        {
            name: 'validateInitialize',
            accounts: [
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: 'seed',
                    type: 'bytes',
                },
                {
                    name: 'bump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'depositNft',
            accounts: [
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'itemFromDeposit',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'itemToDeposit',
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'seed',
                    type: 'bytes',
                },
                {
                    name: 'bump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'depositSol',
            accounts: [
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: 'seed',
                    type: 'bytes',
                },
                {
                    name: 'bump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'validateDeposit',
            accounts: [
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: 'seed',
                    type: 'bytes',
                },
                {
                    name: 'bump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'claimSol',
            accounts: [
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: 'seed',
                    type: 'bytes',
                },
                {
                    name: 'bump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'claimNft',
            accounts: [
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'itemFromDeposit',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'itemToDeposit',
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'seed',
                    type: 'bytes',
                },
                {
                    name: 'bump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'validateClaimed',
            accounts: [
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'splTokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: 'seed',
                    type: 'bytes',
                },
                {
                    name: 'bump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'cancelSol',
            accounts: [
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: 'seed',
                    type: 'bytes',
                },
                {
                    name: 'bump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'cancelNft',
            accounts: [
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'itemFromDeposit',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'itemToDeposit',
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'seed',
                    type: 'bytes',
                },
                {
                    name: 'bump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'validateCancel',
            accounts: [
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'splTokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: 'seed',
                    type: 'bytes',
                },
                {
                    name: 'bump',
                    type: 'u8',
                },
            ],
        },
    ],
    accounts: [
        {
            name: 'SwapData',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'initializer',
                        type: 'publicKey',
                    },
                    {
                        name: 'status',
                        type: 'u8',
                    },
                    {
                        name: 'items',
                        type: {
                            vec: {
                                defined: 'NftSwapItem',
                            },
                        },
                    },
                    {
                        name: 'nbItems',
                        type: 'u32',
                    },
                ],
            },
        },
    ],
    types: [
        {
            name: 'TradeStatus',
            type: {
                kind: 'enum',
                variants: [
                    {
                        name: 'Initializing',
                    },
                    {
                        name: 'WaitingToDeposit',
                    },
                    {
                        name: 'WaitingToClaim',
                    },
                    {
                        name: 'Closed',
                    },
                    {
                        name: 'Cancelling',
                    },
                    {
                        name: 'Cancelled',
                    },
                ],
            },
        },
        {
            name: 'ItemStatus',
            type: {
                kind: 'enum',
                variants: [
                    {
                        name: 'NFTPending',
                    },
                    {
                        name: 'NFTDeposited',
                    },
                    {
                        name: 'NFTClaimed',
                    },
                    {
                        name: 'NFTCancelled',
                    },
                    {
                        name: 'NFTCancelledRecovered',
                    },
                    {
                        name: 'SolPending',
                    },
                    {
                        name: 'SolDeposited',
                    },
                    {
                        name: 'SolToClaim',
                    },
                    {
                        name: 'SolClaimed',
                    },
                    {
                        name: 'SolCancelled',
                    },
                    {
                        name: 'SolCancelledRecovered',
                    },
                ],
            },
        },
        {
            name: 'MYERROR',
            type: {
                kind: 'enum',
                variants: [
                    {
                        name: 'UserNotPartOfTrade',
                    },
                    {
                        name: 'MintIncorrect',
                    },
                    {
                        name: 'AmountIncorrect',
                    },
                    {
                        name: 'ShouldntSend',
                    },
                    {
                        name: 'NoSend',
                    },
                    {
                        name: 'SumNotNull',
                    },
                    {
                        name: 'NotReady',
                    },
                    {
                        name: 'UnexpectedData',
                    },
                    {
                        name: 'NotSystemProgram',
                    },
                    {
                        name: 'NotTokenProgram',
                    },
                    {
                        name: 'NotPda',
                    },
                    {
                        name: 'NotInit',
                    },
                    {
                        name: 'NotBump',
                    },
                    {
                        name: 'UnexpectedState',
                    },
                    {
                        name: 'InvalidAccountData',
                    },
                    {
                        name: 'IncorrectLength',
                    },
                    {
                        name: 'NotEnoughFunds',
                    },
                    {
                        name: 'IncorrectOwner',
                    },
                ],
            },
        },

        {
            name: 'NftSwapItem',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'isNft',
                        type: 'bool',
                    },
                    {
                        name: 'mint',
                        type: 'publicKey',
                    },
                    {
                        name: 'amount',
                        type: 'i64',
                    },
                    {
                        name: 'owner',
                        type: 'publicKey',
                    },
                    {
                        name: 'destinary',
                        type: 'publicKey',
                    },
                    {
                        name: 'status',
                        type: 'u8',
                    },
                ],
            },
        },
    ],
} as Idl;
