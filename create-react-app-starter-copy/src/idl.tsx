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
            name: 'deposit',
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
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'depositPdaTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'userTokenAccountToDeposit',
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [],
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
                        name: 'isComplete',
                        type: 'bool',
                    },
                    {
                        name: 'userA',
                        type: 'publicKey',
                    },
                    {
                        name: 'userAAmount',
                        type: 'i64',
                    },
                    {
                        name: 'userANft',
                        type: {
                            defined: 'NftSwap',
                        },
                    },
                    {
                        name: 'userB',
                        type: 'publicKey',
                    },
                    {
                        name: 'userBAmount',
                        type: 'i64',
                    },
                    {
                        name: 'userBNft',
                        type: {
                            defined: 'NftSwap',
                        },
                    },
                    {
                        name: 'userC',
                        type: 'publicKey',
                    },
                    {
                        name: 'userCAmount',
                        type: 'i64',
                    },
                    {
                        name: 'userCNft',
                        type: {
                            defined: 'NftSwap',
                        },
                    },
                ],
            },
        },
    ],
    types: [
        {
            name: 'SCERROR',
            type: {
                kind: 'enum',
                variants: [
                    {
                        name: 'UserNotPartOfTrade',
                    },
                ],
            },
        },
        {
            name: 'NftSwap',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'mint',
                        type: 'publicKey',
                    },
                    {
                        name: 'destinary',
                        type: 'publicKey',
                    },
                ],
            },
        },
    ],
} as Idl;
