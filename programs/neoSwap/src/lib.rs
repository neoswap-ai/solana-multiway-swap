use std::str::FromStr;
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
    // mpl_token_metadata::instruction::builders::CreateBuilder,
    // mpl_token_metadata::instruction::CreateArgs,
    // mpl_token_metadata::instruction::MetadataDelegateRole::ProgrammableConfig,
    // mpl_token_metadata::instruction::Transfer,
    // mpl_token_metadata::state::AssetData,
    // mpl_token_metadata::utils::puffed_out_string,
    mpl_token_metadata::{
        instruction::{builders::TransferBuilder, InstructionBuilder, TransferArgs},
        // pda::find_token_record_account,
        state::{
            Metadata,
            TokenMetadataAccount,
            // TokenStandard
        },
    },
    // open_creator_protocol::*,
};

use anchor_lang::solana_program;
use anchor_spl::token::Mint;
// pub mod utils;
// use utils::digital_asset::*;

declare_id!("Et2RutKNHzB6XmsDXUGnDHJAGAsJ73gdHVkoKyV79BFY");

///@title List of function to manage NeoSwap's multi-items swaps
#[program]
pub mod neo_swap {
    // use mpl_token_metadata::{
    //     // instruction::{builders::Transfer, MetadataInstruction},
    //     // state::PrintSupply,
    // };

    use super::*;

    /// @notice Initialize Swap's PDA. /!\ Signer will be Initializer
    /// @dev First function to trigger to initialize Swap's PDA with according space, define admin and add Neoswap Fees. /!\ Signer will be Initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @param sent_data: SwapData: {initializer: Pubkey => admin of the trade, status: u8  => "status of the trade", items: NftSwapItem = first item [length=1]}, nb_of_items: u32 => number of items engaged in the trade}
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts associated_token_program: Pubkey = spl_associated_token_program_id
    /// @return Void
    pub fn init_initialize(
        ctx: Context<InitInitialize>,
        _seed: Vec<u8>,
        _bump: u8,
        sent_data: SwapData,
        nb_of_items: u32,
    ) -> Result<()> {
        require!(
            sent_data.status == TradeStatus::Initializing.to_u8(),
            MYERROR::UnexpectedState
        );
        require!(sent_data.items.len() == 1, MYERROR::IncorrectLength);

        let mut item_to_add: Vec<NftSwapItem> = sent_data.items;

        // checking status and values
        if item_to_add[0].is_nft {
            item_to_add[0].status = ItemStatus::NFTPending.to_u8();
            msg!("item added with status NFTPending");
        } else {
            item_to_add[0].destinary =
                Pubkey::from_str("11111111111111111111111111111111").unwrap();
            item_to_add[0].mint = Pubkey::from_str("11111111111111111111111111111111").unwrap();

            if item_to_add[0].amount.is_positive() {
                item_to_add[0].status = ItemStatus::SolPending.to_u8();
                msg!("item added with status SolPending");
            } else if item_to_add[0].amount == 0 {
                return Err(error!(MYERROR::UnexpectedData).into());
            } else {
                item_to_add[0].status = ItemStatus::SolToClaim.to_u8();
                msg!("item added with status SolToClaim");
            }
        }

        // Write according Data into Swap's PDA
        ctx.accounts.swap_data_account.initializer = ctx.accounts.signer.key();
        ctx.accounts.swap_data_account.items = item_to_add;
        ctx.accounts.swap_data_account.status = TradeStatus::Initializing.to_u8();
        ctx.accounts.swap_data_account.nb_items = nb_of_items;
        Ok(())
    }

    /// @notice add item to Swap's PDA. /!\ initializer function
    /// @dev Function to add an item to the PDA. /!\ status of item is rewritten to according value in program.  /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @param trade_to_add: NftSwapItem: {is_nft: bool => "return true if the item is en NFT (true)/(false)", mint: Pubkey => "(Mint address)/(Owner address)", amount: i64 => (nbr of NFT engaged in this trade)/(number of lamports the user will exchange with the smart contract if_positive(user will give lamports), if_negative(user will receive lamports)), owner: Pubkey => owner of the NFT or lamports , destinary: Pubkey => (user who should receive the NFT)/(Owner address), status : u8 => /!\ will be rewritten by program, }
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @return Void
    pub fn initialize_add(
        ctx: Context<InitializeAdd>,
        _seed: Vec<u8>,
        _bump: u8,
        trade_to_add: NftSwapItem,
    ) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;

