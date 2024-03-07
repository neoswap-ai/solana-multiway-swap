use ::{
    anchor_lang::{
        prelude::*,
        solana_program::{
            instruction::Instruction,
            program::{ invoke, invoke_signed },
            pubkey::Pubkey,
            // system_program::ID as SYSTEM_PROGRAM_ID,
            sysvar::instructions::ID as SYSVAR_INSTRUCTIONS_ID,
            pubkey,
        },
    },
    anchor_spl::token::{ spl_token, Mint, Token, TokenAccount },
    mpl_token_metadata::{
        accounts::Metadata,
        instructions::TransferBuilder,
        programs::MPL_TOKEN_METADATA_ID,
        types::{ TokenStandard, TransferArgs },
    },
    spl_associated_token_account::ID as SPL_ASSOCIATED_TOKEN_ACCOUNT_ID,
};

declare_id!("2vumtPDSVo3UKqYYxMVbDaQz1K4foQf6A31KiUaii1M7"); // mainnet test
// declare_id!("Et2RutKNHzB6XmsDXUGnDHJAGAsJ73gdHVkoKyV79BFY");
// declare_id!("HCg7NKnvWwWZdLXqDwZdjn9RDz9eLDYuSAcUHqeC1vmH");
// declare_id!("EU5zoiRSvPE5k1Fy49UJZvPMBKxzatdBGFJ11XPFD42Z");
// declare_id!("28c8n7mgURdiuo1n2Po7kjMNqnhNihMC5aJLTG6bLn5E"); // devnet Test

///@title List of function to manage NeoSwap's multi-items swaps
#[program]
pub mod neo_swap {
    use super::*;

    const NS_FEE_ACCOUNT: Pubkey = pubkey!("FjecsBcSXQh4rjPSksh2eBiXUswcMpAwU25ykcr842j8");

    pub fn make_swap(ctx: Context<MakeSwap>, bid_to_add: Bid, end_date: i64) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;
        let maker = &ctx.accounts.maker;
        let nft_mint_maker = &ctx.accounts.nft_mint_maker;

        require!(end_date.is_positive() || end_date.eq(&0), MYERROR::IncorrectDate);

        // Write according Data into Swap's PDA
        swap_data_account.maker = maker.key();
        swap_data_account.nft_mint_maker = nft_mint_maker.key();

        swap_data_account.bids = [].to_vec();

        swap_data_account.royalties_paid = false;

        swap_data_account.end_time = end_date;

        swap_data_account.seed = init_get_seed_string(maker.key(), nft_mint_maker.key());
        swap_data_account.payment_mint = ctx.accounts.mint_token.key();

        require_keys_eq!(
            swap_data_account.payment_mint,
            ctx.accounts.mint_token.key(),
            MYERROR::MintIncorrect
        );

        //Add bid to the data
        swap_data_account.bids.push(bid_to_add.clone());
        msg!("bid_to_add {:?}", bid_to_add);

        //transfer Maker NFT
        let transfert_nft_data = create_p_nft_instruction(1, SendPNft {
            from: maker.to_account_info(),
            from_ata: ctx.accounts.maker_nft_ata.to_account_info(),
            to: swap_data_account.to_account_info(),
            to_ata: ctx.accounts.swap_data_account_nft_ata.to_account_info(),
            mint: nft_mint_maker.to_account_info(),
            signer: maker.to_account_info(),
            auth_rules: ctx.accounts.auth_rules_maker.clone(),
            auth_rules_program: ctx.accounts.auth_rules_program.to_account_info(),
            destination_token_record: ctx.accounts.destination_token_record_maker.clone(),
            metadata_program: ctx.accounts.metadata_program.to_account_info(),
            nft_master_edition: ctx.accounts.nft_master_edition_maker.clone(),
            nft_metadata: ctx.accounts.nft_metadata_maker.to_account_info(),
            owner_token_record: ctx.accounts.owner_token_record_maker.clone(),
            sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            ata_program: ctx.accounts.ata_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        }).unwrap();
        msg!(
            "transfer {:?} of {:?} from {:?} to {:?} ",
            1,
            shorten(ctx.accounts.nft_mint_maker.key()),
            shorten(ctx.accounts.maker_nft_ata.key()),
            shorten(ctx.accounts.swap_data_account_nft_ata.key())
        );
        invoke(&transfert_nft_data.instruction, &transfert_nft_data.account_infos)?;

        //Calculate amount to send
        let mut amount_to_send = bid_to_add.maker_neoswap_fee
            .checked_add(bid_to_add.maker_royalties)
            .unwrap();

        if bid_to_add.amount.is_negative() {
            msg!("bid_to_add.amount {:?}", -bid_to_add.amount);
            amount_to_send = amount_to_send.checked_add(bid_to_add.amount.unsigned_abs()).unwrap();
        }

        //transfer Maker Token
        let transfert_token_data = get_transfer_token_ix(amount_to_send, SendToken {
            from: ctx.accounts.maker.to_account_info(),
            from_ata: ctx.accounts.maker_token_ata.clone(),
            to: swap_data_account.to_account_info(),
            to_ata: ctx.accounts.swap_data_account_token_ata.clone(),
            // mint: ctx.accounts.mint_token.clone(),
            token_program: ctx.accounts.token_program.to_account_info(),
        }).unwrap();

        msg!(
            "transfer {:?} of {:?} from {:?} to {:?} ",
            amount_to_send,
            shorten(swap_data_account.payment_mint),
            shorten(ctx.accounts.maker.key()),
            shorten(swap_data_account.key())
        );
        invoke(&transfert_token_data.instruction, &transfert_token_data.account_infos)?;

