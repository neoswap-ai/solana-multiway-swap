use anchor_lang::prelude::{AnchorDeserialize, AnchorSerialize, *};
use anchor_lang::solana_program::{
    // program_pack::Pack, 
    // program_error::ProgramError::InvalidAccountData,
    pubkey::Pubkey,program::{invoke_signed, invoke}};
use anchor_spl::token::{spl_token, TokenAccount};
// use spl_token::state::Account as SplTokenAccount;
// use spl_associated_token_account::solana_program::instruction::;

declare_id!("77m2FaVWDBu3yRmw17ouHCbGMcwdzXqdwQALNYTHsRda");

#[program]
pub mod swap_coontract_test {

    use super::*;

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

        ctx.accounts.swap_data_account.initializer = ctx.accounts.signer.key();
        ctx.accounts.swap_data_account.items = sent_data.items;
        ctx.accounts.swap_data_account.status = TradeStatus::Initializing.to_u8();

        Ok(())
    }

    pub fn initialize_add(
        ctx: Context<InitializeAdd>,
        _seed: Vec<u8>,
        _bump: u8,
        trade_to_add: NftSwapItem,
    ) -> Result<()>  {
        let swap_data_account = &mut ctx.accounts.swap_data_account;

        require!(swap_data_account.status == TradeStatus::Initializing.to_u8(),MYERROR::UnexpectedState);
        require_keys_eq!(swap_data_account.initializer, ctx.accounts.signer.key(),MYERROR::NotInit);

        swap_data_account.items.push(trade_to_add);

        Ok(())
    }


    pub fn validate_initialize(
        ctx: Context<VerifyInitialize>,
        _seed: Vec<u8>,
        _bump: u8,
    ) -> Result<()>  {

        let swap_data_account = &mut ctx.accounts.swap_data_account;

        require!(swap_data_account.status == TradeStatus::Initializing.to_u8(),MYERROR::UnexpectedState);
        require_keys_eq!(swap_data_account.initializer, ctx.accounts.signer.key(),MYERROR::NotInit);


        let mut sum =0 as i64;

        for item_id in 0..swap_data_account.items.len() {
            if !swap_data_account.items[item_id].is_nft {
                sum = sum.checked_add(swap_data_account.items[item_id].amount).unwrap()
            }

            require!(swap_data_account.items[item_id].status == TradeStatus::Pending.to_u8(),MYERROR::UnexpectedState);
        };

        require!(sum==0, MYERROR::SumNotNull);

        swap_data_account.status = TradeStatus::Pending.to_u8();

        Ok(())
    }

    pub fn deposit_nft(
        ctx: Context<DepositNft>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
        require_keys_eq!(ctx.accounts.token_program.key(),anchor_spl::token::ID,MYERROR::NotTokenProgram);
        
        let swap_data_account = &ctx.accounts.swap_data_account;
        // require!(swap_data_account.initializer == ctx.accounts.signer.key(),MYERROR::NotInit);

        let token_program = &ctx.accounts.token_program;
        let signer = &ctx.accounts.signer;
        let item_to_deposit = &ctx.accounts.item_to_deposit;
        let item_from_deposit = &ctx.accounts.item_from_deposit;
        
          require!(swap_data_account.status == TradeStatus::Pending.to_u8(),MYERROR::UnexpectedState);

          let mut transfered : bool = false;

        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            require!(
               ( ctx.accounts.swap_data_account.items[item_id].status == TradeStatus::Pending.to_u8() 
            || ctx.accounts.swap_data_account.items[item_id].status == TradeStatus::Deposited.to_u8() )
            ,MYERROR::NotReady);

          if ctx.accounts.swap_data_account.items[item_id].is_nft 
          && ctx.accounts.swap_data_account.items[item_id].mint == item_to_deposit.mint 
          && ctx.accounts.swap_data_account.items[item_id].status == TradeStatus::Pending.to_u8() {

                let ix = spl_token::instruction::transfer(
                    token_program.key,
                    &item_from_deposit.key(),
                    &item_to_deposit.key(),
                    &signer.key(),
                    &[&signer.key()],
                    1,
                )?;

                msg!("Calling Token Program to transfer mint {:} to {:}",item_to_deposit.mint , item_to_deposit.key());
                    invoke(
                        &ix,
                        &[
                            item_from_deposit.to_account_info(),
                            item_to_deposit.to_account_info(),
                            signer.to_account_info(),
                            token_program.clone(),
                        ],
                    )?;
                    
                    //update status
                    ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Deposited.to_u8();
                    transfered = true;

                // break

            } else if item_id == ctx.accounts.swap_data_account.items.len() && transfered == false {
                return  Err(error!(MYERROR::NoSend).into());
            }
        }
        Ok(())
    }

    pub fn deposit_sol(
        ctx: Context<DepositSol>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
     
        require!(ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8(),MYERROR::UnexpectedState);

        let mut transfered : bool = false;

        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if  !(ctx.accounts.swap_data_account.items[item_id].is_nft) 
            && ctx.accounts.swap_data_account.items[item_id].status == 0  
            && ctx.accounts.swap_data_account.items[item_id].owner == ctx.accounts.signer.key() 
            && transfered == false {
                if ctx.accounts.swap_data_account.items[item_id].amount > 0 {
                    msg!("Deposit  Sent");
                  let amount_to_send = ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs();//.checked_mul((10 as u64).pow(9)).unwrap();

                    let ix = anchor_lang::solana_program::system_instruction::transfer(
                        &ctx.accounts.signer.key(),
                        &ctx.accounts.swap_data_account.key(),
                        amount_to_send,
                    );
                    invoke(
                        &ix,
                        &[
                            ctx.accounts.signer.to_account_info(),
                            ctx.accounts.swap_data_account.to_account_info(),
                        ],
                    )?;

                    //update status
                    ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Deposited.to_u8();
                    transfered = true

                    // break;

                } else if ctx.accounts.swap_data_account.items[item_id].amount <= 0 {
                    msg!("nothing to deposit, your account was validated");
                    ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Deposited.to_u8();
                    // break;
                } else {
                    return  Err(error!(MYERROR::NotReady).into());
                }

            } else if item_id == ctx.accounts.swap_data_account.items.len() && transfered ==false {
                return  Err(error!(MYERROR::NoSend).into());
            }
        }
        Ok(())
    }

    pub fn validate_deposit(
        ctx: Context<Validate>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()>  {
             
        require_keys_eq!(ctx.accounts.swap_data_account.initializer,ctx.accounts.signer.key(),MYERROR::NotInit);
        require!(ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8(),MYERROR::UnexpectedState);

        let mut counter : usize = 0;

        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            require_eq!(ctx.accounts.swap_data_account.items[item_id].status,TradeStatus::Deposited.to_u8(),MYERROR::NotReady);
            counter = counter.checked_add(1).unwrap()
        }

        require!(counter == ctx.accounts.swap_data_account.items.len(),MYERROR::NotReady);

        ctx.accounts.swap_data_account.status  = TradeStatus::Deposited.to_u8();
        msg!("state passed to Deposited");

        Ok(())  
    }

    pub fn claim_sol(
        ctx: Context<ClaimSol>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);

        require!(ctx.accounts.swap_data_account.status == TradeStatus::Deposited.to_u8(),MYERROR::NotReady);

        let mut transfered : bool = false;

        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if !ctx.accounts.swap_data_account.items[item_id].is_nft 
            && ctx.accounts.swap_data_account.items[item_id].status == TradeStatus::Deposited.to_u8()
            && ctx.accounts.swap_data_account.items[item_id].destinary == ctx.accounts.signer.key() 
            && transfered == false {
                
                    if  ctx.accounts.swap_data_account.items[item_id].amount < 0 {
                        msg!("claim accepted, item status changed to claimed");

                        let amount_to_send = ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs();//.checked_mul((10 as u64).pow(0)).unwrap();
                        
                        let swap_data_lamports_initial = ctx.accounts.swap_data_account.to_account_info().lamports();

                        if swap_data_lamports_initial > amount_to_send {
                            **ctx.accounts.signer.lamports.borrow_mut() = ctx.accounts.signer.lamports() + amount_to_send ;
                            **ctx.accounts.swap_data_account.to_account_info().lamports.borrow_mut() = ctx.accounts.swap_data_account.to_account_info().lamports() - amount_to_send;
                        
                        }else {
                            return  Err(error!(MYERROR::SumNotNull).into());
                        }

                    } else {
                        msg!("nothing to claim, your account was validated");
                    }
                    //update status
                    ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Claimed.to_u8();
                    transfered = true

                } else if item_id == ctx.accounts.swap_data_account.items.len() && transfered == false {
                return  Err(error!(MYERROR::NoSend).into());
            }
            
        }

        Ok(())

    }

    pub fn claim_nft(
        ctx: Context<ClaimNft>,
        seed: Vec<u8>,
        bump: u8,
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
        require_keys_eq!(ctx.accounts.token_program.key(),anchor_spl::token::ID,MYERROR::NotTokenProgram);
      
        let user_ata = &ctx.accounts.item_to_deposit;
        let swap_data_ata = &ctx.accounts.item_from_deposit;

        require!(ctx.accounts.swap_data_account.status == TradeStatus::Deposited.to_u8(),MYERROR::NotReady);

        let mut transfered : bool = false;
        
        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if ctx.accounts.swap_data_account.items[item_id].is_nft 
            && ctx.accounts.swap_data_account.items[item_id].status == 1 
            && ctx.accounts.swap_data_account.items[item_id].mint == user_ata.mint
            && ctx.accounts.swap_data_account.items[item_id].mint == swap_data_ata.mint
            && ctx.accounts.swap_data_account.items[item_id].destinary == ctx.accounts.signer.key() 
            && transfered == false {

    
                let ix = spl_token::instruction::transfer(
                    &ctx.accounts.token_program.key,
                    &swap_data_ata.key(),
                    &user_ata.key(),
                    &ctx.accounts.swap_data_account.key(),
                    &[&ctx.accounts.swap_data_account.key()],
                    1,
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
                    //update status
                    msg!("item changed to claimed");
                    if swap_data_ata.amount == 0 {
                        let ix2 = spl_token::instruction::close_account(
                            &ctx.accounts.token_program.key,
                            &swap_data_ata.key(),
                            &ctx.accounts.signer.key(),
                            &ctx.accounts.swap_data_account.key(),
                            &[&ctx.accounts.swap_data_account.key()],
                        )?;
                        
                        invoke_signed(
                            &ix2,
                            &[
                                ctx.accounts.token_program.clone(),
                                swap_data_ata.to_account_info(),
                                ctx.accounts.swap_data_account.to_account_info(),
                                ctx.accounts.signer.to_account_info(),
                                ],
                                &[&[&seed[..], &[bump]]],
                            )?;
                        }
                        
                        ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Claimed.to_u8();
                    transfered = true;
                // break
             } else if item_id == ctx.accounts.swap_data_account.items.len() && transfered == false {
                return  Err(error!(MYERROR::NoSend).into());
            }
        }

        Ok(())

    }

    pub fn validate_claimed(
        ctx: Context<ValidateAndClose>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
        require_keys_eq!(ctx.accounts.spl_token_program.key(),anchor_spl::associated_token::ID,MYERROR::NotTokenProgram);
     
        require_eq!(ctx.accounts.swap_data_account.status, TradeStatus::Deposited.to_u8(),MYERROR::NotReady);
      
        require_keys_eq!(ctx.accounts.swap_data_account.initializer,ctx.accounts.signer.key(),MYERROR::NotInit);
    
        let mut counter : usize=0;

        for item_id in 0..ctx.accounts.swap_data_account.items.len(){
            require_eq!(ctx.accounts.swap_data_account.items[item_id].status,TradeStatus::Claimed.to_u8(),MYERROR::NotReady);
            counter = counter.checked_add(1).unwrap()
            // counter += 1
        }

        require_eq!(counter, ctx.accounts.swap_data_account.items.len(),MYERROR::NoSend);
        
        ctx.accounts.swap_data_account.status = TradeStatus::Claimed.to_u8();
        ctx.accounts.swap_data_account.status = TradeStatus::Closed.to_u8();

        **ctx.accounts.signer.lamports.borrow_mut() = ctx.accounts.signer.lamports() + ctx.accounts.swap_data_account.to_account_info().lamports();
        **ctx.accounts.swap_data_account.to_account_info().lamports.borrow_mut() = 0;


        msg!("Account emptied");

        Ok(())  
    }

    pub fn cancel_sol(
        ctx: Context<ClaimSol>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
      

        require!(
            (
                ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8() 
        || ctx.accounts.swap_data_account.status == TradeStatus::Cancelled.to_u8()
        )
        ,MYERROR::NotReady
        );

        let mut transfered : bool = false;

        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if !ctx.accounts.swap_data_account.items[item_id].is_nft 
            && (
                ctx.accounts.swap_data_account.items[item_id].status == TradeStatus::Pending.to_u8() 
                || ctx.accounts.swap_data_account.items[item_id].status == TradeStatus::Deposited.to_u8() 
            ) 
            &&  ctx.accounts.swap_data_account.items[item_id].destinary == ctx.accounts.signer.key() 
            && transfered == false {
                // msg!("claim accepted");

                if  ctx.accounts.swap_data_account.items[item_id].amount > 0 
                && ctx.accounts.swap_data_account.items[item_id].status == TradeStatus::Deposited.to_u8() {
                    msg!("money sending, item status changed to cancelled");

                  let amount_to_send = ctx.accounts.swap_data_account.items[item_id].amount.unsigned_abs();//.checked_mul((10 as u64).pow(0)).unwrap();
 
                    **ctx.accounts.signer.lamports.borrow_mut() = ctx.accounts.signer.lamports() + amount_to_send;
                    **ctx.accounts.swap_data_account.to_account_info().lamports.borrow_mut() = ctx.accounts.swap_data_account.to_account_info().lamports() - amount_to_send;

                } else {
                msg!("nothing to recover, you've validated the cancel tho");
                }

                //update status
                ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::CancelledRecovered.to_u8();
                transfered = true;

                if ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8() {
                    ctx.accounts.swap_data_account.status = TradeStatus::Cancelled.to_u8();
                    msg!("general status changed to cancelled")
                }

                // break
            } else if item_id == ctx.accounts.swap_data_account.items.len() && transfered == false {
                return  Err(error!(MYERROR::NoSend).into());
            }
            
        }

        Ok(())

    }

    pub fn cancel_nft(
        ctx: Context<ClaimNft>,
        seed: Vec<u8>,
        bump: u8,
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
        require_keys_eq!(ctx.accounts.token_program.key(),anchor_spl::token::ID,MYERROR::NotTokenProgram);
    
        let user_ata = &ctx.accounts.item_to_deposit;
        let swap_data_ata = &ctx.accounts.item_from_deposit;

        require!(
            (
            ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8() 
        || ctx.accounts.swap_data_account.status == TradeStatus::Cancelled.to_u8()
        )
        ,MYERROR::NotReady
        );


        let mut transfered : bool = false;

        for item_id in 0..ctx.accounts.swap_data_account.items.len() {
            if ctx.accounts.swap_data_account.items[item_id].is_nft 
            && ctx.accounts.swap_data_account.items[item_id].status == 0 
            && ctx.accounts.swap_data_account.items[item_id].mint == user_ata.mint
            && ctx.accounts.swap_data_account.items[item_id].mint == swap_data_ata.mint
            && ctx.accounts.swap_data_account.items[item_id].owner==ctx.accounts.signer.key()
            && transfered == false {

                msg!("no item to cancel and status changed to cancelled");
                ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::CancelledRecovered.to_u8();
                transfered = true;

            } else if ctx.accounts.swap_data_account.items[item_id].is_nft 
            && ctx.accounts.swap_data_account.items[item_id].status == 1 
            && ctx.accounts.swap_data_account.items[item_id].mint == user_ata.mint
            && ctx.accounts.swap_data_account.items[item_id].mint == swap_data_ata.mint
            && ctx.accounts.swap_data_account.items[item_id].owner==ctx.accounts.signer.key()
            && transfered == false {
    
                let ix = spl_token::instruction::transfer(
                    &ctx.accounts.token_program.key,
                    &swap_data_ata.key(),
                    &user_ata.key(),
                    &ctx.accounts.swap_data_account.key(),
                    &[&ctx.accounts.swap_data_account.key()],
                    1,
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
                  
                if swap_data_ata.amount == 0 {

                    msg!("also close the NFT ata");

                    let ix2 = spl_token::instruction::close_account(
                        &ctx.accounts.token_program.key,
                        &swap_data_ata.key(),
                        &ctx.accounts.signer.key(),
                        &ctx.accounts.swap_data_account.key(),
                        &[&ctx.accounts.swap_data_account.key()],
                    )?;
    
                    invoke_signed(
                        &ix2,
                        &[
                            ctx.accounts.token_program.clone(),
                            swap_data_ata.to_account_info(),
                            ctx.accounts.swap_data_account.to_account_info(),
                            ctx.accounts.signer.to_account_info(),
                        ],
                        &[&[&seed[..], &[bump]]],
                    )?;
                }

                msg!("item sent and status changed to cancelled");
                ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::CancelledRecovered.to_u8();
                
                if ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8() {
                    msg!("general status changed to cancelled");
                    ctx.accounts.swap_data_account.status = TradeStatus::Cancelled.to_u8();
                }
                transfered = true;

                // break
            } else if item_id == ctx.accounts.swap_data_account.items.len() && transfered == false {
                return  Err(error!(MYERROR::NoSend).into());
            }
        }

        Ok(())

    }

    pub fn validate_cancelled(
        ctx: Context<ValidateAndClose>,
        _seed: Vec<u8>,
        _bump: u8
    ) -> Result<()>  {
        require_keys_eq!(ctx.accounts.system_program.key(),anchor_lang::system_program::ID,MYERROR::NotSystemProgram);
        require_keys_eq!(ctx.accounts.spl_token_program.key(),anchor_spl::associated_token::ID,MYERROR::NotTokenProgram);
      
        require_eq!(ctx.accounts.swap_data_account.status, TradeStatus::Cancelled.to_u8(),MYERROR::NotReady);

        let nbr_items = ctx.accounts.swap_data_account.items.len();
        let mut counter : usize=0;

        for item_id in 0..nbr_items{
            require_eq!(ctx.accounts.swap_data_account.items[item_id].status,TradeStatus::CancelledRecovered.to_u8(),MYERROR::NotReady);
            counter = counter.checked_add(1).unwrap()
            // counter += 1
        }

        require_eq!(counter, nbr_items,MYERROR::NoSend);

        ctx.accounts.swap_data_account.status = TradeStatus::CancelledRecovered.to_u8();
        ctx.accounts.swap_data_account.status = TradeStatus::Closed.to_u8();

        **ctx.accounts.signer.lamports.borrow_mut() = ctx.accounts.signer.lamports() + ctx.accounts.swap_data_account.to_account_info().lamports();
        **ctx.accounts.swap_data_account.to_account_info().lamports.borrow_mut() = 0;

        msg!("Account emptied");


        Ok(())  
    }


}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8, sent_data : SwapData,_nb_of_items: u32)]

pub struct InitInitialize<'info> {
    #[account(
        init,
        payer = signer,
        seeds = [&seed],
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
    signer: Signer<'info>,
    #[account(mut, constraint = swap_data_account.key() == item_from_deposit.owner)]
    item_from_deposit: Account<'info, TokenAccount>,
    #[account(mut, constraint = signer.key() == item_to_deposit.owner)]
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
    // #[msg("g")]
    // GG,
    // #[msg("h")]
    // HH,
    // #[msg("i")]
    // II,
    // #[msg("j")]
    // JJ
}
