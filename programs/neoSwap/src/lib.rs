use ::{
    anchor_lang::{
        prelude::*,
        solana_program::{ program::{ invoke, invoke_signed }, pubkey::Pubkey },
        system_program::ID as SYSTEM_PROGRAM_ID,
    },
    anchor_spl::{ associated_token::AssociatedToken, token::{ spl_token, Token, TokenAccount } },
    mpl_bubblegum::program::Bubblegum,
    mpl_token_metadata::{
        instructions::TransferBuilder,
        types::{ TransferArgs, TokenStandard },
        accounts::Metadata,
        programs::MPL_TOKEN_METADATA_ID,
    },
    spl_account_compression::{ program::SplAccountCompression, Noop },
};

use anchor_lang::solana_program;
use anchor_spl::token::Mint;

declare_id!("2vumtPDSVo3UKqYYxMVbDaQz1K4foQf6A31KiUaii1M7");
// declare_id!("Et2RutKNHzB6XmsDXUGnDHJAGAsJ73gdHVkoKyV79BFY");
// declare_id!("HCg7NKnvWwWZdLXqDwZdjn9RDz9eLDYuSAcUHqeC1vmH");
// declare_id!("EU5zoiRSvPE5k1Fy49UJZvPMBKxzatdBGFJ11XPFD42Z");
// declare_id!("CtZHiWNnLu5rQuTN3jo7CmYDR8Wns6qXHn7taPvmnACp");

