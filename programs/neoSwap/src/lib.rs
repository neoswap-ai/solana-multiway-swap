use ::{
    mpl_bubblegum::program::Bubblegum,
    mpl_token_metadata::{
        instruction::{ builders::TransferBuilder, InstructionBuilder, TransferArgs },
        state::{ Metadata, TokenMetadataAccount },
    },
    spl_account_compression::{ program::SplAccountCompression, Noop },
    anchor_lang::{
        prelude::*,
        solana_program::{
            self,
            program::{ invoke, invoke_signed },
            pubkey::Pubkey,
            instruction::Instruction,
        },
    },
    anchor_spl::{
        token::{ self, spl_token, Token, TokenAccount, Mint },
        associated_token::AssociatedToken,
    },
    spl_associated_token_account,
};

declare_id!("7H73hAEk1R1EXXgheDBdAn3Un3W7SQKMuKtwpfU67eet");
// declare_id!("Et2RutKNHzB6XmsDXUGnDHJAGAsJ73gdHVkoKyV79BFY");
// declare_id!("HCg7NKnvWwWZdLXqDwZdjn9RDz9eLDYuSAcUHqeC1vmH");
// declare_id!("EU5zoiRSvPE5k1Fy49UJZvPMBKxzatdBGFJ11XPFD42Z");
// declare_id!("CtZHiWNnLu5rQuTN3jo7CmYDR8Wns6qXHn7taPvmnACp");

///@title List of function to manage NeoSwap's multi-items swaps
#[program]
pub mod neo_swap {
    use super::*;

    /// @notice Initialize Swap's PDA. /!\ Signer will be Initializer
    /// @dev First function to trigger to initialize Swap's PDA with according space, define admin and add Neoswap Fees. /!\ Signer will be Initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @param sent_data: SwapData: {initializer: Pubkey => admin of the trade, status: u8  => "status of the trade", items: NftSwapItem = first item [length=1]}, nb_of_items: u32 => number of items engaged in the trade}
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts spl_token_program: Pubkey = spl_associated_token_program_id
    /// @return Void
    pub fn initialize_init(
        ctx: Context<InitializeInit>,
        _seed: Vec<u8>,
        sent_data: SwapData
    ) -> Result<()> {
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
    /// @param trade_to_add: NftSwapItem: {is_nft: bool => "return true if the item is en NFT (true)/(false)", mint: Pubkey => "(Mint address)/(Owner address)", amount: i64 => (nbr of NFT engaged in this trade)/(number of lamports the user will exchange with the smart contract if_positive(user will give lamports), if_negative(user will receive lamports)), owner: Pubkey => owner of the NFT or lamports , destinary: Pubkey => (user who should receive the NFT)/(Owner address), status : u8 => /!\ will be rewritten by program, }
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @return Void
    pub fn initialize_add(
        ctx: Context<InitializeAdd>,
        _seed: Vec<u8>,
        trade_to_add: NftSwapItem
    ) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;

        require!(
            swap_data_account.status == TradeStatus::Initializing.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut item_to_add: NftSwapItem = trade_to_add;

        // Write according status to item
        if already_exist_in_sda(swap_data_account.items.clone(), item_to_add.clone()) {
            return Err(error!(MYERROR::AlreadyExist).into());
        }

        if item_to_add.is_nft {
            if item_to_add.amount <= 0 {
                return Err(error!(MYERROR::UnexpectedData).into());
            }

            item_to_add.status = ItemStatus::NFTPresigningWaitingForApproval.to_u8();
            msg!("NFT item added with status NFTPresigningWaitingForApproval");
        } else {
            // Check that mint and destinary are dummy values
            require!(
                item_to_add.mint.eq(&swap_data_account.accepted_payement),
                MYERROR::MintIncorrect
            );
            require!(
                item_to_add.destinary.eq(&swap_data_account.accepted_payement),
                MYERROR::UnexpectedData
            );

            if item_to_add.amount.is_positive() {
                item_to_add.status = ItemStatus::SolPresigningWaitingForApproval.to_u8();
                msg!("SOL item added with status SolPresigningWaitingForApproval");
            } else if item_to_add.amount == 0 {
                msg!("SOL item is null amount");
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
    pub fn initialize_validate(ctx: Context<InitializeVerify>, _seed: Vec<u8>) -> Result<()> {
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
                // require_eq!(ItemStatus::SolPending, MYERROR::SumNotNull);
                if
                    !(
                        swap_data_account.items[item_id].status ==
                            ItemStatus::SolPresigningWaitingForApproval.to_u8() ||
                        swap_data_account.items[item_id].status == ItemStatus::SolToClaim.to_u8()
                    )
                {
                    return Err(error!(MYERROR::IncorrectStatus).into());
                }

                sum = sum.checked_add(swap_data_account.items[item_id].amount).unwrap();
            } else {
                if
                    !swap_data_account.items[item_id].status ==
                    ItemStatus::NFTPresigningWaitingForApproval.to_u8()
                {
                    msg!("{} item status: {}", item_id, swap_data_account.items[item_id].status);
                    return Err(error!(MYERROR::IncorrectStatus).into());
                }
            }

            count += 1;
        }
        require!(sum == 0, MYERROR::SumNotNull);
        require!(count == swap_data_account.nb_items, MYERROR::IncorrectLength);

        //changing status to WaitingToValidatePresigning
        swap_data_account.status = TradeStatus::WaitingToValidatePresigning.to_u8();

        Ok(())
    }

    pub fn users_confirm(ctx: Context<UserConfirm>, _seed: Vec<u8>) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;
        let user_pda: &mut Box<Account<'_, UserPdaData>> = &mut ctx.accounts.user_pda;

        require!(
            swap_data_account.status == TradeStatus::WaitingToValidatePresigning.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut list_items: Vec<NftSwapItem> = [].to_vec();
        let mut amount_min: u64 = 0;
        let mut amount_max: u64 = 0;
        let mut amount_to_give_to_swap: i64 = 0;

        for item_id in 0..swap_data_account.items.len() {
            if swap_data_account.items[item_id].owner.eq(ctx.accounts.user.key) {
                msg!(
                    "Found owner presigning item {}\n{:?}",
                    item_id,
                    swap_data_account.items[item_id].owner
                );
                if swap_data_account.items[item_id].is_nft {
                    // let mut found_item_in_user_pda = false;
                    let user_pda_item_index = user_pda.items_to_sell
                        .iter()
                        .position(
                            |x|
                                x.token.eq(&swap_data_account.accepted_payement) &&
                                x.mint.eq(&swap_data_account.items[item_id].mint)
                        )
                        .unwrap();

                    msg!(
                        "amount max updated with {} in token {}",
                        user_pda.items_to_sell[user_pda_item_index].price_min,
                        user_pda.items_to_sell[user_pda_item_index].token
                    );

                    amount_min = amount_min
                        .checked_add(user_pda.items_to_sell[user_pda_item_index].price_min)
                        .unwrap();
                    swap_data_account.items[item_id].status = ItemStatus::NFTPending.to_u8();
                    msg!(
                        "Found owner presigning item {} in UserPda and status changed to NFTPending {}",
                        item_id,
                        swap_data_account.items[item_id].mint
                    );
                } else {
                    if amount_to_give_to_swap != 0 {
                        return Err(error!(MYERROR::DoubleSend).into());
                    }
                    amount_to_give_to_swap = swap_data_account.items[item_id].amount;

                    if amount_to_give_to_swap.is_positive() {
                        msg!("amount max updated with {}", amount_to_give_to_swap);
                        amount_max = amount_max
                            .checked_add(amount_to_give_to_swap.unsigned_abs())
                            .unwrap();
                        swap_data_account.items[item_id].status = ItemStatus::SolPending.to_u8();
                        msg!("Found positive sol to send {} status changed to SolPending", item_id);
                    } else {
                        return Err(error!(MYERROR::PresignCantBeReceiveSol).into());
                    }
                }

                msg!("status : {}", swap_data_account.items[item_id].status);
                list_items.push(swap_data_account.items[item_id].clone());
            } else if swap_data_account.items[item_id].destinary.eq(ctx.accounts.user.key) {
                msg!(
                    "{} Found destinary presigning item {}",
                    item_id,
                    swap_data_account.items[item_id].mint
                );
                let user_pda_item_index = user_pda.items_to_sell
                    .iter()
                    .position(
                        |x|
                            x.token.eq(&swap_data_account.accepted_payement) &&
                            x.mint.eq(&swap_data_account.items[item_id].mint)
                    )
                    .unwrap();

                msg!(
                    "amount max updated with {} in token {}",
                    user_pda.items_to_buy[user_pda_item_index].price_max,
                    user_pda.items_to_buy[user_pda_item_index].token
                );
                amount_max += user_pda.items_to_buy[user_pda_item_index].price_max;

                list_items.push(swap_data_account.items[item_id].clone());
            }
        }
        amount_min = amount_min.checked_add(ctx.accounts.user_pda_ata.amount).unwrap();
        msg!(
            "amount_min {} / amount_max {} / amount_to_give_to_swap {} / amount_to_topup {}",
            amount_min,
            amount_max,
            amount_to_give_to_swap,
            ctx.accounts.user_pda_ata.amount
        );
        if amount_min < amount_max {
            // {
            return Err(error!(MYERROR::MinSupMax).into());
        }

        if
            amount_to_give_to_swap.unsigned_abs() > ctx.accounts.user_pda_ata.amount &&
            amount_to_give_to_swap.is_positive()
        {
            return Err(error!(MYERROR::NotEnoughFunds).into());
        }

        for item in list_items.iter() {
            if item.owner.eq(ctx.accounts.user.key) {
                if
                    !(
                        item.status == ItemStatus::NFTPending.to_u8() ||
                        item.status == ItemStatus::SolPending.to_u8()
                    )
                {
                    msg!(
                        "{} belongs to {:?}, was not validated {} ",
                        item.mint,
                        item.owner,
                        item.status
                    );
                    return Err(error!(MYERROR::NotAllValidated).into());
                }

                // Remove all items related to a specific mint from userPda to sell
                // ctx.accounts.user_pda.items_to_sell.retain(|x| !x.mint.eq(&item.mint)); //.filter(|x| x.mint.eq(&item.mint))
            }
        }

        Ok(())
    }

    pub fn initialize_users_confirm(ctx: Context<InitializeVerify>, _seed: Vec<u8>) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;

        require!(
            swap_data_account.status == TradeStatus::WaitingToValidatePresigning.to_u8(),
            MYERROR::UnexpectedState
        );

        // Check that sum of lamports to trade is null
        let mut sum = 0 as i64;
        let mut count = 0 as u32;
        for item_id in 0..swap_data_account.items.len() {
            if !swap_data_account.items[item_id].is_nft {
                // require_eq!(ItemStatus::SolPending, MYERROR::SumNotNull);
                if
                    !(
                        swap_data_account.items[item_id].status == ItemStatus::SolPending.to_u8() ||
                        swap_data_account.items[item_id].status == ItemStatus::SolToClaim.to_u8()
                    )
                {
                    return Err(error!(MYERROR::IncorrectStatus).into());
                }

                sum = sum.checked_add(swap_data_account.items[item_id].amount).unwrap();
            } else {
                if !swap_data_account.items[item_id].status == ItemStatus::NFTPending.to_u8() {
                    msg!("{} item status: {}", item_id, swap_data_account.items[item_id].status);
                    return Err(error!(MYERROR::IncorrectStatus).into());
                }
            }

            count += 1;
        }
        require!(sum == 0, MYERROR::SumNotNull);
        require!(count == swap_data_account.nb_items, MYERROR::IncorrectLength);

        //changing status to WaitingToValidatePresigning
        swap_data_account.status = TradeStatus::WaitingToDeposit.to_u8();

        Ok(())
    }

    /// @notice Deposit NFT to escrow.
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and deposit the NFT into the escrow.
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts {system_program: Pubkey = system_program_id, token_program: Pubkey = token_program_id, swap_data_account: Pubkey => Swap's PDA corresponding to seeds, signer: Pubkey => User that deposits,  item_from_deposit: Pubkey => User ATA related to mint, item_to_deposit: Pubkey => Swap's PDA ATA related to mint}
    /// @return Void
    pub fn deposit_p_nft(
        ctx: Context<DepositPNftPresigned>,
        seed: Vec<u8>,
        bump: u8
    ) -> Result<()> {
        let swap_data_account_account_info = ctx.accounts.swap_data_account
            .to_account_info()
            .clone();
        let mut transfered = false;

        for item_to_sell in &ctx.accounts.user_pda.items_to_sell {
            if item_to_sell.mint.eq(&ctx.accounts.mint.key()) {
                for item in ctx.accounts.swap_data_account.items.iter_mut() {
                    if
                        item.is_nft &&
                        item.mint.eq(&ctx.accounts.mint.key()) &&
                        item.status == ItemStatus::NFTPending.to_u8()
                    {
                        let transfert_data = create_p_nft_instruction(
                            item.amount.unsigned_abs(),
                            SendPNft {
                                from: ctx.accounts.user_pda.to_account_info(),
                                from_ata: ctx.accounts.user_pda_ata.to_account_info(),
                                to: swap_data_account_account_info.clone(),
                                to_ata: ctx.accounts.swap_data_account_ata.to_account_info(),
                                mint: ctx.accounts.mint.to_account_info(),
                                signer: ctx.accounts.signer.to_account_info(),
                                auth_rules: ctx.accounts.auth_rules.to_account_info(),
                                auth_rules_program: ctx.accounts.auth_rules_program.to_account_info(),
                                destination_token_record: ctx.accounts.destination_token_record.to_account_info(),
                                metadata_program: ctx.accounts.metadata_program.to_account_info(),
                                nft_master_edition: ctx.accounts.nft_master_edition.to_account_info(),
                                nft_metadata: ctx.accounts.nft_metadata.to_account_info(),
                                owner_token_record: ctx.accounts.owner_token_record.to_account_info(),
                                sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
                                spl_token_program: ctx.accounts.spl_token_program.to_account_info(),
                                spl_ata_program: ctx.accounts.spl_ata_program.to_account_info(),
                                system_program: ctx.accounts.system_program.to_account_info(),
                            }
                        ).unwrap();

                        invoke_signed(
                            &transfert_data.instruction,
                            &transfert_data.account_infos,
                            &[&[&seed[..], &[bump]]]
                        )?;

                        let index = ctx.accounts.user_pda.items_to_sell
                            .iter()
                            .position(|x| x.mint.eq(&item.mint))
                            .unwrap();

                        msg!(
                            "token {} was removed to userPda to sell at index {}",
                            ctx.accounts.mint.key(),
                            index
                        );
                        ctx.accounts.user_pda.items_to_sell.remove(index);

                        //update item status to NFTDeposited
                        item.status = ItemStatus::NFTDeposited.to_u8();
                        transfered = true;
                        msg!("NFTDeposited");
                        break;
                    }
                }

                break;
            }
        }
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
            MYERROR::UnexpectedState
        );
        require!(!!transfered, MYERROR::NoSend);
        Ok(())
    }

