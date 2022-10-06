import { Idl } from '@project-serum/anchor';
export const idl = {
    version: '0.1.0',
    name: 'swap_coontract_test',
    instructions: [
        {
            name: 'initialize',
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
                    name: 'tokenProgram',
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
            args: [],
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
            args: [],
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
            args: [],
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
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [],
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
                        name: 'Unallocated',
                    },
                ],
            },
        },
        {
            name: 'SCERROR',
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