        Ok(())
    }

    pub fn take_swap(ctx: Context<TakeSwap>, bid_to_accept: Bid) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;
        let maker = &ctx.accounts.maker;
        let taker = &ctx.accounts.taker;
        let nft_mint_taker = &ctx.accounts.nft_mint_taker;

        require!(swap_data_account.accepted_bid.is_none(), MYERROR::AlreadyTaken);
        require!(swap_data_account.nft_mint_taker.is_none(), MYERROR::AlreadyTaken);
        require!(swap_data_account.taker.is_none(), MYERROR::AlreadyTaken);
        require!(
            swap_data_account.end_time > Clock::get().unwrap().unix_timestamp ||
                swap_data_account.end_time.eq(&0),
            MYERROR::TooLate
        );

        require_keys_eq!(
            swap_data_account.payment_mint,
            ctx.accounts.mint_token.key(),
            MYERROR::MintIncorrect
        );

        // Find Bid to accept
        let found_bid_to_accept = swap_data_account.bids
            .iter()
            .find(|item_search| {
                item_search.collection.eq(&bid_to_accept.collection) &&
                    item_search.amount == bid_to_accept.amount &&
                    item_search.maker_neoswap_fee == bid_to_accept.maker_neoswap_fee &&
                    item_search.maker_royalties == bid_to_accept.maker_royalties &&
                    item_search.taker_neoswap_fee == bid_to_accept.taker_neoswap_fee &&
                    item_search.taker_royalties == bid_to_accept.taker_royalties
            })
            .expect(&MYERROR::BidNotFound.to_string())
            .clone();

        // checking if NFT is part of collection
        let meta_collection = get_metadata(
            ctx.accounts.nft_metadata_taker.to_account_info()
        ).collection.expect(&MYERROR::CollectionNotFound.to_string());

        require!(meta_collection.verified, MYERROR::UnVerifiedCollection);
        require!(
            meta_collection.key.eq(&found_bid_to_accept.collection),
            MYERROR::IncorrectCollection
        );
        // Adding the Bid to the data:
        swap_data_account.accepted_bid = Some(found_bid_to_accept.clone());
        swap_data_account.taker = Some(taker.key());
        swap_data_account.nft_mint_taker = Some(nft_mint_taker.key());

        //transfer Maker NFT
        let transfert_nft_data = create_p_nft_instruction(1, SendPNft {
            from: taker.to_account_info(),
            from_ata: ctx.accounts.taker_nft_ata.to_account_info(),
            to: maker.to_account_info(),
            to_ata: ctx.accounts.maker_nft_ata.to_account_info(),
            mint: nft_mint_taker.to_account_info(),
            signer: taker.to_account_info(),
            auth_rules: ctx.accounts.auth_rules_taker.clone(),
            auth_rules_program: ctx.accounts.auth_rules_program.to_account_info(),
            destination_token_record: ctx.accounts.destination_token_record_taker.clone(),
            metadata_program: ctx.accounts.metadata_program.to_account_info(),
            nft_master_edition: ctx.accounts.nft_master_edition_taker.clone(),
            nft_metadata: ctx.accounts.nft_metadata_taker.to_account_info(),
            owner_token_record: ctx.accounts.owner_token_record_taker.clone(),
            sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            ata_program: ctx.accounts.ata_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        }).unwrap();
        msg!(
            "transfer {:?} of {:?} from {:?} to {:?} ",
            1,
            shorten(nft_mint_taker.key()),
            shorten(ctx.accounts.taker_nft_ata.key()),
            shorten(ctx.accounts.maker_nft_ata.key())
        );
        invoke(&transfert_nft_data.instruction, &transfert_nft_data.account_infos)?;

        //  send funds to maker
        if found_bid_to_accept.amount.is_positive() {
            let transfert_token_data = get_transfer_token_ix(
                found_bid_to_accept.amount.unsigned_abs(),
                SendToken {
                    from: taker.to_account_info(),
                    from_ata: ctx.accounts.taker_token_ata.clone(),
                    to: maker.clone(),
                    to_ata: ctx.accounts.maker_token_ata.clone(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                }
            ).unwrap();

            msg!(
                "transfer {:?} of {:?} from {:?} to {:?} ",
                found_bid_to_accept.amount.unsigned_abs(),
                shorten(swap_data_account.payment_mint),
                shorten(taker.key()),
                shorten(maker.key())
            );
            invoke(&transfert_token_data.instruction, &transfert_token_data.account_infos)?;
        }

        // transfer fees taker Token
        let fee_taker = found_bid_to_accept.taker_neoswap_fee + found_bid_to_accept.taker_royalties;

        if fee_taker > 0 {
            let transfert_fee_data = get_transfer_token_ix(fee_taker, SendToken {
                from: taker.to_account_info(),
                from_ata: ctx.accounts.taker_token_ata.clone(),
                to: swap_data_account.to_account_info(),
                to_ata: ctx.accounts.swap_data_account_token_ata.clone(),
                token_program: ctx.accounts.token_program.to_account_info(),
            }).unwrap();

            msg!(
                "transfer fees {:?} of {:?} from {:?} to {:?} ",
                fee_taker,
                shorten(swap_data_account.payment_mint),
                shorten(taker.key()),
                shorten(swap_data_account.key())
            );
            invoke(&transfert_fee_data.instruction, &transfert_fee_data.account_infos)?;
        }

        Ok(())
    }

    pub fn pay_royalties(ctx: Context<PayRoyalties>) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.royalties_paid == false,
            MYERROR::RoyaltiesAlreadyPaid
        );
        let seed: &[u8] = &get_seed_buffer(ctx.accounts.swap_data_account.clone());
        let bump = ctx.bumps.swap_data_account;

        let payment_mint = ctx.accounts.swap_data_account.payment_mint;

        let token_program = ctx.accounts.token_program.to_account_info().clone();

        let sda = ctx.accounts.swap_data_account.to_account_info().clone();
        let sda_ata = ctx.accounts.swap_data_account_token_ata.clone();

        let accepted_bid = ctx.accounts.swap_data_account.accepted_bid
            .clone()
            .expect(&MYERROR::IncorrectState.to_string());

        // Paying Royalties
        // Maker
        let taker_amount = accepted_bid.taker_royalties;
        msg!("taker_amount {:?}", taker_amount);

        if taker_amount > 0 {
            let maker_meta = get_metadata(ctx.accounts.nft_metadata_taker.clone());
            let maker_creators = maker_meta.creators.unwrap();

            let maker_creator0 = maker_creators[0].clone();
            let creator0_amount = (taker_amount * (maker_creator0.share as u64)) / 100;
            if creator0_amount > 0 {
                let creator0_data = get_transfer_token_ix(creator0_amount, SendToken {
                    from: sda.clone(),
                    from_ata: sda_ata.clone(),
                    to: ctx.accounts.maker_creator0.clone(),
                    to_ata: ctx.accounts.maker_creator0_token_ata.clone(),
                    token_program: token_program.clone(),
                }).unwrap();

                msg!(
                    "0 taker pays {:?} ({}/100) of {:?} from {:?} to {:?} ",
                    creator0_amount,
                    maker_creator0.share,
                    shorten(payment_mint),
                    shorten(ctx.accounts.swap_data_account.key()),
                    shorten(ctx.accounts.maker_creator0.key())
                );
                invoke_signed(
                    &creator0_data.instruction,
                    &creator0_data.account_infos,
                    &[&[&seed[..], &[bump]]]
                )?;
            } else {
                msg!("maker 0 amount == 0 {:?}", maker_creator0);
            }

            if maker_creators.len() >= 2 {
                let maker_creator = maker_creators[1].clone();
                let creator_amount = (taker_amount * (maker_creator.share as u64)) / 100;
                if creator_amount > 0 {
                    let creator_data = get_transfer_token_ix(creator_amount, SendToken {
                        from: ctx.accounts.swap_data_account.to_account_info().clone(),
                        from_ata: ctx.accounts.swap_data_account_token_ata.clone(),
                        to: ctx.accounts.maker_creator1.clone(),
                        to_ata: ctx.accounts.maker_creator1_token_ata.clone(),
                        token_program: token_program.clone(),
                    }).unwrap();

                    msg!(
                        "1 taker pays {:?} ({}/100) of {:?} from {:?} to {:?} ",
                        creator_amount,
                        maker_creator.share,
                        shorten(payment_mint),
                        shorten(ctx.accounts.swap_data_account.key()),
                        shorten(ctx.accounts.maker_creator1.key())
                    );
                    invoke_signed(
                        &creator_data.instruction,
                        &creator_data.account_infos,
                        &[&[&seed[..], &[bump]]]
                    )?;
                } else {
                    msg!("maker 1 amount {:?}", maker_creator);
                }
            }

            if maker_creators.len() >= 3 {
                let maker_creator = maker_creators[2].clone();
                let creator_amount = (taker_amount * (maker_creator.share as u64)) / 100;
                if creator_amount > 0 {
                    let creator_data = get_transfer_token_ix(creator_amount, SendToken {
                        from: sda.clone(),
                        from_ata: sda_ata.clone(),
                        to: ctx.accounts.maker_creator2.to_account_info(),
                        to_ata: ctx.accounts.maker_creator2_token_ata.clone(),
                        token_program: token_program.clone(),
                    }).unwrap();

                    msg!(
                        "2 taker pays {:?} ({}/100) of {:?} from {:?} to {:?} ",
                        creator_amount,
                        maker_creator.share,
                        shorten(payment_mint),
                        shorten(ctx.accounts.swap_data_account.key()),
                        shorten(ctx.accounts.maker_creator2.key())
                    );
                    invoke_signed(
                        &creator_data.instruction,
                        &creator_data.account_infos,
                        &[&[&seed[..], &[bump]]]
                    )?;
                } else {
                    msg!("maker 2 amount {:?}", maker_creator);
                }
            }
        } else {
            msg!("maker fee skipped");
        }
        // Taker
        let taker_meta = get_metadata(ctx.accounts.nft_metadata_taker.clone());
        let taker_creators = taker_meta.creators.unwrap();
        let maker_amount = accepted_bid.maker_royalties;
        msg!("maker_amount {:?}", maker_amount);

        if maker_amount > 0 {
            let taker_creator0 = taker_creators[0].clone();
            let creator0_amount = (maker_amount * (taker_creator0.share as u64)) / 100;
            if creator0_amount > 0 {
                let creator0_data = get_transfer_token_ix(creator0_amount, SendToken {
                    from: sda.clone(),
                    from_ata: sda_ata.clone(),
                    to: ctx.accounts.taker_creator0.to_account_info(),
                    to_ata: ctx.accounts.taker_creator0_token_ata.clone(),
                    token_program: token_program.clone(),
                }).unwrap();

                msg!(
                    "0 maker pays {:?} ({}/100) of {:?} from {:?} to {:?} ",
                    creator0_amount,
                    taker_creator0.share,
                    shorten(payment_mint),
                    shorten(ctx.accounts.swap_data_account.key()),
                    shorten(ctx.accounts.taker_creator0.key())
                );
                invoke_signed(
                    &creator0_data.instruction,
                    &creator0_data.account_infos,
                    &[&[&seed[..], &[bump]]]
                )?;
            } else {
                msg!("taker 0 amount == 0  {:?}", taker_creator0);
            }
            if taker_creators.len() >= 2 {
                let taker_creator = taker_creators[1].clone();
                let creator_amount = (maker_amount * (taker_creator.share as u64)) / 100;
                if creator_amount > 0 {
                    let creator_data = get_transfer_token_ix(creator_amount, SendToken {
                        from: sda.clone(),
                        from_ata: sda_ata.clone(),
                        to: ctx.accounts.taker_creator1.to_account_info(),
                        to_ata: ctx.accounts.taker_creator1_token_ata.clone(),
                        token_program: token_program.clone(),
                    }).unwrap();

                    msg!(
                        "1 maker pays {:?} ({}/100) of {:?} from {:?} to {:?} ",
                        creator_amount,
                        taker_creator.share,
                        shorten(payment_mint),
                        shorten(ctx.accounts.swap_data_account.key()),
                        shorten(ctx.accounts.taker_creator1.key())
                    );
                    invoke_signed(
                        &creator_data.instruction,
                        &creator_data.account_infos,
                        &[&[&seed[..], &[bump]]]
                    )?;
                } else {
                    msg!("taker 1 amount {:?}", taker_creator);
                }
            }

            if taker_creators.len() >= 3 {
                let taker_creator = taker_creators[2].clone();

                let creator_amount = (maker_amount * (taker_creator.share as u64)) / 100;
                if creator_amount > 0 {
                    let creator_data = get_transfer_token_ix(creator_amount, SendToken {
                        from: sda.clone(),
                        from_ata: sda_ata.clone(),
                        to: ctx.accounts.taker_creator2.to_account_info(),
                        to_ata: ctx.accounts.taker_creator2_token_ata.clone(),
                        token_program: token_program.clone(),
                    }).unwrap();

                    msg!(
                        "2 maker pays {:?} ({}/100) of {:?} from {:?} to {:?} ",
                        creator_amount,
                        taker_creator.share,
                        shorten(ctx.accounts.swap_data_account.payment_mint),
                        shorten(ctx.accounts.swap_data_account.key()),
                        shorten(ctx.accounts.taker_creator2.key())
                    );
                    invoke_signed(
                        &creator_data.instruction,
                        &creator_data.account_infos,
                        &[&[&seed[..], &[bump]]]
                    )?;
                } else {
                    msg!("taker 2 amount {:?}", taker_creator);
                }
            }
        } else {
            msg!("taker fee skipped");
        }

        ctx.accounts.swap_data_account.royalties_paid = true;
        Ok(())
    }

    pub fn claim_swap(ctx: Context<ClaimSwap>) -> Result<()> {
        require_keys_eq!(ctx.accounts.ns_fee.key(), NS_FEE_ACCOUNT, MYERROR::IncorrectFeeAccount);
        require!(ctx.accounts.swap_data_account.royalties_paid == true, MYERROR::FeeNotPaid);

        let seed: &[u8] = &get_seed_buffer(ctx.accounts.swap_data_account.clone());
        let bump = ctx.bumps.swap_data_account;

        let accepted_bid = ctx.accounts.swap_data_account.accepted_bid
            .clone()
            .expect(&MYERROR::IncorrectState.to_string());

        // transfer Taker Tokens
        if accepted_bid.amount.is_negative() {
            let transfert_token_data = get_transfer_token_ix(
                accepted_bid.amount.unsigned_abs(),
                SendToken {
                    from: ctx.accounts.swap_data_account.to_account_info(),
                    from_ata: ctx.accounts.swap_data_account_token_ata.clone(),
                    to: ctx.accounts.taker.to_account_info().clone(),
                    to_ata: ctx.accounts.taker_token_ata.clone(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                }
            ).unwrap();

            msg!(
                "token transfer {:?} of {:?} from {:?} to {:?} ",
                ctx.accounts.swap_data_account_token_ata.amount,
                shorten(ctx.accounts.swap_data_account.payment_mint),
                shorten(ctx.accounts.swap_data_account.key()),
                shorten(ctx.accounts.maker.key())
            );
            invoke_signed(
                &transfert_token_data.instruction,
                &transfert_token_data.account_infos,
                &[&[&seed[..], &[bump]]]
            )?;
        }

        // claim maker's NFT
        let transfert_data = create_p_nft_instruction(1, SendPNft {
            from: ctx.accounts.swap_data_account.to_account_info(),
            from_ata: ctx.accounts.swap_data_account_nft_ata.to_account_info(),
            to: ctx.accounts.taker.to_account_info(),
            to_ata: ctx.accounts.taker_nft_ata_maker.to_account_info(),
            mint: ctx.accounts.nft_mint_maker.to_account_info(),
            signer: ctx.accounts.signer.to_account_info(),
            auth_rules: ctx.accounts.auth_rules_maker.clone(),
            auth_rules_program: ctx.accounts.auth_rules_program.to_account_info(),
            destination_token_record: ctx.accounts.destination_token_record_maker.clone(),
            metadata_program: ctx.accounts.metadata_program.to_account_info(),
            nft_master_edition: ctx.accounts.nft_master_edition_maker.clone(),
            nft_metadata: ctx.accounts.nft_metadata_maker.to_account_info(),
            owner_token_record: ctx.accounts.owner_token_record_maker.clone(),
            ata_program: ctx.accounts.ata_program.to_account_info(),
            sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        }).unwrap();

        msg!(
            "nft transfer {:?} of {:?} from {:?} to {:?} ",
            1,
            shorten(ctx.accounts.nft_mint_maker.key()),
            shorten(ctx.accounts.swap_data_account_nft_ata.key()),
            shorten(ctx.accounts.taker_nft_ata_maker.key())
        );

        invoke_signed(
            &transfert_data.instruction,
            &transfert_data.account_infos,
            &[&[&seed[..], &[bump]]]
        )?;

        // Paying NS Fees
        let neoswap_fee_amount = accepted_bid.maker_neoswap_fee + accepted_bid.taker_neoswap_fee;
        if neoswap_fee_amount > 0 {
            let ns_fee_data = get_transfer_token_ix(neoswap_fee_amount, SendToken {
                from: ctx.accounts.swap_data_account.to_account_info(),
                from_ata: ctx.accounts.swap_data_account_token_ata.clone(),
                to: ctx.accounts.ns_fee.to_account_info(),
                to_ata: ctx.accounts.ns_fee_token_ata.clone(),
                token_program: ctx.accounts.token_program.to_account_info(),
            }).unwrap();

            msg!(
                "ns Fee token transfer {:?} of {:?} from {:?} to {:?} ",
                neoswap_fee_amount,
                shorten(ctx.accounts.swap_data_account.payment_mint),
                shorten(ctx.accounts.swap_data_account.key()),
                shorten(ctx.accounts.ns_fee.key())
            );
            invoke_signed(
                &ns_fee_data.instruction,
                &ns_fee_data.account_infos,
                &[&[&seed[..], &[bump]]]
            )?;
        }

        //
        //
        //
        //
        //

        let _ = ctx.accounts.swap_data_account_nft_ata.reload();
        let _ = ctx.accounts.swap_data_account_token_ata.reload();

        if ctx.accounts.swap_data_account_token_ata.amount > 0 {
            let ns_fee_data = get_transfer_token_ix(
                ctx.accounts.swap_data_account_token_ata.amount,
                SendToken {
                    from: ctx.accounts.swap_data_account.to_account_info(),
                    from_ata: ctx.accounts.swap_data_account_token_ata.clone(),
                    to: ctx.accounts.maker.to_account_info(),
                    to_ata: ctx.accounts.maker_token_ata.clone(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                }
            ).unwrap();

            msg!(
                "token transfer Back {:?} of {:?} from {:?} to {:?} ",
                ctx.accounts.swap_data_account_token_ata.amount,
                shorten(ctx.accounts.swap_data_account.payment_mint),
                shorten(ctx.accounts.swap_data_account.key()),
                shorten(ctx.accounts.maker.key())
            );
            invoke_signed(
                &ns_fee_data.instruction,
                &ns_fee_data.account_infos,
                &[&[&seed[..], &[bump]]]
            )?;
        }

        let ix1 = spl_token::instruction::close_account(
            &ctx.accounts.token_program.key,
            &ctx.accounts.swap_data_account_nft_ata.key(),
            &ctx.accounts.maker.key(),
            &ctx.accounts.swap_data_account.key(),
            &[&ctx.accounts.swap_data_account.key()]
        )?;
        msg!("{} closing", ctx.accounts.swap_data_account_nft_ata.key());
        invoke_signed(
            &ix1,
            &[
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.swap_data_account_nft_ata.to_account_info(),
                ctx.accounts.swap_data_account.to_account_info(),
                ctx.accounts.maker.to_account_info(),
            ],
            &[&[&seed[..], &[bump]]]
        )?;

        let ix2 = spl_token::instruction::close_account(
            &ctx.accounts.token_program.key,
            &ctx.accounts.swap_data_account_token_ata.key(),
            &ctx.accounts.maker.key(),
            &ctx.accounts.swap_data_account.key(),
            &[&ctx.accounts.swap_data_account.key()]
        )?;
        msg!("{} closing", ctx.accounts.swap_data_account_token_ata.key());
        invoke_signed(
            &ix2,
            &[
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.swap_data_account_token_ata.to_account_info(),
                ctx.accounts.swap_data_account.to_account_info(),
                ctx.accounts.maker.to_account_info(),
            ],
            &[&[&seed[..], &[bump]]]
        )?;
        Ok(())
    }

    pub fn cancel_swap(ctx: Context<CancelSwap>) -> Result<()> {
        let seed: &[u8] = &get_seed_buffer(ctx.accounts.swap_data_account.clone());
        let bump = ctx.bumps.swap_data_account;

        require!(ctx.accounts.swap_data_account.accepted_bid.is_none(), MYERROR::IncorrectState);
        require!(
            ctx.accounts.maker.key().eq(&ctx.accounts.swap_data_account.maker) ||
                (!ctx.accounts.swap_data_account.end_time.eq(&0) &&
                    Clock::get().unwrap().unix_timestamp > ctx.accounts.swap_data_account.end_time),
            MYERROR::TooEarly
        );

        // transfer Maker Token
        let transfert_token_data = get_transfer_token_ix(
            ctx.accounts.swap_data_account_token_ata.amount,
            SendToken {
                from: ctx.accounts.swap_data_account.to_account_info(),
                from_ata: ctx.accounts.swap_data_account_token_ata.clone(),
                to: ctx.accounts.maker.to_account_info().clone(),
                to_ata: ctx.accounts.maker_token_ata.clone(),
                token_program: ctx.accounts.token_program.to_account_info(),
            }
        ).unwrap();

        msg!(
            "token transfer Back {:?} of {:?} from {:?} to {:?} ",
            ctx.accounts.swap_data_account_token_ata.amount,
            shorten(ctx.accounts.swap_data_account.payment_mint),
            shorten(ctx.accounts.swap_data_account.key()),
            shorten(ctx.accounts.maker.key())
        );
        invoke_signed(
            &transfert_token_data.instruction,
            &transfert_token_data.account_infos,
            &[&[&seed[..], &[bump]]]
        )?;

        let transfert_data = create_p_nft_instruction(1, SendPNft {
            from: ctx.accounts.swap_data_account.to_account_info(),
            from_ata: ctx.accounts.swap_data_account_nft_ata.to_account_info(),
            to: ctx.accounts.maker.to_account_info(),
            to_ata: ctx.accounts.maker_nft_ata.to_account_info(),
            mint: ctx.accounts.nft_mint_maker.to_account_info(),
            signer: ctx.accounts.maker.to_account_info(),
            auth_rules: ctx.accounts.auth_rules_maker.clone(),
            auth_rules_program: ctx.accounts.auth_rules_program.to_account_info(),
            destination_token_record: ctx.accounts.destination_token_record_maker.clone(),
            metadata_program: ctx.accounts.metadata_program.to_account_info(),
            nft_master_edition: ctx.accounts.nft_master_edition_maker.clone(),
            nft_metadata: ctx.accounts.nft_metadata_maker.to_account_info(),
            owner_token_record: ctx.accounts.owner_token_record_maker.clone(),
            ata_program: ctx.accounts.ata_program.to_account_info(),
            sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        }).unwrap();

        msg!(
            "2nft transfer Back {:?} of {:?} from {:?} to {:?} ",
            1,
            shorten(ctx.accounts.nft_mint_maker.key()),
            shorten(ctx.accounts.swap_data_account_nft_ata.key()),
            shorten(ctx.accounts.maker_nft_ata.key())
        );

        invoke_signed(
            &transfert_data.instruction,
            &transfert_data.account_infos,
            &[&[&seed[..], &[bump]]]
        )?;

        let _ = ctx.accounts.swap_data_account_nft_ata.reload();
        let _ = ctx.accounts.swap_data_account_token_ata.reload();

        let ix1 = spl_token::instruction::close_account(
            &ctx.accounts.token_program.key,
            &ctx.accounts.swap_data_account_nft_ata.key(),
            &ctx.accounts.maker.key(),
            &ctx.accounts.swap_data_account.key(),
            &[&ctx.accounts.swap_data_account.key()]
        )?;
        invoke_signed(
            &ix1,
            &[
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.swap_data_account_nft_ata.to_account_info(),
                ctx.accounts.swap_data_account.to_account_info(),
                ctx.accounts.maker.to_account_info(),
            ],
            &[&[&seed[..], &[bump]]]
        )?;
        msg!("{} closed", ctx.accounts.swap_data_account_nft_ata.key());

        let ix2 = spl_token::instruction::close_account(
            &ctx.accounts.token_program.key,
            &ctx.accounts.swap_data_account_token_ata.key(),
            &ctx.accounts.maker.key(),
            &ctx.accounts.swap_data_account.key(),
            &[&ctx.accounts.swap_data_account.key()]
        )?;
        invoke_signed(
            &ix2,
            &[
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.swap_data_account_token_ata.to_account_info(),
                ctx.accounts.swap_data_account.to_account_info(),
                ctx.accounts.maker.to_account_info(),
            ],
            &[&[&seed[..], &[bump]]]
        )?;
        msg!("{} closed", ctx.accounts.swap_data_account_token_ata.key());

        Ok(())
    }

    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //

    pub fn override_time(ctx: Context<OverrideTime>, end_time: i64) -> Result<()> {
        require!(ctx.accounts.swap_data_account.accepted_bid.is_none(), MYERROR::IncorrectState);
        ctx.accounts.swap_data_account.end_time = end_time;
        Ok(())
    }
}

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

#[derive(Accounts)]
#[instruction()]
pub struct MakeSwap<'info> {
    #[account(
        init,
        payer = maker,
        seeds = [&init_get_seed_buffer(maker.key(), nft_mint_maker.key())],
        bump,
        space = SwapData::LEN
        // constraint = maker.key().eq(&swap_data_account.maker)  @ MYERROR::NotMaker
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: in constraints
    #[account(
        mut,
        constraint = swap_data_account_nft_ata.mint.eq(&nft_mint_maker.key()) @ MYERROR::MintIncorrect,
        constraint = swap_data_account_nft_ata.owner.eq(&swap_data_account.to_account_info().key() ) @ MYERROR::IncorrectOwner
    )]
    swap_data_account_nft_ata: Account<'info, TokenAccount>,
    /// CHECK: inside the function Logic
    #[account( mut,
        constraint = swap_data_account_token_ata.mint.eq(&mint_token.key()) @ MYERROR::MintIncorrect,
        constraint = swap_data_account_token_ata.owner.eq(&swap_data_account.key()) @ MYERROR::IncorrectOwner
     )]
    swap_data_account_token_ata: Account<'info, TokenAccount>,

    #[account( mut )]
    maker: Signer<'info>,
    #[account(
        mut,
        constraint = maker_nft_ata.mint.eq(&nft_mint_maker.key()) @ MYERROR::MintIncorrect,
        constraint = maker_nft_ata.owner.eq(&maker.key()) @ MYERROR::IncorrectOwner
    )]
    maker_nft_ata: Account<'info, TokenAccount>,
    /// CHECK: inside the function Logic
    #[account( mut,
        constraint = maker_token_ata.mint.eq(&mint_token.key()) @ MYERROR::MintIncorrect,
        constraint = maker_token_ata.owner.eq(maker.key)  @ MYERROR::IncorrectOwner,
    )]
    maker_token_ata: Account<'info, TokenAccount>,

    nft_mint_maker: Box<Account<'info, Mint>>,
    mint_token: Box<Account<'info, Mint>>,

    /// CHECK: in constraints
    #[account( mut,
        seeds =[
            b"metadata".as_ref(),
            metadata_program.key().as_ref(),
            nft_mint_maker.key().as_ref()],
        bump,
        owner = metadata_program.key() @ MYERROR::IncorrectMetadata,
        seeds::program = metadata_program.key()
    )]
    nft_metadata_maker: AccountInfo<'info>,
    /// CHECK: in constraints
    nft_master_edition_maker: Option<AccountInfo<'info>>,
    /// CHECK: in constraints
    #[account( mut )]
    owner_token_record_maker: Option<AccountInfo<'info>>,
    /// CHECK: in constraints
    #[account( mut )]
    destination_token_record_maker: Option<AccountInfo<'info>>,
    /// CHECK: account checked in CPI
    auth_rules_maker: Option<AccountInfo<'info>>,
    system_program: Program<'info, System>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&MPL_TOKEN_METADATA_ID) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = sysvar_instructions.key().eq(&SYSVAR_INSTRUCTIONS_ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = ata_program.key().eq(&SPL_ASSOCIATED_TOKEN_ACCOUNT_ID)  @ MYERROR::IncorrectSplAta)]
    ata_program: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    auth_rules_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct TakeSwap<'info> {
    #[account(
        mut,
        seeds = [&get_seed_buffer(swap_data_account.clone())],
        bump,
        constraint = maker.key().eq(&swap_data_account.maker)  @ MYERROR::NotMaker,
        constraint = mint_token.key().eq(&swap_data_account.payment_mint)  @ MYERROR::MintIncorrect,
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account( mut,
        constraint = swap_data_account_token_ata.mint.eq(&mint_token.key()) @ MYERROR::MintIncorrect,
        constraint = swap_data_account_token_ata.owner.eq(&swap_data_account.key()) @ MYERROR::IncorrectOwner )]
    swap_data_account_token_ata: Account<'info, TokenAccount>,
    /// CHECK: Maker
    maker: AccountInfo<'info>,
    #[account( mut, 
        constraint = maker_nft_ata.mint.eq(&nft_mint_taker.key()) @ MYERROR::MintIncorrect,
        constraint = maker_nft_ata.owner.eq(&maker.key() ) @ MYERROR::IncorrectOwner 
    )]
    maker_nft_ata: Account<'info, TokenAccount>,
    #[account( mut, 
        constraint = maker_token_ata.mint.eq(&mint_token.key()) @ MYERROR::MintIncorrect,
        constraint = maker_token_ata.owner.eq(&maker.key() ) @ MYERROR::IncorrectOwner 
    )]
    maker_token_ata: Account<'info, TokenAccount>,

    #[account( mut )]
    taker: Signer<'info>,
    #[account(
        mut,
        constraint = taker_nft_ata.mint.eq(&nft_mint_taker.key()) @ MYERROR::MintIncorrect,
        constraint = taker_nft_ata.owner.eq(&taker.key()) @ MYERROR::IncorrectOwner
    )]
    taker_nft_ata: Account<'info, TokenAccount>,
    #[account( mut,
        constraint = taker_token_ata.mint.eq(&mint_token.key()) @ MYERROR::MintIncorrect,
        constraint = taker_token_ata.owner.eq(taker.key) @ MYERROR::IncorrectOwner
    )]
    taker_token_ata: Account<'info, TokenAccount>,

    nft_mint_taker: Box<Account<'info, Mint>>,
    mint_token: Box<Account<'info, Mint>>,

    /// CHECK: in constraints
    #[account( mut,
        seeds =[
            b"metadata".as_ref(),
            metadata_program.key().as_ref(),
            nft_mint_taker.key().as_ref()],
        bump,
        owner = metadata_program.key() @ MYERROR::IncorrectMetadata,
        seeds::program = metadata_program.key()
    )]
    nft_metadata_taker: AccountInfo<'info>,
    /// CHECK: in constraints
    nft_master_edition_taker: Option<AccountInfo<'info>>,
    /// CHECK: in constraints
    #[account( mut )]
    owner_token_record_taker: Option<AccountInfo<'info>>,
    /// CHECK: in constraints
    #[account( mut )]
    destination_token_record_taker: Option<AccountInfo<'info>>,
    /// CHECK: account checked in CPI
    auth_rules_taker: Option<AccountInfo<'info>>,
    system_program: Program<'info, System>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&MPL_TOKEN_METADATA_ID) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = sysvar_instructions.key().eq(&SYSVAR_INSTRUCTIONS_ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = ata_program.key().eq(&SPL_ASSOCIATED_TOKEN_ACCOUNT_ID)  @ MYERROR::IncorrectSplAta)]
    ata_program: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    auth_rules_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction()]