        require!(
            swap_data_account.status == TradeStatus::Initializing.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut item_to_add: NftSwapItem = trade_to_add;

        // Write according status to item
        if item_to_add.is_nft {
            item_to_add.status = ItemStatus::NFTPending.to_u8();
            if item_to_add.amount.is_negative() || item_to_add.amount == 0 {
                return Err(error!(MYERROR::UnexpectedData).into());
            }
            msg!("NFT item added with status NFTPending");
        } else {
            //Check if already one user has Sol item
            for item_id in 0..swap_data_account.items.len() {
                if !swap_data_account.items[item_id].is_nft
                    && swap_data_account.items[item_id]
                        .owner
                        .eq(&item_to_add.owner)
                {
                    return Err(error!(MYERROR::UnexpectedData).into());
                }
            }
            if item_to_add.destinary
                != Pubkey::from_str("11111111111111111111111111111111").unwrap()
                || item_to_add.mint != Pubkey::from_str("11111111111111111111111111111111").unwrap()
            {
                return Err(error!(MYERROR::UnexpectedData).into());
            }

            if item_to_add.amount.is_positive() {
                item_to_add.status = ItemStatus::SolPending.to_u8();
                msg!("SOL item added with status SolPending");
            } else if item_to_add.amount == 0 {
                return Err(error!(MYERROR::UnexpectedData).into());
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
    /// @dev Function verify each item status and sum of lamports to mutate the smart contract status to (waiting for deposit).
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @return Void
    pub fn validate_initialize(
        ctx: Context<VerifyInitialize>,
        _seed: Vec<u8>,
        _bump: u8,
    ) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;

        require!(
            swap_data_account.status == TradeStatus::Initializing.to_u8(),
            MYERROR::UnexpectedState
        );

        // Check that sum of lamports to trade is null
        let mut sum = 0 as i64;
        let mut count = 0 as u32;
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
    /// @accounts {system_program: Pubkey = system_program_id, token_program: Pubkey = token_program_id, swap_data_account: Pubkey => Swap's PDA corresponding to seeds, signer: Pubkey => User that deposits,  item_from_deposit: Pubkey => User ATA related to mint, item_to_deposit: Pubkey => Swap's PDA ATA related to mint}
    /// @return Void
    pub fn deposit_nft(ctx: Context<DepositPNft>, _seed: Vec<u8>, _bump: u8, _metadata_bump:u8, _master_bump:u8) -> Result<()> {
        let swap_data_account = &ctx.accounts.swap_data_account;

        // let token_program = &ctx.accounts.token_program;
        // let signer = &ctx.accounts.signer;
        // let item_to_deposit = &ctx.accounts.item_to_deposit;
        // let item_from_deposit = &ctx.accounts.item_from_deposit;

        require!(
            swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut transfered: bool = false;
        msg!("1");
        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            msg!("2");

            if ctx.accounts.swap_data_account.items[item_id].is_nft
                && ctx.accounts.swap_data_account.items[item_id]
                    .mint
                    .eq(&ctx.accounts.item_to_deposit.mint)
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
                    .destination_owner(ctx.accounts.owner_to.key())
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
                    ctx.accounts.owner_to.to_account_info(),
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
                    let nft_master_edition = match &ctx.accounts.nft_master_edition {
                        Some(m_e) => m_e,
                        None => return Err(MYERROR::RemainingAccountNotFound.into()),
                    };
                    let owner_token_record = match &ctx.accounts.owner_token_record {
                        Some(m_e) => m_e,
                        None => return Err(MYERROR::RemainingAccountNotFound.into()),
                    };
                    let destination_token_record = match &ctx.accounts.destination_token_record {
                        Some(m_e) => m_e,
                        None => return Err(MYERROR::RemainingAccountNotFound.into()),
                    };
                    let auth_rules_program = match &ctx.accounts.auth_rules_program {
                        Some(m_e) => m_e,
                        None => return Err(MYERROR::RemainingAccountNotFound.into()),
                    };
                    let auth_rules = match &ctx.accounts.auth_rules {
                        Some(m_e) => m_e,
                        None => return Err(MYERROR::RemainingAccountNotFound.into()),
                    };
                    // transfer_infos.push([

                    transfer_builder
                        .edition(nft_master_edition.key())
                        .owner_token_record(owner_token_record.key())
                        .destination_token_record(destination_token_record.key())
                        .authorization_rules_program(auth_rules_program.key())
                        .authorization_rules(auth_rules.key());

                    transfer_infos.push(nft_master_edition.to_account_info());
                    transfer_infos.push(owner_token_record.to_account_info());
                    transfer_infos.push(destination_token_record.to_account_info());
                    transfer_infos.push(auth_rules_program.to_account_info());
                    transfer_infos.push(auth_rules.to_account_info());
                    // ][..]);
                    msg!("6.1");
                } else {
                    msg!("6.2");
                    // return Err(MYERROR::NotProgrammableNft.into());
                }

                let transfer_ix = transfer_builder
                    .build(TransferArgs::V1 {
                        amount: 1,
                        authorization_data: None,
                    })
                    .map_err(|_| MYERROR::InstructionBuilderFailed)?
                    .instruction();
                msg!("7");

                invoke(&transfer_ix, &transfer_infos)?;

                ctx.accounts.swap_data_account.items[item_id].status =
                    ItemStatus::NFTDeposited.to_u8();
                transfered = true;
                msg!("NFTDeposited");
                break;
            }
        }

        if transfered == false {
            return Err(error!(MYERROR::NoSend).into());
        }
        Ok(())
    }

    pub fn transfer_pnft(ctx: Context<DepositPNft2>) -> Result<()> {
        msg!("{:?}", mpl_token_metadata::ID.key());
        let mut transfer_builder = TransferBuilder::new();

        let metadata: Metadata =
            Metadata::from_account_info(&ctx.accounts.nft_metadata.to_account_info())?;

        msg!("1");
        if matches!(
            metadata.token_standard,
            Some(mpl_token_metadata::state::TokenStandard::ProgrammableNonFungible)
        ) {
            msg!("2");
        } else {
            return Err(MYERROR::NotProgrammableNft.into());
        }

        transfer_builder
            .token(ctx.accounts.item_from_deposit.key())
            .token_owner(ctx.accounts.signer.key())
            .destination(ctx.accounts.item_to_deposit.key())
            .destination_owner(ctx.accounts.owner_to.key())
            .mint(ctx.accounts.mint.key())
            .metadata(ctx.accounts.nft_metadata.key())
            .edition(ctx.accounts.nft_master_edition.key())
            .owner_token_record(ctx.accounts.owner_token_record.key())
            .destination_token_record(ctx.accounts.destination_token_record.key())
            .authority(ctx.accounts.signer.key())
            .payer(ctx.accounts.signer.key())
            .system_program(ctx.accounts.system_program.key())
            .sysvar_instructions(ctx.accounts.sysvar_instructions.key())
            .spl_token_program(ctx.accounts.spl_token_program.key())
            .spl_ata_program(ctx.accounts.spl_ata_program.key())
            .authorization_rules_program(ctx.accounts.auth_rules_program.key())
            .authorization_rules(ctx.accounts.auth_rules.key());

        msg!("3");

        let transfer_infos = vec![
            ctx.accounts.item_from_deposit.to_account_info(),
            ctx.accounts.item_to_deposit.to_account_info(),
            ctx.accounts.owner_to.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.nft_metadata.to_account_info(),
            ctx.accounts.signer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.sysvar_instructions.to_account_info(),
            ctx.accounts.spl_token_program.to_account_info(),
            ctx.accounts.spl_ata_program.to_account_info(),
            ctx.accounts.sysvar_instructions.to_account_info(),
            ctx.accounts.metadata_program.to_account_info(),
            ctx.accounts.nft_master_edition.to_account_info(),
            ctx.accounts.owner_token_record.to_account_info(),
            ctx.accounts.destination_token_record.to_account_info(),
            ctx.accounts.auth_rules_program.to_account_info(),
            ctx.accounts.auth_rules.to_account_info(),
        ];

        let transfer_ix = transfer_builder
            .build(TransferArgs::V1 {
                amount: 1,
                authorization_data: None,
            })
            .map_err(|_| MYERROR::InstructionBuilderFailed)?
            .instruction();
        msg!("4");

        invoke(&transfer_ix, &transfer_infos)?;
        msg!("5");

        Ok(())
    }

    // pub fn deposit_nft_ocp(ctx: Context<DepositNftOCP>, _seed: Vec<u8>, _bump: u8) -> Result<()> {
    //     let swap_data_account = &ctx.accounts.swap_data_account;

    //     let token_program = &ctx.accounts.token_program;
    //     let signer = &ctx.accounts.signer;
    //     let item_to_deposit = &ctx.accounts.item_to_deposit;
    //     let item_from_deposit = &ctx.accounts.item_from_deposit;

    //     require!(
    //         swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
    //         MYERROR::UnexpectedState
    //     );

    //     let mut transfered: bool = false;

    //     // find the item linked with shared Accounts
    //     for item_id in 0..ctx.accounts.swap_data_account.items.len() {
    //         if ctx.accounts.swap_data_account.items[item_id].is_nft
    //             && ctx.accounts.swap_data_account.items[item_id]
    //                 .mint
    //                 .eq(&item_to_deposit.mint)
    //             && ctx.accounts.swap_data_account.items[item_id].status
    //                 == ItemStatus::NFTPending.to_u8()
    //         {
    //             // Transfer according item to Swap's PDA ATA

    //             // open_creator_protocol::cpi::transfer(CpiContext::new(
    //             //     ctx.accounts.ocp_program.to_account_info(),
    //             //     open_creator_protocol::cpi::accounts::TransferCtx {
    //             //         policy: ctx.accounts.ocp_policy.to_account_info(),
    //             //         mint: ctx.accounts.token_mint.to_account_info(),
    //             //         metadata: ctx.accounts.metadata.to_account_info(),
    //             //         mint_state: ctx.accounts.ocp_mint_state.to_account_info(),
    //             //         from: ctx.accounts.program_as_signer.to_account_info(),
    //             //         from_account: ctx.accounts.seller_token_ata.to_account_info(),
    //             //         cmt_program: ctx.accounts.cmt_program.to_account_info(),
    //             //         instructions: ctx.accounts.instructions.to_account_info(),
    //             //         freeze_authority: ctx.accounts.ocp_freeze_authority.to_account_info(),
    //             //         token_program: ctx.accounts.token_program.to_account_info(),
    //             //         to: ctx.accounts.buyer.to_account_info(),
    //             //         to_account: ctx.accounts.buyer_token_ata.to_account_info(),
    //             //     },
    //             // ))?;

    //             // let ix = spl_token::instruction::transfer(
    //             //     token_program.key,
    //             //     &item_from_deposit.key(),
    //             //     &item_to_deposit.key(),
    //             //     &signer.key(),
    //             //     &[&signer.key()],
    //             //     ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
    //             // )?;

    //             // invoke(
    //             //     &ix,
    //             //     &[
    //             //         item_from_deposit.to_account_info(),
    //             //         item_to_deposit.to_account_info(),
    //             //         signer.to_account_info(),
    //             //         token_program.to_account_info(),
    //             //     ]
    //             // )?;

    //             //update item status to NFTDeposited
    //             ctx.accounts.swap_data_account.items[item_id].status =
    //                 ItemStatus::NFTDeposited.to_u8();
    //             transfered = true;
    //             msg!("NFTDeposited");
    //             break;
    //         }
    //     }

    //     if transfered == false {
    //         return Err(error!(MYERROR::NoSend).into());
    //     }
    //     Ok(())
    // }

    /// @notice Deposit lamports to escrow.
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and deposits lamports to escrow. /!\ user that should only receive lamports don't have to deposit.
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => User that deposits
    /// @return Void
    pub fn deposit_sol(ctx: Context<DepositSol>, _seed: Vec<u8>, _bump: u8) -> Result<()> {
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
                && transfered == false
            {
                if ctx.accounts.swap_data_account.items[item_id].amount > 0 {
                    // Transfer lamports to Escrow
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

                    //update status to 2 (Claimed)
                    ctx.accounts.swap_data_account.items[item_id].status =
                        ItemStatus::SolDeposited.to_u8();
                    transfered = true;
                    msg!("SolDeposited");
                    break;
                } else {
                    return Err(error!(MYERROR::NoSend).into());
                }
            }
        }

        if transfered == false {
            return Err(error!(MYERROR::NoSend).into());
        }
        Ok(())
    }

