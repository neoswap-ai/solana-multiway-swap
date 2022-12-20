use {
anchor_lang::{
    prelude::*,
    solana_program::{
        pubkey::Pubkey,
        program::{invoke_signed, invoke}
    }},
anchor_spl::token::{spl_token, TokenAccount}
};

declare_id!("EsYuHZrno8EjpWVbkAfpxnJeZcQetd3k9ighJFFpgKJu");

///@title List of function to manage NeoSwap's multi-items swaps
#[program]
pub mod neo_swap {

    use super::*;

    /// @notice Initialize Swap's PDA. /!\ Signer will be Initializer
    /// @dev First function to trigger to initialize Swap's PDA with according space, define admin and add Neoswap Fees. /!\ Signer will be Initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @param sent_data: SwapData: {initializer: Pubkey => admin of the trade, status: u8 = 80 => "status of the trade", items: NftSwapItem = Neoswap_fees [length=1]}, nb_of_items: u32 => number of items engaged in the trade}
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
        _nb_of_items: u32
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
        require_keys_eq!(ctx.accounts.spl_token_program.key(),anchor_spl::associated_token::ID,MYERROR::NotTokenProgram);

        require!(sent_data.status == TradeStatus::Initializing.to_u8(),MYERROR::UnexpectedState);
        require!(sent_data.items.len() == 1, MYERROR::IncorrectLength);
     
        let mut item_to_add: Vec<NftSwapItem>= sent_data.items;

        // Write according status to item
        if item_to_add[0].is_nft {
            item_to_add[0].status = TradeStatus::Pending.to_u8()
        } else {
            if item_to_add[0].amount.is_positive(){
                item_to_add[0].status = TradeStatus::Pending.to_u8()
            }else{
                item_to_add[0].status = TradeStatus::Deposited.to_u8();
                msg!("item added with status deposited");
            }

        }

