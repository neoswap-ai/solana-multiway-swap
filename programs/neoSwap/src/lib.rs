use {
    anchor_lang::{
        prelude::*,
        solana_program::{
            program::{invoke, invoke_signed},
            pubkey::Pubkey,
        },
    },
    anchor_spl::{
        associated_token::AssociatedToken,
        token::{spl_token, Token, TokenAccount},
    },
    mpl_bubblegum,
    mpl_bubblegum::program::Bubblegum,
    mpl_token_metadata::{
        instruction::{builders::TransferBuilder, InstructionBuilder, TransferArgs},
        state::{Metadata, TokenMetadataAccount},
    },
    spl_account_compression::{program::SplAccountCompression, Noop},
};

use anchor_lang::solana_program;
use anchor_spl::token::Mint;

// declare_id!("6kHx1ZDMaECRE14bEJB7mgP8NbsZHiVpSzNba2JgPq9N");
// declare_id!("Et2RutKNHzB6XmsDXUGnDHJAGAsJ73gdHVkoKyV79BFY");
// declare_id!("HCg7NKnvWwWZdLXqDwZdjn9RDz9eLDYuSAcUHqeC1vmH");
declare_id!("EU5zoiRSvPE5k1Fy49UJZvPMBKxzatdBGFJ11XPFD42Z");

///@title List of function to manage NeoSwap's multi-items swaps
#[program]
pub mod neo_swap {
    use anchor_lang::solana_program::system_program;

    use super::*;

    /// @notice Initialize Swap's PDA. /!\ Signer will be Initializer
    /// @dev First function to trigger to initialize Swap's PDA with according space, define admin and preSeed. /!\ Signer will be Initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @param sent_data: SwapData
    /// @param nb_of_items: u32 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @accounts system_program: Pubkey = system_program_id
    /// @return Void
    pub fn init_initialize(
        ctx: Context<InitInitialize>,
        _seed: Vec<u8>,
        sent_data: SwapData,
    ) -> Result<()> {
        require!(
            sent_data.status == TradeStatus::Initializing.to_u8(),
            MYERROR::UnexpectedState
        );
        require!(sent_data.items.is_empty(), MYERROR::IncorrectLength);
        // require!(
        //     !sent_data.accepted_payement,
        //     MYERROR::NoAcceptedPaymentGiven
        // );

        require!(sent_data.pre_seed.len() < 30_usize, MYERROR::PreSeedTooLong);
        // Write according Data into Swap's PDA
        ctx.accounts.swap_data_account.initializer = ctx.accounts.signer.key();
        ctx.accounts.swap_data_account.items = [].to_vec();
        ctx.accounts.swap_data_account.status = TradeStatus::Initializing.to_u8();
        ctx.accounts.swap_data_account.nb_items = sent_data.nb_items;
        ctx.accounts.swap_data_account.pre_seed = sent_data.pre_seed;
        ctx.accounts.swap_data_account.accepted_payement = sent_data.accepted_payement;
        Ok(())
    }

    /// @notice add item to Swap's PDA. /!\ initializer function
    /// @dev Function to add an item to the PDA. /!\ status of item is rewritten to according value in program.  /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @param trade_to_add: NftSwapItem
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @return Void
    pub fn initialize_add(
        ctx: Context<InitializeAdd>,
        _seed: Vec<u8>,
        trade_to_add: NftSwapItem,
    ) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;

        require!(
            swap_data_account.status == TradeStatus::Initializing.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut item_to_add: NftSwapItem = trade_to_add;

        // Write status according status to item
        if item_to_add.is_nft {
            require!(
                item_to_add.is_compressed == false || item_to_add.is_compressed == true,
                MYERROR::UnexpectedState
            );
            item_to_add.status = ItemStatus::NFTPending.to_u8();
            if item_to_add.amount.is_negative() || item_to_add.amount == 0 {
                return Err(error!(MYERROR::UnexpectedData));
            }
            msg!("NFT item added with status NFTPending");
        } else {
            // Check if already one user has Sol item
            for item_id in 0..swap_data_account.items.len() {
                if !swap_data_account.items[item_id].is_nft
                    && swap_data_account.items[item_id]
                        .owner
                        .eq(&item_to_add.owner)
                {
                    return Err(error!(MYERROR::AlreadyExist));
                }
            }
            // Check the Payment asked for this item is compliant to the swap Data
            // msg!(
            //     "mint of item_to_add: ${}, accepted payment : ${}",
            //     item_to_add.mint,
            //     swap_data_account.accepted_payement
            // );
            require!(
                item_to_add.mint.eq(&swap_data_account.accepted_payement),
                MYERROR::MintIncorrect
            );
            // Check that mint and destinary are dummy values
            require!(
                item_to_add.destinary.eq(&system_program::id()),
                MYERROR::UnexpectedData
            );

            if item_to_add.amount.is_positive() {
                item_to_add.status = ItemStatus::SolPending.to_u8();
                msg!("SOL item added with status SolPending");
            } else if item_to_add.amount == 0 {
                return Err(error!(MYERROR::UnexpectedData));
            } else {
                item_to_add.status = ItemStatus::SolToClaim.to_u8();
                msg!("SOL item added with status SolToClaim");
            }
        }

        // Write according Data into Swap's PDA
        swap_data_account.items.push(item_to_add);

        Ok(())
    }

    /// @notice Verify Swap's PDA items to proceed to waiting for deposit state. /!\ initializer function
    /// @dev Function verify each item status and sum of lamports to mutate the program status to (waiting for deposit).
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @return Void
    pub fn validate_initialize(ctx: Context<Validate>, _seed: Vec<u8>) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;

        require!(
            swap_data_account.status == TradeStatus::Initializing.to_u8(),
            MYERROR::UnexpectedState
        );

        // Check that sum of lamports to trade is null
        let mut sum = 0_i64;
        let mut count = 0_u32;
        for item_id in 0..swap_data_account.items.len() {
            if !swap_data_account.items[item_id].is_nft {
                sum = sum
                    .checked_add(swap_data_account.items[item_id].amount)
                    .unwrap();
            }
            count += 1;
        }
        require!(sum == 0, MYERROR::SumNotNull);
        require!(
            count == swap_data_account.nb_items,
            MYERROR::IncorrectLength
        );

        //changing status to WaitingToDeposit
        swap_data_account.status = TradeStatus::WaitingToDeposit.to_u8();