    /// @notice Verify Swap's PDA items to proceed to waiting for claiming state. /!\ initializer function
    /// @dev Function verify each item status to mutate the smart contract status to 1 (waiting for claim).  /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @return Void
    pub fn validate_deposit(ctx: Context<Validate>, _seed: Vec<u8>, _bump: u8) -> Result<()> {
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
                return Err(error!(MYERROR::NotReady).into());
            }
        }

        // Udpate status to WaitingToClaim
        ctx.accounts.swap_data_account.status = TradeStatus::WaitingToClaim.to_u8();

        Ok(())
    }

    /// @notice Claims lamports from escrow. /!\ initializer function
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfer lamports to destinary. /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts user: Pubkey => User that will receive lamports
    /// @accounts signer: Pubkey => Initializer
    /// @return Void
    pub fn claim_sol(ctx: Context<ClaimSol>, _seed: Vec<u8>, _bump: u8) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToClaim.to_u8(),
            MYERROR::NotReady
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if !ctx.accounts.swap_data_account.items[item_id].is_nft
                && ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::SolToClaim.to_u8()
                && ctx.accounts.swap_data_account.items[item_id]
                    .owner
                    .eq(ctx.accounts.user.key)
                && transfered == false
            {
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

                        //update item status to SolClaimed
                        ctx.accounts.swap_data_account.items[item_id].status =
                            ItemStatus::SolClaimed.to_u8();
                        transfered = true;
                        msg!("SOL item Claimed");
                        break;
                    } else {
                        return Err(error!(MYERROR::NotEnoughFunds).into());
                    }
                } else {
                    return Err(error!(MYERROR::NoSend).into());
                }
            }
        }
        if transfered == false {
            return Err(error!(MYERROR::NoSend).into());
        }
        Ok(())
    }

    /// @notice Claim NFT from escrow. /!\ initializer function
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfers the NFT from the escrow to the shared user. If no more NFT is held by the PDA, close PDA ATA and send rent fund to user. /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts token_program: Pubkey = token_program_id
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts user: Pubkey => User that will receive the NFT, signer: Pubkey => Initializer
    /// @accounts signer: Pubkey => Initializer
    /// @accounts item_from_deposit: Pubkey => Swap's PDA ATA related to mint
    /// @accounts item_to_deposit: Pubkey => User ATA related to mint
    /// @return Void
    pub fn claim_nft(ctx: Context<ClaimNft>, seed: Vec<u8>, bump: u8) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToClaim.to_u8(),
            MYERROR::NotReady
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if ctx.accounts.swap_data_account.items[item_id].is_nft
                && ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::NFTDeposited.to_u8()
                && ctx.accounts.swap_data_account.items[item_id]
                    .mint
                    .eq(&ctx.accounts.item_from_deposit.mint)
                && ctx.accounts.swap_data_account.items[item_id]
                    .mint
                    .eq(&ctx.accounts.item_to_deposit.mint)
                && ctx.accounts.swap_data_account.items[item_id]
                    .destinary
                    .eq(ctx.accounts.user.key)
                && transfered == false
            {
                // Transfer the NFT to user
                let ix = spl_token::instruction::transfer(
                    &ctx.accounts.token_program.key,
                    &ctx.accounts.item_from_deposit.key(),
                    &ctx.accounts.item_to_deposit.key(),
                    &ctx.accounts.swap_data_account.key(),
                    &[&ctx.accounts.swap_data_account.key()],
                    1,
                )?;
                invoke_signed(
                    &ix,
                    &[
                        ctx.accounts.token_program.to_account_info(),
                        ctx.accounts.item_from_deposit.to_account_info(),
                        ctx.accounts.item_to_deposit.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                    ],
                    &[&[&seed[..], &[bump]]],
                )?;
                msg!("NFT item Claimed");
                let _ = ctx.accounts.item_from_deposit.reload();
                // if no more NFT held, closes the Swap's PDA ATA
                if ctx.accounts.item_from_deposit.amount == 0 {
                    let ix2 = spl_token::instruction::close_account(
                        &ctx.accounts.token_program.key,
                        &ctx.accounts.item_from_deposit.key(),
                        &ctx.accounts.user.key(),
                        &ctx.accounts.swap_data_account.key(),
                        &[&ctx.accounts.swap_data_account.key()],
                    )?;
                    invoke_signed(
                        &ix2,
                        &[
                            ctx.accounts.token_program.to_account_info(),
                            ctx.accounts.item_from_deposit.to_account_info(),
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

        if transfered == false {
            return Err(error!(MYERROR::NoSend).into());
        }
        Ok(())
    }

    /// @notice Verify Swap's PDA items to proceed to closed state. /!\ initializer function
    /// @dev Function verify each item status to mutate the smart contract status to 3 (closed) then close the Swap's PDA.  /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds, signer: Pubkey => initializer
    /// @accounts signer: Pubkey => initializer
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts associated_token_program: Pubkey = spl_associated_token_program_id
    /// @return Void
    pub fn validate_claimed(
        ctx: Context<ValidateAndClose>,
        _seed: Vec<u8>,
        _bump: u8,
    ) -> Result<()> {
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
                return Err(error!(MYERROR::NotReady).into());
            }
        }

        // Change Swap's status to Closed
        ctx.accounts.swap_data_account.status = TradeStatus::Closed.to_u8();

        Ok(())
    }

    /// @notice Cancels an item from escrow, retrieving funds if deposited previously. /!\ initializer function
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfer lamports to destinary if needed, change the item status to cancelled and Swap's status to 90 (cancelled) if not already. /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts user: Pubkey => User that will receive lamports
    /// @accounts signer: Pubkey => Initializer
    /// @return Void
    pub fn cancel_sol(ctx: Context<ClaimSol>, _seed: Vec<u8>, _bump: u8) -> Result<()> {
        if !(ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8()
            || ctx.accounts.swap_data_account.status == TradeStatus::Cancelling.to_u8())
        {
            return Err(error!(MYERROR::NotReady).into());
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
            if (ctx
                .accounts
                .signer
                .key()
                .eq(&ctx.accounts.swap_data_account.items[item_id].owner)
                && ctx.accounts.swap_data_account.items[item_id].amount > 0)
                || authorized == true
            {
                authorized = true;
            }

            if !ctx.accounts.swap_data_account.items[item_id].is_nft
                && ctx.accounts.swap_data_account.items[item_id]
                    .owner
                    .eq(ctx.accounts.user.key)
                && transfered == false
            {
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

                            ctx.accounts.swap_data_account.items[item_id].status =
                                ItemStatus::SolCancelledRecovered.to_u8();
                            msg!("SolCancelledRecovered");
                        } else {
                            return Err(error!(MYERROR::NotEnoughFunds).into());
                        }
                    }
                } else {
                    return Err(error!(MYERROR::NotReady).into());
                    // msg!("${}",ItemStatus::SolDeposited.to_u8())
                }

                transfered = true;
            }
        }

        if transfered == false {
            return Err(error!(MYERROR::NoSend).into());
        }

        if authorized == false {
            return Err(error!(MYERROR::UserNotPartOfTrade).into());
        }

        // if not already, Swap status changed to 90 (Cancelled)
        if ctx.accounts.swap_data_account.status != TradeStatus::Cancelling.to_u8() {
            ctx.accounts.swap_data_account.status = TradeStatus::Cancelling.to_u8();
            msg!("General status changed to Cancelling");
        }
        Ok(())
    }

    /// @notice Cancel NFT from escrow, retrieving it if previously deposited. /!\ initializer function
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfers the NFT from the shared user to the escrow. If no more NFT is held by the PDA, close PDA ATA and send rent fund to user. /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts system_program: Pubkey = system_program_id, token_program: Pubkey = token_program_id
    /// @accounts token_program: Pubkey = token_program_id
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts user: Pubkey => User that will potentially receive the NFT
    /// @accounts signer: Pubkey => Initializer
    /// @accounts item_from_deposit: Pubkey => Swap's PDA ATA related to mint
    /// @accounts item_to_deposit: Pubkey => User ATA related to mint
    /// @return Void
    pub fn cancel_nft(ctx: Context<ClaimNft>, seed: Vec<u8>, bump: u8) -> Result<()> {
        let user_ata = &ctx.accounts.item_to_deposit;
        let swap_data_ata = &mut ctx.accounts.item_from_deposit;

        let mut authorized = false;

        if ctx
            .accounts
            .signer
            .key()
            .eq(&ctx.accounts.swap_data_account.initializer)
        {
            authorized = true;
        }

        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8()
                || ctx.accounts.swap_data_account.status == TradeStatus::Cancelling.to_u8(),
            MYERROR::NotReady
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if ctx
                .accounts
                .signer
                .key()
                .eq(&ctx.accounts.swap_data_account.items[item_id].owner)
                || authorized == true
            {
                authorized = true;
            }

            if ctx.accounts.swap_data_account.items[item_id].is_nft
                && ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::NFTDeposited.to_u8()
                && ctx.accounts.swap_data_account.items[item_id]
                    .mint
                    .eq(&user_ata.mint)
                && ctx.accounts.swap_data_account.items[item_id]
                    .mint
                    .eq(&swap_data_ata.mint)
                && ctx.accounts.swap_data_account.items[item_id]
                    .owner
                    .eq(ctx.accounts.user.key)
                && transfered == false
            {
                // Transfer deposited NFT back to user
                let ix = spl_token::instruction::transfer(
                    &ctx.accounts.token_program.key,
                    &swap_data_ata.key(),
                    &user_ata.key(),
                    &ctx.accounts.swap_data_account.key(),
                    &[&ctx.accounts.swap_data_account.key()],
                    ctx.accounts.swap_data_account.items[item_id]
                        .amount
                        .unsigned_abs(),
                )?;

                invoke_signed(
                    &ix,
                    &[
                        ctx.accounts.token_program.to_account_info(),
                        swap_data_ata.to_account_info(),
                        user_ata.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                    ],
                    &[&[&seed[..], &[bump]]],
                )?;
                msg!("NFT item Cancelled");

                let _ = swap_data_ata.reload();

                // If Swap's PDA ATA balance is null, closes the account and send the rent to user
                if swap_data_ata.amount.eq(&0) {
                    let ix2 = spl_token::instruction::close_account(
                        &ctx.accounts.token_program.key,
                        &swap_data_ata.key(),
                        &ctx.accounts.user.key(),
                        &ctx.accounts.swap_data_account.key(),
                        &[&ctx.accounts.swap_data_account.key()],
                    )?;

                    invoke_signed(
                        &ix2,
                        &[
                            ctx.accounts.token_program.to_account_info(),
                            swap_data_ata.to_account_info(),
                            ctx.accounts.swap_data_account.to_account_info(),
                            ctx.accounts.user.to_account_info(),
                        ],
                        &[&[&seed[..], &[bump]]],
                    )?;
                    msg!("ATA closed");
                }

                // Update item status to 91 (CancelRecovered)
                ctx.accounts.swap_data_account.items[item_id].status =
                    ItemStatus::NFTCancelledRecovered.to_u8();

                transfered = true;
            }
        }

        if transfered == false {
            return Err(error!(MYERROR::NoSend).into());
        }

        if authorized == false {
            return Err(error!(MYERROR::UserNotPartOfTrade).into());
        }

        // If not already, update Swap's status to 90 (Cancelled)
        if ctx.accounts.swap_data_account.status != TradeStatus::Cancelling.to_u8() {
            ctx.accounts.swap_data_account.status = TradeStatus::Cancelling.to_u8();
            msg!("General status changed to Cancelling");
        }

        Ok(())
    }

    /// @notice Verify Swap's PDA items to proceed to closed state. /!\ initializer function
    /// @dev Function verify each item status to mutate the smart contract status to 3 (closed) then close the Swap's PDA.  /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts associated_token_program: Pubkey = spl_associated_token_program_id
    /// @return Void
    pub fn validate_cancel(
        ctx: Context<ValidateAndClose>,
        _seed: Vec<u8>,
        _bump: u8,
    ) -> Result<()> {
        if !(ctx.accounts.swap_data_account.status == TradeStatus::Cancelling.to_u8()
            || ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8())
        {
            return Err(error!(MYERROR::NotReady).into());
        }

        let nbr_items = ctx.accounts.swap_data_account.items.len();

        // Checks all items are Cancelled
        for item_id in 0..nbr_items {
            if !(ctx.accounts.swap_data_account.items[item_id].status
                == ItemStatus::SolCancelledRecovered.to_u8()
                || ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::NFTCancelledRecovered.to_u8()
                || ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::SolPending.to_u8()
                || ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::NFTPending.to_u8()
                || ctx.accounts.swap_data_account.items[item_id].status
                    == ItemStatus::SolToClaim.to_u8())
            {
                return Err(error!(MYERROR::NotReady).into());
            }
        }

        // Changing Swap status to 91 (CancelledRecovered)
        ctx.accounts.swap_data_account.status = TradeStatus::Closed.to_u8();
        msg!("General status changed to Closed");

        Ok(())
    }

    // pub fn create_pnft(ctx: Context<CreatePNFT>, name: String) -> Result<()> {
    //     let name = puffed_out_string(&name, 20);
    //     let symbol = puffed_out_string("PRG", 4);
    //     let uri = puffed_out_string("http://first.programmable.nft/", 40);

    //     let mut asset = AssetData::new(
    //         TokenStandard::ProgrammableNonFungible,
    //         name.clone(),
    //         symbol.clone(),
    //         uri.clone(),
    //         // ctx.accounts.signer.key(),
    //     );
    //     asset.seller_fee_basis_points = 500;
    //     // asset.programmable_config = Some(ProgrammableConfig {
    //     //     rule_set: Pubkey::from_str("Cex6GAMtCwD9E17VsEK4rQTbmcVtSdHxWcxhwdwXkuAN").unwrap(),
    //     // });

    //     let create_ix = CreateBuilder::new()
    //         .metadata(ctx.accounts.nft_metadata.key())
    //         .master_edition(ctx.accounts.nft_master_edition.key())
    //         .mint(ctx.accounts.mint.key())
    //         // .mint_authority(ctx.accounts.signer.key())
    //         .payer(ctx.accounts.signer.key())
    //         .update_authority(ctx.accounts.signer.key())
    //         .initialize_mint(true)
    //         .update_authority_as_signer(true)
    //         .build(CreateArgs::V1 {
    //             asset_data: asset,
    //             decimals: Some(0),
    //             print_supply: Some(PrintSupply::Limited(1)),
    //         })
    //         .unwrap()
    //         .instruction();

    //     invoke(
    //         &create_ix,
    //         &[
    //             ctx.accounts.nft_metadata.to_account_info(),
    //             ctx.accounts.nft_master_edition.to_account_info(),
    //             ctx.accounts.mint.to_account_info(),
    //             ctx.accounts.signer.to_account_info(),
    //         ],
    //     )?;

    //     Ok(())
    // }
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8, sent_data : SwapData,_nb_of_items: u32)]
pub struct InitInitialize<'info> {
    #[account(
        init,
        payer = signer,
        seeds = [&&seed[..]],
        bump,
        space = SwapData::size(sent_data, _nb_of_items)
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account()]
    system_program: Program<'info, System>,
    #[account()]
    associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]
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
#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]
pub struct VerifyInitialize<'info> {
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

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]
pub struct DepositNft<'info> {
    #[account()]
    system_program: Program<'info, System>,
    #[account()]
    token_program: Program<'info, Token>,
    ///CHECK: in constraint
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID))]
    sysvar_instructions: AccountInfo<'info>,
    ///CHECK: in constraint
    #[account()] //constraint = spl_token_program.key().eq(&spl_token::ID))]
    spl_token_program: Program<'info, Token>,
    ///CHECK: in constraint
    #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID))]
    spl_ata_program: AccountInfo<'info>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        constraint = item_from_deposit.mint == item_to_deposit.mint @ MYERROR::MintIncorrect,
        constraint = item_from_deposit.owner == signer.key() @ MYERROR::IncorrectOwner
    )]
    item_from_deposit: Account<'info, TokenAccount>,
    #[account(
        constraint = item_from_deposit.mint == mint.key()  @ MYERROR::MintIncorrect
    )]
    mint: Account<'info, Mint>,
    /// CHECK: account checked in CPI
    #[account(
    //     seeds = [b"metadata".as_ref(), mint.key().as_ref()],
    // bump=nft_metadata.self_bump,
    )]
    nft_metadata: AccountInfo<'info>,
    #[account(
        mut,
        constraint = item_to_deposit.owner == swap_data_account.to_account_info().key()  @ MYERROR::IncorrectOwner
    )]
    item_to_deposit: Account<'info, TokenAccount>,
    #[account()]
    nft_master_edition: Option<AccountInfo<'info>>,
    #[account()]
    owner_token_record: Option<AccountInfo<'info>>,
    #[account()]
    destination_token_record: Option<AccountInfo<'info>>,
    #[account()]
    auth_rules_program: Option<AccountInfo<'info>>,
    #[account()]
    auth_rules: Option<AccountInfo<'info>>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8, metadata_bump:u8, master_bump:u8)]