pub struct PayRoyalties<'info> {
    #[account(
        mut,
        seeds = [&get_seed_buffer(swap_data_account.clone())],
        bump, 
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: in constraints
    #[account( mut,
        constraint = swap_data_account_token_ata.mint.eq(&mint_token.key()) @ MYERROR::MintIncorrect,
        constraint = swap_data_account_token_ata.owner.eq(&swap_data_account.key()) @ MYERROR::IncorrectOwner )]
    swap_data_account_token_ata: Account<'info, TokenAccount>,

    #[account(
        constraint = swap_data_account.payment_mint.eq(&mint_token.key())  @ MYERROR::MintIncorrect
    )]
    mint_token: Box<Account<'info, Mint>>,

    signer: Signer<'info>,
    /// CHECK: in constraints
    #[account( mut,
        seeds =[
            b"metadata".as_ref(),
            metadata_program.key().as_ref(),
            swap_data_account.nft_mint_taker.expect(&MYERROR::IncorrectState.to_string()).as_ref()],
        bump,
        owner = metadata_program.key() @ MYERROR::IncorrectMetadata,
        seeds::program = metadata_program.key()
    )]
    nft_metadata_taker: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account( mut,
            seeds =[
                b"metadata".as_ref(),
                metadata_program.key().as_ref(),
                swap_data_account.nft_mint_maker.as_ref()],
            bump,
            owner = metadata_program.key() @ MYERROR::IncorrectMetadata,
            seeds::program = metadata_program.key()
        )]
    nft_metadata_maker: AccountInfo<'info>,

    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&MPL_TOKEN_METADATA_ID) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,

    token_program: Program<'info, Token>,

    /// CHECK: account checked in CPI
    maker_creator0: AccountInfo<'info>,
    #[account( mut )]
    maker_creator0_token_ata: Account<'info, TokenAccount>,
    /// CHECK: account checked in CPI
    maker_creator1: AccountInfo<'info>,
    #[account( mut )]
    maker_creator1_token_ata: Account<'info, TokenAccount>,
    /// CHECK: account checked in CPI
    maker_creator2: AccountInfo<'info>,
    #[account( mut )]
    maker_creator2_token_ata: Account<'info, TokenAccount>,

    /// CHECK: account checked in CPI
    taker_creator0: AccountInfo<'info>,
    #[account( mut )]
    taker_creator0_token_ata: Account<'info, TokenAccount>,
    /// CHECK: account checked in CPI
    taker_creator1: AccountInfo<'info>,
    #[account( mut )]
    taker_creator1_token_ata: Account<'info, TokenAccount>,
    /// CHECK: account checked in CPI
    taker_creator2: AccountInfo<'info>,
    #[account( mut )]
    taker_creator2_token_ata: Account<'info, TokenAccount>,
}
#[derive(Accounts)]
#[instruction()]
pub struct ClaimSwap<'info> {
    #[account(
        mut,
        close = maker,
        seeds = [&get_seed_buffer(swap_data_account.clone())],
        bump,
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(
        mut,
        constraint = swap_data_account_nft_ata.mint.eq(&nft_mint_maker.key()) @ MYERROR::MintIncorrect,
        constraint = swap_data_account_nft_ata.owner.eq(&swap_data_account.key()) @ MYERROR::IncorrectOwner
    )]
    swap_data_account_nft_ata: Account<'info, TokenAccount>,
    #[account( mut,
        constraint = swap_data_account_token_ata.mint.eq(&mint_token.key()) @ MYERROR::MintIncorrect,
        constraint = swap_data_account_token_ata.owner.eq(&swap_data_account.key()) @ MYERROR::IncorrectOwner )]
    swap_data_account_token_ata: Account<'info, TokenAccount>,

    /// CHECK : in constraints
    #[account( mut )]
    ns_fee: AccountInfo<'info>,
    #[account( mut,
        constraint = ns_fee_token_ata.mint.eq(&mint_token.key()) @ MYERROR::MintIncorrect,
        constraint = ns_fee_token_ata.owner.eq(ns_fee.key) @ MYERROR::IncorrectOwner )]
    ns_fee_token_ata: Account<'info, TokenAccount>,
    /// CHECK : in constraints
    #[account( mut,
        constraint = taker.key().eq(&swap_data_account.taker.expect(&MYERROR::IncorrectState.to_string()))  @ MYERROR::NotTaker,
    )]
    taker: AccountInfo<'info>,
    #[account(
        mut,
        constraint = taker_nft_ata_maker.mint.eq(&nft_mint_maker.key()) @ MYERROR::MintIncorrect,
        constraint = taker_nft_ata_maker.owner.eq(&taker.key()) @ MYERROR::IncorrectOwner
    )]
    taker_nft_ata_maker: Account<'info, TokenAccount>,
    #[account( mut,
        constraint = taker_token_ata.mint.eq(&mint_token.key()) @ MYERROR::MintIncorrect,
        constraint = taker_token_ata.owner.eq(taker.key) @ MYERROR::IncorrectOwner
    )]
    taker_token_ata: Account<'info, TokenAccount>,

    /// CHECK: logic
    #[account( mut,
        constraint = maker.key().eq(&swap_data_account.maker)  @ MYERROR::NotMaker,
     )]
    maker: AccountInfo<'info>,
    #[account( mut,
        constraint = maker_token_ata.mint.eq(&mint_token.key()) @ MYERROR::MintIncorrect,
        constraint = maker_token_ata.owner.eq(maker.key) @ MYERROR::IncorrectOwner
    )]
    maker_token_ata: Account<'info, TokenAccount>,
    #[account(
        constraint = nft_mint_maker.key().eq(&swap_data_account.nft_mint_maker)  @ MYERROR::MintIncorrect ,       
    )]
    nft_mint_maker: Box<Account<'info, Mint>>,
    #[account(
        constraint = mint_token.key().eq(&swap_data_account.payment_mint)  @ MYERROR::MintIncorrect        
    )]
    mint_token: Box<Account<'info, Mint>>,

    signer: Signer<'info>,

    /// CHECK: in constraints
    #[account( mut,
            seeds =[
                b"metadata".as_ref(),
                metadata_program.key().as_ref(),
                nft_mint_maker.key().as_ref()],
            bump,
            owner = metadata_program.key() @ MYERROR::IncorrectMetadata,
            seeds::program = metadata_program.key()
        )]
    nft_metadata_maker: AccountInfo<'info>,
    /// CHECK: in constraints
    nft_master_edition_maker: Option<AccountInfo<'info>>,
    /// CHECK: in constraints
    #[account( mut )]
    owner_token_record_maker: Option<AccountInfo<'info>>,
    /// CHECK: in constraints
    #[account( mut )]
    destination_token_record_maker: Option<AccountInfo<'info>>,
    /// CHECK: account checked in CPI
    auth_rules_maker: Option<AccountInfo<'info>>,
    system_program: Program<'info, System>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&MPL_TOKEN_METADATA_ID) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = sysvar_instructions.key().eq(&SYSVAR_INSTRUCTIONS_ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = ata_program.key().eq(&SPL_ASSOCIATED_TOKEN_ACCOUNT_ID)  @ MYERROR::IncorrectSplAta)]
    ata_program: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    auth_rules_program: AccountInfo<'info>,
}
#[derive(Accounts)]
#[instruction()]
pub struct CancelSwap<'info> {
    #[account(
        mut,
        close = maker,
        seeds = [&get_seed_buffer(swap_data_account.clone())],
        bump,
    )]
    swap_data_account: Box<Account<'info, SwapData>>,

    #[account(
        mut, 
        constraint = swap_data_account_nft_ata.mint.eq(&nft_mint_maker.key()) @ MYERROR::MintIncorrect,
        constraint = swap_data_account_nft_ata.owner.eq(&swap_data_account.to_account_info().key() ) @ MYERROR::IncorrectOwner
    )]
    swap_data_account_nft_ata: Account<'info, TokenAccount>,
    #[account(
        mut, 
        constraint = swap_data_account_token_ata.mint.eq(&mint_token.key()) @ MYERROR::MintIncorrect,
        constraint = swap_data_account_token_ata.owner.eq(&swap_data_account.to_account_info().key() ) @ MYERROR::IncorrectOwner
    )]
    swap_data_account_token_ata: Account<'info, TokenAccount>,
    #[account( constraint = maker.key().eq(&swap_data_account.maker)  @ MYERROR::NotMaker )]
    maker: Signer<'info>,
    #[account(
        mut,
        constraint = maker_nft_ata.mint.eq(&nft_mint_maker.key()) @ MYERROR::MintIncorrect,
        constraint = maker_nft_ata.owner.eq(&maker.key()) @ MYERROR::IncorrectOwner
    )]
    maker_nft_ata: Account<'info, TokenAccount>,
    /// CHECK: inside the function Logic
    #[account( mut,
            constraint = maker_token_ata.owner.eq(&maker.key())  @ MYERROR::IncorrectOwner,
            constraint = maker_token_ata.mint.eq(&mint_token.key()) @ MYERROR::MintIncorrect,
        )]
    maker_token_ata: Account<'info, TokenAccount>,

    #[account(constraint = swap_data_account.nft_mint_maker.eq(&nft_mint_maker.key())  @ MYERROR::MintIncorrect)]
    nft_mint_maker: Box<Account<'info, Mint>>,
    #[account(constraint = swap_data_account.payment_mint.eq(&mint_token.key())  @ MYERROR::MintIncorrect)]
    mint_token: Box<Account<'info, Mint>>,

    /// CHECK: in constraints
    #[account( mut,
        seeds =[
            b"metadata".as_ref(),
            metadata_program.key().as_ref(),
            nft_mint_maker.key().as_ref()],
        bump,
        owner = metadata_program.key() @ MYERROR::IncorrectMetadata,
        seeds::program = metadata_program.key()
    )]
    nft_metadata_maker: AccountInfo<'info>,
    /// CHECK: in constraints
    nft_master_edition_maker: Option<AccountInfo<'info>>,
    /// CHECK: in constraints
    #[account( mut )]
    owner_token_record_maker: Option<AccountInfo<'info>>,
    /// CHECK: in constraints
    #[account( mut )]
    destination_token_record_maker: Option<AccountInfo<'info>>,
    /// CHECK: account checked in CPI
    auth_rules_maker: Option<AccountInfo<'info>>,
    system_program: Program<'info, System>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&MPL_TOKEN_METADATA_ID) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = sysvar_instructions.key().eq(&SYSVAR_INSTRUCTIONS_ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = ata_program.key().eq(&SPL_ASSOCIATED_TOKEN_ACCOUNT_ID)  @ MYERROR::IncorrectSplAta)]
    ata_program: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    auth_rules_program: AccountInfo<'info>,
}

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