        // Write according Data into Swap's PDA
        ctx.accounts.swap_data_account.initializer = ctx.accounts.signer.key();
        ctx.accounts.swap_data_account.items = item_to_add;
        ctx.accounts.swap_data_account.status = TradeStatus::Initializing.to_u8();
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
    ) -> Result<()>  {
        let swap_data_account = &mut ctx.accounts.swap_data_account;

        require!(swap_data_account.status == TradeStatus::Initializing.to_u8(),MYERROR::UnexpectedState);
        require_keys_eq!(swap_data_account.initializer, ctx.accounts.signer.key(),MYERROR::NotInit);
        
        let mut item_to_add: NftSwapItem= trade_to_add;

        // Write according status to item
        if item_to_add.is_nft {
            item_to_add.status = TradeStatus::Pending.to_u8();
            if item_to_add.amount.is_negative(){return  Err(error!(MYERROR::UnexpectedData).into());}
            msg!("NFT item added with status pending");

        } else {
            //Check if already one user has Sol item
            for item_id in 0..swap_data_account.items.len() {
                if !swap_data_account.items[item_id].is_nft &&
                swap_data_account.items[item_id].owner.eq(&item_to_add.owner){
                    return  Err(error!(MYERROR::UnexpectedData).into());
                }
            };
            if item_to_add.amount.is_positive(){
                item_to_add.status = TradeStatus::Pending.to_u8();
                msg!("SOL item added with status Pending");
            }else{
                item_to_add.status = TradeStatus::Deposited.to_u8();
                msg!("SOL item added with status Deposited");
            }

        }

        // Write according Data into Swap's PDA
        swap_data_account.items.push(item_to_add);

        Ok(())
    }

    /// @notice Verify Swap's PDA items to proceed to waiting for deposit state. /!\ initializer function
    /// @dev Function verify each item status and sum of lamports to mutate the smart contract status to 0 (waiting for deposit).  /!\ this function can only be triggered by initializer
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts swap_data_account: Pubkey => Swap's PDA corresponding to seeds
    /// @accounts signer: Pubkey => initializer
    /// @return Void
    pub fn validate_initialize(
        ctx: Context<VerifyInitialize>,
        _seed: Vec<u8>,
        _bump: u8,
    ) -> Result<()>  {
        let swap_data_account = &mut ctx.accounts.swap_data_account;

        require!(swap_data_account.status == TradeStatus::Initializing.to_u8(),MYERROR::UnexpectedState);
        require_keys_eq!(swap_data_account.initializer, ctx.accounts.signer.key(),MYERROR::NotInit);

        // Check that sum of lamports to trade is null
        let mut sum =0 as i64;
        for item_id in 0..swap_data_account.items.len() {
            if !swap_data_account.items[item_id].is_nft {
                sum = sum.checked_add(swap_data_account.items[item_id].amount).unwrap()
            }
        };

        require!(sum==0, MYERROR::SumNotNull);
        
        //changing status to 0 (Pending)
        swap_data_account.status = TradeStatus::Pending.to_u8();

        Ok(())
    }

    /// @notice Deposit NFT to escrow. 
    /// @dev Function that iterates through Swap's Data from PDA to find the relevant information linked with accounts shared and deposit the NFT into the escrow. 
    /// @param seed: u8[] => Seed buffer corresponding to Swap's PDA
    /// @param bump: u8 => "Bump corresponding to Swap's PDA"
    /// @accounts {system_program: Pubkey = system_program_id, token_program: Pubkey = token_program_id, swap_data_account: Pubkey => Swap's PDA corresponding to seeds, signer: Pubkey => User that deposits,  item_from_deposit: Pubkey => User ATA related to mint, item_to_deposit: Pubkey => Swap's PDA ATA related to mint}
    /// @return Void
    pub fn deposit_nft(
        ctx: Context<DepositNft>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
        require_keys_eq!(ctx.accounts.token_program.key(),anchor_spl::token::ID,MYERROR::NotTokenProgram);
        
        let swap_data_account = &ctx.accounts.swap_data_account;

        let token_program = &ctx.accounts.token_program;
        let signer = &ctx.accounts.signer;
        let item_to_deposit = &ctx.accounts.item_to_deposit;
        let item_from_deposit = &ctx.accounts.item_from_deposit;
        
        require!(swap_data_account.status == TradeStatus::Pending.to_u8(),MYERROR::UnexpectedState);

        let mut transfered : bool = false;
        
        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {

        if ctx.accounts.swap_data_account.items[item_id].is_nft 
        && ctx.accounts.swap_data_account.items[item_id].mint.eq(&item_to_deposit.mint)
        && ctx.accounts.swap_data_account.items[item_id].status == TradeStatus::Pending.to_u8()  {
                // Transfer according item to Swap's PDA ATA
                let ix = spl_token::instruction::transfer(
                    token_program.key,
                    &item_from_deposit.key(),
                    &item_to_deposit.key(),
                    &signer.key(),
                    &[&signer.key()],
                    ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs(),
                )?;

                invoke(
                    &ix,
                    &[
                        item_from_deposit.to_account_info(),
                        item_to_deposit.to_account_info(),
                        signer.to_account_info(),
                        token_program.clone(),
                    ],
                )?;
                    
                //update item status to 1 (Deposited)
                ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Deposited.to_u8();
                transfered = true;
                msg!("NFT item Deposited");
                break;

            } 
        }
        
        if transfered == false {
            return  Err(error!(MYERROR::NoSend).into());
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
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
     
        require!(ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8(),MYERROR::UnexpectedState);

        let mut transfered : bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if  !(ctx.accounts.swap_data_account.items[item_id].is_nft) 
            && ctx.accounts.swap_data_account.items[item_id].status == 0  
            && ctx.accounts.swap_data_account.items[item_id].owner.eq(ctx.accounts.signer.key) 
            && transfered == false {
                if ctx.accounts.swap_data_account.items[item_id].amount > 0 {
                    // Transfer lamports to Escrow
                    let ix = anchor_lang::solana_program::system_instruction::transfer(
                        &ctx.accounts.signer.key(),
                        &ctx.accounts.swap_data_account.key(),
                        ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs(),
                    );
                    invoke(
                        &ix,
                        &[
                            ctx.accounts.signer.to_account_info(),
                            ctx.accounts.swap_data_account.to_account_info(),
                        ],
                    )?;

                    //update status to 2 (Claimed)
                    ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Claimed.to_u8();
                    transfered = true;
                    msg!("SOL item Deposited");

                } else {
                    return  Err(error!(MYERROR::NotReady).into());
                }

            } else if item_id == ctx.accounts.swap_data_account.items.len() && transfered ==false {
                return  Err(error!(MYERROR::NoSend).into());
            }
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
    pub fn validate_deposit(
        ctx: Context<Validate>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.swap_data_account.initializer,ctx.accounts.signer.key(),MYERROR::NotInit);

        require!(ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8(),MYERROR::UnexpectedState);

        // Checks that all items have been deposited
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if !(ctx.accounts.swap_data_account.items[item_id].status==TradeStatus::Deposited.to_u8() || 
                ctx.accounts.swap_data_account.items[item_id].status==TradeStatus::Claimed.to_u8()) {
                    return  Err(error!(MYERROR::NotReady).into())
                }
        }

        // Udpate status to 1 (Deposited)
        ctx.accounts.swap_data_account.status  = TradeStatus::Deposited.to_u8();

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
    pub fn claim_sol(
        ctx: Context<ClaimSol>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
        require_keys_eq!(ctx.accounts.signer.key(),ctx.accounts.swap_data_account.initializer,MYERROR::NotInit);

        require!(ctx.accounts.swap_data_account.status == TradeStatus::Deposited.to_u8(),MYERROR::NotReady);

        let mut transfered : bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if !ctx.accounts.swap_data_account.items[item_id].is_nft 
            && ctx.accounts.swap_data_account.items[item_id].status == TradeStatus::Deposited.to_u8()
            && ctx.accounts.swap_data_account.items[item_id].destinary.eq(ctx.accounts.user.key)
            && transfered == false {                
                if  ctx.accounts.swap_data_account.items[item_id].amount.is_negative() {
                    // Send lamports to user
                    let amount_to_send = ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs();
                    
                    let swap_data_lamports_initial = ctx.accounts.swap_data_account.to_account_info().lamports();
                    
                    if swap_data_lamports_initial > amount_to_send {
                        **ctx.accounts.user.lamports.borrow_mut() = ctx.accounts.user.lamports() + amount_to_send ;
                        **ctx.accounts.swap_data_account.to_account_info().lamports.borrow_mut() = ctx.accounts.swap_data_account.to_account_info().lamports() - amount_to_send;
                        
                        //update item status to 2 (Claimed)
                        ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Claimed.to_u8();
                        transfered = true;
                        msg!("SOL item Claimed");

                    } else {
                        return  Err(error!(MYERROR::SumNotNull).into());
                    }
                } else {
                    return  Err(error!(MYERROR::NotReady).into());
                }

            } else if item_id == ctx.accounts.swap_data_account.items.len() && transfered ==false {
                return  Err(error!(MYERROR::NoSend).into());
            }
            
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
    pub fn claim_nft(
        ctx: Context<ClaimNft>,
        seed: Vec<u8>,
        bump: u8,
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
        require_keys_eq!(ctx.accounts.token_program.key(),anchor_spl::token::ID,MYERROR::NotTokenProgram);

        require!(ctx.accounts.swap_data_account.status == TradeStatus::Deposited.to_u8(),MYERROR::NotReady);

        let mut transfered : bool = false;
        
        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if ctx.accounts.swap_data_account.items[item_id].is_nft
            && ctx.accounts.swap_data_account.items[item_id].status == 1 
            && ctx.accounts.swap_data_account.items[item_id].mint.eq(&ctx.accounts.item_from_deposit.mint)
            && ctx.accounts.swap_data_account.items[item_id].mint.eq(&ctx.accounts.item_to_deposit.mint)
            && ctx.accounts.swap_data_account.items[item_id].destinary.eq(ctx.accounts.user.key)
            && transfered == false {

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
                        ctx.accounts.token_program.clone(),
                        ctx.accounts.item_from_deposit.to_account_info(),
                        ctx.accounts.item_to_deposit.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                    ],
                    &[&[&seed[..],&[bump]]],
                )?;
                msg!("NFT item Claimed");

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
                                ctx.accounts.token_program.clone(),
                                ctx.accounts.item_from_deposit.to_account_info(),
                                ctx.accounts.swap_data_account.to_account_info(),
                                ctx.accounts.user.to_account_info(),
                                ],
                                &[&[&seed[..], &[bump]]],
                            )?;
                        msg!("ATA closed");

                        }
                        
                //Change status to 2 (Claimed)
                ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Claimed.to_u8();
                transfered = true;

             } else if item_id == ctx.accounts.swap_data_account.items.len() && transfered == false {
                return  Err(error!(MYERROR::NoSend).into());
            }
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
    /// @accounts spl_token_program: Pubkey = spl_associated_token_program_id
    /// @return Void
    pub fn validate_claimed(
        ctx: Context<ValidateAndClose>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
        require_keys_eq!(ctx.accounts.spl_token_program.key(),anchor_spl::associated_token::ID,MYERROR::NotTokenProgram);
     
        require_eq!(ctx.accounts.swap_data_account.status, TradeStatus::Deposited.to_u8(),MYERROR::NotReady);
      
        require_keys_eq!(ctx.accounts.swap_data_account.initializer,ctx.accounts.signer.key(),MYERROR::NotInit);
    
        // verify all items are claimed
        for item_id in 0..ctx.accounts.swap_data_account.items.len(){
            require_eq!(ctx.accounts.swap_data_account.items[item_id].status,TradeStatus::Claimed.to_u8(),MYERROR::NotReady);
        }
        
        // Change Swap's status to 3 (Closed)
        ctx.accounts.swap_data_account.status = TradeStatus::Closed.to_u8();

        **ctx.accounts.signer.lamports.borrow_mut() = ctx.accounts.signer.lamports() + ctx.accounts.swap_data_account.to_account_info().lamports();
        **ctx.accounts.swap_data_account.to_account_info().lamports.borrow_mut() = 0;

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
    pub fn cancel_sol(
        ctx: Context<ClaimSol>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
        require_keys_eq!(ctx.accounts.signer.key(),ctx.accounts.swap_data_account.initializer,MYERROR::NotInit);

        let is_in_pending_or_cancelled_state : bool = 
        ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8() || 
        ctx.accounts.swap_data_account.status == TradeStatus::Cancelled.to_u8();

        require!(is_in_pending_or_cancelled_state,MYERROR::NotReady);

        let mut transfered : bool = false;
        
        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if !ctx.accounts.swap_data_account.items[item_id].is_nft 
            && ctx.accounts.swap_data_account.items[item_id].owner.eq(ctx.accounts.user.key) 
            && transfered == false {
                
                // Check if deposited
                if ctx.accounts.swap_data_account.items[item_id].status == TradeStatus::Claimed.to_u8(){
                    
                        if  ctx.accounts.swap_data_account.items[item_id].amount.is_positive() {
                            
                            let amount_to_send = ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs();
                            
                            let swap_data_lamports_initial = ctx.accounts.swap_data_account.to_account_info().lamports();
                            
                            if swap_data_lamports_initial > amount_to_send {
                                **ctx.accounts.user.lamports.borrow_mut() = ctx.accounts.user.lamports() + amount_to_send ;
                                **ctx.accounts.swap_data_account.to_account_info().lamports.borrow_mut() = ctx.accounts.swap_data_account.to_account_info().lamports() - amount_to_send;
                                msg!("SOL item Cancelled");
                                
                            } else {return  Err(error!(MYERROR::SumNotNull).into());}
    
                        } 
                    } else if ctx.accounts.swap_data_account.items[item_id].status == TradeStatus::Deposited.to_u8() 
                    || ctx.accounts.swap_data_account.items[item_id].status == TradeStatus::Pending.to_u8() {
                        msg!("Item status changed to Cancelled, nothing to recover");
                    } else {
                        return  Err(error!(MYERROR::NotReady).into());
                    }
    
                    // Item status changed to 91 (CancelledRecovered)
                    ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::CancelledRecovered.to_u8();
                    transfered = true;
                    
                    // if not already, Swap status changed to 90 (Cancelled)
                    if ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8() {
                        ctx.accounts.swap_data_account.status = TradeStatus::Cancelled.to_u8();
                        msg!("General status changed to Cancelled");
                    }

                } else if item_id == ctx.accounts.swap_data_account.items.len() && transfered ==false {
                    return  Err(error!(MYERROR::NoSend).into());
                }
            
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
    pub fn cancel_nft(
        ctx: Context<ClaimNft>,
        seed: Vec<u8>,
        bump: u8,
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
        require_keys_eq!(ctx.accounts.token_program.key(),anchor_spl::token::ID,MYERROR::NotTokenProgram);
    
        let user_ata = &ctx.accounts.item_to_deposit;
        let swap_data_ata = &ctx.accounts.item_from_deposit;

        require!((
            ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8() 
        || ctx.accounts.swap_data_account.status == TradeStatus::Cancelled.to_u8()
        ), MYERROR::NotReady );

        let mut transfered : bool = false;

        // find the item linked with shared Accounts
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if ctx.accounts.swap_data_account.items[item_id].is_nft 
            && ctx.accounts.swap_data_account.items[item_id].status == 0 
            && ctx.accounts.swap_data_account.items[item_id].mint.eq(&user_ata.mint) 
            && ctx.accounts.swap_data_account.items[item_id].mint.eq(&swap_data_ata.mint) 
            && ctx.accounts.swap_data_account.items[item_id].owner.eq(ctx.accounts.user.key)
            && transfered == false {
                // Change item status to 91 (CancelRecovered)
                ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::CancelledRecovered.to_u8();
                transfered = true;
                msg!("Item status changed to Cancelled, nothing to recover");

            } else if ctx.accounts.swap_data_account.items[item_id].is_nft 
            && ctx.accounts.swap_data_account.items[item_id].status == 1 
            && ctx.accounts.swap_data_account.items[item_id].mint.eq(&user_ata.mint) 
            && ctx.accounts.swap_data_account.items[item_id].mint.eq(&swap_data_ata.mint) 
            && ctx.accounts.swap_data_account.items[item_id].owner.eq(ctx.accounts.user.key)
            && transfered == false {
                // Transfer deposited NFT back to user
                let ix = spl_token::instruction::transfer(
                    &ctx.accounts.token_program.key,
                    &swap_data_ata.key(),
                    &user_ata.key(),
                    &ctx.accounts.swap_data_account.key(),
                    &[&ctx.accounts.swap_data_account.key()],
                    ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs(),
                )?;
    
                invoke_signed(
                    &ix,
                    &[
                        ctx.accounts.token_program.clone(),
                        swap_data_ata.to_account_info(),
                        user_ata.to_account_info(),
                        ctx.accounts.swap_data_account.to_account_info(),
                    ],
                    &[&[&seed[..], &[bump]]],
                )?;
                msg!("NFT item Cancelled");
                
                // If Swap's PDA ATA balance is null, closes the account and send the rent to user
                if swap_data_ata.amount == 0 {
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
                            ctx.accounts.token_program.clone(),
                            swap_data_ata.to_account_info(),
                            ctx.accounts.swap_data_account.to_account_info(),
                            ctx.accounts.user.to_account_info(),
                        ],
                        &[&[&seed[..], &[bump]]],
                    )?;
                    msg!("ATA closed");

                }

                // Update item status to 91 (CancelRecovered)
                ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::CancelledRecovered.to_u8();
                
                // If not already, update Swap's status to 90 (Cancelled)
                if ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8() {
                    ctx.accounts.swap_data_account.status = TradeStatus::Cancelled.to_u8();
                    msg!("General status changed to Cancelled");
                }
                transfered = true;
            } else if item_id == ctx.accounts.swap_data_account.items.len()-1 && transfered == false {
                return  Err(error!(MYERROR::NoSend).into());
            }
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
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
        require_keys_eq!(ctx.accounts.spl_token_program.key(),anchor_spl::associated_token::ID,MYERROR::NotTokenProgram);
      
        require_eq!(ctx.accounts.swap_data_account.status, TradeStatus::Cancelled.to_u8(),MYERROR::NotReady);

        let nbr_items = ctx.accounts.swap_data_account.items.len();
        
        // Checks all items are Cancelled
        for item_id in 0..nbr_items{
            require_eq!(ctx.accounts.swap_data_account.items[item_id].status,TradeStatus::CancelledRecovered.to_u8(),MYERROR::NotReady);
        }

        // Changing Swap status to 91 (CancelledRecovered)
        ctx.accounts.swap_data_account.status = TradeStatus::CancelledRecovered.to_u8();

        // Emptying Swap's PDA
        **ctx.accounts.signer.lamports.borrow_mut() = ctx.accounts.signer.lamports() + ctx.accounts.swap_data_account.to_account_info().lamports();
        **ctx.accounts.swap_data_account.to_account_info().lamports.borrow_mut() = 0;

        Ok(())  
    }


}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8, sent_data : SwapData,_nb_of_items: u32)]