pub struct DepositPNft<'info> {
    #[account()]
    system_program: Program<'info, System>,
    /// CHECK: to be done
    #[account(constraint =metadata_program.key().eq(&mpl_token_metadata::id()) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>, //, TokenMetadata>,
    ///CHECK: in constraint
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    ///CHECK: in constraint
    #[account(constraint = spl_token_program.key().eq(&spl_token::ID))]
    spl_token_program: Program<'info, Token>,
    ///CHECK: in constraint
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
    /// CHECK: account checked in CPI
    #[account(constraint = item_from_deposit.mint == mint.key()  @ MYERROR::MintIncorrect)]
    mint: Account<'info, Mint>,
    /// CHECK: account checked in CPI
    #[account(mut,
        // seeds = [b"metadata".as_ref(), mint.key().as_ref()],
        // bump=metadata_bump,
        // owner = metadata_program.key() @ MYERROR::IncorrectMetadata
    )]
    nft_metadata: AccountInfo<'info>,
    #[account(
        mut,
        // constraint = item_to_deposit.owner == swap_data_account.to_account_info().key()  @ MYERROR::IncorrectOwner
    )]
    item_to_deposit: Account<'info, TokenAccount>,
    /// CHECK: account checked in CPI
    #[account(mut)]
    owner_to: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    #[account(
        // seeds = [b"metadata".as_ref(), metadata_program.key().as_ref(),mint.key().as_ref(),b"edition".as_ref()],
        // bump=master_bump,
        // owner = metadata_program.key() @ MYERROR::IncorrectMetadata
    )]
    nft_master_edition: Option<AccountInfo<'info>>,
    /// CHECK: account checked in CPI
    #[account(mut)]
    owner_token_record: Option<AccountInfo<'info>>,
    /// CHECK: account checked in CPI
    #[account(mut)]
    destination_token_record: Option<AccountInfo<'info>>,
    /// CHECK: account checked in CPI
    #[account()]
    auth_rules_program: Option<AccountInfo<'info>>,
    /// CHECK: account checked in CPI
    #[account()]
    auth_rules: Option<AccountInfo<'info>>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8, metadata_bump:u8)]
