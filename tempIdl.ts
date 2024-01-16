import { Idl } from "@coral-xyz/anchor";

export const idl: Idl = {
    version: "0.1.0",
    name: "neo_swap",
    docs: ["@title List of function to manage NeoSwap's multi-items swaps"],
    instructions: [
        {
            name: "readMerkleTree",
            accounts: [
                {
                    name: "signer",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "treeAuthority",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "leafOwner",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "leafDelegate",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "merkleTree",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "logWrapper",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "compressionProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "bubblegumProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "dataHash",
                    type: {
                        array: ["u8", 32],
                    },
                },
                {
                    name: "creatorHash",
                    type: {
                        array: ["u8", 32],
                    },
                },
                {
                    name: "nonce",
                    type: "u64",
                },
                {
                    name: "collection",
                    type: "publicKey",
                },
            ],
        },
    ],
    types: [
        {
            name: "Creator",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "address",
                        type: "publicKey",
                    },
                    {
                        name: "verified",
                        type: "bool",
                    },
                    {
                        name: "share",
                        type: "u8",
                    },
                ],
            },
        },
        {
            name: "Uses",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "useMethod",
                        type: {
                            defined: "UseMethod",
                        },
                    },
                    {
                        name: "remaining",
                        type: "u64",
                    },
                    {
                        name: "total",
                        type: "u64",
                    },
                ],
            },
        },
        {
            name: "Collection",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "verified",
                        type: "bool",
                    },
                    {
                        name: "key",
                        type: "publicKey",
                    },
                ],
            },
        },
        {
            name: "MetadataArgs",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "name",
                        docs: ["The name of the asset"],
                        type: "string",
                    },
                    {
                        name: "symbol",
                        docs: ["The symbol for the asset"],
                        type: "string",
                    },
                    {
                        name: "uri",
                        docs: ["URI pointing to JSON representing the asset"],
                        type: "string",
                    },
                    {
                        name: "sellerFeeBasisPoints",
                        docs: [
                            "Royalty basis points that goes to creators in secondary sales (0-10000)",
                        ],
                        type: "u16",
                    },
                    {
                        name: "primarySaleHappened",
                        type: "bool",
                    },
                    {
                        name: "isMutable",
                        type: "bool",
                    },
                    {
                        name: "editionNonce",
                        docs: ["nonce for easy calculation of editions, if present"],
                        type: {
                            option: "u8",
                        },
                    },
                    {
                        name: "tokenStandard",
                        docs: [
                            "Since we cannot easily change Metadata, we add the new DataV2 fields here at the end.",
                        ],
                        type: {
                            option: {
                                defined: "TokenStandard",
                            },
                        },
                    },
                    {
                        name: "collection",
                        docs: ["Collection"],
                        type: {
                            option: {
                                defined: "Collection",
                            },
                        },
                    },
                    {
                        name: "uses",
                        docs: ["Uses"],
                        type: {
                            option: {
                                defined: "Uses",
                            },
                        },
                    },
                    {
                        name: "tokenProgramVersion",
                        type: {
                            defined: "TokenProgramVersion",
                        },
                    },
                    {
                        name: "creators",
                        type: {
                            vec: {
                                defined: "Creator",
                            },
                        },
                    },
                ],
            },
        },
        {
            name: "TokenProgramVersion",
            type: {
                kind: "enum",
                variants: [
                    {
                        name: "Original",
                    },
                    {
                        name: "Token2022",
                    },
                ],
            },
        },
        {
            name: "TokenStandard",
            type: {
                kind: "enum",
                variants: [
                    {
                        name: "NonFungible",
                    },
                    {
                        name: "FungibleAsset",
                    },
                    {
                        name: "Fungible",
                    },
                    {
                        name: "NonFungibleEdition",
                    },
                ],
            },
        },
        {
            name: "UseMethod",
            type: {
                kind: "enum",
                variants: [
                    {
                        name: "Burn",
                    },
                    {
                        name: "Multiple",
                    },
                    {
                        name: "Single",
                    },
                ],
            },
        },
    ],
};
