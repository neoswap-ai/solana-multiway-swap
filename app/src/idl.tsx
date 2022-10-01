import { Idl } from "@project-serum/anchor";

export const idl = {
  "version": "0.1.0",
  "name": "swap_coontract_test",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "swapDataAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "seed",
          "type": "bytes"
        },
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "sentData",
          "type": {
            "defined": "SwapData"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "SwapData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initializer",
            "type": "publicKey"
          },
          {
            "name": "isComplete",
            "type": "bool"
          },
          {
            "name": "userA",
            "type": "publicKey"
          },
          {
            "name": "userANft1",
            "type": "publicKey"
          },
          {
            "name": "userANft2",
            "type": "publicKey"
          },
          {
            "name": "userB",
            "type": "publicKey"
          },
          {
            "name": "userBNft",
            "type": "publicKey"
          },
          {
            "name": "userC",
            "type": "publicKey"
          },
          {
            "name": "userCNft",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "SCERROR",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "UserNotPartOfTrade"
          }
        ]
      }
    }
  ]
} as Idl;