#[derive(Accounts)]
#[instruction()]
pub struct OverrideTime<'info> {
    #[account(
        mut,
        seeds = [&get_seed_buffer(swap_data_account.clone())],
        bump,
        constraint = maker.key().eq(&swap_data_account.maker)  @ MYERROR::NotMaker
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account( mut )]
    maker: Signer<'info>,
}

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

#[account]
#[derive(Default)]
pub struct SwapData {
    pub maker: Pubkey, // maker Pubkey
    pub nft_mint_maker: Pubkey, // mint of the maker's NFT

    pub bids: Vec<Bid>, // List of possible bids Taker can accept

    pub taker: Option<Pubkey>, // taker Pubkey
    pub nft_mint_taker: Option<Pubkey>, // mint of the taker's NFT
    pub accepted_bid: Option<Bid>, // index of accepted bid when Taker accepted one

    pub end_time: i64, // time until when the trade valid

    pub royalties_paid: bool, // if royalties have been paid

    pub payment_mint: Pubkey, // token accepted for payment
    pub seed: String, // String to initialize PDA's seed
}
impl SwapData {
    const LEN: usize =
        8 + //Base
        1 + //Royalties
        3 + //Options
        8 + //i64
        (25 + 1) * Bid::LEN + //bid len
        32 + //seed
        32 * 5; //Pubkey
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug, PartialEq)]
pub struct Bid {
    collection: Pubkey, // collection of the NFT aker wants to get
    amount: i64, // amount of tokens to transfer. amount < 0 maker gives