pub struct InitInitialize<'info> {
    #[account(
        init,
        payer = signer,
        seeds = [&(&seed[..])],
        bump,
        space=SwapData::size(sent_data,_nb_of_items)
    )]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(executable)]
    spl_token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]

pub struct InitializeAdd<'info> {
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}
#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]

pub struct VerifyInitialize<'info> {
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}


#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]

pub struct DepositNft<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(executable)]
    token_program: AccountInfo<'info>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(mut, constraint = signer.key() == item_from_deposit.owner)]
    item_from_deposit: Account<'info, TokenAccount>,
    #[account(mut, constraint = swap_data_account.key() == item_to_deposit.owner)]
    item_to_deposit: Account<'info, TokenAccount>,
}

#[derive(Accounts)]

#[instruction(seed: Vec<u8>, bump: u8)]
pub struct DepositSol<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[derive(Accounts)]

#[instruction(seed: Vec<u8>, bump: u8)]
pub struct Validate<'info> {
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}
#[derive(Accounts)]

#[instruction(seed: Vec<u8>, bump: u8)]
pub struct ValidateAndClose<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(executable)]
    spl_token_program: AccountInfo<'info>,
    #[account(mut,seeds = [&seed[..]], bump, close = signer)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}



#[derive(Accounts)]

#[instruction(seed: Vec<u8>, bump: u8)]
pub struct ClaimNft<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(executable)]
    token_program: AccountInfo<'info>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(mut, constraint = swap_data_account.key() == item_from_deposit.owner)]
    item_from_deposit: Account<'info, TokenAccount>,
    #[account(mut, constraint = user.key() == item_to_deposit.owner)]
    item_to_deposit: Account<'info, TokenAccount>,
}

