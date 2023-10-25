use anchor_spl::token::Mint;

use ::{
    mpl_token_metadata,
    // mpl_bubblegum,
    mpl_bubblegum::program::Bubblegum,
    spl_account_compression::{ program::SplAccountCompression, Noop },
    anchor_lang::{
        prelude::*,
        solana_program::{ self, program::{ invoke, invoke_signed }, pubkey::Pubkey },
    },
    anchor_spl::{
        token::{ self, spl_token, Token, TokenAccount, Transfer },
        associated_token::AssociatedToken,
    },
    spl_associated_token_account,
};

declare_id!("CCzejnwJTxcYzaKioMKoVWkDKnR265FE9eYdnKGVWahx");
// declare_id!("6kHx1ZDMaECRE14bEJB7mgP8NbsZHiVpSzNba2JgPq9N");
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
    pub fn init_initialize(
        ctx: Context<InitInitialize>,
        _seed: Vec<u8>,
        _bump: u8,
        sent_data: SwapData,
        nb_of_items: u32
    ) -> Result<()> {
        require!(sent_data.status == TradeStatus::Initializing.to_u8(), MYERROR::UnexpectedState);
        require!(sent_data.items.len() == 0, MYERROR::IncorrectLength);

        // Write according Data into Swap's PDA
        ctx.accounts.swap_data_account.initializer = ctx.accounts.signer.key();
        ctx.accounts.swap_data_account.items = [].to_vec(); //item_to_add;
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
        trade_to_add: NftSwapItem
    ) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;

        require!(
            swap_data_account.status == TradeStatus::Initializing.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut item_to_add: NftSwapItem = trade_to_add;

        // Write according status to item
        if item_to_add.is_nft {
            if item_to_add.amount.is_negative() || item_to_add.amount == 0 {
                return Err(error!(MYERROR::UnexpectedData).into());
            }
            for item_id in 0..swap_data_account.items.len() {
                if
                    swap_data_account.items[item_id].mint.eq(&item_to_add.mint) &&
                    swap_data_account.items[item_id].owner.eq(&item_to_add.owner) &&
                    swap_data_account.items[item_id].destinary.eq(&item_to_add.destinary)
                {
                    return Err(error!(MYERROR::AlreadyExist).into());
                }
            }

            if item_to_add.is_presigning == true {
                item_to_add.status = ItemStatus::NFTPresigningWaitingForApproval.to_u8();
                msg!("NFT item added with status NFTPresigningWaitingForApproval");
            } else {
                item_to_add.status = ItemStatus::NFTPending.to_u8();
                msg!("NFT item added with status NFTPending");
            }
        } else {
            //Check if already one user has Sol item
            for item_id in 0..swap_data_account.items.len() {
                if
                    !swap_data_account.items[item_id].is_nft &&
                    swap_data_account.items[item_id].owner.eq(&item_to_add.owner)
                {
                    return Err(error!(MYERROR::AlreadyExist).into());
                }
            }
            require!(
                item_to_add.mint.eq(&swap_data_account.accepted_payement),
                MYERROR::MintIncorrect
            );
            // Check that mint and destinary are dummy values
            require!(
                item_to_add.destinary.eq(&swap_data_account.accepted_payement),
                MYERROR::UnexpectedData
            );

            if item_to_add.amount.is_positive() {
                if item_to_add.is_presigning == true {
                    item_to_add.status = ItemStatus::SolPresigningWaitingForApproval.to_u8();
                    msg!("SOL item added with status SolPresigningWaitingForApproval");
                } else {
                    item_to_add.status = ItemStatus::SolPending.to_u8();
                    msg!("SOL item added with status SolPending");
                }
            } else if item_to_add.amount == 0 {
                return Err(error!(MYERROR::UnexpectedData).into());
            } else if item_to_add.amount.is_negative() && item_to_add.is_presigning == true {
                return Err(error!(MYERROR::AmountIncorrect).into());
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
        _bump: u8
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
                // require_eq!(ItemStatus::SolPending, MYERROR::SumNotNull);
                if
                    !(
                        ((swap_data_account.items[item_id].status ==
                            ItemStatus::SolPending.to_u8() ||
                            swap_data_account.items[item_id].status ==
                                ItemStatus::SolToClaim.to_u8()) &&
                            swap_data_account.items[item_id].is_presigning == false) ||
                        (swap_data_account.items[item_id].status ==
                            ItemStatus::SolPresigningWaitingForApproval.to_u8() &&
                            swap_data_account.items[item_id].is_presigning == true)
                    )
                {
                    return Err(error!(MYERROR::IncorrectStatus).into());
                }

                sum = sum.checked_add(swap_data_account.items[item_id].amount).unwrap();
            } else {
                if
                    !(
                        swap_data_account.items[item_id].status == ItemStatus::NFTPending.to_u8() ||
                        swap_data_account.items[item_id].status ==
                            ItemStatus::NFTPresigningWaitingForApproval.to_u8()
                    )
                {
                    msg!("item status: {}", swap_data_account.items[item_id].status);
                    return Err(error!(MYERROR::IncorrectStatus).into());
                }
            }

            count += 1;
        }
        require!(sum == 0, MYERROR::SumNotNull);
        require!(count == swap_data_account.nb_items, MYERROR::IncorrectLength);

        //changing status to WaitingToDeposit
        swap_data_account.status = TradeStatus::WaitingToValidatePresigning.to_u8();

        Ok(())
    }

    pub fn validate_user_pda_items(
        ctx: Context<VerifyUserPda>,
        _seed: Vec<u8>,
        _bump: u8,
        _user_bump: u8
    ) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status ==
                TradeStatus::WaitingToValidatePresigning.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut list_items: Vec<NftSwapItem> = [].to_vec();
        let mut amount_min: u64 = 0;
        let mut amount_max: u64 = 0;
        let mut amount_to_give_to_swap: i64 = 0;

        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if ctx.accounts.swap_data_account.items[item_id].is_presigning == true {
                if ctx.accounts.swap_data_account.items[item_id].owner.eq(ctx.accounts.user.key) {
                    msg!(
                        "Found owner presigning item {}\n{:?}",
                        item_id,
                        ctx.accounts.swap_data_account.items[item_id].owner
                    );
                    if ctx.accounts.swap_data_account.items[item_id].is_nft {
                        let mut found_item_in_user_pda = false;
                        for user_pda_item_id in 0..ctx.accounts.user_pda.items_to_sell.len() {
                            if
                                ctx.accounts.user_pda.items_to_sell[user_pda_item_id].mint.eq(
                                    &ctx.accounts.swap_data_account.items[item_id].mint
                                )
                            {
                                msg!(
                                    "amount mini updated with {}",
                                    ctx.accounts.user_pda.items_to_sell
                                        [user_pda_item_id].amount_mini
                                );
                                amount_min = amount_min
                                    .checked_add(
                                        ctx.accounts.user_pda.items_to_sell
                                            [user_pda_item_id].amount_mini
                                    )
                                    .unwrap();
                                ctx.accounts.swap_data_account.items[item_id].status =
                                    ItemStatus::NFTPendingPresign.to_u8();
                                msg!(
                                    "Found owner presigning item {} in UserPda and status changed to NFTPendingPresign {}",
                                    item_id,
                                    ctx.accounts.swap_data_account.items[item_id].mint
                                );
                                found_item_in_user_pda = true;
                                // break;
                            }
                        }
                        if found_item_in_user_pda == false {
                            return Err(error!(MYERROR::ItemNotFoundInUserPda).into());
                        }
                    } else {
                        if amount_to_give_to_swap != 0 {
                            return Err(error!(MYERROR::DoubleSend).into());
                        }
                        amount_to_give_to_swap = ctx.accounts.swap_data_account.items
                            [item_id].amount;

                        if amount_to_give_to_swap.is_positive() {
                            msg!("amount max updated with {}", amount_to_give_to_swap);
                            amount_max = amount_max
                                .checked_add(amount_to_give_to_swap.unsigned_abs())
                                .unwrap();
                            ctx.accounts.swap_data_account.items[item_id].status =
                                ItemStatus::SolPendingPresign.to_u8();
                            msg!("Found positive sol to send {} status changed to SolPendingPresign", item_id);
                        } else {
                            return Err(error!(MYERROR::PresignCantBeReceiveSol).into());
                        }
                    }

                    msg!("status : {}", ctx.accounts.swap_data_account.items[item_id].status);
                    list_items.push(ctx.accounts.swap_data_account.items[item_id].clone());
                } else if
                    ctx.accounts.swap_data_account.items[item_id].destinary.eq(
                        ctx.accounts.user.key
                    )
                {
                    msg!(
                        "{} Found destinary presigning item {}",
                        item_id,
                        ctx.accounts.swap_data_account.items[item_id].mint
                    );
                    for user_pda_item_id in 0..ctx.accounts.user_pda.items_to_buy.len() {
                        if
                            ctx.accounts.user_pda.items_to_buy[user_pda_item_id].mint.eq(
                                &ctx.accounts.swap_data_account.items[item_id].mint
                            )
                        {
                            msg!(
                                "amount max updated with {}",
                                ctx.accounts.user_pda.items_to_buy[user_pda_item_id].amount_maxi
                            );
                            amount_max += ctx.accounts.user_pda.items_to_buy
                                [user_pda_item_id].amount_maxi;
                        }
                    }
                    // list_items.push(ctx.accounts.swap_data_account.items[item_id].clone());
                }
            }
        }
        amount_min = amount_min.checked_add(ctx.accounts.user_pda.amount_to_topup).unwrap();
        msg!(
            "amount_min {} / amount_max {} / amount_to_give_to_swap {} / amount_to_topup {}",
            amount_min,
            amount_max,
            amount_to_give_to_swap,
            ctx.accounts.user_pda.amount_to_topup
        );
        if amount_min < amount_max {
            // {
            return Err(error!(MYERROR::MinSupMax).into());
        }

        if
            amount_to_give_to_swap.unsigned_abs() > ctx.accounts.user_pda.amount_to_topup &&
            amount_to_give_to_swap.is_positive()
        {
            return Err(error!(MYERROR::NotEnoughFunds).into());
        }

        for item in list_items.iter() {
            if item.owner.eq(ctx.accounts.user.key) && item.is_presigning == true {
                if
                    !(
                        item.status == ItemStatus::NFTPendingPresign.to_u8() ||
                        item.status == ItemStatus::SolPendingPresign.to_u8()
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
            }
        }

        // ctx.accounts.swap_data_account.status = TradeStatus::WaitingToDeposit.to_u8();

        Ok(())
    }

    pub fn validate_presigning_swap(
        ctx: Context<VerifyPresigning>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status ==
                TradeStatus::WaitingToValidatePresigning.to_u8(),
            MYERROR::UnexpectedState
        );

        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            // msg!("item_id {}",item_id);
            if ctx.accounts.swap_data_account.items[item_id].is_presigning == true {
                if
                    !(
                        ctx.accounts.swap_data_account.items[item_id].status ==
                            ItemStatus::NFTPendingPresign.to_u8() ||
                        ctx.accounts.swap_data_account.items[item_id].status ==
                            ItemStatus::SolPendingPresign.to_u8()
                    )
                {
                    msg!(
                        "{} belongs to {:?}, was not validated {} ",
                        ctx.accounts.swap_data_account.items[item_id].mint,
                        ctx.accounts.swap_data_account.items[item_id].owner,
                        ctx.accounts.swap_data_account.items[item_id].status
                    );
                    return Err(error!(MYERROR::NotAllValidated).into());
                }
            }
        }

        ctx.accounts.swap_data_account.status = TradeStatus::WaitingToDeposit.to_u8();

        Ok(())
    }

    /// @notice Deposit NFT to escrow.
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and deposit the NFT into the escrow.
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts {system_program: Pubkey = system_program_id, token_program: Pubkey = token_program_id, swap_data_account: Pubkey => Swap's PDA corresponding to seeds, signer: Pubkey => User that deposits,  item_from_deposit: Pubkey => User ATA related to mint, item_to_deposit: Pubkey => Swap's PDA ATA related to mint}
    /// @return Void
    pub fn deposit_nft(ctx: Context<DepositNft>, _seed: Vec<u8>, _bump: u8) -> Result<()> {
        let swap_data_account = &ctx.accounts.swap_data_account;

        let token_program = &ctx.accounts.token_program;
        let signer = &ctx.accounts.signer;
        let item_to_deposit = &ctx.accounts.item_to_deposit;
        let item_from_deposit = &ctx.accounts.item_from_deposit;
        msg!("item_from_deposit.mint {}", ctx.accounts.item_from_deposit.mint);
        msg!("item_from_deposit.owner {}", ctx.accounts.item_from_deposit.owner);
        msg!("signer.key() {}", ctx.accounts.signer.key());
        msg!("item_from_deposit.amount {}", ctx.accounts.item_from_deposit.amount);
        require!(
            swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if
                ctx.accounts.swap_data_account.items[item_id].is_nft &&
                ctx.accounts.swap_data_account.items[item_id].mint.eq(&item_to_deposit.mint) &&
                ctx.accounts.swap_data_account.items[item_id].status ==
                    ItemStatus::NFTPending.to_u8()
            {
                // Transfer according item to Swap's PDA ATA
                let ix = spl_token::instruction::transfer(
                    token_program.key,
                    &item_from_deposit.key(),
                    &item_to_deposit.key(),
                    &signer.key(),
                    &[&signer.key()],
                    ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
                )?;

                invoke(
                    &ix,
                    &[
                        item_from_deposit.to_account_info(),
                        item_to_deposit.to_account_info(),
                        signer.to_account_info(),
                        token_program.to_account_info(),
                    ]
                )?;

                //update item status to NFTDeposited
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

    pub fn deposit_c_nft<'info>(
        ctx: Context<'_, '_, '_, 'info, DepositCNft<'info>>,
        _seed: Vec<u8>,
        root: [u8; 32],
        data_hash: [u8; 32],
        creator_hash: [u8; 32],
        nonce: u64,
        index: u32
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
            // msg!(
            //     "item {:#?}",
            //     ctx.accounts.swap_data_account.items[item_id].merkle_tree
            // );
            // msg!("mwrkle {:#?}", ctx.accounts.merkle_tree.key());
            // msg!(
            //     "index {:#?} VS {:#?}",
            //     index,
            //     ctx.accounts.swap_data_account.items[item_id].index
            // );
            if
                ctx.accounts.swap_data_account.items[item_id].is_compressed &&
                ctx.accounts.swap_data_account.items[item_id].is_nft
            {
                if
                    ctx.accounts.swap_data_account.items[item_id].merkle_tree.eq(
                        &ctx.accounts.merkle_tree.key()
                    ) &&
                    index == ctx.accounts.swap_data_account.items[item_id].index &&
                    ctx.accounts.swap_data_account.items[item_id].owner.eq(
                        &ctx.accounts.user.key()
                    ) &&
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::NFTPending.to_u8()
                {
                    msg!("3");
                    // creating base transfer builder

                    // remaining_accounts are the accounts that make up the required proof
                    let remaining_accounts_len = ctx.remaining_accounts.len();
                    let mut accounts = Vec::with_capacity(8 + remaining_accounts_len);
                    accounts.extend(
                        vec![
                            AccountMeta::new_readonly(ctx.accounts.tree_authority.key(), false),
                            AccountMeta::new_readonly(ctx.accounts.user.key(), true),
                            AccountMeta::new_readonly(ctx.accounts.leaf_delegate.key(), false),
                            AccountMeta::new_readonly(ctx.accounts.swap_data_account.key(), false),
                            AccountMeta::new(ctx.accounts.merkle_tree.key(), false),
                            AccountMeta::new_readonly(ctx.accounts.log_wrapper.key(), false),
                            AccountMeta::new_readonly(
                                ctx.accounts.compression_program.key(),
                                false
                            ),
                            AccountMeta::new_readonly(ctx.accounts.system_program.key(), false)
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
                            ctx.accounts.tree_authority.to_account_info(),
                            ctx.accounts.user.to_account_info(),
                            ctx.accounts.leaf_delegate.to_account_info(),
                            ctx.accounts.swap_data_account.to_account_info(),
                            ctx.accounts.merkle_tree.to_account_info(),
                            ctx.accounts.log_wrapper.to_account_info(),
                            ctx.accounts.compression_program.to_account_info(),
                            ctx.accounts.system_program.to_account_info()
                        ]
                    );

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

    pub fn deposit_nft_presigned(
        ctx: Context<DepositNftPresigned>,
        _seed: Vec<u8>,
        _bump: u8,
        user_bump: u8
    ) -> Result<()> {
        // ctx.accounts.delegated_item_ata.delegate.unwrap().eq(&ctx.accounts.user_pda.key);
        // let swap_data_account = &ctx.accounts.swap_data_account;
        // let item_to_deposit = &ctx.accounts.swap_data_account_ata;

        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut transfered: bool = false;
        let mut removed: bool = false;
        msg!(
            "delegated item {} with delegated {} amount {}",
            ctx.accounts.delegated_item_ata.mint,
            ctx.accounts.delegated_item_ata.delegate.unwrap(),
            ctx.accounts.delegated_item_ata.delegated_amount
        );
        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if
                ctx.accounts.swap_data_account.items[item_id].is_nft &&
                ctx.accounts.swap_data_account.items[item_id].mint.eq(
                    &ctx.accounts.delegated_item_ata.mint
                ) &&
                ctx.accounts.swap_data_account.items[item_id].status ==
                    ItemStatus::NFTPendingPresign.to_u8()
            {
                let seeds = &[&ctx.accounts.user.key().to_bytes()[..], &[user_bump]];
                let signer = &[&seeds[..]];

                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.delegated_item_ata.to_account_info(),
                        to: ctx.accounts.swap_data_account_ata.to_account_info(),
                        authority: ctx.accounts.user_pda.to_account_info(),
                    },
                    signer
                );
                token::transfer(
                    cpi_ctx,
                    ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
                )?;
                //update item status to NFTDeposited
                ctx.accounts.swap_data_account.items[item_id].status =
                    ItemStatus::NFTDeposited.to_u8();
                transfered = true;
                msg!("NFTDeposited");

                for presigned_item_id in 0..ctx.accounts.user_pda.items_to_sell.len() {
                    if
                        ctx.accounts.user_pda.items_to_sell[presigned_item_id].mint.eq(
                            &ctx.accounts.swap_data_account.items[item_id].mint
                        )
                    {
                        msg!(
                            "removed {} from userPda",
                            ctx.accounts.user_pda.items_to_sell[presigned_item_id].mint
                        );
                        ctx.accounts.user_pda.items_to_sell.remove(presigned_item_id);
                        removed = true;
                        break;
                    }
                }

                break;
            }
        }

        if removed == false {
            return Err(error!(MYERROR::PdaDataNotRemoved).into());
        }
        if transfered == false {
            return Err(error!(MYERROR::NoSend).into());
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
    pub fn deposit_sol(
        ctx: Context<DepositSol>,
        _seed: Vec<u8>,
        _bump: u8
        // _user_bump: u8,
    ) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
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
                transfered == false
            {
                if ctx.accounts.swap_data_account.items[item_id].amount > 0 {
                    // Transfer lamports to Escrow
                    // let ix = anchor_lang::solana_program::system_instruction::transfer(
                    //     // let ix = spl_token::instruction::transfer(
                    //     &ctx.accounts.signer.key(),
                    //     &ctx.accounts.swap_data_account.key(),
                    //     ctx.accounts.swap_data_account.items[item_id]
                    //         .amount
                    //         .unsigned_abs(),
                    // );
                    let ix = spl_token::instruction::transfer(
                        &ctx.accounts.token_program.key,
                        &ctx.accounts.user_wsol.key(),
                        &ctx.accounts.swap_data_account_wsol.key(),
                        &ctx.accounts.user.key(),
                        &[&ctx.accounts.signer.key()],
                        ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
                    )?;
                    invoke(
                        &ix,
                        &[
                            ctx.accounts.token_program.to_account_info(),
                            ctx.accounts.signer.to_account_info(),
                            ctx.accounts.user.to_account_info(),
                            ctx.accounts.user_wsol.to_account_info(),
                            ctx.accounts.swap_data_account_wsol.to_account_info(),
                        ]
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

    /// @notice Deposit lamports to escrow.
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and deposits lamports to escrow. /!\ user that should only receive lamports don't have to deposit.
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => User that deposits
    /// @return Void
    pub fn deposit_sol_presigned(
        ctx: Context<DepositSolPresigned>,
        _seed: Vec<u8>,
        _bump: u8,
        user_bump: u8
    ) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8(),
            MYERROR::UnexpectedState
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if
                !ctx.accounts.swap_data_account.items[item_id].is_nft &&
                ctx.accounts.swap_data_account.items[item_id].status ==
                    ItemStatus::SolPendingPresign.to_u8() &&
                ctx.accounts.swap_data_account.items[item_id].owner.eq(ctx.accounts.user.key) &&
                transfered == false
            {
                if ctx.accounts.swap_data_account.items[item_id].amount > 0 {
                    // Transfer lamports to Escrow
                    // let ix = anchor_lang::solana_program::system_instruction::transfer(
                    //     &ctx.accounts.signer.key(),
                    //     &ctx.accounts.swap_data_account.key(),
                    //     ctx.accounts.swap_data_account.items[item_id]
                    //         .amount
                    //         .unsigned_abs(),
                    // );
                    // invoke_signed(
                    //     &ix,
                    //     &[
                    //         ctx.accounts.signer.to_account_info(),
                    //         ctx.accounts.swap_data_account.to_account_info(),
                    //     ],
                    // )?;
                    msg!(
                        "sent {} tokens from {} to {}",
                        ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs(),
                        ctx.accounts.user_wsol.key(),
                        ctx.accounts.swap_data_account_wsol.key()
                    );
                    // msg!("user balance {:?}",ctx.accounts.swap_data_account.items[item_id].owner);
                    msg!("user balance {:?}", ctx.accounts.user.lamports);
                    msg!("user_pda balance {:?}", ctx.accounts.user_pda.to_account_info().lamports);
                    msg!("user_wsol1 balance {}", ctx.accounts.user_wsol.amount);
                    msg!("user_wsol2 balance {}", ctx.accounts.user_wsol.delegated_amount);
                    msg!(
                        "user_wsol3 balance {}",
                        ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
                    );

                    let seeds = &[&ctx.accounts.user_pda.owner.to_bytes()[..], &[user_bump]];
                    let signer = &[&seeds[..]];

                    let cpi_ctx = CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.user_wsol.to_account_info(),
                            to: ctx.accounts.swap_data_account_wsol.to_account_info(),
                            authority: ctx.accounts.user_pda.to_account_info(),
                        },
                        signer
                    );

                    token::transfer(
                        cpi_ctx,
                        ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
                    )?; //.checked_div(10).unwrap())?;
                    // token::transfer(cpi_ctx,1)?;
                    //update status to SolDeposited
                    ctx.accounts.swap_data_account.items[item_id].status =
                        ItemStatus::SolDeposited.to_u8();
                    transfered = true;

                    ctx.accounts.user_pda.amount_to_topup
                        .checked_sub(
                            ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
                        )
                        .unwrap();
                    ctx.accounts.user_pda.reload()?;
                    msg!(
                        "SolDeposited and removed {} from amount_to_topup, left {}",
                        ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs(),
                        ctx.accounts.user_pda.amount_to_topup
                            .checked_sub(
                                ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
                            )
                            .unwrap()
                    );
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
            if
                !(
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::NFTDeposited.to_u8() ||
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::SolDeposited.to_u8() ||
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::SolToClaim.to_u8()
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
    pub fn claim_sol(ctx: Context<ClaimSol>, seed: Vec<u8>, bump: u8) -> Result<()> {
        require!(
            ctx.accounts.swap_data_account.status == TradeStatus::WaitingToClaim.to_u8(),
            MYERROR::NotReady
        );

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if
                !ctx.accounts.swap_data_account.items[item_id].is_nft &&
                ctx.accounts.swap_data_account.items[item_id].status ==
                    ItemStatus::SolToClaim.to_u8() &&
                ctx.accounts.swap_data_account.items[item_id].owner.eq(ctx.accounts.user.key) &&
                transfered == false
            {
                if ctx.accounts.swap_data_account.items[item_id].amount.is_negative() {
                    // Send lamports to user
                    let amount_to_send =
                        ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs();

                    let swap_data_lamports_initial = ctx.accounts.swap_data_account_wsol.amount;

                    if swap_data_lamports_initial >= amount_to_send {
                        let seeds = &[&seed[..], &[bump]];
                        let signer = &[&seeds[..]];

                        let cpi_ctx = CpiContext::new_with_signer(
                            ctx.accounts.token_program.to_account_info(),
                            Transfer {
                                from: ctx.accounts.swap_data_account_wsol.to_account_info(),
                                to: ctx.accounts.user_wsol.to_account_info(),
                                authority: ctx.accounts.swap_data_account.to_account_info(),
                            },
                            signer
                        );
                        token::transfer(cpi_ctx, amount_to_send)?;

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
            if
                ctx.accounts.swap_data_account.items[item_id].is_nft &&
                ctx.accounts.swap_data_account.items[item_id].status ==
                    ItemStatus::NFTDeposited.to_u8() &&
                ctx.accounts.swap_data_account.items[item_id].mint.eq(
                    &ctx.accounts.item_from_deposit.mint
                ) &&
                ctx.accounts.swap_data_account.items[item_id].mint.eq(
                    &ctx.accounts.item_to_deposit.mint
                ) &&
                ctx.accounts.swap_data_account.items[item_id].destinary.eq(ctx.accounts.user.key) &&
                transfered == false
            {
                // Transfer the NFT to user
                let ix = spl_token::instruction::transfer(
                    &ctx.accounts.token_program.key,
                    &ctx.accounts.item_from_deposit.key(),
                    &ctx.accounts.item_to_deposit.key(),
                    &ctx.accounts.swap_data_account.key(),
                    &[&ctx.accounts.swap_data_account.key()],
                    1
                )?;
                invoke_signed(
                    &ix,
                    &[
                        ctx.accounts.token_program.to_account_info(),
                        ctx.accounts.item_from_deposit.to_account_info(),
                        ctx.accounts.item_to_deposit.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                    ],
                    &[&[&seed[..], &[bump]]]
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
                        &[&ctx.accounts.swap_data_account.key()]
                    )?;
                    invoke_signed(
                        &ix2,
                        &[
                            ctx.accounts.token_program.to_account_info(),
                            ctx.accounts.item_from_deposit.to_account_info(),
                            ctx.accounts.swap_data_account.to_account_info(),
                            ctx.accounts.user.to_account_info(),
                        ],
                        &[&[&seed[..], &[bump]]]
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
            if
                ctx.accounts.swap_data_account.items[item_id].is_compressed &&
                ctx.accounts.swap_data_account.items[item_id].is_nft
            {
                if
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::NFTDeposited.to_u8() &&
                    ctx.accounts.swap_data_account.items[item_id].merkle_tree.eq(
                        &ctx.accounts.merkle_tree.key()
                    ) &&
                    index == ctx.accounts.swap_data_account.items[item_id].index &&
                    ctx.accounts.swap_data_account.items[item_id].destinary.eq(
                        &ctx.accounts.user.key()
                    ) &&
                    !transfered
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
                        ctx.accounts.swap_data_account.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
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
                    solana_program::program::invoke_signed(
                        &(solana_program::instruction::Instruction {
                            program_id: ctx.accounts.bubblegum_program.key(),
                            accounts,
                            data,
                        }),
                        &account_infos[..],
                        &[&[&seed[..], &[bump]]]
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
    /// @dev Function verify each item status to mutate the smart contract status to 3 (closed) then close the Swap's PDA.  /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds, signer: Pubkey => initializer
    /// @accounts signer: Pubkey => initializer
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts spl_token_program: Pubkey = spl_associated_token_program_id
    /// @return Void
    pub fn validate_claimed(
        ctx: Context<ValidateAndClose>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()> {
        msg!("validate claimed status {}", ctx.accounts.swap_data_account.status);
        require_eq!(
            ctx.accounts.swap_data_account.status,
            TradeStatus::WaitingToClaim.to_u8(),
            MYERROR::NotReady
        );

        // verify all items are claimed
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if
                !(
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::SolClaimed.to_u8() ||
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::NFTClaimed.to_u8() ||
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::SolDeposited.to_u8()
                )
            {
                msg!(
                    "item {} status {}",
                    item_id,
                    ctx.accounts.swap_data_account.items[item_id].status
                );
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
    pub fn cancel_sol(ctx: Context<ClaimSol>, seed: Vec<u8>, bump: u8) -> Result<()> {
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
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if
                (ctx.accounts.signer
                    .key()
                    .eq(&ctx.accounts.swap_data_account.items[item_id].owner) &&
                    ctx.accounts.swap_data_account.items[item_id].amount > 0) ||
                authorized == true
            {
                authorized = true;
            }

            if
                !ctx.accounts.swap_data_account.items[item_id].is_nft &&
                ctx.accounts.swap_data_account.items[item_id].owner.eq(ctx.accounts.user.key) &&
                transfered == false
            {
                // Check if deposited
                if
                    ctx.accounts.swap_data_account.items[item_id].status ==
                    ItemStatus::SolDeposited.to_u8()
                {
                    if ctx.accounts.swap_data_account.items[item_id].amount.is_positive() {
                        let amount_to_send =
                            ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs();
                        let swap_data_lamports_initial = ctx.accounts.swap_data_account_wsol.amount;

                        if swap_data_lamports_initial >= amount_to_send {
                            // **ctx.accounts.user.lamports.borrow_mut() =
                            //     ctx.accounts.user.lamports() + amount_to_send;
                            // **ctx
                            //     .accounts
                            //     .swap_data_account
                            //     .to_account_info()
                            //     .lamports
                            //     .borrow_mut() =
                            //     ctx.accounts.swap_data_account.to_account_info().lamports()
                            // - amount_to_send;

                            // let seeds = &[&seed, &[bump]];
                            let seeds = &[&seed[..], &[bump]];
                            let signer = &[&seeds[..]];

                            let cpi_ctx = CpiContext::new_with_signer(
                                ctx.accounts.token_program.to_account_info(),
                                Transfer {
                                    from: ctx.accounts.swap_data_account_wsol.to_account_info(),
                                    to: ctx.accounts.user_wsol.to_account_info(),
                                    authority: ctx.accounts.swap_data_account.to_account_info(),
                                },
                                signer
                            );
                            token::transfer(cpi_ctx, amount_to_send)?;

                            ctx.accounts.swap_data_account.items[item_id].status =
                                ItemStatus::SolCanceledRecovered.to_u8();
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
    pub fn cancel_nft(ctx: Context<ClaimNft>, seed: Vec<u8>, bump: u8) -> Result<()> {
        let user_ata = &ctx.accounts.item_to_deposit;
        let swap_data_ata = &mut ctx.accounts.item_from_deposit;

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
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if
                ctx.accounts.signer
                    .key()
                    .eq(&ctx.accounts.swap_data_account.items[item_id].owner) ||
                authorized == true
            {
                authorized = true;
            }

            if
                ctx.accounts.swap_data_account.items[item_id].is_nft &&
                ctx.accounts.swap_data_account.items[item_id].status ==
                    ItemStatus::NFTDeposited.to_u8() &&
                ctx.accounts.swap_data_account.items[item_id].mint.eq(&user_ata.mint) &&
                ctx.accounts.swap_data_account.items[item_id].mint.eq(&swap_data_ata.mint) &&
                ctx.accounts.swap_data_account.items[item_id].owner.eq(ctx.accounts.user.key) &&
                transfered == false
            {
                // Transfer deposited NFT back to user

                let ix = spl_token::instruction::transfer(
                    &ctx.accounts.token_program.key,
                    &swap_data_ata.key(),
                    &user_ata.key(),
                    &ctx.accounts.swap_data_account.key(),
                    &[&ctx.accounts.swap_data_account.key()],
                    ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs()
                )?;

                invoke_signed(
                    &ix,
                    &[
                        ctx.accounts.token_program.to_account_info(),
                        swap_data_ata.to_account_info(),
                        user_ata.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                    ],
                    &[&[&seed[..], &[bump]]]
                )?;
                msg!("NFT item Canceled");

                let _ = swap_data_ata.reload();

                // If Swap's PDA ATA balance is null, closes the account and send the rent to user
                if swap_data_ata.amount.eq(&0) {
                    let ix2 = spl_token::instruction::close_account(
                        &ctx.accounts.token_program.key,
                        &swap_data_ata.key(),
                        &ctx.accounts.user.key(),
                        &ctx.accounts.swap_data_account.key(),
                        &[&ctx.accounts.swap_data_account.key()]
                    )?;

                    invoke_signed(
                        &ix2,
                        &[
                            ctx.accounts.token_program.to_account_info(),
                            swap_data_ata.to_account_info(),
                            ctx.accounts.swap_data_account.to_account_info(),
                            ctx.accounts.user.to_account_info(),
                        ],
                        &[&[&seed[..], &[bump]]]
                    )?;
                    msg!("ATA closed");
                }

                // Update item status to 91 (CancelRecovered)
                ctx.accounts.swap_data_account.items[item_id].status =
                    ItemStatus::NFTCanceledRecovered.to_u8();

                transfered = true;
            }
        }

        if transfered == false {
            return Err(error!(MYERROR::NoSend).into());
        }

        if authorized == false {
            return Err(error!(MYERROR::UserNotPartOfTrade).into());
        }

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

        let mut transfered: bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            //    msg!("{:#?}", ctx.accounts.merkle_tree.data);
            // msg!(
            //     "item {:#?}",
            //     ctx.accounts.swap_data_account.items[item_id].merkle_tree
            // );
            // msg!("mwrkle {:#?}", ctx.accounts.merkle_tree.key());
            // msg!(
            //     "index {:#?} VS {:#?}",
            //     index,
            //     ctx.accounts.swap_data_account.items[item_id].index
            // );
            if
                ctx.accounts.swap_data_account.items[item_id].is_compressed &&
                ctx.accounts.swap_data_account.items[item_id].is_nft
            {
                if
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::NFTDeposited.to_u8() &&
                    ctx.accounts.swap_data_account.items[item_id].merkle_tree.eq(
                        &ctx.accounts.merkle_tree.key()
                    ) &&
                    index == ctx.accounts.swap_data_account.items[item_id].index &&
                    ctx.accounts.swap_data_account.items[item_id].owner.eq(ctx.accounts.user.key) &&
                    !transfered
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
                        ctx.accounts.swap_data_account.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
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
                    solana_program::program::invoke_signed(
                        &(solana_program::instruction::Instruction {
                            program_id: ctx.accounts.bubblegum_program.key(),
                            accounts,
                            data,
                        }),
                        &account_infos[..],
                        &[&[&seed[..], &[bump]]]
                    )?;

                    // Update item status to 91 (CancelRecovered)
                    ctx.accounts.swap_data_account.items[item_id].status =
                        ItemStatus::NFTCanceledRecovered.to_u8();
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
    /// @dev Function verify each item status to mutate the smart contract status to 3 (closed) then close the Swap's PDA.  /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @accounts system_program: Pubkey = system_program_id
    /// @accounts spl_token_program: Pubkey = spl_associated_token_program_id
    /// @return Void
    pub fn validate_cancel(
        ctx: Context<ValidateAndClose>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()> {
        if
            !(
                ctx.accounts.swap_data_account.status == TradeStatus::Canceling.to_u8() ||
                ctx.accounts.swap_data_account.status == TradeStatus::WaitingToDeposit.to_u8() ||
                ctx.accounts.swap_data_account.status == TradeStatus::Initializing.to_u8() ||
                ctx.accounts.swap_data_account.status ==
                    TradeStatus::WaitingToValidatePresigning.to_u8()
            )
        {
            return Err(error!(MYERROR::NotReady).into());
        }

        let nbr_items = ctx.accounts.swap_data_account.items.len();

        // Checks all items are Canceled
        for item_id in 0..nbr_items {
            if
                !(
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::SolCanceledRecovered.to_u8() ||
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::NFTCanceledRecovered.to_u8() ||
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::SolPending.to_u8() ||
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::NFTPending.to_u8() ||
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::SolToClaim.to_u8() ||
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::SolPendingPresign.to_u8() ||
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::NFTPendingPresign.to_u8() ||
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::SolPresigningWaitingForApproval.to_u8() ||
                    ctx.accounts.swap_data_account.items[item_id].status ==
                        ItemStatus::NFTPresigningWaitingForApproval.to_u8()
                )
            {
                return Err(error!(MYERROR::NotReady).into());
            }
        }

        // Changing Swap status to 91 (CanceledRecovered)
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
    pub fn create_user_pda(ctx: Context<CreateUserPda>, seed: Vec<u8>, bump: u8) -> Result<()> {
        let user_account_seed = ctx.accounts.user.key().to_bytes().to_vec();

        if user_account_seed != seed {
            return Err(error!(MYERROR::NotSeed));
        }

        let (pda, user_account_bump) = Pubkey::find_program_address(
            &[&user_account_seed],
            &ctx.program_id.key()
        );

        if user_account_bump != bump {
            return Err(error!(MYERROR::NotBump));
        }

        if !pda.eq(&ctx.accounts.user_pda.key()) {
            return Err(error!(MYERROR::IncorrectAccount));
        }

        ctx.accounts.user_pda.owner = ctx.accounts.user.key();
        ctx.accounts.user_pda.amount_to_topup = 0;
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
    pub fn user_add_item_to_buy(
        ctx: Context<ModifyUserPdaBuy>,
        _bump: u8,
        item_to_add: ItemToBuy
    ) -> Result<()> {
        if already_exist_buy(ctx.accounts.user_pda.items_to_buy.to_vec(), item_to_add.clone()) {
            return Err(error!(MYERROR::AlreadyExist));
        }

        // ctx.accounts.signer_wsol.delegated_amount
        // let approve_ix = spl_token::instruction::approve(
        //     &token::ID,
        //     &ctx.accounts.signer_wsol.key(),
        //     &ctx.accounts.user_pda.key(),
        //     &ctx.accounts.signer.key(),
        //     &[&ctx.accounts.signer.key()],
        //     item_to_add.amount_maxi,
        // )
        // .unwrap();
        // invoke(
        //     &approve_ix,
        //     &[
        //         ctx.accounts.signer_wsol.to_account_info(),
        //         ctx.accounts.user_pda.to_account_info(),
        //         ctx.accounts.signer.to_account_info(),
        //     ],
        // )?;
        // if item_to_add.amount_maxi > ctx.accounts.user_pda.amount_to_topup {
        //     return Err(error!(MYERROR::ItemTooExpensive));

        // }
        ctx.accounts.user_pda.items_to_buy.push(item_to_add.clone()); //= [&ctx.accounts.user_pda.items_to_buy[..],&[item_to_add.clone()][..]].concat();
        msg!(
            "token {} was added to userPda to buy with a maximum  exchange value of {}",
            item_to_add.mint,
            item_to_add.amount_maxi
        );
        Ok(())
    }

    pub fn user_add_item_to_sell(
        ctx: Context<ModifyUserPdaSell>,
        _bump: u8,
        item_to_add: ItemToSell
    ) -> Result<()> {
        if already_exist_sell(ctx.accounts.user_pda.items_to_buy.to_vec(), item_to_add.clone()) {
            return Err(error!(MYERROR::AlreadyExist));
        }

        let approve_ix = spl_token::instruction
            ::approve(
                &token::ID,
                &ctx.accounts.item_to_delegate.key(),
                &ctx.accounts.user_pda.key(),
                &ctx.accounts.signer.key(),
                &[&ctx.accounts.signer.key()],
                1
            )
            .unwrap();

        invoke(
            &approve_ix,
            &[
                ctx.accounts.item_to_delegate.to_account_info(),
                ctx.accounts.user_pda.to_account_info(),
                ctx.accounts.signer.to_account_info(),
            ]
        )?;
        ctx.accounts.item_to_delegate.reload()?;

        msg!(
            "{} token {} owned by {} was delegated to {}",
            1,
            ctx.accounts.item_to_delegate.mint,
            ctx.accounts.signer.key(),
            ctx.accounts.user_pda.key()
            // ctx.accounts.item_to_delegate.delegate.unwrap()
        );

        ctx.accounts.user_pda.items_to_sell.push(item_to_add.clone()); //= [&ctx.accounts.user_pda.items_to_sell[..],&[item_to_add.clone()][..]].concat();
        msg!(
            "token {} was added to userPda to sell with a minimum exchange value of {}",
            item_to_add.mint,
            item_to_add.amount_mini
        );

        Ok(())
    }

    pub fn user_update_amount_top_up(
        ctx: Context<UpdateUserPdaToTopUp>,
        _bump: u8,
        amount_to_topup: u64
    ) -> Result<()> {
        msg!("delegated account {}", ctx.accounts.signer_wsol.key());
        msg!("delegated delegated_amount {}", ctx.accounts.signer_wsol.delegated_amount);
        msg!("delegated amount {}", ctx.accounts.signer_wsol.amount);
        let mut amount_to_approve: u64 = 0;

        if ctx.accounts.signer_wsol.delegated_amount > 0 {
            //need reduce delegation
            amount_to_approve = ctx.accounts.signer_wsol.delegated_amount;
            msg!("reduce delegation amount_to_approve {} delegated already", amount_to_approve);
        } else if ctx.accounts.signer_wsol.delegated_amount == 0 {
            // proceed to next
        } else if ctx.accounts.signer_wsol.delegated_amount == amount_to_topup {
            return Err(error!(MYERROR::AmountWantedEqualToAlready));
        } else {
            return Err(error!(MYERROR::AmountIncorrect));
        }

        msg!("amount_to_topup amount {}", amount_to_topup);
        if ctx.accounts.signer_wsol.amount < amount_to_topup {
            return Err(error!(MYERROR::NotEnoughFunds));
        }
        // for items_to_buy in ctx.accounts.user_pda.items_to_buy.clone().into_iter() {
        //     amount_to_approve += items_to_buy.amount_maxi
        // }
        amount_to_approve += amount_to_topup;
        msg!("amount_to_approve {} ", amount_to_approve);

        //need increase delegation
        let approve_ix = spl_token::instruction
            ::approve(
                &token::ID,
                &ctx.accounts.signer_wsol.key(),
                &ctx.accounts.user_pda.key(),
                &ctx.accounts.signer.key(),
                &[&ctx.accounts.signer.key()],
                amount_to_approve
            )
            .unwrap();
        invoke(
            &approve_ix,
            &[
                ctx.accounts.signer_wsol.to_account_info(),
                ctx.accounts.user_pda.to_account_info(),
                ctx.accounts.signer.to_account_info(),
            ]
        )?;
        msg!(
            "{} token {} owned by {} was delegated to {}",
            amount_to_approve,
            ctx.accounts.signer_wsol.mint,
            ctx.accounts.signer.key(),
            ctx.accounts.user_pda.key()
        );

        ctx.accounts.user_pda.amount_to_topup = amount_to_topup;

        Ok(())
    }
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
    spl_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]
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

// #[derive(Accounts)]
// #[instruction(seed: Vec<u8>, bump: u8, user_bump:u8, trade_to_add:NftSwapItem)]
// pub struct InitializeAddPresign<'info> {
//     #[account(
//         mut,
//         seeds = [&seed[..]],
//         bump,
//         constraint = swap_data_account.initializer.eq(&signer.key()) @ MYERROR::NotInit
//     )]
//     swap_data_account: Box<Account<'info, SwapData>>,
//     #[account(
//         // mut,
//         seeds = [&user.key().to_bytes()[..]],
//         bump = user_bump
//     )]
//     user_pda: Box<Account<'info, UserPdaData>>,
//     #[account(
//         constraint = delegated_item.mint.eq(&trade_to_add.mint)  @ MYERROR::MintIncorrect,
//         constraint = delegated_item.owner.eq(&user.key())  @ MYERROR::IncorrectOwner,
//         constraint = delegated_item.delegate.unwrap().eq(&user_pda.key())  @ MYERROR::NotDelegatedToUserPda
//     )]
//     delegated_item: Account<'info, TokenAccount>,
//     #[account()]
//     user: AccountInfo<'info>,
//     #[account(mut)]
//     signer: Signer<'info>,
// }

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]
pub struct VerifyInitialize<'info> {
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
#[instruction(seed: Vec<u8>, bump: u8, user_bump:u8)]
pub struct VerifyUserPda<'info> {
    #[account(
        mut,
        seeds = [&seed[..]], 
        bump,
        constraint = swap_data_account.initializer.eq(&signer.key()) @ MYERROR::NotInit        
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(
        mut,
        seeds = [&user.key().to_bytes()[..]], 
        bump=user_bump,
    )]
    user_pda: Box<Account<'info, UserPdaData>>,
    /// CHECK: can only be userPDA
    #[account()]
    user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
}
#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]
pub struct VerifyPresigning<'info> {
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
#[instruction(seed: Vec<u8>, bump: u8)]
pub struct DepositNft<'info> {
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
        constraint = item_from_deposit.mint.eq(&item_to_deposit.mint) @ MYERROR::MintIncorrect,
        constraint = item_from_deposit.owner.eq(&signer.key()) @ MYERROR::IncorrectOwner,
        constraint = item_from_deposit.amount > 0 @ MYERROR::NotEnoughFunds

    )]
    item_from_deposit: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = item_to_deposit.owner.eq(&swap_data_account.to_account_info().key())  @ MYERROR::IncorrectOwner
)]
    item_to_deposit: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8, user_bump: u8)]
pub struct DepositNftPresigned<'info> {
    #[account()]
    system_program: Program<'info, System>,
    #[account()]
    token_program: Program<'info, Token>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,

    #[account(mut)]
    signer: Signer<'info>,
    /// CHECK: can only be userPDA
    #[account()]
    user: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [&user.key().to_bytes()[..]], 
        bump = user_bump,
    )]
    user_pda: Box<Account<'info, UserPdaData>>,
    #[account(
        mut,
        constraint = delegated_item_ata.mint.eq(&swap_data_account_ata.mint) @ MYERROR::MintIncorrect,
        constraint = delegated_item_ata.delegate.unwrap().eq(&user_pda.key()) @ MYERROR::NotDelegated,
        constraint = delegated_item_ata.owner.eq(&user.key()) @ MYERROR::IncorrectOwner,
        constraint = delegated_item_ata.amount > 0 @ MYERROR::NotEnoughFunds
    )]
    delegated_item_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = swap_data_account_ata.owner.eq(&swap_data_account.to_account_info().key())  @ MYERROR::IncorrectOwner
    )]
    swap_data_account_ata: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct DepositCNft<'info> {
    #[account()]
    system_program: Program<'info, System>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&mpl_token_metadata::ID) @ MYERROR::IncorrectMetadata)]
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
#[instruction(seed: Vec<u8>, bump: u8)]
pub struct DepositSol<'info> {
    #[account()]
    system_program: Program<'info, System>,
    #[account()]
    token_program: Program<'info, Token>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(
        mut,
        constraint = swap_data_account_wsol.is_native() @ MYERROR::MintIncorrect,
        constraint = swap_data_account_wsol.owner.eq(&swap_data_account.key())  @ MYERROR::IncorrectOwner
    )]
    swap_data_account_wsol: Account<'info, TokenAccount>,
    // #[account(
    //     mut,
    //     seeds = [&signer.key().to_bytes()[..]],
    //     bump = user_bump,
    // )]
    // user_pda: Box<Account<'info, UserPdaData>>,
    /// CHECK: can only be userPDA
    #[account(mut)]
    user: AccountInfo<'info>,
    #[account(
        mut,
        constraint = user_wsol.is_native() @ MYERROR::MintIncorrect,
        constraint = user_wsol.owner.eq(&user.key())  @ MYERROR::IncorrectOwner,
        constraint = user_wsol.amount > 0 @ MYERROR::NotEnoughFunds
    )]
    user_wsol: Account<'info, TokenAccount>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8, user_bump: u8)]
pub struct DepositSolPresigned<'info> {
    #[account()]
    system_program: Program<'info, System>,
    #[account()]
    token_program: Program<'info, Token>,
    #[account(mut, seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(
        mut,
        constraint = swap_data_account_wsol.owner.eq(&swap_data_account.to_account_info().key())  @ MYERROR::IncorrectOwner,
        constraint = swap_data_account_wsol.is_native() @ MYERROR::MintIncorrect,
    )]
    swap_data_account_wsol: Account<'info, TokenAccount>,
    /// CHECK: can only be userPDA
    #[account(mut,
        constraint = user.key().eq(&user_pda.owner)  @ MYERROR::IncorrectOwner,
    )]
    user: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [&user.key().to_bytes()[..]], 
        bump = user_bump,
    )]
    user_pda: Box<Account<'info, UserPdaData>>,
    #[account(
        mut,
        constraint = user_wsol.owner.eq(&user.key())  @ MYERROR::IncorrectOwner,
        constraint = user_wsol.is_native() @ MYERROR::MintIncorrect,
        constraint = user_wsol.amount > 0 @ MYERROR::NotEnoughFunds
    )]
    user_wsol: Account<'info, TokenAccount>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]
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
    #[account()]
    system_program: Program<'info, System>,
    #[account()]
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
    // #[account(mut)]
    // user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        constraint = item_from_deposit.mint.eq(&item_to_deposit.mint)  @ MYERROR::MintIncorrect,
        constraint = item_from_deposit.owner.eq(&swap_data_account.key())  @ MYERROR::IncorrectOwner
    )]
    item_from_deposit: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = item_to_deposit.owner.eq(&user.key()) @ MYERROR::IncorrectOwner
    )]
    item_to_deposit: Account<'info, TokenAccount>,

    /// CHECK: in constraint
    #[account(constraint = metadata_program.key().eq(&mpl_token_metadata::ID) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraint
    #[account(constraint = sysvar_instructions.key().eq(&solana_program::sysvar::instructions::ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    #[account()]
    spl_token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = spl_ata_program.key().eq(&spl_associated_token_account::ID)  @ MYERROR::IncorrectSplAta)]
    spl_ata_program: AccountInfo<'info>,

    /// CHECK: user Account
    #[account(mut,
        constraint = user_ata.owner == user.key() @ MYERROR::IncorrectOwner
        )]
    user: AccountInfo<'info>,
    // #[account(mut)]
    // signer: Signer<'info>,
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
    #[account(constraint = metadata_program.key().eq(&mpl_token_metadata::ID) @ MYERROR::IncorrectMetadata)]
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
#[instruction(seed: Vec<u8>)] // user_bump:u8
pub struct ClaimSol<'info> {
    #[account()]
    system_program: Program<'info, System>,
    #[account()]
    token_program: Program<'info, Token>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    // #[account(
    //     mut,
    //     seeds = [&user.key().to_bytes()[..]],
    //     bump=user_bump,
    // )]
    // user_pda: Box<Account<'info, UserPdaData>>,
    #[account(
        mut,
        constraint = swap_data_account_wsol.is_native() @ MYERROR::MintIncorrect,
        constraint = swap_data_account_wsol.owner.eq(&swap_data_account.key())  @ MYERROR::IncorrectOwner
    )]
    swap_data_account_wsol: Account<'info, TokenAccount>,
    /// CHECK: can only be userPDA
    #[account(mut)]
    user: AccountInfo<'info>,
    #[account(
        mut,
        constraint = user_wsol.is_native() @ MYERROR::MintIncorrect,
        constraint = user_wsol.owner.eq(&user.key())  @ MYERROR::IncorrectOwner
    )]
    user_wsol: Account<'info, TokenAccount>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]