    pub fn deposit_c_nft<'info>(
        ctx: Context<'_, '_, '_, 'info, DepositCNftPresigned<'info>>,
        _seed: Vec<u8>,
        root: [u8; 32],
        data_hash: [u8; 32],
        creator_hash: [u8; 32],
        nonce: u64,
        index: u32
    ) -> Result<()> {
        let swap_data_account_account_info = ctx.accounts.swap_data_account
            .to_account_info()
            .clone();
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item in ctx.accounts.swap_data_account.items.iter_mut() {
            if item.is_compressed && item.is_nft {
                if
                    item.merkle_tree.eq(&ctx.accounts.merkle_tree.key()) &&
                    index == item.index &&
                    item.owner.eq(&ctx.accounts.user.key()) &&
                    item.status == ItemStatus::NFTPending.to_u8()
                {
                    // creating base transfer builder
                    let transfert_data = create_c_nft_instruction(
                        root,
                        data_hash,
                        creator_hash,
                        nonce,
                        index,
                        SendCNft {
                            from: ctx.accounts.user_pda.to_account_info(),
                            to: swap_data_account_account_info.clone(),
                            system_program: ctx.accounts.system_program.to_account_info(),
                            leaf_delegate: ctx.accounts.leaf_delegate.to_account_info(),
                            tree_authority: ctx.accounts.tree_authority.to_account_info(),
                            merkle_tree: ctx.accounts.merkle_tree.to_account_info(),
                            log_wrapper: ctx.accounts.log_wrapper.to_account_info(),
                            compression_program: ctx.accounts.compression_program.to_account_info(),
                            bubblegum_program: ctx.accounts.bubblegum_program.to_account_info(),
                            remaining_accounts: ctx.remaining_accounts.to_vec().clone(),
                        }
                    ).unwrap();

                    invoke(&transfert_data.instruction, &transfert_data.account_infos)?;

                    let index = ctx.accounts.user_pda.items_to_sell
                        .iter()
                        .position(|x| x.mint.eq(&item.mint))
                        .unwrap();

                    msg!("token {} was removed to userPda to sell at index {}", item.mint, index);
                    ctx.accounts.user_pda.items_to_sell.remove(index);

                    item.status = ItemStatus::NFTDeposited.to_u8();
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
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and deposits lamports to escrow. /!\ user that should only receive lamports don't have to deposit.
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => User that deposits
    /// @return Void
    pub fn deposit_sol(ctx: Context<Deposit>, seed: Vec<u8>, bump: u8) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item in ctx.accounts.swap_data_account.items.iter_mut() {
            if
                !item.is_nft &&
                item.status == ItemStatus::SolPending.to_u8() &&
                item.owner.eq(ctx.accounts.signer.key) &&
                transfered == false
            {
                let ix;
                if ctx.accounts.user.key().eq(&ctx.accounts.user_ata.key()) {
                    ix = solana_program::system_instruction::transfer(
                        &ctx.accounts.user_ata.key(),
                        &ctx.accounts.swap_data_account_ata.key(),
                        item.amount.unsigned_abs()
                    );
                } else {
                    ix = spl_token::instruction::transfer(
                        &ctx.accounts.token_program.key,
                        &ctx.accounts.user_ata.key(),
                        &ctx.accounts.swap_data_account_ata.key(),
                        &ctx.accounts.user.key(),
                        &[&ctx.accounts.signer.key()],
                        item.amount.unsigned_abs()
                    )?;
                }
                invoke_signed(
                    &ix,
                    &[
                        ctx.accounts.token_program.to_account_info(),
                        ctx.accounts.signer.to_account_info(),
                        ctx.accounts.user.to_account_info(),
                        ctx.accounts.user_ata.to_account_info(),
                        ctx.accounts.user_ata.to_account_info(),
                        ctx.accounts.swap_data_account_ata.to_account_info(),
                    ],
                    &[&[&seed[..], &[bump]]]
                )?;
                item.status = ItemStatus::SolDeposited.to_u8();
                transfered = true;
                msg!("SolDeposited");
                break;
            }
        }

        require!(!!transfered, MYERROR::NoSend);
        Ok(())
    }

    /// @notice Verify Swap's PDA items to proceed to waiting for claiming state. /!\ initializer function
    /// @dev Function verify each item status to mutate the smart contract status to 1 (waiting for claim).  /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @return Void
    pub fn deposit_validate(ctx: Context<Validate>, _seed: Vec<u8>, _bump: u8) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
            MYERROR::UnexpectedState
        );

        // Checks that all items have been deposited
        for item in ctx.accounts.swap_data_account.items.iter_mut() {
            if
                !(
                    item.status == ItemStatus::NFTDeposited.to_u8() ||
                    item.status == ItemStatus::SolDeposited.to_u8() ||
                    item.status == ItemStatus::SolToClaim.to_u8()
                )
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
    pub fn claim_sol(ctx: Context<ClaimTokenOrSol>, seed: Vec<u8>, bump: u8) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToClaim.to_u8(),
            MYERROR::NotReady
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item in &mut ctx.accounts.swap_data_account.items {
            if
                !item.is_nft &&
                item.status == ItemStatus::SolToClaim.to_u8() &&
                item.owner.eq(ctx.accounts.user.key) &&
                transfered == false
            {
                if item.amount.is_negative() {
                    let amount_to_send = item.amount.unsigned_abs();
                    let swap_data_lamports_initial = ctx.accounts.swap_data_account_ata.amount;

                    if swap_data_lamports_initial >= amount_to_send {
                        let ix;
                        if ctx.accounts.user.key().eq(&ctx.accounts.user_ata.key()) {
                            ix = solana_program::system_instruction::transfer(
                                &ctx.accounts.swap_data_account_ata.key(),
                                &ctx.accounts.user_ata.key(),
                                item.amount.unsigned_abs()
                            );
                        } else {
                            ix = spl_token::instruction::transfer(
                                &ctx.accounts.token_program.key,
                                &ctx.accounts.swap_data_account_ata.key(),
                                &ctx.accounts.user_ata.key(),
                                &ctx.accounts.user.key(),
                                &[&ctx.accounts.signer.key()],
                                amount_to_send
                            )?;
                        }
                        invoke_signed(
                            &ix,
                            &[
                                ctx.accounts.token_program.to_account_info(),
                                ctx.accounts.signer.to_account_info(),
                                ctx.accounts.user.to_account_info(),
                                ctx.accounts.user_ata.to_account_info(),
                                ctx.accounts.user_ata.to_account_info(),
                                ctx.accounts.swap_data_account_ata.to_account_info(),
                            ],
                            &[&[&seed[..], &[bump]]]
                        )?;

                        //update item status to SolClaimed
                        item.status = ItemStatus::SolClaimed.to_u8();
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
        require!(!!transfered, MYERROR::NoSend);
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
    pub fn claim_p_nft(ctx: Context<ClaimPNft>, seed: Vec<u8>, bump: u8) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToClaim.to_u8(),
            MYERROR::NotReady
        );

        let swap_data_account_key = ctx.accounts.swap_data_account.key().clone();
        let swap_data_account_account_info = ctx.accounts.swap_data_account
            .to_account_info()
            .clone();
        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item in ctx.accounts.swap_data_account.items.iter_mut() {
            if
                item.is_nft &&
                item.status == ItemStatus::NFTDeposited.to_u8() &&
                item.mint.eq(&ctx.accounts.swap_data_account_ata.mint) &&
                item.mint.eq(&ctx.accounts.user_ata.mint) &&
                item.destinary.eq(ctx.accounts.user.key) &&
                transfered == false
            {
                // Transfer the NFT to user
                let transfert_data = create_p_nft_instruction(item.amount.unsigned_abs(), SendPNft {
                    from: swap_data_account_account_info.clone(),
                    from_ata: ctx.accounts.swap_data_account_ata.to_account_info(),
                    to: ctx.accounts.user.to_account_info(),
                    to_ata: ctx.accounts.user_ata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    signer: ctx.accounts.signer.to_account_info(),
                    auth_rules: ctx.accounts.auth_rules.to_account_info(),
                    auth_rules_program: ctx.accounts.auth_rules_program.to_account_info(),
                    destination_token_record: ctx.accounts.destination_token_record.to_account_info(),
                    metadata_program: ctx.accounts.metadata_program.to_account_info(),
                    nft_master_edition: ctx.accounts.nft_master_edition.to_account_info(),
                    nft_metadata: ctx.accounts.nft_metadata.to_account_info(),
                    owner_token_record: ctx.accounts.owner_token_record.to_account_info(),
                    spl_ata_program: ctx.accounts.spl_ata_program.to_account_info(),
                    sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
                    spl_token_program: ctx.accounts.spl_token_program.to_account_info(),
                    // token_program: ctx.accounts.token_program.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                }).unwrap();

                //Bbroadcast transfer instruction
                invoke_signed(
                    &transfert_data.instruction,
                    &transfert_data.account_infos,
                    &[&[&seed[..], &[bump]]]
                )?;

                msg!("NFT item Claimed");
                let _ = ctx.accounts.swap_data_account_ata.reload();
                // if no more NFT held, closes the Swap's PDA ATA
                if ctx.accounts.swap_data_account_ata.amount == 0 {
                    let ix2 = spl_token::instruction::close_account(
                        &ctx.accounts.token_program.key,
                        &ctx.accounts.swap_data_account_ata.key(),
                        &ctx.accounts.user.key(),
                        &swap_data_account_key,
                        &[&swap_data_account_key]
                    )?;
                    invoke_signed(
                        &ix2,
                        &[
                            ctx.accounts.token_program.to_account_info(),
                            ctx.accounts.swap_data_account_ata.to_account_info(),
                            swap_data_account_account_info.clone(),
                            ctx.accounts.user.to_account_info(),
                        ],
                        &[&[&seed[..], &[bump]]]
                    )?;
                    msg!("ATA closed");
                }

                //Change status to NFTClaimed
                item.status = ItemStatus::NFTClaimed.to_u8();
                transfered = true;
                break;
            }
        }

        require!(!!transfered, MYERROR::NoSend);

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
        index: u32
    ) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToClaim.to_u8(),
            MYERROR::NotReady
        );
        let swap_data_account_key = ctx.accounts.swap_data_account.key().clone();
        let swap_data_account_account_info = ctx.accounts.swap_data_account
            .to_account_info()
            .clone();
        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item in ctx.accounts.swap_data_account.items.iter_mut() {
            if item.is_compressed && item.is_nft {
                if
                    item.status == ItemStatus::NFTDeposited.to_u8() &&
                    item.merkle_tree.eq(&ctx.accounts.merkle_tree.key()) &&
                    index == item.index &&
                    item.destinary.eq(&ctx.accounts.user.key()) &&
                    !transfered
                {
                    // Bypass function for initializer or the destinary of this NFT

                    // Transfer the NFT to user

                    let transfert_data = create_c_nft_instruction(
                        root,
                        data_hash,
                        creator_hash,
                        nonce,
                        index,
                        SendCNft {
                            from: swap_data_account_account_info.clone(),
                            to: ctx.accounts.user.to_account_info(),
                            merkle_tree: ctx.accounts.merkle_tree.to_account_info(),
                            system_program: ctx.accounts.system_program.to_account_info(),
                            leaf_delegate: ctx.accounts.leaf_delegate.to_account_info(),
                            tree_authority: ctx.accounts.tree_authority.to_account_info(),
                            log_wrapper: ctx.accounts.log_wrapper.to_account_info(),
                            compression_program: ctx.accounts.compression_program.to_account_info(),
                            bubblegum_program: ctx.accounts.bubblegum_program.to_account_info(),
                            remaining_accounts: ctx.remaining_accounts.to_vec().clone(),
                        }
                    ).unwrap();

                    invoke_signed(
                        &transfert_data.instruction,
                        &transfert_data.account_infos,
                        &[&[&seed[..], &[bump]]]
                    )?;

                    const TRANSFER_DISCRIMINATOR: &[u8; 8] = &[163, 52, 200, 231, 140, 3, 69, 186];

                    let mut accounts: Vec<solana_program::instruction::AccountMeta> = vec![
                        AccountMeta::new_readonly(ctx.accounts.tree_authority.key(), false),
                        AccountMeta::new_readonly(swap_data_account_key, true),
                        AccountMeta::new_readonly(swap_data_account_key, false),
                        AccountMeta::new_readonly(ctx.accounts.user.key(), false),
                        AccountMeta::new(ctx.accounts.merkle_tree.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.log_wrapper.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.compression_program.key(), false),
                        AccountMeta::new_readonly(ctx.accounts.system_program.key(), false)
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
                        swap_data_account_account_info.clone(),
                        swap_data_account_account_info.clone(),
                        ctx.accounts.user.to_account_info(),
                        ctx.accounts.merkle_tree.to_account_info(),
                        ctx.accounts.log_wrapper.to_account_info(),
                        ctx.accounts.compression_program.to_account_info(),
                        ctx.accounts.system_program.to_account_info()
                    ];

                    // add "accounts" (hashes) that make up the merkle proof
                    for acc in ctx.remaining_accounts.iter() {
                        accounts.push(AccountMeta::new_readonly(acc.key(), false));
                        account_infos.push(acc.to_account_info());
                    }

                    // msg!("manual cpi call");
                    invoke_signed(
                        &(solana_program::instruction::Instruction {
                            program_id: ctx.accounts.bubblegum_program.key(),
                            accounts,
                            data,
                        }),
                        &account_infos[..],
                        &[&[&seed[..], &[bump]]]
                    )?;

                    //Change status to NFTClaimed
                    item.status = ItemStatus::NFTClaimed.to_u8();
                    transfered = true;
                    break;
                }
            }
        }

        require!(!!transfered, MYERROR::NoSend);
        Ok(())
    }

    /// @notice Verify Swap's PDA items to proceed to closed state. /!\ initializer function
    /// @dev Function verify each item status to mutate the smart contract status to 3 (closed) then close the Swap's PDA.  /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds, signer: Pubkey => initializer
    /// @accounts signer: Pubkey => initializer
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts spl_token_program: Pubkey = spl_associated_token_program_id
    /// @return Void
    pub fn claim_validate(ctx: Context<ValidateAndClose>, _seed: Vec<u8>, _bump: u8) -> Result<()> {
        msg!("validate claimed status {}", ctx.accounts.swap_data_account.status);
        require_eq!(
            ctx.accounts.swap_data_account.status,
            TradeStatus::WaitingToClaim.to_u8(),
            MYERROR::NotReady
        );

        // verify all items are claimed
        for item in ctx.accounts.swap_data_account.items.iter_mut() {
            if
                !(
                    item.status == ItemStatus::SolClaimed.to_u8() ||
                    item.status == ItemStatus::NFTClaimed.to_u8() ||
                    item.status == ItemStatus::SolDeposited.to_u8()
                )
            {
                msg!("item owner {}, mint {}, status {}", item.owner, item.mint, item.status);
                return Err(error!(MYERROR::NotReady).into());
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
    pub fn cancel_sol(ctx: Context<ClaimTokenOrSol>, seed: Vec<u8>, bump: u8) -> Result<()> {
        if
            !(
                ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8() ||
                ctx.accounts.swap_data_account.status == TradeStatus::Canceling.to_u8()
            )
        {
            return Err(error!(MYERROR::NotReady).into());
        }

        let mut transfered: bool = false;
        let mut authorized: bool = false;

        if ctx.accounts.signer.key().eq(&ctx.accounts.swap_data_account.initializer) {
            authorized = true;
        }

        // find the item linked with shared Accounts
        for item in ctx.accounts.swap_data_account.items.iter_mut() {
            if (ctx.accounts.signer.key().eq(&item.owner) && item.amount > 0) || authorized == true {
                authorized = true;
            }

            if !item.is_nft && item.owner.eq(ctx.accounts.user.key) && transfered == false {
                // Check if deposited
                if item.status == ItemStatus::SolDeposited.to_u8() {
                    if item.amount.is_positive() {
                        let amount_to_send = item.amount.unsigned_abs();
                        let swap_data_lamports_initial = ctx.accounts.swap_data_account_ata.amount;

                        if swap_data_lamports_initial >= amount_to_send {
                            let ix;
                            if ctx.accounts.user.key().eq(&ctx.accounts.user_ata.key()) {
                                ix = solana_program::system_instruction::transfer(
                                    &ctx.accounts.swap_data_account_ata.key(),
                                    &ctx.accounts.user_ata.key(),
                                    item.amount.unsigned_abs()
                                );
                            } else {
                                ix = spl_token::instruction::transfer(
                                    &ctx.accounts.token_program.key,
                                    &ctx.accounts.swap_data_account_ata.key(),
                                    &ctx.accounts.user_ata.key(),
                                    &ctx.accounts.user.key(),
                                    &[&ctx.accounts.signer.key()],
                                    amount_to_send
                                )?;
                            }
                            invoke_signed(
                                &ix,
                                &[
                                    ctx.accounts.token_program.to_account_info(),
                                    ctx.accounts.signer.to_account_info(),
                                    ctx.accounts.user.to_account_info(),
                                    ctx.accounts.user_ata.to_account_info(),
                                    ctx.accounts.user_ata.to_account_info(),
                                    ctx.accounts.swap_data_account_ata.to_account_info(),
                                ],
                                &[&[&seed[..], &[bump]]]
                            )?;

                            item.status = ItemStatus::SolCanceledRecovered.to_u8();
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

        require!(!!transfered, MYERROR::NoSend);
        require!(!!authorized, MYERROR::UserNotPartOfTrade);

        // if not already, Swap status changed to 90 (Canceled)
        if ctx.accounts.swap_data_account.status != TradeStatus::Canceling.to_u8() {
            ctx.accounts.swap_data_account.status = TradeStatus::Canceling.to_u8();
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
    pub fn cancel_p_nft(ctx: Context<ClaimPNft>, seed: Vec<u8>, bump: u8) -> Result<()> {
        let user_ata = &ctx.accounts.user_ata;
        let sda_ata = &mut ctx.accounts.swap_data_account_ata;

        let swap_data_account_key = ctx.accounts.swap_data_account.key().clone();
        let swap_data_account_account_info = ctx.accounts.swap_data_account
            .to_account_info()
            .clone();

        let mut authorized = false;

        if ctx.accounts.signer.key().eq(&ctx.accounts.swap_data_account.initializer) {
            authorized = true;
        }

        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8() ||
                ctx.accounts.swap_data_account.status == TradeStatus::Canceling.to_u8(),
            MYERROR::NotReady
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item in ctx.accounts.swap_data_account.items.iter_mut() {
            if ctx.accounts.signer.key().eq(&item.owner) || authorized == true {
                authorized = true;
            }

            if
                item.is_nft &&
                item.status == ItemStatus::NFTDeposited.to_u8() &&
                item.mint.eq(&user_ata.mint) &&
                item.mint.eq(&sda_ata.mint) &&
                item.owner.eq(ctx.accounts.user.key) &&
                transfered == false
            {
                // Transfer deposited NFT back to user
                let transfert_data = create_p_nft_instruction(item.amount.unsigned_abs(), SendPNft {
                    from: swap_data_account_account_info.clone(),
                    from_ata: sda_ata.to_account_info(),
                    to: ctx.accounts.user.to_account_info(),
                    to_ata: user_ata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    signer: ctx.accounts.signer.to_account_info(),
                    auth_rules: ctx.accounts.auth_rules.to_account_info(),
                    auth_rules_program: ctx.accounts.auth_rules_program.to_account_info(),
                    destination_token_record: ctx.accounts.destination_token_record.to_account_info(),
                    metadata_program: ctx.accounts.metadata_program.to_account_info(),
                    nft_master_edition: ctx.accounts.nft_master_edition.to_account_info(),
                    nft_metadata: ctx.accounts.nft_metadata.to_account_info(),
                    owner_token_record: ctx.accounts.owner_token_record.to_account_info(),
                    spl_ata_program: ctx.accounts.spl_ata_program.to_account_info(),
                    sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
                    spl_token_program: ctx.accounts.spl_token_program.to_account_info(),
                    // token_program: ctx.accounts.token_program.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                }).unwrap();

                //Bbroadcast transfer instruction
                invoke_signed(
                    &transfert_data.instruction,
                    &transfert_data.account_infos,
                    &[&[&seed[..], &[bump]]]
                )?;

                msg!("NFT item Canceled");

                let _ = sda_ata.reload();

                // If Swap's PDA ATA balance is null, closes the account and send the rent to user
                if sda_ata.amount.eq(&0) {
                    let ix2 = spl_token::instruction::close_account(
                        &ctx.accounts.token_program.key,
                        &sda_ata.key(),
                        &ctx.accounts.user.key(),
                        &swap_data_account_key,
                        &[&swap_data_account_key]
                    )?;

                    invoke_signed(
                        &ix2,
                        &[
                            ctx.accounts.token_program.to_account_info(),
                            sda_ata.to_account_info(),
                            swap_data_account_account_info.clone(),
                            ctx.accounts.user.to_account_info(),
                        ],
                        &[&[&seed[..], &[bump]]]
                    )?;
                    msg!("ATA closed");
                }

                // Update item status to 91 (CancelRecovered)
                item.status = ItemStatus::NFTCanceledRecovered.to_u8();

                transfered = true;
            }
        }

        require!(!!transfered, MYERROR::NoSend);
        require!(!!authorized, MYERROR::UserNotPartOfTrade);

        // If not already, update Swap's status to 90 (Canceled)
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
        index: u32
    ) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8() ||
                ctx.accounts.swap_data_account.status == TradeStatus::Canceling.to_u8(),
            MYERROR::NotReady
        );

        if
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8() &&
            !(
                ctx.accounts.signer.key().eq(&ctx.accounts.swap_data_account.initializer) ||
                ctx.accounts.user.key().eq(&ctx.accounts.signer.key())
            )
        {
            return Err(error!(MYERROR::NotAuthorized));
        }
        let swap_data_account_account_info = ctx.accounts.swap_data_account
            .to_account_info()
            .clone();

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item in ctx.accounts.swap_data_account.items.iter_mut() {
            if item.is_compressed && item.is_nft {
                if
                    item.status == ItemStatus::NFTDeposited.to_u8() &&
                    item.merkle_tree.eq(&ctx.accounts.merkle_tree.key()) &&
                    index == item.index &&
                    item.owner.eq(ctx.accounts.user.key) &&
                    !transfered
                {
                    // Transfer deposited NFT back to user
                    let transfert_data = create_c_nft_instruction(
                        root,
                        data_hash,
                        creator_hash,
                        nonce,
                        index,
                        SendCNft {
                            from: swap_data_account_account_info.clone(),
                            to: ctx.accounts.user.to_account_info(),
                            merkle_tree: ctx.accounts.merkle_tree.to_account_info(),
                            system_program: ctx.accounts.system_program.to_account_info(),
                            leaf_delegate: ctx.accounts.leaf_delegate.to_account_info(),
                            tree_authority: ctx.accounts.tree_authority.to_account_info(),
                            log_wrapper: ctx.accounts.log_wrapper.to_account_info(),
                            compression_program: ctx.accounts.compression_program.to_account_info(),
                            bubblegum_program: ctx.accounts.bubblegum_program.to_account_info(),
                            remaining_accounts: ctx.remaining_accounts.to_vec().clone(),
                        }
                    ).unwrap();

                    // invoke(&transfert_data.instruction, &transfert_data.account_infos)?;
                    invoke_signed(
                        &transfert_data.instruction,
                        &transfert_data.account_infos,
                        &[&[&seed[..], &[bump]]]
                    )?;

                    // Update item status to 91 (CancelRecovered)
                    item.status = ItemStatus::NFTCanceledRecovered.to_u8();
                    msg!("NFT item status changed to NFTcanceledRecovered");

                    transfered = true;
                }
            }
        }

        require!(!!transfered, MYERROR::NoSend);

        // If not already, update Swap's status to 90 (canceled)
        if ctx.accounts.swap_data_account.status != TradeStatus::Canceling.to_u8() {
            ctx.accounts.swap_data_account.status = TradeStatus::Canceling.to_u8();
            msg!("General status changed to Canceling");
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
    /// @accounts spl_token_program: Pubkey = spl_associated_token_program_id
    /// @return Void
    pub fn cancel_validate(
        ctx: Context<ValidateAndClose>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()> {
        if
            !(
                ctx.accounts.swap_data_account.status == TradeStatus::Canceling.to_u8() ||
                ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8() ||
                ctx.accounts.swap_data_account.status == TradeStatus::Initializing.to_u8()
            )
        {
            return Err(error!(MYERROR::NotReady).into());
        }

        let nbr_items = ctx.accounts.swap_data_account.items.len();
        let mut checker = 0;
        // Checks all items are Canceled
        for item in ctx.accounts.swap_data_account.items.iter_mut() {
            if
                !(
                    item.status == ItemStatus::SolCanceledRecovered.to_u8() ||
                    item.status == ItemStatus::NFTCanceledRecovered.to_u8() ||
                    item.status == ItemStatus::SolPending.to_u8() ||
                    item.status == ItemStatus::NFTPending.to_u8() ||
                    item.status == ItemStatus::SolToClaim.to_u8()
                )
            {
                return Err(error!(MYERROR::NotReady).into());
            }
            checker += 1;
        }
        require!(checker == nbr_items, MYERROR::NotReady);
        ctx.accounts.swap_data_account.status = TradeStatus::Closed.to_u8();
        msg!("General status changed to Closed");

        Ok(())
    }

    /// @notice Initialize User's PDA. /!\ Signer will be User
    /// @dev Function to trigger to initialize User's PDA with according space. /!\ Signer will be User
    /// @param seed: u8[] => Seed buffer corresponding to User's Publickey
    /// @param bump: u8 => "Bump corresponding to User's Publickey"
    /// @accounts user_pda: Pubkey => User's PDA corresponding to seeds
    /// @accounts signer: Pubkey => User
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts spl_token_program: Pubkey = spl_associated_token_program_id
    /// @return Void
    pub fn user_pda_create(ctx: Context<UserPdaCreate>) -> Result<()> {
        let user_account_seed = ctx.accounts.user.key().to_bytes().to_vec();

        let (pda, _user_account_bump) = Pubkey::find_program_address(
            &[&user_account_seed],
            &ctx.program_id.key()
        );

        require!(pda.eq(&ctx.accounts.user_pda.key()), MYERROR::IncorrectAccount);

        ctx.accounts.user_pda.owner = ctx.accounts.user.key();
        // ctx.accounts.user_pda.amount_to_topup = 0;
        ctx.accounts.user_pda.items_to_sell = [].to_vec();
        ctx.accounts.user_pda.items_to_buy = [].to_vec();
        Ok(())
    }

    /// @notice add item to User's PDA. /!\ User function
    /// @dev Function to add an item to the User's PDA.  /!\ this function can only be triggered by User
    /// @param seed: u8[] => Seed buffer corresponding to User's Publickey
    /// @param bump: u8 => "Bump corresponding to User's PDA"
    /// @param trade_to_add: NftSwapItem: {is_nft: bool => "return true if the item is en NFT (true)/(false)", mint: Pubkey => "(Mint address)/(Owner address)", amount: i64 => (nbr of NFT engaged in this trade)/(number of lamports the user will exchange with the smart contract if_positive(user will give lamports), if_negative(user will receive lamports)), owner: Pubkey => owner of the NFT or lamports , destinary: Pubkey => (user who should receive the NFT)/(Owner address), status : u8 => /!\ will be rewritten by program, }
    /// @accounts user_pda: Pubkey => User's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @return Void
    pub fn user_modify_nft_buy(
        ctx: Context<UserPdaModifyBuyNFT>,
        item_to_modify: OptionToBuy,
        is_remove_item: bool
    ) -> Result<()> {
        if is_remove_item {
            let index = ctx.accounts.user_pda.items_to_buy
                .iter()
                .position(|x| x.mint.eq(&item_to_modify.mint))
                .unwrap();

            msg!("token {} was removed to userPda to buy at index {}", item_to_modify.mint, index);
            ctx.accounts.user_pda.items_to_buy.remove(index);
        } else {
            if
                already_exist_buy(
                    ctx.accounts.user_pda.items_to_buy.to_vec(),
                    item_to_modify.clone()
                )
            {
                let index = ctx.accounts.user_pda.items_to_buy
                    .iter()
                    .position(|x| x.mint.eq(&item_to_modify.mint))
                    .unwrap();

                ctx.accounts.user_pda.items_to_buy[index] = item_to_modify.clone();
                msg!(
                    "token {} was modified to userPda to buy at index {}, {} tokens can be payed with {} for {}",
                    item_to_modify.mint,
                    index,
                    item_to_modify.amount,
                    item_to_modify.token,
                    item_to_modify.price_max
                );
            } else {
                ctx.accounts.user_pda.items_to_buy.push(item_to_modify.clone());
            }
        }

        Ok(())
    }

    pub fn user_modify_p_nft_sell(
        ctx: Context<DepositPNft>,
        item_to_modify: OptionToSell,
        is_remove_item: bool,
        seed: Vec<u8>,
        bump: u8
    ) -> Result<()> {
        if is_remove_item {
            let transfert_data = create_p_nft_instruction(item_to_modify.amount, SendPNft {
                from: ctx.accounts.user_pda.to_account_info(),
                from_ata: ctx.accounts.user_pda_ata.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
                to_ata: ctx.accounts.user_ata.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                signer: ctx.accounts.signer.to_account_info(),
                auth_rules: ctx.accounts.auth_rules.to_account_info(),
                auth_rules_program: ctx.accounts.auth_rules_program.to_account_info(),
                destination_token_record: ctx.accounts.destination_token_record.to_account_info(),
                metadata_program: ctx.accounts.metadata_program.to_account_info(),
                nft_master_edition: ctx.accounts.nft_master_edition.to_account_info(),
                nft_metadata: ctx.accounts.nft_metadata.to_account_info(),
                owner_token_record: ctx.accounts.owner_token_record.to_account_info(),
                spl_ata_program: ctx.accounts.spl_ata_program.to_account_info(),
                sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
                spl_token_program: ctx.accounts.spl_token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            }).unwrap();

            //Bbroadcast transfer instruction
            invoke_signed(
                &transfert_data.instruction,
                &transfert_data.account_infos,
                &[&[&seed[..], &[bump]]]
            )?;

            let index = ctx.accounts.user_pda.items_to_sell
                .iter()
                .position(|x| x.mint.eq(&item_to_modify.mint))
                .unwrap();

            msg!("token {} was removed to userPda to sell at index {}", item_to_modify.mint, index);
            ctx.accounts.user_pda.items_to_sell.remove(index);
        } else {
            if
                already_exist_sell(
                    ctx.accounts.user_pda.items_to_sell.to_vec(),
                    item_to_modify.clone()
                )
            {
                let index = ctx.accounts.user_pda.items_to_sell
                    .iter()
                    .position(|x| x.mint.eq(&item_to_modify.mint))
                    .unwrap();

                ctx.accounts.user_pda.items_to_sell[index] = item_to_modify.clone();
                msg!(
                    "token {} was modified to userPda to sell at index {}, {} tokens can be payed with {} for {}",
                    item_to_modify.mint,
                    index,
                    item_to_modify.amount,
                    item_to_modify.token,
                    item_to_modify.price_min
                );
            } else {
                let transfert_data = create_p_nft_instruction(item_to_modify.amount, SendPNft {
                    from: ctx.accounts.signer.to_account_info(),
                    from_ata: ctx.accounts.user_ata.to_account_info(),
                    to: ctx.accounts.user_pda.to_account_info(),
                    to_ata: ctx.accounts.user_pda_ata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    signer: ctx.accounts.signer.to_account_info(),
                    auth_rules: ctx.accounts.auth_rules.to_account_info(),
                    auth_rules_program: ctx.accounts.auth_rules_program.to_account_info(),
                    destination_token_record: ctx.accounts.destination_token_record.to_account_info(),
                    metadata_program: ctx.accounts.metadata_program.to_account_info(),
                    nft_master_edition: ctx.accounts.nft_master_edition.to_account_info(),
                    nft_metadata: ctx.accounts.nft_metadata.to_account_info(),
                    owner_token_record: ctx.accounts.owner_token_record.to_account_info(),
                    sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
                    spl_token_program: ctx.accounts.spl_token_program.to_account_info(),
                    spl_ata_program: ctx.accounts.spl_ata_program.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                }).unwrap();

                // Send NFTs
                invoke(&transfert_data.instruction, &transfert_data.account_infos)?;

                // Add data to pda
                ctx.accounts.user_pda.items_to_sell.push(item_to_modify.clone());
            }

            msg!(
                "{} token {} owned by {} was sent to {}\n can be payed with {} for {}",
                item_to_modify.amount,
                item_to_modify.mint,
                ctx.accounts.signer.key(),
                ctx.accounts.user_pda.key(),
                item_to_modify.token,
                item_to_modify.price_min
            );
        }
        Ok(())
    }

    pub fn user_modify_c_nft_sell<'info>(
        ctx: Context<'_, '_, '_, 'info, DepositCNft<'info>>,
        item_to_modify: OptionToSell,
        is_remove_item: bool,
        root: [u8; 32],
        data_hash: [u8; 32],
        creator_hash: [u8; 32],
        nonce: u64,
        index: u32,
        seed: Vec<u8>,
        bump: u8
    ) -> Result<()> {
        if is_remove_item {
            let transfert_data = create_c_nft_instruction(
                root,
                data_hash,
                creator_hash,
                nonce,
                index,
                SendCNft {
                    from: ctx.accounts.user_pda.to_account_info(),
                    to: ctx.accounts.user.to_account_info(),
                    merkle_tree: ctx.accounts.merkle_tree.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    leaf_delegate: ctx.accounts.leaf_delegate.to_account_info(),
                    tree_authority: ctx.accounts.tree_authority.to_account_info(),
                    log_wrapper: ctx.accounts.log_wrapper.to_account_info(),
                    compression_program: ctx.accounts.compression_program.to_account_info(),
                    bubblegum_program: ctx.accounts.bubblegum_program.to_account_info(),
                    remaining_accounts: ctx.remaining_accounts.to_vec().clone(),
                }
            ).unwrap();

            invoke_signed(
                &transfert_data.instruction,
                &transfert_data.account_infos,
                &[&[&seed[..], &[bump]]]
            )?;

            let index = ctx.accounts.user_pda.items_to_sell
                .iter()
                .position(|x| x.mint.eq(&item_to_modify.mint))
                .unwrap();

            msg!("token {} was removed to userPda to sell at index {}", item_to_modify.mint, index);
            ctx.accounts.user_pda.items_to_sell.remove(index);
        } else {
            if
                already_exist_sell(
                    ctx.accounts.user_pda.items_to_sell.to_vec(),
                    item_to_modify.clone()
                )
            {
                let index = ctx.accounts.user_pda.items_to_sell
                    .iter()
                    .position(|x| x.mint.eq(&item_to_modify.mint))
                    .unwrap();

                ctx.accounts.user_pda.items_to_sell[index] = item_to_modify.clone();
                msg!(
                    "token {} was modified to userPda to sell at index {}, {} tokens can be payed with {} for {}",
                    item_to_modify.mint,
                    index,
                    item_to_modify.amount,
                    item_to_modify.token,
                    item_to_modify.price_min
                );
            } else {
                let transfert_data = create_c_nft_instruction(
                    root,
                    data_hash,
                    creator_hash,
                    nonce,
                    index,
                    SendCNft {
                        from: ctx.accounts.user.to_account_info(),
                        to: ctx.accounts.user_pda.to_account_info(),
                        system_program: ctx.accounts.system_program.to_account_info(),
                        leaf_delegate: ctx.accounts.leaf_delegate.to_account_info(),
                        tree_authority: ctx.accounts.tree_authority.to_account_info(),
                        merkle_tree: ctx.accounts.merkle_tree.to_account_info(),
                        log_wrapper: ctx.accounts.log_wrapper.to_account_info(),
                        compression_program: ctx.accounts.compression_program.to_account_info(),
                        bubblegum_program: ctx.accounts.bubblegum_program.to_account_info(),
                        remaining_accounts: ctx.remaining_accounts.to_vec().clone(),
                    }
                ).unwrap();

                invoke(&transfert_data.instruction, &transfert_data.account_infos)?;
                // Add data to pda
                ctx.accounts.user_pda.items_to_sell.push(item_to_modify.clone());

                msg!(
                    "{} token {} owned by {} \nwas sent to {}\ncan be payed in {} costing {}",
                    item_to_modify.amount,
                    item_to_modify.mint,
                    ctx.accounts.user.key(),
                    ctx.accounts.user_pda.key(),
                    item_to_modify.token,
                    item_to_modify.price_min
                );
            }
        }
        Ok(())
    }

    pub fn user_modify_top_up(
        ctx: Context<UserPdaUpdateToTopUp>,
        amount_to_topup: i64,
        seed: Vec<u8>,
        bump: u8
    ) -> Result<()> {
        let transfer_ix: Instruction;
        let mut transfered = false;
        let is_system = ctx.accounts.signer_ata.key().eq(&ctx.accounts.signer.key());
        msg!("amount to topup {}", amount_to_topup);
        msg!("is_system {}", is_system);
        // msg!("is_system {}", is_system);
        if amount_to_topup.is_positive() {
            if is_system {
                transfer_ix = solana_program::system_instruction::transfer(
                    &ctx.accounts.signer.key(),
                    &ctx.accounts.user_pda.key(),
                    amount_to_topup.unsigned_abs()
                );
            } else {
                transfer_ix = spl_token::instruction
                    ::transfer(
                        &token::ID,
                        &ctx.accounts.signer_ata.key(),
                        &ctx.accounts.user_pda_ata.key(),
                        &ctx.accounts.signer.key(),
                        &[&ctx.accounts.signer.key()],
                        amount_to_topup.unsigned_abs()
                    )
                    .unwrap();
            }
            invoke(
                &transfer_ix,
                &[
                    ctx.accounts.signer_ata.to_account_info(),
                    ctx.accounts.user_pda_ata.to_account_info(),
                    ctx.accounts.signer.to_account_info(),
                    // ctx.accounts.user_pda.to_account_info(),
                    ctx.accounts.token_program.to_account_info(),
                ]
            )?;
            transfered = true;
        } else if amount_to_topup.is_negative() {
            if is_system {
                transfer_ix = solana_program::system_instruction::transfer(
                    &ctx.accounts.user_pda.key(),
                    &ctx.accounts.signer.key(),
                    amount_to_topup.unsigned_abs()
                );
            } else {
                transfer_ix = spl_token::instruction
                    ::transfer(
                        &token::ID,
                        &ctx.accounts.user_pda_ata.key(),
                        &ctx.accounts.signer_ata.key(),
                        &ctx.accounts.user_pda.key(),
                        &[&ctx.accounts.user_pda.key()],
                        amount_to_topup.unsigned_abs()
                    )
                    .unwrap();
            }
            invoke_signed(
                &transfer_ix,
                &[
                    ctx.accounts.signer_ata.to_account_info(),
                    // ctx.accounts.signer.to_account_info(),
                    ctx.accounts.user_pda_ata.to_account_info(),
                    ctx.accounts.user_pda.to_account_info(),
                    ctx.accounts.token_program.to_account_info(),
                ],
                &[&[&seed[..], &[bump]]]
            )?;
            transfered = true;
        }

        msg!(
            "{} token {} owned by {} was transfered to {}",
            amount_to_topup,
            ctx.accounts.signer_ata.key(), //mint,
            ctx.accounts.signer_ata.key(),
            ctx.accounts.user_pda_ata.key()
        );

        if !transfered {
            return Err(error!(MYERROR::NoSend));
        }
        Ok(())
    }

    pub fn user_pda_close(ctx: Context<UserPdaClose>) -> Result<()> {
        require!(
            ctx.accounts.user_pda.items_to_buy.is_empty() &&
                ctx.accounts.user_pda.items_to_sell.is_empty(),
            MYERROR::NotReady
        );
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
//
//
//
//

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, sent_data : SwapData)]
pub struct InitializeInit<'info> {
    #[account(init, payer = signer, seeds = [&&seed[..]], bump, space = SwapData::size(sent_data))]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    system_program: Program<'info, System>,
    spl_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct InitializeAdd<'info> {
    #[account(
        mut,
        seeds = [&seed[..]],
        bump,
        constraint = swap_data_account.initializer.eq(&signer.key()) @ MYERROR::NotInit
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct InitializeVerify<'info> {
    #[account(
        mut,
        seeds = [&seed[..]], 
        bump,
        constraint = swap_data_account.initializer.eq(&signer.key()) @ MYERROR::NotInit        
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct UserConfirm<'info> {
    #[account(
        mut,
        seeds = [&seed[..]], 
        bump,
        constraint = swap_data_account.initializer.eq(&signer.key()) @ MYERROR::NotInit        
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut,seeds = [&user.key().to_bytes()[..]], bump)]
    user_pda: Box<Account<'info, UserPdaData>>,
    #[account(
        mut,
        constraint = user_pda_ata.owner.eq(&user_pda.to_account_info().key())  @ MYERROR::IncorrectOwner
    )]
    user_pda_ata: Account<'info, TokenAccount>,
    /// CHECK: in CPI
    #[account(mut)]
    user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct DepositPNft<'info> {
    #[account(mut,seeds = [&signer.key().to_bytes()[..]], bump)]
    user_pda: Box<Account<'info, UserPdaData>>,
    /// CHECK: in CPI
    #[account(mut)]
    user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        constraint = user_ata.mint.eq(&user_pda_ata.mint) @ MYERROR::MintIncorrect,
        constraint = user_ata.owner.eq(&signer.key()) @ MYERROR::IncorrectOwner,
        constraint = user_ata.amount > 0 @ MYERROR::NotEnoughFunds

    )]
    user_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_pda_ata.owner.eq(&user_pda.to_account_info().key())  @ MYERROR::IncorrectOwner
)]
    user_pda_ata: Account<'info, TokenAccount>,
    #[account(constraint = user_ata.mint.eq(&mint.key())  @ MYERROR::MintIncorrect)]
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
    nft_master_edition: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(mut)]
    owner_token_record: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(mut)]
    destination_token_record: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    auth_rules_program: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    auth_rules: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&mpl_token_metadata::id()) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
    spl_ata_program: AccountInfo<'info>,
    spl_token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct DepositPNftPresigned<'info> {
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(
        mut,
        constraint = swap_data_account_ata.owner.eq(&swap_data_account.to_account_info().key())  @ MYERROR::IncorrectOwner
    )]
    swap_data_account_ata: Account<'info, TokenAccount>,
    /// CHECK: can only be userPDA
    user: AccountInfo<'info>,

    #[account(mut, seeds = [&signer.key().to_bytes()[..]], bump)]
    user_pda: Box<Account<'info, UserPdaData>>,
    #[account(
        mut,
        constraint = user_pda_ata.mint.eq(&swap_data_account_ata.mint) @ MYERROR::MintIncorrect,
        constraint = user_pda_ata.owner.eq(&user_pda.key()) @ MYERROR::IncorrectOwner,
    )]
    user_pda_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    signer: Signer<'info>,

    #[account(constraint = user_pda_ata.mint == mint.key()  @ MYERROR::MintIncorrect)]
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
    nft_master_edition: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(mut)]
    owner_token_record: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(mut)]
    destination_token_record: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    auth_rules_program: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    auth_rules: AccountInfo<'info>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    spl_token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&mpl_token_metadata::id()) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
    spl_ata_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct DepositCNft<'info> {
    #[account(mut,seeds = [&seed[..]], bump)]
    user_pda: Box<Account<'info, UserPdaData>>,
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
    system_program: Program<'info, System>,
    log_wrapper: Program<'info, Noop>,
    compression_program: Program<'info, SplAccountCompression>,
    bubblegum_program: Program<'info, Bubblegum>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&mpl_token_metadata::ID) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    spl_token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
    spl_ata_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct DepositCNftPresigned<'info> {
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(init, payer = signer, seeds = [&user.key().to_bytes()[..]], bump, space = 10240)]
    user_pda: Box<Account<'info, UserPdaData>>,
    /// CHECK: in cpi
    #[account()]
    user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
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
    system_program: Program<'info, System>,
    log_wrapper: Program<'info, Noop>,
    compression_program: Program<'info, SplAccountCompression>,
    bubblegum_program: Program<'info, Bubblegum>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&mpl_token_metadata::ID) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    spl_token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
    spl_ata_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct Deposit<'info> {
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(
        mut,
        constraint = swap_data_account_ata.is_native() @ MYERROR::MintIncorrect,
        constraint = swap_data_account_ata.owner.eq(&swap_data_account.key())  @ MYERROR::IncorrectOwner
    )]
    swap_data_account_ata: Account<'info, TokenAccount>,
    /// CHECK: can only be userPDA
    #[account(mut)]
    user: AccountInfo<'info>,
    #[account(
        mut,
        constraint = user_ata.is_native() @ MYERROR::MintIncorrect,
        constraint = user_ata.owner.eq(&user.key())  @ MYERROR::IncorrectOwner,
        constraint = user_ata.amount > 0 @ MYERROR::NotEnoughFunds
    )]
    user_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct DepositPresigned<'info> {
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    #[account(mut, seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(
        mut,
        constraint = swap_data_account_ata.owner.eq(&swap_data_account.to_account_info().key())  @ MYERROR::IncorrectOwner,
        constraint = swap_data_account_ata.is_native() @ MYERROR::MintIncorrect,
    )]
    swap_data_account_ata: Account<'info, TokenAccount>,
    /// CHECK: can only be userPDA
    #[account(mut,
        constraint = user.key().eq(&user_pda.owner)  @ MYERROR::IncorrectOwner,
    )]
    user: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [&user.key().to_bytes()[..]], 
        bump //= user_bump,
    )]
    user_pda: Box<Account<'info, UserPdaData>>,
    #[account(
        mut,
        constraint = user_ata.owner.eq(&user.key())  @ MYERROR::IncorrectOwner,
        constraint = user_ata.is_native() @ MYERROR::MintIncorrect,
        constraint = user_ata.amount > 0 @ MYERROR::NotEnoughFunds
    )]
    user_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct Validate<'info> {
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
    system_program: Program<'info, System>,
    spl_token_program: Program<'info, AssociatedToken>,
    #[account(
        mut,
        seeds = [&seed[..]], 
        bump, 
        close = signer,
        constraint = swap_data_account.initializer.eq(&signer.key()) @ MYERROR::NotInit    
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct ClaimPNft<'info> {
    #[account(
        mut,
        seeds = [&seed[..]], 
        bump
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,

    /// CHECK: user Account
    #[account(mut,
        constraint = user_ata.owner == user.key() @ MYERROR::IncorrectOwner
        )]
    user: AccountInfo<'info>,
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
    nft_master_edition: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(mut)]
    owner_token_record: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(mut)]
    destination_token_record: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    auth_rules_program: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    auth_rules: AccountInfo<'info>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    /// CHECK: in constraint
    #[account(constraint = metadata_program.key().eq(&mpl_token_metadata::ID) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraint
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    spl_token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
    spl_ata_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct ClaimCNft<'info> {
    #[account(
        mut,
        seeds = [&seed[..]],
        bump
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: user Account
    user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
    /// CHECK: user Account
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
    system_program: Program<'info, System>,
    /// CHECK: in constraint
    #[account(constraint = metadata_program.key().eq(&mpl_token_metadata::ID) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraint
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    spl_token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
    spl_ata_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct ClaimTokenOrSol<'info> {
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(
        mut,
        constraint = swap_data_account_ata.is_native() @ MYERROR::MintIncorrect,
        constraint = swap_data_account_ata.owner.eq(&swap_data_account.key())  @ MYERROR::IncorrectOwner
    )]
    swap_data_account_ata: Account<'info, TokenAccount>,
    /// CHECK: can only be userPDA
    #[account(mut)]
    user: AccountInfo<'info>,
    #[account(
        mut,
        constraint = user_ata.is_native() @ MYERROR::MintIncorrect,
        constraint = user_ata.owner.eq(&user.key())  @ MYERROR::IncorrectOwner
    )]
    user_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    signer: Signer<'info>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UserPdaCreate<'info> {
    #[account(init, payer = signer, seeds = [&user.key().to_bytes()[..]], bump, space = 10240)]
    user_pda: Box<Account<'info, UserPdaData>>,
    /// CHECK: can only be userPDA
    user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
    system_program: Program<'info, System>,
    spl_token_program: Program<'info, AssociatedToken>,
}
#[derive(Accounts)]
pub struct UserPdaClose<'info> {
    #[account(
        mut,
        seeds = [&signer.key().to_bytes()[..]], 
        bump, 
        close = signer,
        constraint = user_pda.owner.eq(&signer.key()) @ MYERROR::NotInit    
    )]
    user_pda: Box<Account<'info, UserPdaData>>,
    #[account(mut)]
    signer: Signer<'info>,
    system_program: Program<'info, System>,
    spl_token_program: Program<'info, AssociatedToken>,
}
#[derive(Accounts)]
pub struct UserPdaModifyBuyNFT<'info> {
    #[account(
        mut,
        seeds = [&signer.key().to_bytes()[..]], 
        bump,
    )]
    user_pda: Box<Account<'info, UserPdaData>>,
    #[account(mut)]
    signer: Signer<'info>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UserPdaUpdateToTopUp<'info> {
    #[account(
        mut,
        seeds = [&signer.key().to_bytes()[..]], 
        bump,
    )]
    user_pda: Box<Account<'info, UserPdaData>>,
    /// CHECK: can only be userPDA
    #[account(
        mut,
        // constraint = (user_pda_ata.mint.eq(&signer_ata.mint) || user_pda_ata.key().eq(&user_pda.key())) @ MYERROR::MintIncorrect,
        // constraint = (user_pda_ata.owner.eq(&user_pda.key()) || user_pda_ata.key().eq(&user_pda.key()))  @ MYERROR::IncorrectOwner,
    )]
    // user_pda_ata: Account<'info, TokenAccount>,
    user_pda_ata: AccountInfo<'info>,
    /// CHECK: can only be userPDA
    #[account(
        mut,
        // constraint = signer_ata.owner.eq(&signer.key()) || signer_ata.key().eq(&signer.key()) @ MYERROR::IncorrectOwner
    )]
    // signer_ata: Account<'info, TokenAccount>,
    signer_ata: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
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
//
//
//
//