pub struct DepositPNft2<'info> {
    #[account()]
    system_program: Program<'info, System>,
    /// CHECK: to be done
    #[account(constraint =metadata_program.key().eq(&mpl_token_metadata::id()) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>, //, TokenMetadata>,
    ///CHECK: in constraint
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    ///CHECK: in constraint
    #[account(constraint = spl_token_program.key().eq(&spl_token::ID))]
    spl_token_program: Program<'info, Token>,
    ///CHECK: in constraint
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
    /// CHECK: account checked in CPI
    #[account(constraint = item_from_deposit.mint == mint.key()  @ MYERROR::MintIncorrect)]
    mint: Account<'info, Mint>,
    /// CHECK: account checked in CPI
    #[account(mut,
        seeds = [b"metadata".as_ref(), mint.key().as_ref()],
        bump=metadata_bump,
    )]
    nft_metadata: AccountInfo<'info>,
    #[account(
        mut,
        // constraint = item_to_deposit.owner == swap_data_account.to_account_info().key()  @ MYERROR::IncorrectOwner
    )]
    item_to_deposit: Account<'info, TokenAccount>,
    /// CHECK: account checked in CPI
    #[account(mut)]
    owner_to: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    #[account()]
    nft_master_edition: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    #[account(mut)]
    owner_token_record: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    #[account(mut)]
    destination_token_record: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    #[account()]
    auth_rules_program: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    #[account()]
    auth_rules: AccountInfo<'info>,
}