///@title List of function to manage NeoSwap's multi-items swaps
#[program]
pub mod neo_swap {
    use anchor_lang::solana_program::system_program;

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, _seed: Vec<u8>, sent_data: SwapData) -> Result<()> {
        require_eq!(sent_data.seed.len(), 32, MYERROR::UnexpectedData);
        require!(sent_data.bids.is_empty(), MYERROR::EmptyBids);
        // Write according Data into Swap's PDA
        ctx.accounts.swap_data_account.maker = ctx.accounts.signer.key();
        ctx.accounts.swap_data_account.taker = SYSTEM_PROGRAM_ID;
        ctx.accounts.swap_data_account.bids = [sent_data.bids[0]].to_vec();
        ctx.accounts.swap_data_account.seed = sent_data.seed;
        ctx.accounts.swap_data_account.accepted_bid_index = -1;
        ctx.accounts.swap_data_account.accepted_payement = sent_data.accepted_payement;
        Ok(())
    }

    pub fn add_bid(ctx: Context<AddBid>, bid_to_add: Bid) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;
        let signer = &mut ctx.accounts.signer;

        require_keys_eq!(swap_data_account.maker, signer.key(), MYERROR::NotMaker);

        ctx.accounts.swap_data_account.bids.push(bid_to_add);

        Ok(())
    }

    pub fn deposit_initial_bid(
        ctx: Context<DepositInitialBid>,
        bid_to_add: Bid
        // _seed: Vec<u8>
        // _metadata_bump: u8,
    ) -> Result<()> {
        let swap_data_account = &ctx.accounts.swap_data_account;

        require!(
            swap_data_account.status == TradeStatus::Initialized.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            msg!("2");
            // msg!("{}",ctx.accounts.item_from_deposit.owner);
            if !ctx.accounts.swap_data_account.items[item_id].is_compressed {
                if
                    ctx.accounts.swap_data_account.items[item_id].is_nft &&
                    ctx.accounts.swap_data_account.items[item_id].mint.eq(
                        &ctx.accounts.item_to_deposit.mint
                    ) &&
                    ctx.accounts.swap_data_account.items[item_id].owner.eq(
                        &ctx.accounts.item_from_deposit.owner
                    ) &&
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::NFTPending.to_u8()
                {
                    msg!("3");
                    // creating base transfer builder
                    let mut transfer_builder = TransferBuilder::new();
                    transfer_builder
                        .token(ctx.accounts.item_from_deposit.key())
                        .token_owner(ctx.accounts.signer.key())
                        .destination_token(ctx.accounts.item_to_deposit.key())
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
                        ctx.accounts.metadata_program.to_account_info()
                    ];

                    let metadata: Metadata = Metadata::safe_deserialize(
                        &ctx.accounts.nft_metadata.to_account_info().data.borrow()
                    )?;

                    msg!("5");

                    if
                        matches!(
                            metadata.token_standard,
                            Some(TokenStandard::ProgrammableNonFungible)
                        )
                    {
                        transfer_builder
                            .edition(Some(ctx.accounts.nft_master_edition.key()))
                            .token_record(Some(ctx.accounts.owner_token_record.key()))
                            .destination_token_record(
                                Some(ctx.accounts.destination_token_record.key())
                            )
                            .authorization_rules_program(
                                Some(ctx.accounts.auth_rules_program.key())
                            )
                            .authorization_rules(Some(ctx.accounts.auth_rules.key()));

                        transfer_infos.push(ctx.accounts.nft_master_edition.to_account_info());
                        transfer_infos.push(ctx.accounts.owner_token_record.to_account_info());
                        transfer_infos.push(
                            ctx.accounts.destination_token_record.to_account_info()
                        );
                        transfer_infos.push(ctx.accounts.auth_rules_program.to_account_info());
                        transfer_infos.push(ctx.accounts.auth_rules.to_account_info());
                        msg!("6.1");
                    } else {
                        msg!("6.2");
                    }

                    // Check enough tokens in ATA balance
                    if
                        ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs() >
                        ctx.accounts.item_from_deposit.amount
                    {
                        return Err(MYERROR::NotEnoughFunds.into());
                    }

                    // Create transfer instruction
                    let transfer_ix = transfer_builder
                        .transfer_args(TransferArgs::V1 {
                            amount: ctx.accounts.swap_data_account.items[
                                item_id
                            ].amount.unsigned_abs(),
                            authorization_data: None,
                        })
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

    pub fn deposit_sol(
        ctx: Context<DepositSol>,
        _seed: Vec<u8>
        // _bump: u8
    ) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::Initialized.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if
                !ctx.accounts.swap_data_account.items[item_id].is_nft &&
                ctx.accounts.swap_data_account.items[item_id].status ==
                    ItemStatus::SolPending.to_u8() &&
                ctx.accounts.swap_data_account.items[item_id].owner.eq(ctx.accounts.signer.key) &&
                !transfered
            {
                if ctx.accounts.swap_data_account.items[item_id].amount > 0 {
                    // Transfer lamports to Escrow

                    if ctx.accounts.swap_data_account.items[item_id].mint.eq(&system_program::id()) {
                        let ix = anchor_lang::solana_program::system_instruction::transfer(
                            &ctx.accounts.signer.key(),
                            &ctx.accounts.swap_data_account.key(),
                            ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
                        );
                        invoke(
                            &ix,
                            &[
                                ctx.accounts.signer.to_account_info(),
                                ctx.accounts.swap_data_account.to_account_info(),
                            ]
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
                            ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
                        );

                        let ix = spl_token::instruction::transfer(
                            &ctx.accounts.spl_token_program.key,
                            &ctx.accounts.signer_ata.key(),
                            &ctx.accounts.swap_data_account_ata.key(),
                            &ctx.accounts.signer.key(),
                            &[&ctx.accounts.signer.key()],
                            ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
                        )?;
                        invoke(
                            &ix,
                            &[
                                ctx.accounts.spl_token_program.to_account_info(),
                                ctx.accounts.signer.to_account_info(),
                                ctx.accounts.signer_ata.to_account_info(),
                                ctx.accounts.swap_data_account.to_account_info(),
                                ctx.accounts.swap_data_account_ata.to_account_info(),
                            ]
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

    // pub fn validate_deposit(
    //     ctx: Context<ValidateDeposited>,
    //     _seed: Vec<u8>
    //     // _bump: u8
    // ) -> Result<()> {
    //     require!(
    //         ctx.accounts.swap_data_account.status == TradeStatus::Initialized.to_u8(),
    //         MYERROR::UnexpectedState
    //     );

    //     // Checks that all items have been deposited
    //     for item_id in 0..ctx.accounts.swap_data_account.items.len() {
    //         if
    //             !(
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                     ItemStatus::NFTDeposited.to_u8() ||
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                     ItemStatus::SolDeposited.to_u8() ||
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                     ItemStatus::SolToClaim.to_u8()
    //             )
    //         {
    //             return Err(error!(MYERROR::NotReady));
    //         }
    //     }

    //     // Udpate status to ToClaim
    //     ctx.accounts.swap_data_account.status = TradeStatus::ToClaim.to_u8();

    //     Ok(())
    // }

    // pub fn claim_sol(ctx: Context<ClaimSol>, seed: Vec<u8>, bump: u8) -> Result<()> {
    //     require!(
    //         ctx.accounts.swap_data_account.status == TradeStatus::ToClaim.to_u8(),
    //         MYERROR::NotReady
    //     );

    //     let mut transfered: bool = false;
    //     let mut authorized: bool = false;

    //     if ctx.accounts.signer.key().eq(&ctx.accounts.swap_data_account.initializer) {
    //         authorized = true;
    //     }

    //     // find the item linked with shared Accounts
    //     for item_id in 0..ctx.accounts.swap_data_account.items.len() {
    //         if
    //             !ctx.accounts.swap_data_account.items[item_id].is_nft &&
    //             ctx.accounts.swap_data_account.items[item_id].status ==
    //                 ItemStatus::SolToClaim.to_u8() &&
    //             ctx.accounts.swap_data_account.items[item_id].owner.eq(&ctx.accounts.user.key()) &&
    //             !transfered
    //         {
    //             // Bypass function for initializer or the destinary of this solItem
    //             if
    //                 ctx.accounts.signer
    //                     .key()
    //                     .eq(&ctx.accounts.swap_data_account.items[item_id].destinary)
    //             {
    //                 authorized = true;
    //             }

    //             if ctx.accounts.swap_data_account.items[item_id].amount.is_negative() {
    //                 // Send lamports to user
    //                 let amount_to_send =
    //                     ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs();

    //                 // let swap_data_lamports_initial =
    //                 //     ctx.accounts.swap_data_account.to_account_info().lamports();

    //                 // if swap_data_lamports_initial >= amount_to_send {
    //                 // } else {
    //                 //     return Err(error!(MYERROR::NotEnoughFunds));
    //                 // }
    //                 if ctx.accounts.swap_data_account.items[item_id].mint.eq(&system_program::id()) {
    //                     **ctx.accounts.user.lamports.borrow_mut() =
    //                         ctx.accounts.user.lamports() + amount_to_send;
    //                     **ctx.accounts.swap_data_account.to_account_info().lamports.borrow_mut() =
    //                         ctx.accounts.swap_data_account.to_account_info().lamports() -
    //                         amount_to_send;
    //                 } else {
    //                     // check swapDataAccount ata
    //                     require!(
    //                         is_correct_ata(
    //                             ctx.accounts.swap_data_account_ata.key(),
    //                             ctx.accounts.swap_data_account.key(),
    //                             ctx.accounts.swap_data_account.items[item_id].mint.key()
    //                         ),
    //                         MYERROR::IncorrectOwner
    //                     );
    //                     // check user ata
    //                     require!(
    //                         is_correct_ata(
    //                             ctx.accounts.user_ata.key(),
    //                             ctx.accounts.user.key(),
    //                             ctx.accounts.swap_data_account.items[item_id].mint.key()
    //                         ),
    //                         MYERROR::IncorrectOwner
    //                     );

    //                     let ix_user = spl_token::instruction::transfer(
    //                         &ctx.accounts.spl_token_program.to_account_info().key(),
    //                         &ctx.accounts.swap_data_account_ata.key(),
    //                         &ctx.accounts.user_ata.key(),
    //                         &ctx.accounts.swap_data_account.key(),
    //                         &[&ctx.accounts.swap_data_account.key()],
    //                         ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
    //                     )?;

    //                     invoke_signed(
    //                         &ix_user,
    //                         &[
    //                             ctx.accounts.swap_data_account.to_account_info(),
    //                             ctx.accounts.swap_data_account_ata.to_account_info(),
    //                             ctx.accounts.user_ata.to_account_info(),
    //                             ctx.accounts.user.to_account_info(),
    //                             ctx.accounts.spl_token_program.to_account_info(),
    //                         ],
    //                         &[&[&seed[..], &[bump]]]
    //                     )?;
    //                 }

    //                 //update item status to SolClaimed
    //                 ctx.accounts.swap_data_account.items[item_id].status =
    //                     ItemStatus::SolClaimed.to_u8();
    //                 transfered = true;
    //                 msg!("SOL item Claimed");
    //                 break;
    //             } else {
    //                 return Err(error!(MYERROR::NoSend));
    //             }
    //         }
    //     }
    //     if !transfered {
    //         return Err(error!(MYERROR::NoSend));
    //     }
    //     if !authorized {
    //         return Err(error!(MYERROR::UserNotPartOfTrade));
    //     }
    //     Ok(())
    // }

    // pub fn claim_nft(
    //     ctx: Context<ClaimNft>,
    //     seed: Vec<u8>,
    //     bump: u8
    //     // _metadata_bump: u8,
    // ) -> Result<()> {
    //     require!(
    //         ctx.accounts.swap_data_account.status == TradeStatus::ToClaim.to_u8(),
    //         MYERROR::NotReady
    //     );

    //     let mut transfered: bool = false;

    //     // find the item linked with shared Accounts
    //     for item_id in 0..ctx.accounts.swap_data_account.items.len() {
    //         if !ctx.accounts.swap_data_account.items[item_id].is_compressed {
    //             if
    //                 ctx.accounts.swap_data_account.items[item_id].is_nft &&
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                     ItemStatus::NFTDeposited.to_u8() &&
    //                 ctx.accounts.swap_data_account.items[item_id].mint.eq(
    //                     &ctx.accounts.swap_data_account_ata.mint
    //                 ) &&
    //                 ctx.accounts.swap_data_account.items[item_id].mint.eq(
    //                     &ctx.accounts.user_ata.mint
    //                 ) &&
    //                 ctx.accounts.swap_data_account.items[item_id].destinary.eq(
    //                     &ctx.accounts.user_ata.owner
    //                 ) &&
    //                 !transfered
    //             {
    //                 // Bypass function for initializer or the destinary of this NFT

    //                 // Transfer the NFT to user

    //                 let mut transfer_builder = TransferBuilder::new();

    //                 transfer_builder
    //                     .token(ctx.accounts.swap_data_account_ata.key())
    //                     .token_owner(ctx.accounts.swap_data_account.key())
    //                     .destination_token(ctx.accounts.user_ata.key())
    //                     .destination_owner(ctx.accounts.user.key())
    //                     .mint(ctx.accounts.mint.key())
    //                     .metadata(ctx.accounts.nft_metadata.key())
    //                     .authority(ctx.accounts.swap_data_account.key())
    //                     .payer(ctx.accounts.signer.key())
    //                     .system_program(ctx.accounts.system_program.key())
    //                     .sysvar_instructions(ctx.accounts.sysvar_instructions.key())
    //                     .spl_token_program(ctx.accounts.spl_token_program.key())
    //                     .spl_ata_program(ctx.accounts.spl_ata_program.key());

    //                 msg!("4");

    //                 // creating vase transfer info
    //                 let mut transfer_infos = vec![
    //                     ctx.accounts.swap_data_account_ata.to_account_info(),
    //                     ctx.accounts.user_ata.to_account_info(),
    //                     ctx.accounts.swap_data_account.to_account_info(),
    //                     ctx.accounts.user.to_account_info(),
    //                     ctx.accounts.mint.to_account_info(),
    //                     ctx.accounts.nft_metadata.to_account_info(),
    //                     ctx.accounts.signer.to_account_info(),
    //                     ctx.accounts.system_program.to_account_info(),
    //                     ctx.accounts.sysvar_instructions.to_account_info(),
    //                     ctx.accounts.spl_token_program.to_account_info(),
    //                     ctx.accounts.spl_ata_program.to_account_info(),
    //                     ctx.accounts.sysvar_instructions.to_account_info(),
    //                     ctx.accounts.metadata_program.to_account_info()
    //                 ];

    //                 let metadata: Metadata = Metadata::safe_deserialize(
    //                     &ctx.accounts.nft_metadata.to_account_info().data.borrow()
    //                 )?;

    //                 msg!("5");

    //                 if
    //                     matches!(
    //                         metadata.token_standard,
    //                         Some(TokenStandard::ProgrammableNonFungible)
    //                     )
    //                 {
    //                     transfer_builder
    //                         .edition(Some(ctx.accounts.nft_master_edition.key()))
    //                         .token_record(Some(ctx.accounts.owner_token_record.key()))
    //                         .destination_token_record(
    //                             Some(ctx.accounts.destination_token_record.key())
    //                         )
    //                         .authorization_rules_program(
    //                             Some(ctx.accounts.auth_rules_program.key())
    //                         )
    //                         .authorization_rules(Some(ctx.accounts.auth_rules.key()));

    //                     transfer_infos.push(ctx.accounts.nft_master_edition.to_account_info());
    //                     transfer_infos.push(ctx.accounts.owner_token_record.to_account_info());
    //                     transfer_infos.push(
    //                         ctx.accounts.destination_token_record.to_account_info()
    //                     );
    //                     transfer_infos.push(ctx.accounts.auth_rules_program.to_account_info());
    //                     transfer_infos.push(ctx.accounts.auth_rules.to_account_info());
    //                     msg!("6.1");
    //                 } else {
    //                     msg!("6.2");
    //                 }

    //                 let transfer_ix = transfer_builder
    //                     .transfer_args(TransferArgs::V1 {
    //                         amount: ctx.accounts.swap_data_account.items[
    //                             item_id
    //                         ].amount.unsigned_abs(),
    //                         authorization_data: None,
    //                     })
    //                     .instruction();
    //                 msg!("7");

    //                 invoke_signed(&transfer_ix, &transfer_infos, &[&[&seed[..], &[bump]]])?;

    //                 msg!("NFT item Claimed");
    //                 let _ = ctx.accounts.swap_data_account_ata.reload();

    //                 // if no more NFT held, closes the Swap's PDA ATA
    //                 if ctx.accounts.swap_data_account_ata.amount == 0 {
    //                     let ix2 = spl_token::instruction::close_account(
    //                         ctx.accounts.spl_token_program.key,
    //                         &ctx.accounts.swap_data_account_ata.key(),
    //                         &ctx.accounts.user.key(),
    //                         &ctx.accounts.swap_data_account.key(),
    //                         &[&ctx.accounts.swap_data_account.key()]
    //                     )?;
    //                     invoke_signed(
    //                         &ix2,
    //                         &[
    //                             ctx.accounts.spl_token_program.to_account_info(),
    //                             ctx.accounts.swap_data_account_ata.to_account_info(),
    //                             ctx.accounts.swap_data_account.to_account_info(),
    //                             ctx.accounts.user.to_account_info(),
    //                         ],
    //                         &[&[&seed[..], &[bump]]]
    //                     )?;
    //                     msg!("ATA closed");
    //                 }

    //                 //Change status to NFTClaimed
    //                 ctx.accounts.swap_data_account.items[item_id].status =
    //                     ItemStatus::NFTClaimed.to_u8();
    //                 transfered = true;
    //                 break;
    //             }
    //         }
    //     }

    //     if !transfered {
    //         return Err(error!(MYERROR::NoSend));
    //     }

    //     Ok(())
    // }

    // pub fn validate_claimed(ctx: Context<ValidateAndClose>, _seed: Vec<u8>) -> Result<()> {
    //     require_eq!(
    //         ctx.accounts.swap_data_account.status,
    //         TradeStatus::ToClaim.to_u8(),
    //         MYERROR::NotReady
    //     );

    //     // verify all items are claimed
    //     for item_id in 0..ctx.accounts.swap_data_account.items.len() {
    //         if
    //             !(
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                     ItemStatus::SolClaimed.to_u8() ||
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                     ItemStatus::NFTClaimed.to_u8() ||
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                     ItemStatus::SolDeposited.to_u8()
    //             )
    //         {
    //             msg!(
    //                 "item Id :{}, {}",
    //                 item_id,
    //                 ctx.accounts.swap_data_account.items[item_id].status
    //             );
    //             return Err(error!(MYERROR::NotReady));
    //         }
    //     }

    //     // Change Swap's status to Closed
    //     ctx.accounts.swap_data_account.status = TradeStatus::Closed.to_u8();

    //     Ok(())
    // }

    // pub fn cancel_sol(ctx: Context<ClaimSol>, seed: Vec<u8>, bump: u8) -> Result<()> {
    //     if
    //         !(
    //             ctx.accounts.swap_data_account.status == TradeStatus::Initialized.to_u8() ||
    //             ctx.accounts.swap_data_account.status == TradeStatus::Canceling.to_u8()
    //         )
    //     {
    //         return Err(error!(MYERROR::NotReady));
    //     }

    //     let mut transfered: bool = false;
    //     let mut authorized: bool = false;

    //     if ctx.accounts.signer.key().eq(&ctx.accounts.swap_data_account.initializer) {
    //         authorized = true;
    //     }

    //     // find the item linked with shared Accounts
    //     for item_id in 0..ctx.accounts.swap_data_account.items.len() {
    //         if
    //             !ctx.accounts.swap_data_account.items[item_id].is_nft &&
    //             ctx.accounts.swap_data_account.items[item_id].owner.eq(ctx.accounts.user.key) &&
    //             !transfered
    //         {
    //             // Bypass function for initializer or the owner of this solItem
    //             if
    //                 ctx.accounts.signer
    //                     .key()
    //                     .eq(&ctx.accounts.swap_data_account.items[item_id].owner)
    //             {
    //                 authorized = true;
    //             }

    //             // Check if deposited
    //             if
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                 ItemStatus::SolDeposited.to_u8()
    //             {
    //                 if ctx.accounts.swap_data_account.items[item_id].amount.is_positive() {
    //                     let amount_to_send =
    //                         ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs();
    //                     // let swap_data_lamports_initial =
    //                     //     ctx.accounts.swap_data_account.to_account_info().lamports();

    //                     // if swap_data_lamports_initial >= amount_to_send {
    //                     // } else {
    //                     //     return Err(error!(MYERROR::NotEnoughFunds));
    //                     // }
    //                     if
    //                         ctx.accounts.swap_data_account.items[item_id].mint.eq(
    //                             &system_program::id()
    //                         )
    //                     {
    //                         **ctx.accounts.user.lamports.borrow_mut() =
    //                             ctx.accounts.user.lamports() + amount_to_send;
    //                         **ctx.accounts.swap_data_account
    //                             .to_account_info()
    //                             .lamports.borrow_mut() =
    //                             ctx.accounts.swap_data_account.to_account_info().lamports() -
    //                             amount_to_send;
    //                     } else {
    //                         // check user ata
    //                         require!(
    //                             is_correct_ata(
    //                                 ctx.accounts.user_ata.key(),
    //                                 ctx.accounts.user.key(),
    //                                 ctx.accounts.swap_data_account.items[item_id].mint.key()
    //                             ),
    //                             MYERROR::IncorrectOwner
    //                         );

    //                         // check swapDataAccount ata
    //                         require!(
    //                             is_correct_ata(
    //                                 ctx.accounts.swap_data_account_ata.key(),
    //                                 ctx.accounts.swap_data_account.key(),
    //                                 ctx.accounts.swap_data_account.items[item_id].mint.key()
    //                             ),
    //                             MYERROR::IncorrectOwner
    //                         );

    //                         let ix_user = spl_token::instruction::transfer(
    //                             &ctx.accounts.spl_token_program.to_account_info().key(),
    //                             &ctx.accounts.swap_data_account_ata.key(),
    //                             &ctx.accounts.user_ata.key(),
    //                             &ctx.accounts.swap_data_account.key(),
    //                             &[&ctx.accounts.swap_data_account.key()],
    //                             ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
    //                         )?;

    //                         invoke_signed(
    //                             &ix_user,
    //                             &[
    //                                 ctx.accounts.swap_data_account.to_account_info(),
    //                                 ctx.accounts.swap_data_account_ata.to_account_info(),
    //                                 ctx.accounts.user_ata.to_account_info(),
    //                                 ctx.accounts.user.to_account_info(),
    //                                 ctx.accounts.spl_token_program.to_account_info(),
    //                             ],
    //                             &[&[&seed[..], &[bump]]]
    //                         )?;
    //                     }

    //                     ctx.accounts.swap_data_account.items[item_id].status =
    //                         ItemStatus::SolcanceledRecovered.to_u8();
    //                     msg!("SolcanceledRecovered");
    //                 }
    //             } else {
    //                 return Err(error!(MYERROR::NotReady));
    //                 // msg!("${}",ItemStatus::SolDeposited.to_u8())
    //             }

    //             transfered = true;
    //         }
    //     }

    //     if !transfered {
    //         return Err(error!(MYERROR::NoSend));
    //     }

    //     if !authorized {
    //         return Err(error!(MYERROR::UserNotPartOfTrade));
    //     }

    //     // if not already, Swap status changed to 90 (canceled)
    //     if ctx.accounts.swap_data_account.status != TradeStatus::Canceling.to_u8() {
    //         ctx.accounts.swap_data_account.status = TradeStatus::Canceling.to_u8();
    //         msg!("General status changed to canceling");
    //     }
    //     Ok(())
    // }

    // /// @notice Claim NFT from escrow, retrieving it if previously deposited.
    // /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and transfers the NFT from the escrow to the owner. If no more NFT is held by the PDA ATAs, close PDA ATA and send rent fund to user.
    // /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    // /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    // /// @accounts system_program = SYSTEM_PROGRAM_ID
    // /// @accounts metadata_program => METADATA_PROGRAM_ID
    // /// @accounts sysvar_instructions => SYSVAR_INSTRUCTION_ID
    // /// @accounts spl_token_program => TOKEN_PROGRAM_ID
    // /// @accounts spl_ata_program => SPL_TOKEN_PROGRAM_ID
    // /// @accounts swap_data_account => Swap's PDA corresponding to seeds
    // /// @accounts user => User that will potentially receive the NFT
    // /// @accounts signer => Initializer or User
    // /// @accounts swap_data_account_ata => Swap's PDA ATA related to mint
    // /// @accounts user_ata => User ATA related to mint
    // /// @accounts mint => mint Account of the NFT
    // /// @accounts nft_metadata => metadata account
    // /// @accounts nft_master_edition => if !pNFT: signer / if pNFT: masterEdition account
    // /// @accounts owner_token_record => if !pNFT: signer / if pNFT: swap_data_account's token record account (seed:'metadata',METADATA_PROGRAM,mint,'token_record',swap_data_account_mint_ata; programAssociated:METADATA_PROGRAM)
    // /// @accounts destination_token_record => if !pNFT: signer / if pNFT: initial owner's token record account (seed:'metadata',METADATA_PROGRAM,mint,'token_record',initial_owner_mint_ata; programAssociated:METADATA_PROGRAM)
    // /// @accounts auth_rules_program => metaplex auth rules program (auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg)
    // /// @accounts auth_rules => if !pNFT: signer / if pNFT: auth rules account linked to the mint (get from mint account data)
    // /// @return Void
    // pub fn cancel_nft(
    //     ctx: Context<ClaimNft>,
    //     seed: Vec<u8>,
    //     bump: u8
    //     // _metadata_bump: u8,
    // ) -> Result<()> {
    //     require!(
    //         ctx.accounts.swap_data_account.status == TradeStatus::Initialized.to_u8() ||
    //             ctx.accounts.swap_data_account.status == TradeStatus::Canceling.to_u8(),
    //         MYERROR::NotReady
    //     );
    //     let mut authorized = false;

    //     if
    //         ctx.accounts.signer.key().eq(&ctx.accounts.swap_data_account.initializer) ||
    //         ctx.accounts.swap_data_account.status == TradeStatus::Canceling.to_u8()
    //     {
    //         authorized = true;
    //     }

    //     let mut transfered: bool = false;
    //     // find the item linked with shared Accounts
    //     for item_id in 0..ctx.accounts.swap_data_account.items.len() {
    //         if
    //             ctx.accounts.swap_data_account.items[item_id].owner.eq(
    //                 &ctx.accounts.signer.key()
    //             ) &&
    //             !authorized
    //         {
    //             authorized = true;
    //         }

    //         if !ctx.accounts.swap_data_account.items[item_id].is_compressed {
    //             if
    //                 ctx.accounts.swap_data_account.items[item_id].is_nft &&
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                     ItemStatus::NFTDeposited.to_u8() &&
    //                 ctx.accounts.swap_data_account.items[item_id].mint.eq(
    //                     &ctx.accounts.user_ata.mint
    //                 ) &&
    //                 ctx.accounts.swap_data_account.items[item_id].mint.eq(
    //                     &ctx.accounts.swap_data_account_ata.mint
    //                 ) &&
    //                 ctx.accounts.swap_data_account.items[item_id].owner.eq(ctx.accounts.user.key) &&
    //                 !transfered
    //             {
    //                 let mut transfer_builder = TransferBuilder::new();

    //                 transfer_builder
    //                     .token(ctx.accounts.swap_data_account_ata.key())
    //                     .token_owner(ctx.accounts.swap_data_account.key())
    //                     .destination_token(ctx.accounts.user_ata.key())
    //                     .destination_owner(ctx.accounts.user.key())
    //                     .mint(ctx.accounts.mint.key())
    //                     .metadata(ctx.accounts.nft_metadata.key())
    //                     .authority(ctx.accounts.swap_data_account.key())
    //                     .payer(ctx.accounts.signer.key())
    //                     .system_program(ctx.accounts.system_program.key())
    //                     .sysvar_instructions(ctx.accounts.sysvar_instructions.key())
    //                     .spl_token_program(ctx.accounts.spl_token_program.key())
    //                     .spl_ata_program(ctx.accounts.spl_ata_program.key());

    //                 msg!("4");

    //                 // creating vase transfer info
    //                 let mut transfer_infos = vec![
    //                     ctx.accounts.swap_data_account_ata.to_account_info(),
    //                     ctx.accounts.user_ata.to_account_info(),
    //                     ctx.accounts.swap_data_account.to_account_info(),
    //                     ctx.accounts.user.to_account_info(),
    //                     ctx.accounts.mint.to_account_info(),
    //                     ctx.accounts.nft_metadata.to_account_info(),
    //                     ctx.accounts.signer.to_account_info(),
    //                     ctx.accounts.system_program.to_account_info(),
    //                     ctx.accounts.sysvar_instructions.to_account_info(),
    //                     ctx.accounts.spl_token_program.to_account_info(),
    //                     ctx.accounts.spl_ata_program.to_account_info(),
    //                     ctx.accounts.sysvar_instructions.to_account_info(),
    //                     ctx.accounts.metadata_program.to_account_info()
    //                 ];

    //                 let metadata: Metadata = Metadata::safe_deserialize(
    //                     &ctx.accounts.nft_metadata.to_account_info().data.borrow()
    //                 )?;

    //                 msg!("5");

    //                 if
    //                     matches!(
    //                         metadata.token_standard,
    //                         Some(TokenStandard::ProgrammableNonFungible)
    //                     )
    //                 {
    //                     // build extra info for pNFT
    //                     transfer_builder
    //                         .edition(Some(ctx.accounts.nft_master_edition.key()))
    //                         .token_record(Some(ctx.accounts.owner_token_record.key()))
    //                         .destination_token_record(
    //                             Some(ctx.accounts.destination_token_record.key())
    //                         )
    //                         .authorization_rules_program(
    //                             Some(ctx.accounts.auth_rules_program.key())
    //                         )
    //                         .authorization_rules(Some(ctx.accounts.auth_rules.key()));

    //                     transfer_infos.push(ctx.accounts.nft_master_edition.to_account_info());
    //                     transfer_infos.push(ctx.accounts.owner_token_record.to_account_info());
    //                     transfer_infos.push(
    //                         ctx.accounts.destination_token_record.to_account_info()
    //                     );
    //                     transfer_infos.push(ctx.accounts.auth_rules_program.to_account_info());
    //                     transfer_infos.push(ctx.accounts.auth_rules.to_account_info());
    //                     msg!("6.1");
    //                 } else {
    //                     // Other NFT
    //                     msg!("6.2");
    //                 }

    //                 let transfer_ix = transfer_builder
    //                     .transfer_args(TransferArgs::V1 {
    //                         amount: ctx.accounts.swap_data_account.items[
    //                             item_id
    //                         ].amount.unsigned_abs(),
    //                         authorization_data: None,
    //                     })
    //                     .instruction();
    //                 msg!("7");

    //                 invoke_signed(&transfer_ix, &transfer_infos, &[&[&seed[..], &[bump]]])?;

    //                 msg!("NFT item sent");

    //                 let _ = ctx.accounts.swap_data_account_ata.reload();

    //                 // If Swap's PDA ATA balance is null, closes the account and send the rent to user
    //                 if ctx.accounts.swap_data_account_ata.amount.eq(&0) {
    //                     let ix2 = spl_token::instruction::close_account(
    //                         ctx.accounts.spl_token_program.key,
    //                         &ctx.accounts.swap_data_account_ata.key(),
    //                         &ctx.accounts.user.key(),
    //                         &ctx.accounts.swap_data_account.key(),
    //                         &[&ctx.accounts.swap_data_account.key()]
    //                     )?;

    //                     invoke_signed(
    //                         &ix2,
    //                         &[
    //                             ctx.accounts.spl_token_program.to_account_info(),
    //                             ctx.accounts.swap_data_account_ata.to_account_info(),
    //                             ctx.accounts.swap_data_account.to_account_info(),
    //                             ctx.accounts.user.to_account_info(),
    //                         ],
    //                         &[&[&seed[..], &[bump]]]
    //                     )?;
    //                     msg!("ATA closed");
    //                 }

    //                 // Update item status to 91 (CancelRecovered)
    //                 ctx.accounts.swap_data_account.items[item_id].status =
    //                     ItemStatus::NFTcanceledRecovered.to_u8();
    //                 msg!("NFT item status changed to NFTcanceledRecovered");

    //                 transfered = true;
    //             }
    //         }
    //     }

    //     if !transfered {
    //         return Err(error!(MYERROR::NoSend));
    //     }
    //     if !authorized {
    //         return Err(error!(MYERROR::NotAuthorized));
    //     }

    //     // If not already, update Swap's status to 90 (canceled)
    //     if ctx.accounts.swap_data_account.status != TradeStatus::Canceling.to_u8() {
    //         ctx.accounts.swap_data_account.status = TradeStatus::Canceling.to_u8();
    //         msg!("General status changed to Canceling");
    //     }

    //     Ok(())
    // }

    // pub fn validate_cancel(ctx: Context<ValidateAndClose>, _seed: Vec<u8>) -> Result<()> {
    //     if
    //         !(
    //             ctx.accounts.swap_data_account.status == TradeStatus::Canceling.to_u8() ||
    //             ctx.accounts.swap_data_account.status == TradeStatus::Initialized.to_u8()
    //         )
    //     {
    //         return Err(error!(MYERROR::NotReady));
    //     }

    //     let nbr_items = ctx.accounts.swap_data_account.items.len();

    //     // Checks all items are canceled
    //     for item_id in 0..nbr_items {
    //         if
    //             !(
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                     ItemStatus::SolcanceledRecovered.to_u8() ||
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                     ItemStatus::NFTcanceledRecovered.to_u8() ||
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                     ItemStatus::SolPending.to_u8() ||
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                     ItemStatus::NFTPending.to_u8() ||
    //                 ctx.accounts.swap_data_account.items[item_id].status ==
    //                     ItemStatus::SolToClaim.to_u8()
    //             )
    //         {
    //             return Err(error!(MYERROR::NotReady));
    //         }
    //     }

    //     // Changing Swap status to 91 (canceledRecovered)
    //     ctx.accounts.swap_data_account.status = TradeStatus::Closed.to_u8();
    //     msg!("General status changed to Closed");

    //     Ok(())
    // }
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, seeds = [&seed[..]], bump, space = SwapData::LEN)]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account()]
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct AddBid<'info> {
    #[account(
        mut,
        seeds = [&seed[..]],
        bump,
        constraint = swap_data_account.maker == signer.key() @ MYERROR::NotMaker
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
//         constraint = swap_data_account.initializer == signer.key() @ MYERROR::NotMaker
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
    #[account(constraint = metadata_program.key().eq(&MPL_TOKEN_METADATA_ID) @ MYERROR::IncorrectMetadata)]
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

// #[derive(Accounts)]
// #[instruction(seed: Vec<u8>)]
// pub struct Validate<'info> {
//     #[account(
//         mut,
//         seeds = [&seed[..]], bump,
//         constraint = swap_data_account.initializer == signer.key() @ MYERROR::NotMaker
//     )]
//     swap_data_account: Box<Account<'info, SwapData>>,
//     #[account(mut)]
//     signer: Signer<'info>,
// }

// #[derive(Accounts)]
// #[instruction(seed: Vec<u8>)]
// pub struct ValidateDeposited<'info> {
//     #[account(
//         mut,
//         seeds = [&seed[..]], bump,
//     )]
//     swap_data_account: Box<Account<'info, SwapData>>,
//     #[account(mut)]
//     signer: Signer<'info>,
// }

// #[derive(Accounts)]
// #[instruction(seed: Vec<u8>)]
// pub struct ValidateAndClose<'info> {
//     #[account()]
//     system_program: Program<'info, System>,
//     #[account()]
//     associated_token_program: Program<'info, AssociatedToken>,
//     #[account(
//         mut,
//         seeds = [&seed[..]],
//         bump,
//         close = signer,
//         constraint = swap_data_account.initializer == signer.key() @ MYERROR::NotMaker
//     )]
//     swap_data_account: Box<Account<'info, SwapData>>,
//     #[account(mut)]
//     signer: Signer<'info>,
// }

// #[derive(Accounts)]
// #[instruction(seed: Vec<u8>)]
// pub struct ClaimNft<'info> {
//     #[account()]
//     system_program: Program<'info, System>,
//     /// CHECK: in constraint
//     #[account(constraint = metadata_program.key().eq(&MPL_TOKEN_METADATA_ID) @ MYERROR::IncorrectMetadata)]
//     metadata_program: AccountInfo<'info>,
//     /// CHECK: in constraint
//     #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
//     sysvar_instructions: AccountInfo<'info>,
//     #[account()]
//     spl_token_program: Program<'info, Token>,
//     /// CHECK: in constraints
//     #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
//     spl_ata_program: AccountInfo<'info>,
//     #[account(
//         mut,
//         seeds = [&seed[..]],
//         bump
//     )]
//     swap_data_account: Box<Account<'info, SwapData>>,
//     /// CHECK: user Account
//     #[account(mut,
//         constraint = user_ata.owner == user.key() @ MYERROR::IncorrectOwner
//         )]
//     user: AccountInfo<'info>,
//     #[account(mut)]
//     signer: Signer<'info>,
//     #[account(
//         mut,
//         constraint = swap_data_account_ata.mint == user_ata.mint  @ MYERROR::MintIncorrect,
//         constraint = swap_data_account_ata.owner == swap_data_account.key()  @ MYERROR::IncorrectOwner
//     )]
//     swap_data_account_ata: Account<'info, TokenAccount>,
//     #[account(
//         mut,
//         constraint = user_ata.owner == user.key() @ MYERROR::IncorrectOwner
//     )]
//     user_ata: Account<'info, TokenAccount>,

//     #[account(constraint = swap_data_account_ata.mint == mint.key()  @ MYERROR::MintIncorrect)]
//     mint: Account<'info, Mint>,
//     /// CHECK: in constraints
//     #[account(mut,
//         seeds =[
//             b"metadata".as_ref(),
//             metadata_program.key().as_ref(),
//             mint.key().as_ref()],
//         bump,
//         owner = metadata_program.key() @ MYERROR::IncorrectMetadata,
//         seeds::program = metadata_program.key()
//     )]
//     nft_metadata: AccountInfo<'info>,
//     /// CHECK: in constraints
//     #[account()]
//     nft_master_edition: AccountInfo<'info>,
//     /// CHECK: in constraints
//     #[account(mut)]
//     owner_token_record: AccountInfo<'info>,
//     /// CHECK: in constraints
//     #[account(mut)]
//     destination_token_record: AccountInfo<'info>,
//     /// CHECK: account checked in CPI
//     #[account()]
//     auth_rules_program: AccountInfo<'info>,
//     /// CHECK: account checked in CPI
//     #[account()]
//     auth_rules: AccountInfo<'info>,
// }

// #[derive(Accounts)]
// #[instruction(seed: Vec<u8>)]
// pub struct ClaimSol<'info> {
//     #[account()]
//     system_program: Program<'info, System>,
//     #[account()]
//     spl_token_program: Program<'info, Token>,
//     // /// CHECK: in constraints
//     // #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
//     // spl_ata_program: AccountInfo<'info>,
//     #[account(mut,seeds = [&seed[..]], bump)]
//     swap_data_account: Box<Account<'info, SwapData>>,
//     /// CHECK: inside the function Logic
//     #[account(mut)]
//     swap_data_account_ata: AccountInfo<'info>,
//     /// CHECK: user Account
//     #[account(mut)]
//     user: AccountInfo<'info>,
//     /// CHECK: inside the function Logic
//     #[account(mut)]
//     user_ata: AccountInfo<'info>,
//     #[account(mut)]
//     signer: Signer<'info>,
// }

#[account]
#[derive(Default)]
pub struct SwapData {
    pub maker: Pubkey, // maker Pubkey
    pub accepted_bid_index: i8, // tdefault -1, index of accepted bid if Taker accepted one
    pub taker: Pubkey, // taker Pubkey
    pub seed: String, // String to initialize PDA's seed
    pub bids: Vec<Bid>, // List of possible bids Taker can accept
    pub accepted_payement: Pubkey, // List of tokens accepted for payment
}
impl SwapData {
    const LEN: usize =
        8 + //Base
        25 * Bid::LEN + //bid len
        32 + //seed
        32 * 3; //Pubkey
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct Bid {
    collection: Pubkey, // Mint of the NFT. if item not NFT expected PublicKey should be system_program
    amount: i64, // amount of tokens or lamports to transfer. amount < 0 maker gives
}
impl Bid {
    const LEN: usize = 32 + 8;
}

pub enum TradeStatus {
    Initializing,
    Initialized,
    Accepted,
    Closed,
    Canceling,
}

impl TradeStatus {
    pub fn from_u8(status: u8) -> TradeStatus {
        match status {
            0 => TradeStatus::Initializing,
            1 => TradeStatus::Initialized,
            2 => TradeStatus::Accepted,
            3 => TradeStatus::Closed,

            100 => TradeStatus::Canceling,

            _ => panic!("Invalid Proposal Status"),
        }
    }

    pub fn to_u8(&self) -> u8 {
        match self {
            TradeStatus::Initializing => 0,
            TradeStatus::Initialized => 1,
            TradeStatus::Accepted => 2,
            TradeStatus::Closed => 3,

            TradeStatus::Canceling => 100,
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
    /// NS ERRORS 8000-8999

    /// Data errors 8000-8099
    #[msg("List of Bids is empty")]
    EmptyBids,
    #[msg("Incorrect Mint")]
    MintIncorrect,

    /// User errors 8100-8199
    #[msg("wrong signer, only maker can perform this action")]
    NotMaker,
    #[msg("wrong address for Taker")]
    NotTaker,
    #[msg("Owner Given is incorrect")]
    IncorrectOwner,

    /// Program errors 8900-8999
    #[msg("Incorrect Sysvar Instruction Program")]
    IncorrectSysvar,
    #[msg("Incorrect Metadata Program")]
    IncorrectMetadata,
    #[msg("Incorrect Token ATA Program")]
    IncorrectSplAta,

    // #[msg("User not part of the trade")]
    // UserNotPartOfTrade,

    // AmountIncorrect,
    // #[msg("User shouldn't be sending funds")]
    // ShouldntSend,
    // #[msg("Nothing was found in the program to be sent to the swap or you")]
    // NoSend,
    // #[msg("Sum of trade isn't null")]
    // SumNotNull,
    // #[msg("Not ready for claim")]
    // NotReady,
    // #[msg("Given data isn't fitting")]
    // UnexpectedData,
    // #[msg("wrong system program Id passed")]
    // NotSystemProgram,
    // #[msg("wrong token program Id passed")]
    // NotTokenProgram,
    // #[msg("wrong Pda program Id passed")]
    // NotPda,
    // #[msg("wrong bump")]
    // NotBump,
    // #[msg("The status given is not correct")]
    // UnexpectedState,
    // #[msg("owner checks unsuccessfuls")]
    // InvalidAccountData,
    // #[msg("Incorrect init data length")]
    // IncorrectLength,
    // #[msg("Not enough funds")]
    // NotEnoughFunds,

    // #[msg("Missing some account passed")]
    // RemainingAccountNotFound,
    // #[msg("Failed to build the instruction")]
    // InstructionBuilderFailed,
    // #[msg("This is not a programmableNft")]
    // NotProgrammableNft,

    // #[msg("Incorrect token reccord account")]
    // IncorrectTokenRecord,
    // #[msg("Not authorized to perform this action")]
    // NotAuthorized,
    // #[msg("PreSeed has too many character (max: 32)")]
    // PreSeedTooLong,
    // #[msg("The list of token accepted for payment is empty")]
    // NoAcceptedPaymentGiven,
    // #[msg("The item you're trying to add already exists in the Swap")]
    // AlreadyExist,
}