        Ok(())
    }

    /// @notice Deposit NFT to escrow.
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and deposit the NFT into the escrow.
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts system_program = SYSTEM_PROGRAM_ID
    /// @accounts metadata_program => METADATA_PROGRAM_ID
    /// @accounts sysvar_instructions => SYSVAR_INSTRUCTION_ID
    /// @accounts spl_token_program => TOKEN_PROGRAM_ID
    /// @accounts spl_ata_program => SPL_TOKEN_PROGRAM_ID
    /// @accounts swap_data_account => Swap's PDA corresponding to seeds
    /// @accounts user => User that will potentially receive the NFT
    /// @accounts signer => Initializer or User
    /// @accounts item_from_deposit => Swap's PDA ATA related to mint
    /// @accounts item_to_deposit => User ATA related to mint
    /// @accounts mint => mint Account of the NFT
    /// @accounts nft_metadata => metadata account
    /// @accounts nft_master_edition => if !pNFT: signer / if pNFT: masterEdition account
    /// @accounts owner_token_record => if !pNFT: signer / if pNFT: owner's token record account (seed:'metadata',METADATA_PROGRAM,mint,'token_record',swap_data_account_mint_ata; programAssociated:METADATA_PROGRAM)
    /// @accounts destination_token_record => if !pNFT: signer / if pNFT: swap_data_account's token record account (seed:'metadata',METADATA_PROGRAM,mint,'token_record',initial_owner_mint_ata; programAssociated:METADATA_PROGRAM)
    /// @accounts auth_rules_program => metaplex auth rules program (auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg)
    /// @accounts auth_rules => if !pNFT: signer / if pNFT: auth rules account linked to the mint (get from mint account data)
    /// @return Void
    pub fn deposit_nft(
        ctx: Context<DepositPNft>,
        _seed: Vec<u8>,
        // _metadata_bump: u8,
    ) -> Result<()> {
        let swap_data_account = &ctx.accounts.swap_data_account;

        require!(
            swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            msg!("2");
            // msg!("{}",ctx.accounts.item_from_deposit.owner);
            if !ctx.accounts.swap_data_account.items[item_id].is_compressed {
                if ctx.accounts.swap_data_account.items[item_id].is_nft
                    && ctx.accounts.swap_data_account.items[item_id]
                        .mint
                        .eq(&ctx.accounts.item_to_deposit.mint)
                    && ctx.accounts.swap_data_account.items[item_id]
                        .owner
                        .eq(&ctx.accounts.item_from_deposit.owner)
                    && ctx.accounts.swap_data_account.items[item_id].status
                        == ItemStatus::NFTPending.to_u8()
                {
                    msg!("3");
                    // creating base transfer builder
                    let mut transfer_builder = TransferBuilder::new();
                    transfer_builder
                        .token(ctx.accounts.item_from_deposit.key())
                        .token_owner(ctx.accounts.signer.key())
                        .destination(ctx.accounts.item_to_deposit.key())
                        .destination_owner(ctx.accounts.swap_data_account.key())
                        .mint(ctx.accounts.mint.key())
                        .metadata(ctx.accounts.nft_metadata.key())
                        .authority(ctx.accounts.signer.key())
                        .payer(ctx.accounts.signer.key())
                        .system_program(ctx.accounts.system_program.key())
                        .sysvar_instructions(ctx.accounts.sysvar_instructions.key())
                        .spl_token_program(ctx.accounts.spl_token_program.key())
                        .spl_ata_program(ctx.accounts.spl_ata_program.key());

                    msg!("4");

                    // creating vase transfer info
                    let mut transfer_infos = vec![
                        ctx.accounts.item_from_deposit.to_account_info(),
                        ctx.accounts.item_to_deposit.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                        ctx.accounts.mint.to_account_info(),
                        ctx.accounts.nft_metadata.to_account_info(),
                        ctx.accounts.signer.to_account_info(),
                        ctx.accounts.system_program.to_account_info(),
                        ctx.accounts.sysvar_instructions.to_account_info(),
                        ctx.accounts.spl_token_program.to_account_info(),
                        ctx.accounts.spl_ata_program.to_account_info(),
                        ctx.accounts.sysvar_instructions.to_account_info(),
                        ctx.accounts.metadata_program.to_account_info(),
                    ];

                    let metadata: Metadata =
                        Metadata::from_account_info(&ctx.accounts.nft_metadata.to_account_info())?;

                    msg!("5");

                    if matches!(
                        metadata.token_standard,
                        Some(mpl_token_metadata::state::TokenStandard::ProgrammableNonFungible)
                    ) {
                        transfer_builder
                            .edition(ctx.accounts.nft_master_edition.key())
                            .owner_token_record(ctx.accounts.owner_token_record.key())
                            .destination_token_record(ctx.accounts.destination_token_record.key())
                            .authorization_rules_program(ctx.accounts.auth_rules_program.key())
                            .authorization_rules(ctx.accounts.auth_rules.key());

                        transfer_infos.push(ctx.accounts.nft_master_edition.to_account_info());
                        transfer_infos.push(ctx.accounts.owner_token_record.to_account_info());
                        transfer_infos
                            .push(ctx.accounts.destination_token_record.to_account_info());
                        transfer_infos.push(ctx.accounts.auth_rules_program.to_account_info());
                        transfer_infos.push(ctx.accounts.auth_rules.to_account_info());
                        msg!("6.1");
                    } else {
                        msg!("6.2");
                    }

                    // Check enough tokens in ATA balance
                    if ctx.accounts.swap_data_account.items[item_id]
                        .amount
                        .unsigned_abs()
                        > ctx.accounts.item_from_deposit.amount
                    {
                        return Err(MYERROR::NotEnoughFunds.into());
                    }

                    // Create transfer instruction
                    let transfer_ix = transfer_builder
                        .build(TransferArgs::V1 {
                            amount: ctx.accounts.swap_data_account.items[item_id]
                                .amount
                                .unsigned_abs(),
                            authorization_data: None,
                        })
                        .map_err(|_| MYERROR::InstructionBuilderFailed)?
                        .instruction();
                    msg!("7");

                    //Bbroadcast transfer instruction
                    invoke(&transfer_ix, &transfer_infos)?;

                    ctx.accounts.swap_data_account.items[item_id].status =
                        ItemStatus::NFTDeposited.to_u8();
                    transfered = true;
                    msg!("NFTDeposited");
                    break;
                }
            }
        }

        // Returns error if nothing is there to transfer
        if !transfered {
            return Err(error!(MYERROR::NoSend));
        }

        Ok(())
    }

    /// @notice Deposit NFT to escrow.
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and deposit the NFT into the escrow.
    pub fn deposit_c_nft<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, DepositCNft<'info>>,
        _seed: Vec<u8>,
        root: [u8; 32],
        data_hash: [u8; 32],
        creator_hash: [u8; 32],
        nonce: u64,
        index: u32,
    ) -> Result<()> {
        let swap_data_account = &ctx.accounts.swap_data_account;

        require!(
            swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            msg!("2");
            // msg!("{:#?}", ctx.accounts.merkle_tree.data);
            msg!(
                "item {:#?}",
                ctx.accounts.swap_data_account.items[item_id].merkle_tree
            );
            msg!("mwrkle {:#?}", ctx.accounts.merkle_tree.key());
            if ctx.accounts.swap_data_account.items[item_id].is_compressed
                && ctx.accounts.swap_data_account.items[item_id].is_nft
            {
                if ctx.accounts.swap_data_account.items[item_id]
                    .merkle_tree
                    .eq(&ctx.accounts.merkle_tree.key())
                    && ctx.accounts.swap_data_account.items[item_id]
                        .owner
                        .eq(&ctx.accounts.user.key())
                    && ctx.accounts.swap_data_account.items[item_id].status
                        == ItemStatus::NFTPending.to_u8()
                {
                    msg!("3");
                    // creating base transfer builder

                    // remaining_accounts are the accounts that make up the required proof
                    let remaining_accounts_len = ctx.remaining_accounts.len();
                    let mut accounts = Vec::with_capacity(8 + remaining_accounts_len);
                    accounts.extend(vec![
                        AccountMeta::new_readonly(ctx.accounts.tree_authority.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.user.key(), true),
                        AccountMeta::new_readonly(ctx.accounts.leaf_delegate.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.swap_data_account.key(), false),
                        AccountMeta::new(ctx.accounts.merkle_tree.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.log_wrapper.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.compression_program.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                    ]);

                    let transfer_discriminator: [u8; 8] = [163, 52, 200, 231, 140, 3, 69, 186];

                    let mut data = Vec::with_capacity(
                        8 + root.len() + data_hash.len() + creator_hash.len() + 8 + 8,
                    );
                    data.extend(transfer_discriminator);
                    data.extend(root);
                    data.extend(data_hash);
                    data.extend(creator_hash);
                    data.extend(nonce.to_le_bytes());
                    data.extend(index.to_le_bytes());

                    let mut account_infos = Vec::with_capacity(8 + remaining_accounts_len);
                    account_infos.extend(vec![
                        ctx.accounts.tree_authority.to_account_info(),
                        ctx.accounts.user.to_account_info(),
                        ctx.accounts.leaf_delegate.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                        ctx.accounts.merkle_tree.to_account_info(),
                        ctx.accounts.log_wrapper.to_account_info(),
                        ctx.accounts.compression_program.to_account_info(),
                        ctx.accounts.system_program.to_account_info(),
                    ]);

                    // Add "accounts" (hashes) that make up the merkle proof from the remaining accounts.
                    for acc in ctx.remaining_accounts.iter() {
                        accounts.push(AccountMeta::new_readonly(acc.key(), false));
                        account_infos.push(acc.to_account_info());
                    }

                    let instruction = solana_program::instruction::Instruction {
                        program_id: ctx.accounts.bubblegum_program.key(),
                        accounts,
                        data,
                    };

                    solana_program::program::invoke(&instruction, &account_infos[..])?;

                    ctx.accounts.swap_data_account.items[item_id].status =
                        ItemStatus::NFTDeposited.to_u8();
                    transfered = true;
                    msg!("NFTDeposited");
                    break;
                }
            }
        }

        // Returns error if nothing is there to transfer
        if !transfered {
            return Err(error!(MYERROR::NoSend));
        }

        Ok(())
    }

    /// @notice Deposit lamports to escrow.
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and deposits lamports to escrow.
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => User that deposits
    /// @return Void
    pub fn deposit_sol(
        ctx: Context<DepositSol>,
        _seed: Vec<u8>,
        // _bump: u8
    ) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if !ctx.accounts.swap_data_account.items[item_id].is_nft
                && ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::SolPending.to_u8()
                && ctx.accounts.swap_data_account.items[item_id]
                    .owner
                    .eq(ctx.accounts.signer.key)
                && !transfered
            {
                if ctx.accounts.swap_data_account.items[item_id].amount > 0 {
                    // Transfer lamports to Escrow

                    if ctx.accounts.swap_data_account.items[item_id]
                        .mint
                        .eq(&system_program::id())
                    {
                        let ix = anchor_lang::solana_program::system_instruction::transfer(
                            &ctx.accounts.signer.key(),
                            &ctx.accounts.swap_data_account.key(),
                            ctx.accounts.swap_data_account.items[item_id]
                                .amount
                                .unsigned_abs(),
                        );
                        invoke(
                            &ix,
                            &[
                                ctx.accounts.signer.to_account_info(),
                                ctx.accounts.swap_data_account.to_account_info(),
                            ],
                        )?;
                    } else {
                        // check signer ata
                        // msg!("signer ata",ctx.accounts.signer_ata.key())
                        require!(
                            is_correct_ata(
                                ctx.accounts.signer_ata.key(),
                                ctx.accounts.signer.key(),
                                ctx.accounts.swap_data_account.items[item_id].mint.key()
                            ),
                            MYERROR::IncorrectOwner
                        );

                        // check swapDataAccount ata
                        require!(
                            is_correct_ata(
                                ctx.accounts.swap_data_account_ata.key(),
                                ctx.accounts.swap_data_account.key(),
                                ctx.accounts.swap_data_account.items[item_id].mint.key()
                            ),
                            MYERROR::IncorrectOwner
                        );
                        msg!(
                            " amount {}",
                            ctx.accounts.swap_data_account.items[item_id]
                                .amount
                                .unsigned_abs()
                        );

                        let ix = spl_token::instruction::transfer(
                            &ctx.accounts.spl_token_program.key,
                            &ctx.accounts.signer_ata.key(),
                            &ctx.accounts.swap_data_account_ata.key(),
                            &ctx.accounts.signer.key(),
                            &[&ctx.accounts.signer.key()],
                            ctx.accounts.swap_data_account.items[item_id]
                                .amount
                                .unsigned_abs(),
                        )?;
                        invoke(
                            &ix,
                            &[
                                ctx.accounts.spl_token_program.to_account_info(),
                                ctx.accounts.signer.to_account_info(),
                                ctx.accounts.signer_ata.to_account_info(),
                                ctx.accounts.swap_data_account.to_account_info(),
                                ctx.accounts.swap_data_account_ata.to_account_info(),
                            ],
                        )?;
                    }

                    //update status to 2 (Claimed)
                    ctx.accounts.swap_data_account.items[item_id].status =
                        ItemStatus::SolDeposited.to_u8();
                    transfered = true;
                    msg!("SolDeposited");
                    break;
                } else {
                    return Err(error!(MYERROR::NoSend));
                }
            }
        }

        if !transfered {
            return Err(error!(MYERROR::NoSend));
        }
        Ok(())
    }

    /// @notice Verify Swap's PDA items to proceed to waiting for claiming state. /!\ initializer function
    /// @dev Function verify each item status to mutate the program status to WaitingToClaim.  /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @return Void
    pub fn validate_deposit(
        ctx: Context<ValidateDeposited>,
        _seed: Vec<u8>,
        // _bump: u8
    ) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
            MYERROR::UnexpectedState
        );

        // Checks that all items have been deposited
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if !(ctx.accounts.swap_data_account.items[item_id].status
                == ItemStatus::NFTDeposited.to_u8()
                || ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::SolDeposited.to_u8()
                || ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::SolToClaim.to_u8())
            {
                return Err(error!(MYERROR::NotReady));
            }
        }

        // Udpate status to WaitingToClaim
        ctx.accounts.swap_data_account.status = TradeStatus::WaitingToClaim.to_u8();

        Ok(())
    }

    /// @notice Claims lamports from escrow. Initializer can trigger this function
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfer lamports to destinary.
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts user: Pubkey => User that will receive lamports
    /// @accounts signer: Pubkey => Initializer
    /// @return Void
    pub fn claim_sol(ctx: Context<ClaimSol>, seed: Vec<u8>, bump: u8) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToClaim.to_u8(),
            MYERROR::NotReady
        );

        let mut transfered: bool = false;
        let mut authorized: bool = false;

        if ctx
            .accounts
            .signer
            .key()
            .eq(&ctx.accounts.swap_data_account.initializer)
        {
            authorized = true;
        }

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if !ctx.accounts.swap_data_account.items[item_id].is_nft
                && ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::SolToClaim.to_u8()
                && ctx.accounts.swap_data_account.items[item_id]
                    .owner
                    .eq(&ctx.accounts.user.key())
                && !transfered
            {
                // Bypass function for initializer or the destinary of this solItem
                if ctx
                    .accounts
                    .signer
                    .key()
                    .eq(&ctx.accounts.swap_data_account.items[item_id].destinary)
                {
                    authorized = true;
                }

                if ctx.accounts.swap_data_account.items[item_id]
                    .amount
                    .is_negative()
                {
                    // Send lamports to user
                    let amount_to_send = ctx.accounts.swap_data_account.items[item_id]
                        .amount
                        .unsigned_abs();

                    let swap_data_lamports_initial =
                        ctx.accounts.swap_data_account.to_account_info().lamports();

                    if swap_data_lamports_initial >= amount_to_send {
                        if ctx.accounts.swap_data_account.items[item_id]
                            .mint
                            .eq(&system_program::id())
                        {
                            **ctx.accounts.user.lamports.borrow_mut() =
                                ctx.accounts.user.lamports() + amount_to_send;
                            **ctx
                                .accounts
                                .swap_data_account
                                .to_account_info()
                                .lamports
                                .borrow_mut() =
                                ctx.accounts.swap_data_account.to_account_info().lamports()
                                    - amount_to_send;
                        } else {
                            // check swapDataAccount ata
                            require!(
                                is_correct_ata(
                                    ctx.accounts.swap_data_account_ata.key(),
                                    ctx.accounts.swap_data_account.key(),
                                    ctx.accounts.swap_data_account.items[item_id].mint.key()
                                ),
                                MYERROR::IncorrectOwner
                            );
                            // check user ata
                            require!(
                                is_correct_ata(
                                    ctx.accounts.user_ata.key(),
                                    ctx.accounts.user.key(),
                                    ctx.accounts.swap_data_account.items[item_id].mint.key()
                                ),
                                MYERROR::IncorrectOwner
                            );

                            let ix_user = spl_token::instruction::transfer(
                                &ctx.accounts.spl_token_program.to_account_info().key(),
                                &ctx.accounts.swap_data_account_ata.key(),
                                &ctx.accounts.user_ata.key(),
                                &ctx.accounts.swap_data_account.key(),
                                &[&ctx.accounts.swap_data_account.key()],
                                ctx.accounts.swap_data_account.items[item_id]
                                    .amount
                                    .unsigned_abs(),
                            )?;

                            invoke_signed(
                                &ix_user,
                                &[
                                    ctx.accounts.swap_data_account.to_account_info(),
                                    ctx.accounts.swap_data_account_ata.to_account_info(),
                                    ctx.accounts.user_ata.to_account_info(),
                                    ctx.accounts.user.to_account_info(),
                                    ctx.accounts.spl_token_program.to_account_info(),
                                ],
                                &[&[&seed[..], &[bump]]],
                            )?;
                        }

                        //update item status to SolClaimed
                        ctx.accounts.swap_data_account.items[item_id].status =
                            ItemStatus::SolClaimed.to_u8();
                        transfered = true;
                        msg!("SOL item Claimed");
                        break;
                    } else {
                        return Err(error!(MYERROR::NotEnoughFunds));
                    }
                } else {
                    return Err(error!(MYERROR::NoSend));
                }
            }
        }
        if !transfered {
            return Err(error!(MYERROR::NoSend));
        }
        if !authorized {
            return Err(error!(MYERROR::UserNotPartOfTrade));
        }
        Ok(())
    }

    /// @notice Claim NFT from escrow. /!\ initializer function
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfers the NFT from the escrow to the shared user. If no more NFT is held by the PDA, close PDA ATA and send rent fund to user. /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @param _metadata_bump: u8 => "Bump corresponding to Metadata's PDA"
    /// @accounts system_program = SYSTEM_PROGRAM_ID
    /// @accounts metadata_program => METADATA_PROGRAM_ID
    /// @accounts sysvar_instructions => SYSVAR_INSTRUCTION_ID
    /// @accounts spl_token_program => TOKEN_PROGRAM_ID
    /// @accounts spl_ata_program => SPL_TOKEN_PROGRAM_ID
    /// @accounts swap_data_account => Swap's PDA corresponding to seeds
    /// @accounts user => User that will receive the NFT
    /// @accounts signer => Initializer or User
    /// @accounts swap_data_account_ata => Swap's PDA ATA related to mint
    /// @accounts user_ata => User ATA related to mint
    /// @accounts mint => mint Account of the NFT
    /// @accounts nft_metadata => metadata account
    /// @accounts nft_master_edition => if !pNFT: signer / if pNFT: masterEdition account
    /// @accounts owner_token_record => if !pNFT: signer / if pNFT: swap_data_account's token record account (seed:'metadata',METADATA_PROGRAM,mint,'token_record',swap_data_account_mint_ata; programAssociated:METADATA_PROGRAM)
    /// @accounts destination_token_record => if !pNFT: signer / if pNFT: initial owner's token record account (seed:'metadata',METADATA_PROGRAM,mint,'token_record',initial_owner_mint_ata; programAssociated:METADATA_PROGRAM)
    /// @accounts auth_rules_program => metaplex auth rules program (auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg)
    /// @accounts auth_rules => if !pNFT: signer / if pNFT: auth rules account linked to the mint (get from mint account data)
    /// @return Void
    pub fn claim_nft(
        ctx: Context<ClaimNft>,
        seed: Vec<u8>,
        bump: u8,
        // _metadata_bump: u8,
    ) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToClaim.to_u8(),
            MYERROR::NotReady
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if !ctx.accounts.swap_data_account.items[item_id].is_compressed {
                if ctx.accounts.swap_data_account.items[item_id].is_nft
                    && ctx.accounts.swap_data_account.items[item_id].status
                        == ItemStatus::NFTDeposited.to_u8()
                    && ctx.accounts.swap_data_account.items[item_id]
                        .mint
                        .eq(&ctx.accounts.swap_data_account_ata.mint)
                    && ctx.accounts.swap_data_account.items[item_id]
                        .mint
                        .eq(&ctx.accounts.user_ata.mint)
                    && ctx.accounts.swap_data_account.items[item_id]
                        .destinary
                        .eq(&ctx.accounts.user_ata.owner)
                    && !transfered
                {
                    // Bypass function for initializer or the destinary of this NFT

                    // Transfer the NFT to user

                    let mut transfer_builder = TransferBuilder::new();

                    transfer_builder
                        .token(ctx.accounts.swap_data_account_ata.key())
                        .token_owner(ctx.accounts.swap_data_account.key())
                        .destination(ctx.accounts.user_ata.key())
                        .destination_owner(ctx.accounts.user.key())
                        .mint(ctx.accounts.mint.key())
                        .metadata(ctx.accounts.nft_metadata.key())
                        .authority(ctx.accounts.swap_data_account.key())
                        .payer(ctx.accounts.signer.key())
                        .system_program(ctx.accounts.system_program.key())
                        .sysvar_instructions(ctx.accounts.sysvar_instructions.key())
                        .spl_token_program(ctx.accounts.spl_token_program.key())
                        .spl_ata_program(ctx.accounts.spl_ata_program.key());

                    msg!("4");

                    // creating vase transfer info
                    let mut transfer_infos = vec![
                        ctx.accounts.swap_data_account_ata.to_account_info(),
                        ctx.accounts.user_ata.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                        ctx.accounts.user.to_account_info(),
                        ctx.accounts.mint.to_account_info(),
                        ctx.accounts.nft_metadata.to_account_info(),
                        ctx.accounts.signer.to_account_info(),
                        ctx.accounts.system_program.to_account_info(),
                        ctx.accounts.sysvar_instructions.to_account_info(),
                        ctx.accounts.spl_token_program.to_account_info(),
                        ctx.accounts.spl_ata_program.to_account_info(),
                        ctx.accounts.sysvar_instructions.to_account_info(),
                        ctx.accounts.metadata_program.to_account_info(),
                    ];

                    let metadata: Metadata =
                        Metadata::from_account_info(&ctx.accounts.nft_metadata.to_account_info())?;

                    msg!("5");

                    if matches!(
                        metadata.token_standard,
                        Some(mpl_token_metadata::state::TokenStandard::ProgrammableNonFungible)
                    ) {
                        transfer_builder
                            .edition(ctx.accounts.nft_master_edition.key())
                            .owner_token_record(ctx.accounts.owner_token_record.key())
                            .destination_token_record(ctx.accounts.destination_token_record.key())
                            .authorization_rules_program(ctx.accounts.auth_rules_program.key())
                            .authorization_rules(ctx.accounts.auth_rules.key());

                        transfer_infos.push(ctx.accounts.nft_master_edition.to_account_info());
                        transfer_infos.push(ctx.accounts.owner_token_record.to_account_info());
                        transfer_infos
                            .push(ctx.accounts.destination_token_record.to_account_info());
                        transfer_infos.push(ctx.accounts.auth_rules_program.to_account_info());
                        transfer_infos.push(ctx.accounts.auth_rules.to_account_info());
                        msg!("6.1");
                    } else {
                        msg!("6.2");
                    }

                    let transfer_ix = transfer_builder
                        .build(TransferArgs::V1 {
                            amount: ctx.accounts.swap_data_account.items[item_id]
                                .amount
                                .unsigned_abs(),
                            authorization_data: None,
                        })
                        .map_err(|_| MYERROR::InstructionBuilderFailed)?
                        .instruction();
                    msg!("7");

                    invoke_signed(&transfer_ix, &transfer_infos, &[&[&seed[..], &[bump]]])?;

                    msg!("NFT item Claimed");
                    let _ = ctx.accounts.swap_data_account_ata.reload();

                    // if no more NFT held, closes the Swap's PDA ATA
                    if ctx.accounts.swap_data_account_ata.amount == 0 {
                        let ix2 = spl_token::instruction::close_account(
                            ctx.accounts.spl_token_program.key,
                            &ctx.accounts.swap_data_account_ata.key(),
                            &ctx.accounts.user.key(),
                            &ctx.accounts.swap_data_account.key(),
                            &[&ctx.accounts.swap_data_account.key()],
                        )?;
                        invoke_signed(
                            &ix2,
                            &[
                                ctx.accounts.spl_token_program.to_account_info(),
                                ctx.accounts.swap_data_account_ata.to_account_info(),
                                ctx.accounts.swap_data_account.to_account_info(),
                                ctx.accounts.user.to_account_info(),
                            ],
                            &[&[&seed[..], &[bump]]],
                        )?;
                        msg!("ATA closed");
                    }

                    //Change status to NFTClaimed
                    ctx.accounts.swap_data_account.items[item_id].status =
                        ItemStatus::NFTClaimed.to_u8();
                    transfered = true;
                    break;
                }
            }
        }

        if !transfered {
            return Err(error!(MYERROR::NoSend));
        }

        Ok(())
    }

    pub fn claim_c_nft<'info>(
        ctx: Context<'_, '_, '_, 'info, ClaimCNft<'info>>,
        seed: Vec<u8>,
        bump: u8,
        root: [u8; 32],
        data_hash: [u8; 32],
        creator_hash: [u8; 32],
        nonce: u64,
        index: u32,
    ) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToClaim.to_u8(),
            MYERROR::NotReady
        );

        let mut transfered: bool = false;
        // let mut authorized: bool = false;

        // if ctx
        //     .accounts
        //     .signer
        //     .key()
        //     .eq(&ctx.accounts.swap_data_account.initializer)
        // {
        //     authorized = true;
        // }

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if ctx.accounts.swap_data_account.items[item_id].is_compressed
                && ctx.accounts.swap_data_account.items[item_id].is_nft
            {
                if ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::NFTDeposited.to_u8()
                    && ctx.accounts.swap_data_account.items[item_id]
                        .merkle_tree
                        .eq(&ctx.accounts.merkle_tree.key())
                    && ctx.accounts.swap_data_account.items[item_id]
                        .destinary
                        .eq(&ctx.accounts.user.key())
                    && !transfered
                {
                    // Bypass function for initializer or the destinary of this NFT
                    // if ctx
                    //     .accounts
                    //     .signer
                    //     .key()
                    //     .eq(&ctx.accounts.swap_data_account.items[item_id].destinary)
                    // {
                    //     authorized = true;
                    // }
                    // Transfer the NFT to user

                    const TRANSFER_DISCRIMINATOR: &[u8; 8] = &[163, 52, 200, 231, 140, 3, 69, 186];

                    let mut accounts: Vec<solana_program::instruction::AccountMeta> = vec![
                        AccountMeta::new_readonly(ctx.accounts.tree_authority.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.swap_data_account.key(), true),
                        AccountMeta::new_readonly(ctx.accounts.swap_data_account.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.user.key(), false),
                        AccountMeta::new(ctx.accounts.merkle_tree.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.log_wrapper.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.compression_program.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                    ];

                    let mut data: Vec<u8> = vec![];
                    data.extend(TRANSFER_DISCRIMINATOR);
                    data.extend(root);
                    data.extend(data_hash);
                    data.extend(creator_hash);
                    data.extend(nonce.to_le_bytes());
                    data.extend(index.to_le_bytes());

                    let mut account_infos: Vec<AccountInfo> = vec![
                        ctx.accounts.tree_authority.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                        ctx.accounts.user.to_account_info(),
                        ctx.accounts.merkle_tree.to_account_info(),
                        ctx.accounts.log_wrapper.to_account_info(),
                        ctx.accounts.compression_program.to_account_info(),
                        ctx.accounts.system_program.to_account_info(),
                    ];

                    // add "accounts" (hashes) that make up the merkle proof
                    for acc in ctx.remaining_accounts.iter() {
                        accounts.push(AccountMeta::new_readonly(acc.key(), false));
                        account_infos.push(acc.to_account_info());
                    }

                    // msg!("manual cpi call");
                    solana_program::program::invoke_signed(
                        &solana_program::instruction::Instruction {
                            program_id: ctx.accounts.bubblegum_program.key(),
                            accounts,
                            data,
                        },
                        &account_infos[..],
                        &[&[&seed[..], &[bump]]],
                    )?;

                    //Change status to NFTClaimed
                    ctx.accounts.swap_data_account.items[item_id].status =
                        ItemStatus::NFTClaimed.to_u8();
                    transfered = true;
                    break;
                }
            }
        }

        if !transfered {
            return Err(error!(MYERROR::NoSend));
        }

        // if !authorized {
        //     return Err(error!(MYERROR::UserNotPartOfTrade));
        // }

        Ok(())
    }

    /// @notice Verify Swap's PDA items to proceed to closed state. /!\ initializer function
    /// @dev Function verify each item status to mutate the program status to 3 (closed) then close the Swap's PDA.  /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds, signer: Pubkey => initializer
    /// @accounts signer: Pubkey => initializer
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts associated_token_program: Pubkey = spl_associated_token_program_id
    /// @return Void
    pub fn validate_claimed(ctx: Context<ValidateAndClose>, _seed: Vec<u8>) -> Result<()> {
        require_eq!(
            ctx.accounts.swap_data_account.status,
            TradeStatus::WaitingToClaim.to_u8(),
            MYERROR::NotReady
        );

        // verify all items are claimed
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if !(ctx.accounts.swap_data_account.items[item_id].status
                == ItemStatus::SolClaimed.to_u8()
                || ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::NFTClaimed.to_u8()
                || ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::SolDeposited.to_u8())
            {
                msg!(
                    "item Id :{}, {}",
                    item_id,
                    ctx.accounts.swap_data_account.items[item_id].status
                );
                return Err(error!(MYERROR::NotReady));
            }
        }

        // Change Swap's status to Closed
        ctx.accounts.swap_data_account.status = TradeStatus::Closed.to_u8();

        Ok(())
    }

    /// @notice Cancels an item from escrow, retrieving funds if deposited previously. /!\ initializer function
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfer lamports to destinary if needed, change the item status to canceled and Swap's status to 90 (canceled) if not already. /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts user: Pubkey => User that will receive lamports
    /// @accounts signer: Pubkey => Initializer
    /// @return Void
    pub fn cancel_sol(ctx: Context<ClaimSol>, seed: Vec<u8>, bump: u8) -> Result<()> {
        if !(ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8()
            || ctx.accounts.swap_data_account.status == TradeStatus::Canceling.to_u8())
        {
            return Err(error!(MYERROR::NotReady));
        }

        let mut transfered: bool = false;
        let mut authorized: bool = false;

        if ctx
            .accounts
            .signer
            .key()
            .eq(&ctx.accounts.swap_data_account.initializer)
        {
            authorized = true;
        }

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if !ctx.accounts.swap_data_account.items[item_id].is_nft
                && ctx.accounts.swap_data_account.items[item_id]
                    .owner
                    .eq(ctx.accounts.user.key)
                && !transfered
            {
                // Bypass function for initializer or the owner of this solItem
                if ctx
                    .accounts
                    .signer
                    .key()
                    .eq(&ctx.accounts.swap_data_account.items[item_id].owner)
                {
                    authorized = true;
                }

                // Check if deposited
                if ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::SolDeposited.to_u8()
                {
                    if ctx.accounts.swap_data_account.items[item_id]
                        .amount
                        .is_positive()
                    {
                        let amount_to_send = ctx.accounts.swap_data_account.items[item_id]
                            .amount
                            .unsigned_abs();
                        let swap_data_lamports_initial =
                            ctx.accounts.swap_data_account.to_account_info().lamports();

                        if swap_data_lamports_initial >= amount_to_send {
                            if ctx.accounts.swap_data_account.items[item_id]
                                .mint
                                .eq(&system_program::id())
                            {
                                **ctx.accounts.user.lamports.borrow_mut() =
                                    ctx.accounts.user.lamports() + amount_to_send;
                                **ctx
                                    .accounts
                                    .swap_data_account
                                    .to_account_info()
                                    .lamports
                                    .borrow_mut() =
                                    ctx.accounts.swap_data_account.to_account_info().lamports()
                                        - amount_to_send;
                            } else {
                                // check user ata
                                require!(
                                    is_correct_ata(
                                        ctx.accounts.user_ata.key(),
                                        ctx.accounts.user.key(),
                                        ctx.accounts.swap_data_account.items[item_id].mint.key()
                                    ),
                                    MYERROR::IncorrectOwner
                                );

                                // check swapDataAccount ata
                                require!(
                                    is_correct_ata(
                                        ctx.accounts.swap_data_account_ata.key(),
                                        ctx.accounts.swap_data_account.key(),
                                        ctx.accounts.swap_data_account.items[item_id].mint.key()
                                    ),
                                    MYERROR::IncorrectOwner
                                );

                                let ix_user = spl_token::instruction::transfer(
                                    &ctx.accounts.spl_token_program.to_account_info().key(),
                                    &ctx.accounts.swap_data_account_ata.key(),
                                    &ctx.accounts.user_ata.key(),
                                    &ctx.accounts.swap_data_account.key(),
                                    &[&ctx.accounts.swap_data_account.key()],
                                    ctx.accounts.swap_data_account.items[item_id]
                                        .amount
                                        .unsigned_abs(),
                                )?;

                                invoke_signed(
                                    &ix_user,
                                    &[
                                        ctx.accounts.swap_data_account.to_account_info(),
                                        ctx.accounts.swap_data_account_ata.to_account_info(),
                                        ctx.accounts.user_ata.to_account_info(),
                                        ctx.accounts.user.to_account_info(),
                                        ctx.accounts.spl_token_program.to_account_info(),
                                    ],
                                    &[&[&seed[..], &[bump]]],
                                )?;
                            }

                            ctx.accounts.swap_data_account.items[item_id].status =
                                ItemStatus::SolcanceledRecovered.to_u8();
                            msg!("SolcanceledRecovered");
                        } else {
                            return Err(error!(MYERROR::NotEnoughFunds));
                        }
                    }
                } else {
                    return Err(error!(MYERROR::NotReady));
                    // msg!("${}",ItemStatus::SolDeposited.to_u8())
                }

                transfered = true;
            }
        }

        if !transfered {
            return Err(error!(MYERROR::NoSend));
        }

        if !authorized {
            return Err(error!(MYERROR::UserNotPartOfTrade));
        }

        // if not already, Swap status changed to 90 (canceled)
        if ctx.accounts.swap_data_account.status != TradeStatus::Canceling.to_u8() {
            ctx.accounts.swap_data_account.status = TradeStatus::Canceling.to_u8();
            msg!("General status changed to canceling");
        }
        Ok(())
    }

    /// @notice Claim NFT from escrow, retrieving it if previously deposited.
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfers the NFT from the escrow to the owner. If no more NFT is held by the PDA ATAs, close PDA ATA and send rent fund to user.
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts system_program = SYSTEM_PROGRAM_ID
    /// @accounts metadata_program => METADATA_PROGRAM_ID
    /// @accounts sysvar_instructions => SYSVAR_INSTRUCTION_ID
    /// @accounts spl_token_program => TOKEN_PROGRAM_ID
    /// @accounts spl_ata_program => SPL_TOKEN_PROGRAM_ID
    /// @accounts swap_data_account => Swap's PDA corresponding to seeds
    /// @accounts user => User that will potentially receive the NFT
    /// @accounts signer => Initializer or User
    /// @accounts swap_data_account_ata => Swap's PDA ATA related to mint
    /// @accounts user_ata => User ATA related to mint
    /// @accounts mint => mint Account of the NFT
    /// @accounts nft_metadata => metadata account
    /// @accounts nft_master_edition => if !pNFT: signer / if pNFT: masterEdition account
    /// @accounts owner_token_record => if !pNFT: signer / if pNFT: swap_data_account's token record account (seed:'metadata',METADATA_PROGRAM,mint,'token_record',swap_data_account_mint_ata; programAssociated:METADATA_PROGRAM)
    /// @accounts destination_token_record => if !pNFT: signer / if pNFT: initial owner's token record account (seed:'metadata',METADATA_PROGRAM,mint,'token_record',initial_owner_mint_ata; programAssociated:METADATA_PROGRAM)
    /// @accounts auth_rules_program => metaplex auth rules program (auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg)
    /// @accounts auth_rules => if !pNFT: signer / if pNFT: auth rules account linked to the mint (get from mint account data)
    /// @return Void
    pub fn cancel_nft(
        ctx: Context<ClaimNft>,
        seed: Vec<u8>,
        bump: u8,
        // _metadata_bump: u8,
    ) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8()
                || ctx.accounts.swap_data_account.status == TradeStatus::Canceling.to_u8(),
            MYERROR::NotReady
        );

        if ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8()
            && (!ctx
                .accounts
                .signer
                .key()
                .eq(&ctx.accounts.swap_data_account.initializer)
                || !ctx.accounts.user.key().eq(&ctx.accounts.signer.key()))
        {
            return Err(error!(MYERROR::NotAuthorized));
        }

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if !ctx.accounts.swap_data_account.items[item_id].is_compressed {
                if ctx.accounts.swap_data_account.items[item_id].is_nft
                    && ctx.accounts.swap_data_account.items[item_id].status
                        == ItemStatus::NFTDeposited.to_u8()
                    && ctx.accounts.swap_data_account.items[item_id]
                        .mint
                        .eq(&ctx.accounts.user_ata.mint)
                    && ctx.accounts.swap_data_account.items[item_id]
                        .mint
                        .eq(&ctx.accounts.swap_data_account_ata.mint)
                    && ctx.accounts.swap_data_account.items[item_id]
                        .owner
                        .eq(ctx.accounts.user.key)
                    && !transfered
                {
                    let mut transfer_builder = TransferBuilder::new();

                    transfer_builder
                        .token(ctx.accounts.swap_data_account_ata.key())
                        .token_owner(ctx.accounts.swap_data_account.key())
                        .destination(ctx.accounts.user_ata.key())
                        .destination_owner(ctx.accounts.user.key())
                        .mint(ctx.accounts.mint.key())
                        .metadata(ctx.accounts.nft_metadata.key())
                        .authority(ctx.accounts.swap_data_account.key())
                        .payer(ctx.accounts.signer.key())
                        .system_program(ctx.accounts.system_program.key())
                        .sysvar_instructions(ctx.accounts.sysvar_instructions.key())
                        .spl_token_program(ctx.accounts.spl_token_program.key())
                        .spl_ata_program(ctx.accounts.spl_ata_program.key());

                    msg!("4");

                    // creating vase transfer info
                    let mut transfer_infos = vec![
                        ctx.accounts.swap_data_account_ata.to_account_info(),
                        ctx.accounts.user_ata.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                        ctx.accounts.user.to_account_info(),
                        ctx.accounts.mint.to_account_info(),
                        ctx.accounts.nft_metadata.to_account_info(),
                        ctx.accounts.signer.to_account_info(),
                        ctx.accounts.system_program.to_account_info(),
                        ctx.accounts.sysvar_instructions.to_account_info(),
                        ctx.accounts.spl_token_program.to_account_info(),
                        ctx.accounts.spl_ata_program.to_account_info(),
                        ctx.accounts.sysvar_instructions.to_account_info(),
                        ctx.accounts.metadata_program.to_account_info(),
                    ];

                    let metadata: Metadata =
                        Metadata::from_account_info(&ctx.accounts.nft_metadata.to_account_info())?;

                    msg!("5");

                    if matches!(
                        metadata.token_standard,
                        Some(mpl_token_metadata::state::TokenStandard::ProgrammableNonFungible)
                    ) {
                        // build extra info for pNFT
                        transfer_builder
                            .edition(ctx.accounts.nft_master_edition.key())
                            .owner_token_record(ctx.accounts.owner_token_record.key())
                            .destination_token_record(ctx.accounts.destination_token_record.key())
                            .authorization_rules_program(ctx.accounts.auth_rules_program.key())
                            .authorization_rules(ctx.accounts.auth_rules.key());

                        transfer_infos.push(ctx.accounts.nft_master_edition.to_account_info());
                        transfer_infos.push(ctx.accounts.owner_token_record.to_account_info());
                        transfer_infos
                            .push(ctx.accounts.destination_token_record.to_account_info());
                        transfer_infos.push(ctx.accounts.auth_rules_program.to_account_info());
                        transfer_infos.push(ctx.accounts.auth_rules.to_account_info());
                        msg!("6.1");
                    } else {
                        // Other NFT
                        msg!("6.2");
                    }

                    let transfer_ix = transfer_builder
                        .build(TransferArgs::V1 {
                            amount: ctx.accounts.swap_data_account.items[item_id]
                                .amount
                                .unsigned_abs(),
                            authorization_data: None,
                        })
                        .map_err(|_| MYERROR::InstructionBuilderFailed)?
                        .instruction();
                    msg!("7");

                    invoke_signed(&transfer_ix, &transfer_infos, &[&[&seed[..], &[bump]]])?;

                    msg!("NFT item sent");

                    let _ = ctx.accounts.swap_data_account_ata.reload();

                    // If Swap's PDA ATA balance is null, closes the account and send the rent to user
                    if ctx.accounts.swap_data_account_ata.amount.eq(&0) {
                        let ix2 = spl_token::instruction::close_account(
                            ctx.accounts.spl_token_program.key,
                            &ctx.accounts.swap_data_account_ata.key(),
                            &ctx.accounts.user.key(),
                            &ctx.accounts.swap_data_account.key(),
                            &[&ctx.accounts.swap_data_account.key()],
                        )?;

                        invoke_signed(
                            &ix2,
                            &[
                                ctx.accounts.spl_token_program.to_account_info(),
                                ctx.accounts.swap_data_account_ata.to_account_info(),
                                ctx.accounts.swap_data_account.to_account_info(),
                                ctx.accounts.user.to_account_info(),
                            ],
                            &[&[&seed[..], &[bump]]],
                        )?;
                        msg!("ATA closed");
                    }

                    // Update item status to 91 (CancelRecovered)
                    ctx.accounts.swap_data_account.items[item_id].status =
                        ItemStatus::NFTcanceledRecovered.to_u8();
                    msg!("NFT item status changed to NFTcanceledRecovered");

                    transfered = true;
                }
            }
        }

        if !transfered {
            return Err(error!(MYERROR::NoSend));
        }

        // If not already, update Swap's status to 90 (canceled)
        if ctx.accounts.swap_data_account.status != TradeStatus::Canceling.to_u8() {
            ctx.accounts.swap_data_account.status = TradeStatus::Canceling.to_u8();
            msg!("General status changed to Canceling");
        }

        Ok(())
    }

    pub fn cancel_c_nft<'info>(
        ctx: Context<'_, '_, '_, 'info, ClaimCNft<'info>>,
        seed: Vec<u8>,
        bump: u8,
        root: [u8; 32],
        data_hash: [u8; 32],
        creator_hash: [u8; 32],
        nonce: u64,
        index: u32,
    ) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8()
                || ctx.accounts.swap_data_account.status == TradeStatus::Canceling.to_u8(),
            MYERROR::NotReady
        );

        if ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8()
            && (!ctx
                .accounts
                .signer
                .key()
                .eq(&ctx.accounts.swap_data_account.initializer)
                || !ctx.accounts.user.key().eq(&ctx.accounts.signer.key()))
        {
            return Err(error!(MYERROR::NotAuthorized));
        }

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if ctx.accounts.swap_data_account.items[item_id].is_compressed
                && ctx.accounts.swap_data_account.items[item_id].is_nft
            {
                if ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::NFTDeposited.to_u8()
                    && ctx.accounts.swap_data_account.items[item_id]
                        .merkle_tree
                        .eq(&ctx.accounts.merkle_tree.key())
                    && ctx.accounts.swap_data_account.items[item_id]
                        .destinary
                        .eq(ctx.accounts.user.key)
                    && !transfered
                {
                    // Transfer deposited NFT back to user

                    const TRANSFER_DISCRIMINATOR: &[u8; 8] = &[163, 52, 200, 231, 140, 3, 69, 186];

                    let mut accounts: Vec<solana_program::instruction::AccountMeta> = vec![
                        AccountMeta::new_readonly(ctx.accounts.tree_authority.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.swap_data_account.key(), true),
                        AccountMeta::new_readonly(ctx.accounts.swap_data_account.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.user.key(), false),
                        AccountMeta::new(ctx.accounts.merkle_tree.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.log_wrapper.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.compression_program.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                    ];

                    let mut data: Vec<u8> = vec![];
                    data.extend(TRANSFER_DISCRIMINATOR);
                    data.extend(root);
                    data.extend(data_hash);
                    data.extend(creator_hash);
                    data.extend(nonce.to_le_bytes());
                    data.extend(index.to_le_bytes());

                    let mut account_infos: Vec<AccountInfo> = vec![
                        ctx.accounts.tree_authority.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                        ctx.accounts.user.to_account_info(),
                        ctx.accounts.merkle_tree.to_account_info(),
                        ctx.accounts.log_wrapper.to_account_info(),
                        ctx.accounts.compression_program.to_account_info(),
                        ctx.accounts.system_program.to_account_info(),
                    ];

                    // add "accounts" (hashes) that make up the merkle proof
                    for acc in ctx.remaining_accounts.iter() {
                        accounts.push(AccountMeta::new_readonly(acc.key(), false));
                        account_infos.push(acc.to_account_info());
                    }

                    // msg!("manual cpi call");
                    solana_program::program::invoke_signed(
                        &solana_program::instruction::Instruction {
                            program_id: ctx.accounts.bubblegum_program.key(),
                            accounts,
                            data,
                        },
                        &account_infos[..],
                        &[&[&seed[..], &[bump]]],
                    )?;

                    // Update item status to 91 (CancelRecovered)
                    ctx.accounts.swap_data_account.items[item_id].status =
                        ItemStatus::NFTcanceledRecovered.to_u8();
                    msg!("NFT item status changed to NFTcanceledRecovered");

                    transfered = true;
                }
            }
        }

        if !transfered {
            return Err(error!(MYERROR::NoSend));
        }

        // If not already, update Swap's status to 90 (canceled)
        if ctx.accounts.swap_data_account.status != TradeStatus::Canceling.to_u8() {
            ctx.accounts.swap_data_account.status = TradeStatus::Canceling.to_u8();
            msg!("General status changed to Canceling");
        }

        Ok(())
    }

    /// @notice Verify Swap's PDA items to proceed to closed state. /!\ initializer function
    /// @dev Function verify each item status to mutate the program status to 3 (closed) then close the Swap's PDA.  /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts associated_token_program: Pubkey = spl_associated_token_program_id
    /// @return Void
    pub fn validate_cancel(ctx: Context<ValidateAndClose>, _seed: Vec<u8>) -> Result<()> {
        if !(ctx.accounts.swap_data_account.status == TradeStatus::Canceling.to_u8()
            || ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8())
        {
            return Err(error!(MYERROR::NotReady));
        }

        let nbr_items = ctx.accounts.swap_data_account.items.len();

        // Checks all items are canceled
        for item_id in 0..nbr_items {
            if !(ctx.accounts.swap_data_account.items[item_id].status
                == ItemStatus::SolcanceledRecovered.to_u8()
                || ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::NFTcanceledRecovered.to_u8()
                || ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::SolPending.to_u8()
                || ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::NFTPending.to_u8()
                || ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::SolToClaim.to_u8())
            {
                return Err(error!(MYERROR::NotReady));
            }
        }

        // Changing Swap status to 91 (canceledRecovered)
        ctx.accounts.swap_data_account.status = TradeStatus::Closed.to_u8();
        msg!("General status changed to Closed");

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, sent_data : SwapData)]
pub struct InitInitialize<'info> {
    #[account(
        init,
        payer = signer,
        seeds = [&seed[..]],
        bump,
        space = SwapData::size(sent_data)
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account()]
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct InitializeAdd<'info> {
    #[account(
        mut,
        seeds = [&seed[..]],
        bump,
        constraint = swap_data_account.initializer == signer.key() @ MYERROR::NotInit
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}
// #[derive(Accounts)]
// #[instruction(seed: Vec<u8>)]
// pub struct ValidateInitialize<'info> {
//     #[account(
//         mut,
//         seeds = [&seed[..]],
//         bump,
//         constraint = swap_data_account.initializer == signer.key() @ MYERROR::NotInit
//     )]
//     swap_data_account: Box<Account<'info, SwapData>>,
//     #[account(mut)]
//     signer: Signer<'info>,
// }

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct DepositPNft<'info> {
    #[account()]
    system_program: Program<'info, System>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&mpl_token_metadata::id()) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    #[account()]
    spl_token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
    spl_ata_program: AccountInfo<'info>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        constraint = item_from_deposit.mint == mint.key() @ MYERROR::MintIncorrect,
        constraint = item_from_deposit.owner == signer.key() @ MYERROR::IncorrectOwner
    )]
    item_from_deposit: Account<'info, TokenAccount>,
    #[account(constraint = item_from_deposit.mint == mint.key()  @ MYERROR::MintIncorrect)]
    mint: Account<'info, Mint>,
    /// CHECK: in constraints
    #[account(mut,
        seeds =[
            b"metadata".as_ref(),
            metadata_program.key().as_ref(),
            mint.key().as_ref()],
        bump,
        owner = metadata_program.key() @ MYERROR::IncorrectMetadata,
        seeds::program = metadata_program.key()
    )]
    nft_metadata: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(
        mut,
        constraint = item_to_deposit.owner == swap_data_account.to_account_info().key()  @ MYERROR::IncorrectOwner
    )]
    item_to_deposit: Account<'info, TokenAccount>,
    /// CHECK: in constraints
    #[account()]
    nft_master_edition: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(mut)]
    owner_token_record: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(mut)]
    destination_token_record: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    #[account()]
    auth_rules_program: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    #[account()]
    auth_rules: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct DepositCNft<'info> {
    #[account()]
    system_program: Program<'info, System>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&mpl_token_metadata::id()) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    #[account()]
    spl_token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
    spl_ata_program: AccountInfo<'info>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    // #[account(mut)]
    // signer: Signer<'info>,
    #[account(mut)]
    user: Signer<'info>,

    #[account(mut)]
    leaf_delegate: Signer<'info>,

    /// CHECK: in cpi
    #[account(
       mut,
       seeds = [merkle_tree.key().as_ref()],
       bump,
       seeds::program = bubblegum_program.key()
   )]
    tree_authority: UncheckedAccount<'info>,

    /// CHECK: in cpi
    #[account(mut)]
    merkle_tree: UncheckedAccount<'info>,

    // /// CHECK: in cpi
    // #[account(mut)]
    // new_leaf_owner: UncheckedAccount<'info>,
    log_wrapper: Program<'info, Noop>,
    compression_program: Program<'info, SplAccountCompression>,
    bubblegum_program: Program<'info, Bubblegum>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct DepositSol<'info> {
    #[account()]
    system_program: Program<'info, System>,
    #[account()]
    spl_token_program: Program<'info, Token>,
    // /// CHECK: in constraints
    // #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
    // spl_ata_program: AccountInfo<'info>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: inside the function Logic
    #[account(mut)]
    swap_data_account_ata: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
    /// CHECK: inside the function Logic
    #[account(mut)]
    signer_ata: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct Validate<'info> {
    #[account(
        mut,
        seeds = [&seed[..]], bump,
        constraint = swap_data_account.initializer == signer.key() @ MYERROR::NotInit
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct ValidateDeposited<'info> {
    #[account(
        mut,
        seeds = [&seed[..]], bump,
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct ValidateAndClose<'info> {
    #[account()]
    system_program: Program<'info, System>,
    #[account()]
    associated_token_program: Program<'info, AssociatedToken>,
    #[account(
        mut,
        seeds = [&seed[..]],
        bump,
        close = signer,
        constraint = swap_data_account.initializer == signer.key() @ MYERROR::NotInit
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct ClaimNft<'info> {
    #[account()]
    system_program: Program<'info, System>,
    /// CHECK: in constraint
    #[account(constraint = metadata_program.key().eq(&mpl_token_metadata::id()) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraint
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    #[account()]
    spl_token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
    spl_ata_program: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [&seed[..]],
        bump
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: user Account
    #[account(mut,
        constraint = user_ata.owner == user.key() @ MYERROR::IncorrectOwner
        )]
    user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        constraint = swap_data_account_ata.mint == user_ata.mint  @ MYERROR::MintIncorrect,
        constraint = swap_data_account_ata.owner == swap_data_account.key()  @ MYERROR::IncorrectOwner
    )]
    swap_data_account_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_ata.owner == user.key() @ MYERROR::IncorrectOwner
    )]
    user_ata: Account<'info, TokenAccount>,

    #[account(constraint = swap_data_account_ata.mint == mint.key()  @ MYERROR::MintIncorrect)]
    mint: Account<'info, Mint>,
    /// CHECK: in constraints
    #[account(mut,
        seeds =[
            b"metadata".as_ref(),
            metadata_program.key().as_ref(),
            mint.key().as_ref()],
        bump,
        owner = metadata_program.key() @ MYERROR::IncorrectMetadata,
        seeds::program = metadata_program.key()
    )]
    nft_metadata: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account()]
    nft_master_edition: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(mut)]
    owner_token_record: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(mut)]
    destination_token_record: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    #[account()]
    auth_rules_program: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    #[account()]
    auth_rules: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct ClaimCNft<'info> {
    // #[account()]
    system_program: Program<'info, System>,
    /// CHECK: in constraint
    #[account(constraint = metadata_program.key().eq(&mpl_token_metadata::id()) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraint
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    // #[account()]
    spl_token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
    spl_ata_program: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [&seed[..]],
        bump
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: user Account
    // #[account(mut,
    //     // constraint = user_ata.owner == user.key() @ MYERROR::IncorrectOwner
    //     )]
    user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
    /// CHECK: user Account
    // #[account(mut)]
    leaf_delegate: UncheckedAccount<'info>,

    /// CHECK: in cpi
    #[account(
    //    mut,
       seeds = [merkle_tree.key().as_ref()],
       bump,
       seeds::program = bubblegum_program.key()
   )]
    tree_authority: UncheckedAccount<'info>,

    /// CHECK: in cpi
    #[account(mut)]
    merkle_tree: UncheckedAccount<'info>,

    log_wrapper: Program<'info, Noop>,
    compression_program: Program<'info, SplAccountCompression>,
    bubblegum_program: Program<'info, Bubblegum>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct ClaimSol<'info> {
    #[account()]
    system_program: Program<'info, System>,
    #[account()]
    spl_token_program: Program<'info, Token>,
    // /// CHECK: in constraints
    // #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
    // spl_ata_program: AccountInfo<'info>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: inside the function Logic
    #[account(mut)]
    swap_data_account_ata: AccountInfo<'info>,
    /// CHECK: user Account
    #[account(mut)]
    user: AccountInfo<'info>,
    /// CHECK: inside the function Logic
    #[account(mut)]
    user_ata: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[account]
#[derive(Default)]
pub struct SwapData {
    pub initializer: Pubkey,       // Initializer is admin of the PDA
    pub status: u8,                // Gives the status of the current swap with TradeStatus
    pub nb_items: u32,             // Required to initialize the PDA account data size
    pub pre_seed: String,          // String to initialize PDA's seed
    pub items: Vec<NftSwapItem>,   // List of items engaged in a swap (can be SOL or NFT)
    pub accepted_payement: Pubkey, // List of tokens accepted for payment
}

impl SwapData {
    const LEN: usize = 8 + //Base
        1 + //u8
        4 * 2 + //u32
        4 + 32 + // max 32 char
        32 *2; //Pubkey

    pub fn size(swap_data_account: SwapData) -> usize {
        SwapData::LEN
            .checked_add(
                NftSwapItem::LEN
                    .checked_mul(swap_data_account.nb_items as usize)
                    .unwrap(),
            )
            .unwrap()
    }
}

#[derive(Accounts)]
pub struct TransferCompressedNft<'info> {
    #[account(mut)]
    pub leaf_owner: Signer<'info>,

    #[account(mut)]
    pub leaf_delegate: Signer<'info>,

    /// CHECK: in cpi
    #[account(
       mut,
       seeds = [merkle_tree.key().as_ref()],
       bump,
       seeds::program = bubblegum_program.key()
   )]
    pub tree_authority: UncheckedAccount<'info>,

    /// CHECK: in cpi
    #[account(mut)]
    pub merkle_tree: UncheckedAccount<'info>,

    /// CHECK: in cpi
    #[account(mut)]
    pub new_leaf_owner: UncheckedAccount<'info>,

    pub log_wrapper: Program<'info, Noop>,
    pub compression_program: Program<'info, SplAccountCompression>,
    pub bubblegum_program: Program<'info, Bubblegum>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct NftSwapItem {
    is_nft: bool,        // Argument to sort the functions in the program's functions
    is_compressed: bool, // if NFT is compressed
    mint: Pubkey, // Mint of the NFT. if item not NFT expected PublicKey should be system_program
    merkle_tree: Pubkey, // Merkle Tree of the NFT. if item not CNFT = mint
    amount: i64,  // amount of tokens or lamports to transfer
    owner: Pubkey, // owner of the NFT or SOL item
    destinary: Pubkey, // destinary of the item
    status: u8,   // Status of the Item with ItemStatus
}