// #[derive(Accounts)]
// pub struct CreatePNFT<'info> {
//     #[account()]
//     system_program: Program<'info, System>,
//     #[account()]
//     token_program: Program<'info, Token>,
//     /// CHECK: will fail if wrong
//     #[account(constraint = sysvar_instructions.key().eq(& solana_program::sysvar::instructions::ID))]
//     sysvar_instructions: AccountInfo<'info>,
//         ///CHECK: in constraint
//     #[account(constraint = spl_token_program.key().eq( &spl_token::ID))]
//     spl_token_program: AccountInfo<'info>,
//         ///CHECK: in constraint
//     #[account(constraint = spl_ata_program.key().eq(  &spl_associated_token_account::ID))]
//     spl_ata_program: AccountInfo<'info>,
//     // #[account(mut,seeds = [&seed[..]], bump)]
//     // swap_data_account: Box<Account<'info, SwapData>>,
//     #[account(mut)]
//     signer: Signer<'info>,
//     // #[account(
//     //     mut,
//     //     constraint = item_from_deposit.mint == item_to_deposit.mint @ MYERROR::MintIncorrect,
//     //     constraint = item_from_deposit.owner == signer.key() @ MYERROR::IncorrectOwner
//     // )]
//     // item_from_deposit: Account<'info, TokenAccount>,
//     #[account(init, payer = signer.key(), space = 1000
//         // constraint = item_from_deposit.mint == mint.key()  @ MYERROR::MintIncorrect
//     )]
//     mint: Account<'info, Mint>,
//     /// CHECK: account checked in CPI
//     #[account(init, payer = signer.key(), space = 1000
//         // seeds = [b"metadata".as_ref(), mint.key().as_ref()],
//     // bump=nft_metadata.self_bump,
//     )]
//     nft_metadata: UncheckedAccount<'info>,
//     // #[account(
//     //     mut,
//     //     constraint = item_to_deposit.owner == swap_data_account.to_account_info().key()  @ MYERROR::IncorrectOwner
//     // )]
//     // item_to_deposit: Account<'info, TokenAccount>,
//     ///CHECK: in constraint
//     #[account(init, payer = signer.key(), space = 1000)]
//     nft_master_edition: AccountInfo<'info>,
//     // #[account()]
//     // // owner_token_record: Option<AccountInfo<'info>>,
//     // #[account()]
//     // destination_token_record: Option<AccountInfo<'info>>,
//     // #[account()]
//     // auth_rules_program: Option<AccountInfo<'info>>,
//     // #[account()]
//     // auth_rules: Option<AccountInfo<'info>>,
// }

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]
pub struct DepositNftOCP<'info> {
    #[account()]
    system_program: Program<'info, System>,
    #[account()]
    token_program: Program<'info, Token>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        constraint = item_from_deposit.mint == item_to_deposit.mint @ MYERROR::MintIncorrect,
        constraint = item_from_deposit.owner == signer.key() @ MYERROR::IncorrectOwner
    )]
    item_from_deposit: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = item_to_deposit.owner == swap_data_account.to_account_info().key()  @ MYERROR::IncorrectOwner
)]
    item_to_deposit: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]
