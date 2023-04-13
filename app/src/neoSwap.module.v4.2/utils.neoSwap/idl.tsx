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
            name: 'initializeAddPresign',
            accounts: [
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'userPda',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'delegatedItem',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: false,
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
                    name: 'userBump',
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
            name: 'validateUserPdaItems',
            accounts: [
                {
                    name: 'swapDataAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'userPda',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: false,
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
                    name: 'userBump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'validatePresigningSwap',
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
                    name: 'swapDataAccountWsol',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'userPda',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'userWsol',
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
                    name: 'userBump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'depositNftPresigned',
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
            name: 'depositSolPresigned',
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
                    name: 'userPda',
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
                    name: 'swapDataAccountWsol',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'userWsol',
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
                    name: 'swapDataAccountWsol',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'userWsol',
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
        {
            name: 'createUserPda',
            accounts: [
                {
                    name: 'userPda',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: false,
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
            ],
        },
        {
            name: 'userAddItemToBuy',
            accounts: [
                {
                    name: 'userPda',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signerWsol',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'bump',
                    type: 'u8',
                },
                {
                    name: 'itemToAdd',
                    type: {
                        defined: 'ItemToBuy',
                    },
                },
            ],
        },
        {
            name: 'userAddItemToSell',
            accounts: [
                {
                    name: 'userPda',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'itemToDelegate',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'bump',
                    type: 'u8',
                },
                {
                    name: 'itemToAdd',
                    type: {
                        defined: 'ItemToSell',
                    },
                },
            ],
        },
        {
            name: 'userUpdateAmountTopUp',
            accounts: [
                {
                    name: 'userPda',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signerWsol',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'bump',
                    type: 'u8',
                },
                {
                    name: 'amountToTopup',
                    type: 'u64',
                },
            ],
        },
        {
            name: 'transferUserApprovedNft',
            accounts: [
                {
                    name: 'userPda',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'user',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'delegatedItem',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'destinary',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'bump',
                    type: 'u8',
                },
                {
                    name: 'number',
                    type: 'u64',
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
        {
            name: 'UserPdaData',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'owner',
                        type: 'publicKey',
                    },
                    {
                        name: 'amountToTopup',
                        type: 'u64',
                    },
                    {
                        name: 'itemsToSell',
                        type: {
                            vec: {
                                defined: 'ItemToSell',
                            },
                        },
                    },
                    {
                        name: 'itemsToBuy',
                        type: {
                            vec: {
                                defined: 'ItemToBuy',
                            },
                        },
                    },
                ],
            },
        },
    ],
    types: [
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
                        name: 'isPresigning',
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
        {
            name: 'ItemToSell',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'mint',
                        type: 'publicKey',
                    },
                    {
                        name: 'amountMini',
                        type: 'u64',
                    },
                ],
            },
        },
        {
            name: 'ItemToBuy',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'mint',
                        type: 'publicKey',
                    },
                    {
                        name: 'amountMaxi',
                        type: 'u64',
                    },
                ],
            },
        },
        {
            name: 'TradeStatus',
            type: {
                kind: 'enum',
                variants: [
                    {
                        name: 'Initializing',
                    },
                    {
                        name: 'WaitingToValidatePresigning',
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
                        name: 'NFTPresigningWaitingForApproval',
                    },
                    {
                        name: 'NFTPending',
                    },
                    {
                        name: 'NFTPendingPresign',
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
                        name: 'SolPresigningWaitingForApproval',
                    },
                    {
                        name: 'SolPending',
                    },
                    {
                        name: 'SolPendingPresign',
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
                    {
                        name: 'NotSeed',
                    },
                    {
                        name: 'AlreadyExist',
                    },
                    {
                        name: 'AmountWantedEqualToAlready',
                    },
                    {
                        name: 'IncorrectAccount',
                    },
                    {
                        name: 'IncorrectStatus',
                    },
                    {
                        name: 'OnlyPresign',
                    },
                    {
                        name: 'OnlyNormal',
                    },
                    {
                        name: 'NotDelegatedToUserPda',
                    },
                    {
                        name: 'DoubleSend',
                    },
                    {
                        name: 'NotAllValidated',
                    },
                    {
                        name: 'PresignCantBeReceiveSol',
                    },
                    {
                        name: 'MinSupMax',
                    },
                ],
            },
        },
    ],
} as Idl;