impl NftSwapItem {
    const LEN: usize = 32 * 4 + //pubkey
        2 + //bool / u8
        8; //i64
}

pub enum TradeStatus {
    Initializing,
    WaitingToDeposit,
    WaitingToClaim,
    Closed,
    Canceling,
    Canceled,
}

impl TradeStatus {
    pub fn from_u8(status: u8) -> TradeStatus {
        match status {
            0 => TradeStatus::Initializing,
            1 => TradeStatus::WaitingToDeposit,
            2 => TradeStatus::WaitingToClaim,
            3 => TradeStatus::Closed,

            100 => TradeStatus::Canceling,
            101 => TradeStatus::Canceled,

            _ => panic!("Invalid Proposal Status"),
        }
    }

    pub fn to_u8(&self) -> u8 {
        match self {
            TradeStatus::Initializing => 0,
            TradeStatus::WaitingToDeposit => 1,
            TradeStatus::WaitingToClaim => 2,
            TradeStatus::Closed => 3,

            TradeStatus::Canceling => 100,
            TradeStatus::Canceled => 101,
        }
    }
}

pub enum ItemStatus {
    NFTPending,
    NFTDeposited,
    NFTClaimed,
    NFTcanceled,
    NFTcanceledRecovered,
    SolPending,
    SolDeposited,
    SolToClaim,
    SolClaimed,
    Solcanceled,
    SolcanceledRecovered,
}