pub struct DepositSol<'info> {
    #[account()]
    system_program: Program<'info, System>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]
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
#[instruction(seed: Vec<u8>, bump: u8)]
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
#[instruction(seed: Vec<u8>, bump: u8)]
pub struct ClaimNft<'info> {
    #[account()]
    system_program: Program<'info, System>,
    #[account()]
    token_program: Program<'info, Token>,
    #[account(
        mut,
        seeds = [&seed[..]],
        bump
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: user Account
    #[account(mut)]
    user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        constraint = item_from_deposit.mint == item_to_deposit.mint  @ MYERROR::MintIncorrect,
        constraint = item_from_deposit.owner == swap_data_account.key()  @ MYERROR::IncorrectOwner
    )]
    item_from_deposit: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = item_to_deposit.owner == user.key() @ MYERROR::IncorrectOwner
    )]
    item_to_deposit: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]
pub struct ClaimSol<'info> {
    #[account()]
    system_program: Program<'info, System>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: user Account
    #[account(mut)]
    user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[account]
#[derive(Default)]
// #[derive(AnchorDeserialize,AnchorSerialize, Clone)]
pub struct SwapData {
    pub initializer: Pubkey,
    pub status: u8,
    pub items: Vec<NftSwapItem>,
    pub nb_items: u32,
}

