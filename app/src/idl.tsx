import { Idl } from '@project-serum/anchor';
export const idl = {
    version: '0.1.0',
    name: 'swap_coontract_test',
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
            name: 'validateCancelled',
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
            name: 'swapData',
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
                        name: 'Pending',
                    },
                    {
                        name: 'Deposited',
                    },
                    {
                        name: 'Claimed',
                    },
                    {
                        name: 'Closed',
                    },
                    {
                        name: 'Initializing',
                    },
                    {
                        name: 'Cancelled',
                    },
                    {
                        name: 'CancelledRecovered',
                    },
                ],
            },
        },
        {
            name: 'ERROR',
            type: {
                kind: 'enum',
                variants: [
                    {
                        name: 'UserNotPartOfTrade',
                    },
                    {
                        name: 'MintNotFound',
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
                        name: 'AmountGivenIncorect',
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
                ],
            },
        },
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