// #[instruction(bump: u8)]
pub struct CreateUserPda<'info> {
    #[account(init, payer = signer, seeds = [&user.key().to_bytes()[..]], bump, space = 10240)]
    user_pda: Box<Account<'info, UserPdaData>>,
    /// CHECK: can only be userPDA
    #[account()]
    user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account()]
    system_program: Program<'info, System>,
    #[account()]
    spl_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
// #[instruction( bump: u8)]
pub struct ModifyUserPdaBuy<'info> {
    #[account(
        mut,
        seeds = [&signer.key().to_bytes()[..]], 
        bump,
    )]
    user_pda: Box<Account<'info, UserPdaData>>,
    // #[account(
    //     mut,
    //     constraint = signer_wsol.is_native() @ MYERROR::MintIncorrect,
    //     constraint = signer_wsol.owner.eq(&signer.key())  @ MYERROR::IncorrectOwner
    // )]
    // signer_wsol: Account<'info, TokenAccount>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account()]
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction( item_to_add:ItemToSell)]
pub struct ModifyUserPdaSell<'info> {
    #[account(
        mut,
        seeds = [&signer.key().to_bytes()[..]], 
        bump,
    )]
    user_pda: Box<Account<'info, UserPdaData>>,
    #[account(
        mut,
        constraint = item_to_delegate.mint.eq(&item_to_add.mint)  @ MYERROR::MintIncorrect,
        constraint = item_to_delegate.owner.eq(&signer.key())  @ MYERROR::IncorrectOwner
    )]
    item_to_delegate: Account<'info, TokenAccount>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account()]
    token_program: Program<'info, Token>,
    // #[account()]
    // spl_token_program: Program<'info, AssociatedToken>,
    // #[account()]
    // system_program: Program<'info, System>,
}