#[derive(Accounts)]

#[instruction(seed: Vec<u8>, bump: u8)]
pub struct ClaimSol<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(mut,seeds = [&seed[..]], bump)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    user: AccountInfo<'info>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[account]
#[derive(Default)]
pub struct SwapData {
    pub initializer: Pubkey,
    pub status: u8,
    pub items: Vec<NftSwapItem>,
}

impl SwapData {
    const LEN: usize = 8 
        + 1 //u8
        + 32 ;

    pub fn size(_swap_data_account: SwapData, nb_items: u32 )->usize{
        return SwapData::LEN + ( nb_items as usize * NftSwapItem::LEN );//* swap_data_account.items.len() *);
    }
}


#[account]
#[derive(Default)]
pub struct NftSwapItem {
    is_nft: bool,
    mint: Pubkey,
    amount: i64,
    owner: Pubkey,
    destinary: Pubkey,
    status : u8
}

impl NftSwapItem {
    const LEN: usize = 8 
    + 32 * 3  //pubkey
    + 2 //bool / u8
    + 8; //i64
}

pub enum TradeStatus {
    Pending,
    Deposited,
    Claimed,
    Closed,
    Initializing,
    Cancelled,
    CancelledRecovered
}

impl TradeStatus {
    pub fn from_u8(status: u8) -> TradeStatus {
        match status {
          0 => TradeStatus::Pending,
            1 => TradeStatus::Deposited,
            2 => TradeStatus::Claimed,
            3 => TradeStatus::Closed,
            80 => TradeStatus::Initializing,
            90 => TradeStatus::Cancelled,
            91 => TradeStatus::CancelledRecovered,  
            _ => panic!("Invalid Proposal Status"),
        }
    }

    pub fn to_u8(&self) -> u8 {
        match self {
            TradeStatus::Pending => 0,
            TradeStatus::Deposited => 1,
            TradeStatus::Claimed => 2,
            TradeStatus::Closed => 3,
            TradeStatus::Initializing => 80,
            TradeStatus::Cancelled => 90,
            TradeStatus::CancelledRecovered => 91,
        }
    }
}


#[error_code]
pub enum MYERROR {
    #[msg("User not part of the trade")]
    UserNotPartOfTrade,
    #[msg("Mint not found")]
    MintNotFound,
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
}