    // Object fith amounts that need to be sent for paying fees
    maker_neoswap_fee: u64,
    taker_neoswap_fee: u64, // Destinary : hardcoded

    taker_royalties: u64,
    maker_royalties: u64, // Destinary : Creators
}
impl Bid {
    const LEN: usize = 32 + 8 * 5;
}

pub struct SendPNft<'info> {
    from: AccountInfo<'info>,
    from_ata: AccountInfo<'info>,
    to: AccountInfo<'info>,
    to_ata: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    signer: AccountInfo<'info>,
    nft_metadata: AccountInfo<'info>,
    nft_master_edition: Option<AccountInfo<'info>>,
    owner_token_record: Option<AccountInfo<'info>>,
    destination_token_record: Option<AccountInfo<'info>>,
    auth_rules_program: AccountInfo<'info>,
    auth_rules: Option<AccountInfo<'info>>,
    metadata_program: AccountInfo<'info>,
    sysvar_instructions: AccountInfo<'info>,
    ata_program: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
}
pub struct SendToken<'info> {
    from: AccountInfo<'info>,
    from_ata: Account<'info, TokenAccount>,

    to: AccountInfo<'info>,
    to_ata: Account<'info, TokenAccount>,

    // mint: Box<Account<'info, Mint>>,

    token_program: AccountInfo<'info>,
}
pub struct TransferData<'a> {
    instruction: Instruction,
    account_infos: Vec<AccountInfo<'a>>,
}

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
fn shorten(address: Pubkey) -> String {
    address.to_string().split_at(4).0.to_owned() + "..." + address.to_string().split_at(40).1
}

