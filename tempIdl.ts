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
                    name: "merkleTree",
                    isMut: true,
                    isSigner: false,
                },
            ],
            args: [],
        },
    ],
};