#[account]
#[derive(Default)]
pub struct SwapData {
    pub initializer: Pubkey, // Initializer is admin of the PDA
    pub status: u8, // Gives the status of the current swap with TradeStatus
    pub nb_items: u32, // Required to initialize the PDA account data size
    pub pre_seed: String, // String to initialize PDA's seed
    pub items: Vec<NftSwapItem>, // List of items engaged in a swap (can be SOL or NFT)
    pub accepted_payement: Pubkey, // List of tokens accepted for payment
}

impl SwapData {
    const LEN: usize =
        8 + //Base
        1 + //u8
        4 * 2 + //u32
        4 +
        32 + // max 32 char
        32 * 2; //Pubkey

    pub fn size(swap_data: SwapData) -> usize {
        return SwapData::LEN.checked_add(
            NftSwapItem::LEN.checked_mul(swap_data.nb_items as usize).unwrap()
        ).unwrap();
    }
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct NftSwapItem {
    is_nft: bool, // Argument to sort the functions in the program's functions
    is_compressed: bool, // if NFT is compressed
    mint: Pubkey, // Mint of the NFT. if item not NFT expected PublicKey should be system_program
    merkle_tree: Pubkey, // Merkle Tree of the NFT. if item not CNFT = mint
    index: u32, // Index of the NFT in the Merkle Tree. if item not CNFT = 0
    amount: i64, // amount of tokens or lamports to transfer
    owner: Pubkey, // owner of the NFT or SOL item
    destinary: Pubkey, // destinary of the item
    status: u8, // Status of the Item with ItemStatus
}

impl NftSwapItem {
    const LEN: usize =
        32 * 4 + //pubkey
        2 + //bool / u8
        8 * 2; //i64
}

#[account]
#[derive(Default)]
pub struct UserPdaData {
    pub owner: Pubkey,
    pub items_to_sell: Vec<OptionToSell>,
    pub items_to_buy: Vec<OptionToBuy>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OptionToSell {
    mint: Pubkey,
    price_min: u64,
    token: Pubkey,
    amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OptionToBuy {
    mint: Pubkey,
    price_max: u64,
    token: Pubkey,
    amount: u64,
}

pub enum TradeStatus {
    WaitingToValidatePresigning,
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
            10 => TradeStatus::WaitingToValidatePresigning,
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
            TradeStatus::WaitingToValidatePresigning => 10,
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
    NFTPresigningWaitingForApproval,
    SolPresigningWaitingForApproval,

    NFTPending,
    SolPending,
    SolToClaim,

    NFTDeposited,
    SolDeposited,

    NFTClaimed,
    SolClaimed,

    // NFTCanceled,
    // SolCanceled,

    NFTCanceledRecovered,
    SolCanceledRecovered,
}

impl ItemStatus {
    pub fn from_u8(status: u8) -> ItemStatus {
        match status {
            0 => ItemStatus::NFTPresigningWaitingForApproval,
            1 => ItemStatus::SolPresigningWaitingForApproval,

            10 => ItemStatus::NFTPending,
            11 => ItemStatus::SolPending,
            // 12 => ItemStatus::NFTPending,
            // 13 => ItemStatus::SolPending,

            20 => ItemStatus::NFTDeposited,
            21 => ItemStatus::SolDeposited,
            22 => ItemStatus::SolToClaim,

            30 => ItemStatus::NFTClaimed,
            31 => ItemStatus::SolClaimed,

            // 100 => ItemStatus::NFTCanceled,
            // 101 => ItemStatus::SolCanceled,

            100 => ItemStatus::NFTCanceledRecovered,
            101 => ItemStatus::SolCanceledRecovered,

            _ => panic!("Invalid Proposal Status"),
        }
    }

    pub fn to_u8(&self) -> u8 {
        match self {
            ItemStatus::NFTPresigningWaitingForApproval => 0,
            ItemStatus::SolPresigningWaitingForApproval => 1,

            ItemStatus::NFTPending => 10,
            ItemStatus::SolPending => 11,

            ItemStatus::NFTDeposited => 20,
            ItemStatus::SolDeposited => 21,
            ItemStatus::SolToClaim => 22,

            ItemStatus::NFTClaimed => 30,
            ItemStatus::SolClaimed => 31,

            // ItemStatus::NFTCanceled => 100,
            // ItemStatus::SolCanceled => 101,

            ItemStatus::NFTCanceledRecovered => 100,
            ItemStatus::SolCanceledRecovered => 101,
        }
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
//
//
//
//

pub fn already_exist_buy(
    list_of_items_to_buy: Vec<OptionToBuy>,
    item_to_check: OptionToBuy
) -> bool {
    for item in list_of_items_to_buy {
        if item.mint.eq(&item_to_check.mint) {
            return true;
        }
    }
    return false;
}
pub fn already_exist_in_sda(list_of_items: Vec<NftSwapItem>, item_to_check: NftSwapItem) -> bool {
    for item in list_of_items {
        if
            item.mint.eq(&item_to_check.mint) &&
            item.owner.eq(&item_to_check.owner) &&
            item.destinary.eq(&item_to_check.destinary) &&
            item.is_nft == item_to_check.is_nft
        {
            return true;
        }
    }
    return false;
}
pub fn already_exist_sell(
    list_of_items_to_sell: Vec<OptionToSell>,
    item_to_check: OptionToSell
) -> bool {
    for item in list_of_items_to_sell {
        if item.mint.eq(&item_to_check.mint) {
            return true;
        }
    }
    return false;
}

pub struct SendPNft<'info> {
    from: AccountInfo<'info>,
    from_ata: AccountInfo<'info>,
    to: AccountInfo<'info>,
    to_ata: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    signer: AccountInfo<'info>,
    nft_metadata: AccountInfo<'info>,
    nft_master_edition: AccountInfo<'info>,
    owner_token_record: AccountInfo<'info>,
    destination_token_record: AccountInfo<'info>,
    auth_rules_program: AccountInfo<'info>,
    auth_rules: AccountInfo<'info>,
    metadata_program: AccountInfo<'info>,
    sysvar_instructions: AccountInfo<'info>,
    spl_ata_program: AccountInfo<'info>,
    spl_token_program: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
}

pub struct SendCNft<'info> {
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    merkle_tree: AccountInfo<'info>,
    leaf_delegate: AccountInfo<'info>,
    tree_authority: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
    log_wrapper: AccountInfo<'info>,
    compression_program: AccountInfo<'info>,
    bubblegum_program: AccountInfo<'info>,
    remaining_accounts: Vec<AccountInfo<'info>>,
}

pub struct TransferData<'a> {
    instruction: Instruction,
    account_infos: Vec<AccountInfo<'a>>,
}

fn create_p_nft_instruction(amount: u64, ctx: SendPNft<'_>) -> Result<TransferData<'_>> {
    let mut transfer_builder = TransferBuilder::new();
    transfer_builder
        .token(ctx.from_ata.key())
        .token_owner(ctx.from.key())
        .destination(ctx.to_ata.key())
        .destination_owner(ctx.to.key())
        .mint(ctx.mint.key())
        .metadata(ctx.nft_metadata.key())
        .authority(ctx.from.key())
        .payer(ctx.signer.key())
        .system_program(ctx.system_program.key())
        .sysvar_instructions(ctx.sysvar_instructions.key())
        .spl_token_program(ctx.spl_token_program.key())
        .spl_ata_program(ctx.spl_ata_program.key());

    // creating vase transfer info
    let mut account_infos: Vec<AccountInfo<'_>> = vec![
        ctx.from.to_account_info(),
        ctx.from_ata.to_account_info(),
        ctx.to.to_account_info(),
        ctx.mint.to_account_info(),
        ctx.nft_metadata.to_account_info(),
        ctx.signer.to_account_info(),
        ctx.system_program.to_account_info(),
        ctx.sysvar_instructions.to_account_info(),
        ctx.spl_token_program.to_account_info(),
        ctx.spl_ata_program.to_account_info(),
        ctx.sysvar_instructions.to_account_info(),
        ctx.metadata_program.to_account_info()
    ];

    let metadata: Metadata = Metadata::from_account_info(&ctx.nft_metadata.to_account_info())?;
// metadata.collection.map(|f|f.key);
// metadata.collection.unwrap().key
    if
        matches!(
            metadata.token_standard,
            Some(mpl_token_metadata::state::TokenStandard::ProgrammableNonFungible)
        )
    {
        transfer_builder
            .edition(ctx.nft_master_edition.key())
            .owner_token_record(ctx.owner_token_record.key())
            .destination_token_record(ctx.destination_token_record.key())
            .authorization_rules_program(ctx.auth_rules_program.key())
            .authorization_rules(ctx.auth_rules.key());

        account_infos.push(ctx.nft_master_edition.to_account_info());
        account_infos.push(ctx.owner_token_record.to_account_info());
        account_infos.push(ctx.destination_token_record.to_account_info());
        account_infos.push(ctx.auth_rules_program.to_account_info());
        account_infos.push(ctx.auth_rules.to_account_info());
    }

    let instruction = transfer_builder
        .build(TransferArgs::V1 {
            amount,
            authorization_data: None,
        })
        .map_err(|_| MYERROR::InstructionBuilderFailed)?
        .instruction();

    let transfer_pnft_data = TransferData {
        instruction,
        account_infos,
    };

    Ok(transfer_pnft_data)
}

fn create_c_nft_instruction(
    root: [u8; 32],
    data_hash: [u8; 32],
    creator_hash: [u8; 32],
    nonce: u64,
    index: u32,
    ctx: SendCNft<'_>
) -> Result<TransferData<'_>> {
    // remaining_accounts are the accounts that make up the required proof
    let remaining_accounts_len = ctx.remaining_accounts.len();
    let mut accounts = Vec::with_capacity(8 + remaining_accounts_len);
    accounts.extend(
        vec![
            AccountMeta::new_readonly(ctx.tree_authority.key(), false),
            AccountMeta::new_readonly(ctx.from.key(), true),
            AccountMeta::new_readonly(ctx.leaf_delegate.key(), false),
            AccountMeta::new_readonly(ctx.to.key(), false),
            AccountMeta::new(ctx.merkle_tree.key(), false),
            AccountMeta::new_readonly(ctx.log_wrapper.key(), false),
            AccountMeta::new_readonly(ctx.compression_program.key(), false),
            AccountMeta::new_readonly(ctx.system_program.key(), false)
        ]
    );