#[derive(Accounts)]
// #[instruction( bump: u8)]
pub struct UpdateUserPdaToTopUp<'info> {
    #[account(
        mut,
        seeds = [&signer.key().to_bytes()[..]], 
        bump,
    )]
    user_pda: Box<Account<'info, UserPdaData>>,
    #[account(
        mut,
        constraint = signer_wsol.is_native() @ MYERROR::MintIncorrect,
        constraint = signer_wsol.owner.eq(&signer.key())  @ MYERROR::IncorrectOwner
    )]
    signer_wsol: Account<'info, TokenAccount>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account()]
    token_program: Program<'info, Token>,
    // #[account()]
    // spl_token_program: Program<'info, AssociatedToken>,
    // #[account()]
    // system_program: Program<'info, System>,
}

// #[derive(Accounts)]
// #[instruction( bump: u8)]
// pub struct TransferApprovedToken<'info> {
//     #[account(
//         mut,
//         seeds = [&delegated_item.owner.to_bytes()[..]],
//         bump,
//     )]
//     user_pda: Box<Account<'info, UserPdaData>>,
//     #[account()]
//     user: AccountInfo<'info>,
//     #[account(
//         mut,
//         // constraint = destinary.mint== @ MYERROR::MintIncorrect,
//         constraint = delegated_item.owner.eq(&user_pda.owner)  @ MYERROR::IncorrectOwner
//     )]
//     delegated_item: Account<'info, TokenAccount>,
//     #[account(
//         mut,
//         constraint = destinary.mint.eq(&delegated_item.mint) @ MYERROR::MintIncorrect,
//         // constraint = signer_wsol.owner  == signer.key()  @ MYERROR::IncorrectOwner
//     )]
//     destinary: Account<'info, TokenAccount>,
//     #[account(mut)]
//     signer: Signer<'info>,
//     #[account()]
//     token_program: Program<'info, Token>,
// }
// #[derive(Accounts)]
// pub struct TransferCompressedNft<'info> {
//     #[account(mut)]
//     pub leaf_owner: Signer<'info>,