impl ItemStatus {
    pub fn from_u8(status: u8) -> ItemStatus {
        match status {
            10 => ItemStatus::NFTPending,
            11 => ItemStatus::SolPending,

            20 => ItemStatus::NFTDeposited,
            21 => ItemStatus::SolDeposited,
            22 => ItemStatus::SolToClaim,

            30 => ItemStatus::NFTClaimed,
            31 => ItemStatus::SolClaimed,

            100 => ItemStatus::NFTcanceled,
            101 => ItemStatus::Solcanceled,

            110 => ItemStatus::NFTcanceledRecovered,
            111 => ItemStatus::SolcanceledRecovered,

            _ => panic!("Invalid Proposal Status"),
        }
    }

    pub fn to_u8(&self) -> u8 {
        match self {
            ItemStatus::NFTPending => 10,
            ItemStatus::SolPending => 11,

            ItemStatus::NFTDeposited => 20,
            ItemStatus::SolDeposited => 21,
            ItemStatus::SolToClaim => 22,

            ItemStatus::NFTClaimed => 30,
            ItemStatus::SolClaimed => 31,

            ItemStatus::NFTcanceled => 100,
            ItemStatus::Solcanceled => 101,

            ItemStatus::NFTcanceledRecovered => 110,
            ItemStatus::SolcanceledRecovered => 111,
        }
    }
}