    let transfer_discriminator: [u8; 8] = [163, 52, 200, 231, 140, 3, 69, 186];

    let mut data = Vec::with_capacity(
        8 + root.len() + data_hash.len() + creator_hash.len() + 8 + 8
    );
    data.extend(transfer_discriminator);
    data.extend(root);
    data.extend(data_hash);
    data.extend(creator_hash);
    data.extend(nonce.to_le_bytes());
    data.extend(index.to_le_bytes());

    let mut account_infos = Vec::with_capacity(8 + remaining_accounts_len);
    account_infos.extend(
        vec![
            ctx.tree_authority.to_account_info(),
            ctx.from.to_account_info(),
            ctx.leaf_delegate.to_account_info(),
            ctx.to.to_account_info(),
            ctx.merkle_tree.to_account_info(),
            ctx.log_wrapper.to_account_info(),
            ctx.compression_program.to_account_info(),
            ctx.system_program.to_account_info()
        ]
    );

    // Add "accounts" (hashes) that make up the merkle proof from the remaining accounts.
    for acc in ctx.remaining_accounts.iter() {
        accounts.push(AccountMeta::new_readonly(acc.key(), false));
        account_infos.push(acc.to_account_info());
    }

    let instruction = solana_program::instruction::Instruction {
        program_id: ctx.bubblegum_program.key(),
        accounts,
        data,
    };