//     #[account(mut)]
//     pub leaf_delegate: Signer<'info>,

//     /// CHECK: in cpi
//     #[account(
//        mut,
//        seeds = [merkle_tree.key().as_ref()],
//        bump,
//        seeds::program = bubblegum_program.key()
//    )]
//     pub tree_authority: UncheckedAccount<'info>,

//     /// CHECK: in cpi
//     #[account(mut)]
//     pub merkle_tree: UncheckedAccount<'info>,

//     /// CHECK: in cpi
//     #[account(mut)]
//     pub new_leaf_owner: UncheckedAccount<'info>,

//     pub log_wrapper: Program<'info, Noop>,
//     pub compression_program: Program<'info, SplAccountCompression>,
//     pub bubblegum_program: Program<'info, Bubblegum>,
//     pub system_program: Program<'info, System>,
// }

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

    pub fn size(_swap_data_account: SwapData, nb_items: u32) -> usize {
        return SwapData::LEN.checked_add(
            NftSwapItem::LEN.checked_mul(nb_items as usize).unwrap()
        ).unwrap();
    }
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct NftSwapItem {
    is_nft: bool, // Argument to sort the functions in the program's functions
    is_compressed: bool, // if NFT is compressed
    is_presigning: bool, // if item is delegated
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
    pub amount_to_topup: u64,
    pub items_to_sell: Vec<ItemToSell>,
    pub items_to_buy: Vec<ItemToBuy>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ItemToSell {
    mint: Pubkey,
    amount_mini: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ItemToBuy {
    mint: Pubkey,
    amount_maxi: u64,
}

pub enum TradeStatus {
    Initializing,
    WaitingToValidatePresigning,
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
            10 => TradeStatus::WaitingToValidatePresigning,

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
            TradeStatus::WaitingToValidatePresigning => 10,

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
    NFTPending,
    NFTPendingPresign,
    NFTDeposited,
    NFTClaimed,
    NFTCanceled,
    NFTCanceledRecovered,
    SolPresigningWaitingForApproval,
    SolPending,
    SolPendingPresign,
    SolDeposited,
    SolToClaim,
    SolClaimed,
    SolCanceled,
    SolCanceledRecovered,
}

impl ItemStatus {
    pub fn from_u8(status: u8) -> ItemStatus {
        match status {
            0 => ItemStatus::NFTPresigningWaitingForApproval,
            1 => ItemStatus::SolPresigningWaitingForApproval,

            10 => ItemStatus::NFTPending,
            11 => ItemStatus::SolPending,
            12 => ItemStatus::NFTPendingPresign,
            13 => ItemStatus::SolPendingPresign,

            20 => ItemStatus::NFTDeposited,
            21 => ItemStatus::SolDeposited,
            22 => ItemStatus::SolToClaim,

            30 => ItemStatus::NFTClaimed,
            31 => ItemStatus::SolClaimed,

            100 => ItemStatus::NFTCanceled,
            101 => ItemStatus::SolCanceled,

            110 => ItemStatus::NFTCanceledRecovered,
            111 => ItemStatus::SolCanceledRecovered,

            _ => panic!("Invalid Proposal Status"),
        }
    }

    pub fn to_u8(&self) -> u8 {
        match self {
            ItemStatus::NFTPresigningWaitingForApproval => 0,
            ItemStatus::SolPresigningWaitingForApproval => 1,

            ItemStatus::NFTPending => 10,
            ItemStatus::SolPending => 11,
            ItemStatus::NFTPendingPresign => 12,
            ItemStatus::SolPendingPresign => 13,

            ItemStatus::NFTDeposited => 20,
            ItemStatus::SolDeposited => 21,
            ItemStatus::SolToClaim => 22,

            ItemStatus::NFTClaimed => 30,
            ItemStatus::SolClaimed => 31,

            ItemStatus::NFTCanceled => 100,
            ItemStatus::SolCanceled => 101,

            ItemStatus::NFTCanceledRecovered => 110,
            ItemStatus::SolCanceledRecovered => 111,
        }
    }
}

pub fn already_exist_buy(list_of_items_to_buy: Vec<ItemToBuy>, item_to_check: ItemToBuy) -> bool {
    for item in list_of_items_to_buy {
        if item.mint.eq(&item_to_check.mint) {
            return true;
        }
    }
    return false;
}

pub fn already_exist_sell(
    list_of_items_to_sell: Vec<ItemToBuy>,
    item_to_check: ItemToSell
) -> bool {
    for item in list_of_items_to_sell {
        if item.mint.eq(&item_to_check.mint) {
            return true;
        }
    }
    return false;
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
