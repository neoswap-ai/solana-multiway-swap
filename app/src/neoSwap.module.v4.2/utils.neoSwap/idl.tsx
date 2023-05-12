import { Idl } from '@project-serum/anchor';
export const idl = {
    version: '0.1.0',
    name: 'neo_swap',
    docs: ["@title List of function to manage NeoSwap's multi-items swaps"],
    instructions: [
        {
            name: 'initInitialize',
            docs: [
                "@notice Initialize Swap's PDA. /!\\ Signer will be Initializer",
                "@dev First function to trigger to initialize Swap's PDA with according space, define admin and add Neoswap Fees. /!\\ Signer will be Initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                '@param sent_data: SwapData: {initializer: Pubkey => admin of the trade, status: u8  => "status of the trade", items: NftSwapItem = first item [length=1]}, nb_of_items: u32 => number of items engaged in the trade}',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                '@accounts signer: Pubkey => initializer',
                '@accounts system_program: Pubkey = system_program_id',
                '@accounts associated_token_program: Pubkey = spl_associated_token_program_id',
                '@return Void',
            ],
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
                    name: 'associatedTokenProgram',
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
            docs: [
                "@notice add item to Swap's PDA. /!\\ initializer function",
                '@dev Function to add an item to the PDA. /!\\ status of item is rewritten to according value in program.  /!\\ this function can only be triggered by initializer',
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                '@param trade_to_add: NftSwapItem: {is_nft: bool => "return true if the item is en NFT (true)/(false)", mint: Pubkey => "(Mint address)/(Owner address)", amount: i64 => (nbr of NFT engaged in this trade)/(number of lamports the user will exchange with the smart contract if_positive(user will give lamports), if_negative(user will receive lamports)), owner: Pubkey => owner of the NFT or lamports , destinary: Pubkey => (user who should receive the NFT)/(Owner address), status : u8 => /!\\ will be rewritten by program, }',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                '@accounts signer: Pubkey => initializer',
                '@return Void',
            ],
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
            docs: [
                "@notice Verify Swap's PDA items to proceed to waiting for deposit state. /!\\ initializer function",
                '@dev Function verify each item status and sum of lamports to mutate the smart contract status to (waiting for deposit).',
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                '@accounts signer: Pubkey => initializer',
                '@return Void',
            ],
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
            docs: [
                '@notice Deposit NFT to escrow.',
                "@dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and deposit the NFT into the escrow.",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts {system_program: Pubkey = system_program_id, token_program: Pubkey = token_program_id, swap_data_account: Pubkey => Swap's PDA corresponding to seeds, signer: Pubkey => User that deposits,  item_from_deposit: Pubkey => User ATA related to mint, signer_ata: Pubkey => Swap's PDA ATA related to mint}",
                '@return Void',
            ],
            accounts: [
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'metadataProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'sysvarInstructions',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'splTokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'splAtaProgram',
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
                    name: 'mint',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'nftMetadata',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'itemToDeposit',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'nftMasterEdition',
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: 'ownerTokenRecord',
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: 'destinationTokenRecord',
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: 'authRulesProgram',
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: 'authRules',
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
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
                    name: 'metadataBump',
                    type: 'u8',
                },
                {
                    name: 'masterBump',
                    type: 'u8',
                },
                {
                    name: 'ownerTokenRecordBump',
                    type: 'u8',
                },
                {
                    name: 'destinationTokenRecordBump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'depositSol',
            docs: [
                '@notice Deposit lamports to escrow.',
                "@dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and deposits lamports to escrow. /!\\ user that should only receive lamports don't have to deposit.",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                '@accounts system_program: Pubkey = system_program_id',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                '@accounts signer: Pubkey => User that deposits',
                '@return Void',
            ],
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
            docs: [
                "@notice Verify Swap's PDA items to proceed to waiting for claiming state. /!\\ initializer function",
                '@dev Function verify each item status to mutate the smart contract status to 1 (waiting for claim).  /!\\ this function can only be triggered by initializer',
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                '@accounts signer: Pubkey => initializer',
                '@return Void',
            ],
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
            docs: [
                '@notice Claims lamports from escrow. /!\\ initializer function',
                "@dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfer lamports to destinary. /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                '@accounts system_program: Pubkey = system_program_id',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                '@accounts user: Pubkey => User that will receive lamports',
                '@accounts signer: Pubkey => Initializer',
                '@return Void',
            ],
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
            docs: [
                '@notice Claim NFT from escrow. /!\\ initializer function',
                "@dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfers the NFT from the escrow to the shared user. If no more NFT is held by the PDA, close PDA ATA and send rent fund to user. /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                '@accounts system_program: Pubkey = system_program_id',
                '@accounts token_program: Pubkey = token_program_id',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                '@accounts user: Pubkey => User that will receive the NFT, signer: Pubkey => Initializer',
                '@accounts signer: Pubkey => Initializer',
                "@accounts item_from_deposit: Pubkey => Swap's PDA ATA related to mint",
                '@accounts item_to_deposit: Pubkey => User ATA related to mint',
                '@return Void',
            ],
            accounts: [
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'metadataProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'sysvarInstructions',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'splTokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'splAtaProgram',
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
                {
                    name: 'mint',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'nftMetadata',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'nftMasterEdition',
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: 'ownerTokenRecord',
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: 'destinationTokenRecord',
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: 'authRulesProgram',
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: 'authRules',
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
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
                    name: 'metadataBump',
                    type: 'u8',
                },
                {
                    name: 'masterBump',
                    type: 'u8',
                },
                {
                    name: 'ownerTokenRecordBump',
                    type: 'u8',
                },
                {
                    name: 'destinationTokenRecordBump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'validateClaimed',
            docs: [
                "@notice Verify Swap's PDA items to proceed to closed state. /!\\ initializer function",
                "@dev Function verify each item status to mutate the smart contract status to 3 (closed) then close the Swap's PDA.  /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds, signer: Pubkey => initializer",
                '@accounts signer: Pubkey => initializer',
                '@accounts system_program: Pubkey = system_program_id',
                '@accounts associated_token_program: Pubkey = spl_associated_token_program_id',
                '@return Void',
            ],
            accounts: [
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'associatedTokenProgram',
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
            docs: [
                '@notice Cancels an item from escrow, retrieving funds if deposited previously. /!\\ initializer function',
                "@dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfer lamports to destinary if needed, change the item status to cancelled and Swap's status to 90 (cancelled) if not already. /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                '@accounts system_program: Pubkey = system_program_id',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                '@accounts user: Pubkey => User that will receive lamports',
                '@accounts signer: Pubkey => Initializer',
                '@return Void',
            ],
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
            docs: [
                '@notice Cancel NFT from escrow, retrieving it if previously deposited. /!\\ initializer function',
                "@dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfers the NFT from the shared user to the escrow. If no more NFT is held by the PDA, close PDA ATA and send rent fund to user. /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                '@accounts system_program: Pubkey = system_program_id, token_program: Pubkey = token_program_id',
                '@accounts token_program: Pubkey = token_program_id',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                '@accounts user: Pubkey => User that will potentially receive the NFT',
                '@accounts signer: Pubkey => Initializer',
                "@accounts item_from_deposit: Pubkey => Swap's PDA ATA related to mint",
                '@accounts item_to_deposit: Pubkey => User ATA related to mint',
                '@return Void',
            ],
            accounts: [
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'metadataProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'sysvarInstructions',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'splTokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'splAtaProgram',
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
                {
                    name: 'mint',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'nftMetadata',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'nftMasterEdition',
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: 'ownerTokenRecord',
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: 'destinationTokenRecord',
                    isMut: true,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: 'authRulesProgram',
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
                },
                {
                    name: 'authRules',
                    isMut: false,
                    isSigner: false,
                    isOptional: true,
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
                    name: 'metadataBump',
                    type: 'u8',
                },
                {
                    name: 'masterBump',
                    type: 'u8',
                },
                {
                    name: 'ownerTokenRecordBump',
                    type: 'u8',
                },
                {
                    name: 'destinationTokenRecordBump',
                    type: 'u8',
                },
            ],
        },
        {
            name: 'validateCancel',
            docs: [
                "@notice Verify Swap's PDA items to proceed to closed state. /!\\ initializer function",
                "@dev Function verify each item status to mutate the smart contract status to 3 (closed) then close the Swap's PDA.  /!\\ this function can only be triggered by initializer",
                "@param seed: u8[] => Seed buffer corresponding to Swap's PDA",
                '@param bump: u8 => "Bump corresponding to Swap\'s PDA"',
                "@accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds",
                '@accounts signer: Pubkey => initializer',
                '@accounts system_program: Pubkey = system_program_id',
                '@accounts associated_token_program: Pubkey = spl_associated_token_program_id',
                '@return Void',
            ],
            accounts: [
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'associatedTokenProgram',
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
            name: 'transferOcp',
            accounts: [
                {
                    name: 'metadataProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'ocpProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'ocpPolicy',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'cmtProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'sysvarInstructions',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenMint',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'nftMetadata',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'ocpMintState',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'ocpFreezeAuthority',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'signer',
                    isMut: false,
                    isSigner: true,
                },
                {
                    name: 'signerAta',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'destinary',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'destinaryAta',
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
    ],
    errors: [
        {
            code: 6000,
            name: 'UserNotPartOfTrade',
            msg: 'User not part of the trade',
        },
        {
            code: 6001,
            name: 'MintIncorrect',
            msg: 'Incorrect Mint',
        },
        {
            code: 6002,
            name: 'AmountIncorrect',
            msg: "Amount given isn't correct",
        },
        {
            code: 6003,
            name: 'ShouldntSend',
            msg: "User shouldn't be sending funds",
        },
        {
            code: 6004,
            name: 'NoSend',
            msg: 'Nothing was found in the smart contract to be sent to you',
        },
        {
            code: 6005,
            name: 'SumNotNull',
            msg: "Sum of trade isn't null",
        },
        {
            code: 6006,
            name: 'NotReady',
            msg: 'Not ready for claim',
        },
        {
            code: 6007,
            name: 'UnexpectedData',
            msg: "Given data isn't fitting",
        },
        {
            code: 6008,
            name: 'NotSystemProgram',
            msg: 'wrong system program Id passed',
        },
        {
            code: 6009,
            name: 'NotTokenProgram',
            msg: 'wrong token program Id passed',
        },
        {
            code: 6010,
            name: 'NotPda',
            msg: 'wrong Pda program Id passed',
        },
        {
            code: 6011,
            name: 'NotInit',
            msg: 'wrong signer, should be initializer to perform this action',
        },
        {
            code: 6012,
            name: 'NotBump',
            msg: 'wrong bump',
        },
        {
            code: 6013,
            name: 'UnexpectedState',
            msg: 'The status given is not correct',
        },
        {
            code: 6014,
            name: 'InvalidAccountData',
            msg: 'owner checks unsuccessfuls',
        },
        {
            code: 6015,
            name: 'IncorrectLength',
            msg: 'Incorrect init data length',
        },
        {
            code: 6016,
            name: 'NotEnoughFunds',
            msg: 'Not enough funds',
        },
        {
            code: 6017,
            name: 'IncorrectOwner',
            msg: 'Owner Given is incorrect',
        },
        {
            code: 6018,
            name: 'RemainingAccountNotFound',
            msg: 'Missing some account passed',
        },
        {
            code: 6019,
            name: 'InstructionBuilderFailed',
            msg: 'Failed to build the instruction',
        },
        {
            code: 6020,
            name: 'NotProgrammableNft',
            msg: 'This is not a programmableNft',
        },
        {
            code: 6021,
            name: 'IncorrectSplAta',
            msg: 'Incorrect Token ATA Program',
        },
        {
            code: 6022,
            name: 'IncorrectSysvar',
            msg: 'Incorrect Sysvar Instruction Program',
        },
        {
            code: 6023,
            name: 'IncorrectMetadata',
            msg: 'Incorrect Metadata Program',
        },
        {
            code: 6024,
            name: 'IncorrectTokenRecord',
            msg: 'Incorrect token reccord account',
        },
        {
            code: 6025,
            name: 'InvalidOcpParameters',
            msg: 'Not OCP NFT',
        },
    ],
} as Idl;