    let transfer_pnft_data = TransferData {
        instruction,
        account_infos,
    };

    Ok(transfer_pnft_data)
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
    #[msg("Wrong seed")]
    NotSeed,
    #[msg("Item you're trying to add already exist in the list")]
    AlreadyExist,
    #[msg("Amount you're trying to input is equal to what's already on the PDA")]
    AmountWantedEqualToAlready,
    #[msg("Account passed is incorrect")]
    IncorrectAccount,
    #[msg("status passed is incorrect")]
    IncorrectStatus,
    #[msg("This function is only to be used for presigning items")]
    OnlyPresign,
    #[msg("This function is only to be used for normal items")]
    OnlyNormal,
    #[msg("The item isn't delegated to the userPda")]
    NotDelegatedToUserPda,
    #[msg("Already found an item to send to user")]
    DoubleSend,
    #[msg("Not all user item are validated")]
    NotAllValidated,
    #[msg("Presigning item can't be receiving sol")]
    PresignCantBeReceiveSol,
    #[msg("minimum to sell bigger than max to buy")]
    MinSupMax,
    #[msg("Item not delegated to it's user PDA")]
    NotDelegated,
    #[msg("item was not found in the User PDA to be removed")]
    PdaDataNotRemoved,
    #[msg("item was not found in the User PDA")]
    ItemNotFoundInUserPda,
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
}

// #[macro_export]
// macro_rules! custom_heap_default {
//     () => {
//         #[cfg(all(not(feature = "custom-heap"), target_os = "solana"))]
//         #[global_allocator]
//         static A: $crate::entrypoint::BumpAllocator = $crate::entrypoint::BumpAllocator {
//             start: $crate::entrypoint::HEAP_START_ADDRESS as usize,
//             len: $crate::entrypoint::HEAP_LENGTH,
//         };
//     };
// }

// #[allow(clippy::arithmetic_side_effects)]
// unsafe impl std::alloc::GlobalAlloc for BumpAllocator {
//     #[inline]
//     unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
//         let pos_ptr = self.start as *mut usize;

//         let mut pos = *pos_ptr;
//         if pos == 0 {
//             // First time, set starting position
//             pos = self.start + self.len;
//         }
//         pos = pos.saturating_sub(layout.size());
//         pos &= !layout.align().wrapping_sub(1);
//         if pos < self.start + size_of::<*mut u8>() {
//             return null_mut();
//         }
//         *pos_ptr = pos;
//         pos as *mut u8
//     }
//     #[inline]
//     unsafe fn dealloc(&self, _: *mut u8, _: Layout) {
//         // I'm a bump allocator, I don't free
//     }
// }
