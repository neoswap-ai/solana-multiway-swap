import { Idl } from "@coral-xyz/anchor";
export const idlSwap: Idl = {
    version: "0.1.0",
    name: "neo_swap",
    docs: ["@title List of function to manage NeoSwap's multi-items swaps"],
    instructions: [
        {
            name: "initialize",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "mint",
                    type: "publicKey",
                },
                {
                    name: "paymentMint",
                    type: "publicKey",
                },
                {
                    name: "duration",
                    type: "i64",
                },
            ],
        },
        {
            name: "makeSwap",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "makerNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "makerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "mintNft",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "mintToken",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "nftMetadata",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMasterEdition",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ownerTokenRecord",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "destinationTokenRecord",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "authRules",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "metadataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "sysvarInstructions",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "authRulesProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "bidToAdd",
                    type: {
                        defined: "Bid",
                    },
                },
            ],
        },
        {
            name: "takeSwap",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "makerNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "makerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "taker",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "takerNftAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "takerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "takerMintNft",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "mintToken",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "nftMetadata",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "nftMasterEdition",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ownerTokenRecord",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "destinationTokenRecord",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "authRules",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "metadataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "sysvarInstructions",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "ataProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "authRulesProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "bidToAccept",
                    type: {
                        defined: "Bid",
                    },
                },
            ],
        },
        {
            name: "addBid",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "swapDataAccountTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "makerTokenAta",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "mintToken",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "bidToAdd",
                    type: {
                        defined: "Bid",
                    },
                },
            ],
        },
        {
            name: "overrideTime",
            accounts: [
                {
                    name: "swapDataAccount",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "maker",
                    isMut: true,
                    isSigner: true,
                },
            ],
            args: [
                {
                    name: "duration",
                    type: "i64",
                },
            ],
        },
    ],
    accounts: [
        {
            name: "SwapData",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "maker",
                        type: "publicKey",
                    },
                    {
                        name: "makerNftMint",
                        type: "publicKey",
                    },
                    {
                        name: "bids",
                        type: {
                            vec: {
                                defined: "Bid",
                            },
                        },
                    },
                    {
                        name: "taker",
                        type: {
                            option: "publicKey",
                        },
                    },
                    {
                        name: "takerNftMint",
                        type: {
                            option: "publicKey",
                        },
                    },
                    {
                        name: "acceptedBid",
                        type: {
                            option: {
                                defined: "Bid",
                            },
                        },
                    },
                    {
                        name: "endTime",
                        type: "i64",
                    },
                    {
                        name: "royaltiesPaid",
                        type: "bool",
                    },
                    {
                        name: "paymentMint",
                        type: "publicKey",
                    },
                    {
                        name: "seed",
                        type: "string",
                    },
                ],
            },
        },
    ],
    types: [
        {
            name: "Bid",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "collection",
                        type: "publicKey",
                    },
                    {
                        name: "amount",
                        type: "i64",
                    },
                    {
                        name: "fees",
                        type: {
                            defined: "Fees",
                        },
                    },
                ],
            },
        },
        {
            name: "Fees",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "makerNeoswapFee",
                        type: "u64",
                    },
                    {
                        name: "takerNeoswapFee",
                        type: "u64",
                    },
                    {
                        name: "takerRoyalties",
                        type: "u64",
                    },
                    {
                        name: "makerRoyalties",
                        type: "u64",
                    },
                ],
            },
        },
    ],
    errors: [
        {
            code: 6000,
            name: "EmptyBids",
            msg: "List of Bids is empty",
        },
        {
            code: 6001,
            name: "MintIncorrect",
            msg: "Incorrect Mint",
        },
        {
            code: 6002,
            name: "SeedLengthIncorrect",
            msg: "Given seed length is Incorrect",
        },
        {
            code: 6003,
            name: "UnexpectedState",
            msg: "The status given is not correct",
        },
        {
            code: 6004,
            name: "NotMaker",
            msg: "wrong signer, only maker can perform this action",
        },
        {
            code: 6005,
            name: "NotTaker",
            msg: "wrong address for Taker",
        },
        {
            code: 6006,
            name: "IncorrectOwner",
            msg: "Owner Given is incorrect",
        },
        {
            code: 6007,
            name: "UnVerifiedCollection",
            msg: "Collection is unverified",
        },
        {
            code: 6008,
            name: "IncorrectCollection",
            msg: "Collection doesnt't match givent mint collection",
        },
        {
            code: 6009,
            name: "AlreadyExist",
            msg: "The item you're trying to add already exists in the SDA",
        },
        {
            code: 6010,
            name: "CannotFindAccount",
            msg: "Cannot find the account",
        },
        {
            code: 6011,
            name: "IncorrectState",
            msg: "Swap is not in the adequate state to perform this action",
        },
        {
            code: 6012,
            name: "CollectionNotFound",
            msg: "Cannot find the given collection in the SDA",
        },
        {
            code: 6013,
            name: "AlreadyTaken",
            msg: "Swap already accepted",
        },
        {
            code: 6900,
            name: "IncorrectSysvar",
            msg: "Incorrect Sysvar Instruction Program",
        },
        {
            code: 6901,
            name: "IncorrectMetadata",
            msg: "Incorrect Metadata Program",
        },
        {
            code: 6902,
            name: "IncorrectSplAta",
            msg: "Incorrect Token ATA Program",
        },
    ],
};