fn init_get_seed_string(maker: Pubkey, nft_mint_maker: Pubkey) -> String {
    maker.to_string().split_at(16).0.to_owned() + nft_mint_maker.to_string().split_at(16).0
}
fn init_get_seed_buffer(maker: Pubkey, nft_mint_maker: Pubkey) -> Vec<u8> {
    init_get_seed_string(maker, nft_mint_maker).as_bytes().to_vec()
}
fn get_seed_buffer(sda: Box<anchor_lang::prelude::Account<'_, SwapData>>) -> Vec<u8> {
    get_seed_string(sda).as_bytes().to_vec()
}
fn get_seed_string(sda: Box<anchor_lang::prelude::Account<'_, SwapData>>) -> String {
    sda.maker.to_string().split_at(16).0.to_owned() + sda.nft_mint_maker.to_string().split_at(16).0
}
fn get_metadata(nft_metadata: AccountInfo) -> Metadata {
    Metadata::safe_deserialize(&nft_metadata.data.borrow()).unwrap()
}
fn get_transfer_token_ix(lamport: u64, ctx: SendToken<'_>) -> Result<TransferData<'_>> {
    let instruction = spl_token::instruction::transfer(
        &ctx.token_program.key,
        &ctx.from_ata.key(),
        &ctx.to_ata.key(),
        &ctx.from.key(),
        &[&ctx.from.key()],
        lamport
    )?;

    let account_infos = [
        ctx.token_program.to_account_info(),
        ctx.from.to_account_info(),
        ctx.to.to_account_info(),
        ctx.from_ata.to_account_info(),
        ctx.to_ata.to_account_info(),
    ].to_vec();

    Ok(TransferData {
        instruction,
        account_infos,
    })
}
fn create_p_nft_instruction(amount: u64, ctx: SendPNft<'_>) -> Result<TransferData<'_>> {
    let mut transfer_builder = TransferBuilder::new();
    transfer_builder
        .token(ctx.from_ata.key())
        .token_owner(ctx.from.key())
        .destination_token(ctx.to_ata.key())
        .destination_owner(ctx.to.key())
        .mint(ctx.mint.key())
        .metadata(ctx.nft_metadata.key())
        .authority(ctx.from.key())
        .payer(ctx.signer.key())
        .system_program(ctx.system_program.key())
        .sysvar_instructions(ctx.sysvar_instructions.key())
        .spl_token_program(ctx.token_program.key())
        .spl_ata_program(ctx.ata_program.key());

    // creating vase transfer info
    let mut account_infos: Vec<AccountInfo<'_>> = vec![
        ctx.from.to_account_info(),
        ctx.from_ata.to_account_info(),
        ctx.to.to_account_info(),
        ctx.to_ata.to_account_info(),
        ctx.mint.to_account_info(),
        ctx.nft_metadata.to_account_info(),
        ctx.signer.to_account_info(),
        ctx.system_program.to_account_info(),
        ctx.sysvar_instructions.to_account_info(),
        ctx.token_program.to_account_info(),
        ctx.ata_program.to_account_info(),
        ctx.metadata_program.to_account_info()
    ];

    let metadata: Metadata = Metadata::safe_deserialize(
        &ctx.nft_metadata.to_account_info().data.borrow()
    )?;
    if matches!(metadata.token_standard, Some(TokenStandard::ProgrammableNonFungible)) {
        msg!("pnft");

        let nft_master_edition = ctx.nft_master_edition.unwrap();
        let owner_token_record = ctx.owner_token_record.unwrap();
        let destination_token_record = ctx.destination_token_record.unwrap();
        let auth_rules = ctx.auth_rules.unwrap();

        transfer_builder
            .edition(Some(nft_master_edition.key()))
            .token_record(Some(owner_token_record.key()))
            .destination_token_record(Some(destination_token_record.key()))
            .authorization_rules_program(Some(ctx.auth_rules_program.key()))
            .authorization_rules(Some(auth_rules.key()));

        account_infos.push(nft_master_edition);
        account_infos.push(owner_token_record);
        account_infos.push(destination_token_record);
        account_infos.push(ctx.auth_rules_program.to_account_info());
        account_infos.push(auth_rules);
    }

    let instruction = transfer_builder
        .transfer_args(TransferArgs::V1 {
            amount,
            authorization_data: None,
        })
        .instruction();

    Ok(TransferData {
        instruction,
        account_infos,
    })
}

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

#[error_code]
pub enum MYERROR {
    /// NS ERRORS 6000-6999

    /// Data errors 6000-6099
    #[msg("List of Bids is empty")]
    EmptyBids,
    #[msg("Incorrect Mint")]
    MintIncorrect,
    #[msg("Given seed length is Incorrect")]
    SeedLengthIncorrect,
    #[msg("The status given is not correct")]
    UnexpectedState,
    #[msg("Fee Account is not correct")]
    IncorrectFeeAccount,
    #[msg("Date given is incorrect")]
    IncorrectDate,

    /// User errors 6100-6199
    #[msg("wrong signer, only maker can perform this action")]
    NotMaker,
    #[msg("wrong address for Taker")]
    NotTaker,
    #[msg("Owner Given is incorrect")]
    IncorrectOwner,

    /// Item errors 6200-6299
    #[msg("Collection is unverified")]
    UnVerifiedCollection,
    #[msg("Collection doesnt't match givent mint collection")]
    IncorrectCollection,
    #[msg("Creator is unverified")]
    UnVerifiedCreator,

    /// Pda errors 6300-6399
    #[msg("The item you're trying to add already exists in the SDA")]
    AlreadyExist,
    #[msg("Cannot find the account")]
    CannotFindAccount,
    #[msg("Swap is not in the adequate state to perform this action")]
    IncorrectState,
    #[msg("Cannot find the given collection in the SDA")]
    CollectionNotFound,
    #[msg("Swap already accepted")]
    AlreadyTaken,
    #[msg("Bid not found in the list of bids")]
    BidNotFound,
    #[msg("Fees are not paid, please pay the fees before claiming the swap")]
    FeeNotPaid,
    #[msg("Royalties already paied")]
    RoyaltiesAlreadyPaid,
    #[msg("the Swap you tried to accept is expired")]
    TooLate,
    #[msg("Too early to perform this action")]
    TooEarly,

    /// Program errors 6900-6999
    #[msg("Incorrect Sysvar Instruction Program")]
    IncorrectSysvar = 900,
    #[msg("Incorrect Metadata Program")]
    IncorrectMetadata = 901,
    #[msg("Incorrect Token ATA Program")]
    IncorrectSplAta = 902,

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
    // SeedLengthIncorrect,
    // #[msg("wrong system program Id passed")]
    // NotSystemProgram,
    // #[msg("wrong token program Id passed")]
    // NotTokenProgram,
    // #[msg("wrong Pda program Id passed")]
    // NotPda,
    // #[msg("wrong bump")]
    // NotBump,

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
}