fn is_correct_ata(owner_ata: Pubkey, owner: Pubkey, mint: Pubkey) -> bool {
    let found_ata = spl_associated_token_account::get_associated_token_address(&owner, &mint);
    // let (found_ata, _) = Pubkey::find_program_address(
    //     &[owner.as_ref(), spl_token::ID.as_ref(), mint.as_ref()],
    //     &spl_associated_token_account::ID,
    // );
    msg!("mint: {:?}", mint);
    msg!("owner: {:?}", owner);
    msg!("found_ata: {:?}", found_ata);
    msg!("owner_ata: {:?}", owner_ata);

    found_ata.eq(&owner_ata)
}

#[error_code]
pub enum MYERROR {
    #[msg("User not part of the trade")]
    UserNotPartOfTrade,
    #[msg("Incorrect Mint")]
    MintIncorrect,
    #[msg("Amount given isn't correct")]
    AmountIncorrect,
    #[msg("User shouldn't be sending funds")]
    ShouldntSend,
    #[msg("Nothing was found in the program to be sent to the swap or you")]
    NoSend,
    #[msg("Sum of trade isn't null")]
    SumNotNull,
    #[msg("Not ready for claim")]
    NotReady,
    #[msg("Given data isn't fitting")]
    UnexpectedData,
    #[msg("wrong system program Id passed")]
    NotSystemProgram,
    #[msg("wrong token program Id passed")]
    NotTokenProgram,
    #[msg("wrong Pda program Id passed")]
    NotPda,
    #[msg("wrong signer, only initializer can perform this action")]
    NotInit,
    #[msg("wrong bump")]
    NotBump,
    #[msg("The status given is not correct")]
    UnexpectedState,
    #[msg("owner checks unsuccessfuls")]
    InvalidAccountData,
    #[msg("Incorrect init data length")]
    IncorrectLength,
    #[msg("Not enough funds")]
    NotEnoughFunds,
    #[msg("Owner Given is incorrect")]
    IncorrectOwner,
    #[msg("Missing some account passed")]
    RemainingAccountNotFound,
    #[msg("Failed to build the instruction")]
    InstructionBuilderFailed,
    #[msg("This is not a programmableNft")]
    NotProgrammableNft,
    #[msg("Incorrect Token ATA Program")]
    IncorrectSplAta,
    #[msg("Incorrect Sysvar Instruction Program")]
    IncorrectSysvar,
    #[msg("Incorrect Metadata Program")]
    IncorrectMetadata,
    #[msg("Incorrect token reccord account")]
    IncorrectTokenRecord,
    #[msg("Not authorized to perform this action")]
    NotAuthorized,
    #[msg("PreSeed has too many character (max: 32)")]
    PreSeedTooLong,
    #[msg("The list of token accepted for payment is empty")]
    NoAcceptedPaymentGiven,
    #[msg("The item you're trying to add already exists in the Swap")]
    AlreadyExist,
}