impl SwapData {
    const LEN: usize = 8 + //Base
        1 + //u8
        4 * 2 + //u32
        32; //Pubkey

    pub fn size(_swap_data_account: SwapData, nb_items: u32) -> usize {
        return SwapData::LEN
            .checked_add(NftSwapItem::LEN.checked_mul(nb_items as usize).unwrap())
            .unwrap();
    }
}

// #[account]
// #[derive(Default)]
#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct NftSwapItem {
    is_nft: bool,
    mint: Pubkey,
    amount: i64,
    owner: Pubkey,
    destinary: Pubkey,
    status: u8,
}

impl NftSwapItem {
    const LEN: usize = 32 * 3 + //pubkey
        2 + //bool / u8
        8; //i64
}

// #[account]
// #[derive(AnchorDeserialize, AnchorSerialize, Clone)]

// pub struct MetadataAccount {
//     pub self_bump: u8,
//     pub mint_bump: u8,
//     pub mint: Pubkey,
//     pub item: Item,
// }
pub enum TradeStatus {
    Initializing,
    WaitingToDeposit,
    WaitingToClaim,
    Closed,
    Cancelling,
    Cancelled,
}

impl TradeStatus {
    pub fn from_u8(status: u8) -> TradeStatus {
        match status {
            0 => TradeStatus::Initializing,
            1 => TradeStatus::WaitingToDeposit,
            2 => TradeStatus::WaitingToClaim,
            3 => TradeStatus::Closed,

            100 => TradeStatus::Cancelling,
            101 => TradeStatus::Cancelled,

            _ => panic!("Invalid Proposal Status"),
        }
    }

    pub fn to_u8(&self) -> u8 {
        match self {
            TradeStatus::Initializing => 0,
            TradeStatus::WaitingToDeposit => 1,
            TradeStatus::WaitingToClaim => 2,
            TradeStatus::Closed => 3,

            TradeStatus::Cancelling => 100,
            TradeStatus::Cancelled => 101,
        }
    }
}

pub enum ItemStatus {
    NFTPending,
    NFTDeposited,
    NFTClaimed,
    NFTCancelled,
    NFTCancelledRecovered,
    SolPending,
    SolDeposited,
    SolToClaim,
    SolClaimed,
    SolCancelled,
    SolCancelledRecovered,
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

            100 => ItemStatus::NFTCancelled,
            101 => ItemStatus::SolCancelled,

            110 => ItemStatus::NFTCancelledRecovered,
            111 => ItemStatus::SolCancelledRecovered,

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

            ItemStatus::NFTCancelled => 100,
            ItemStatus::SolCancelled => 101,

            ItemStatus::NFTCancelledRecovered => 110,
            ItemStatus::SolCancelledRecovered => 111,
        }
    }
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
    #[msg("Nothing was found in the smart contract to be sent to you")]
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
    #[msg("wrong signer, should be initializer to perform this action")]
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
}
