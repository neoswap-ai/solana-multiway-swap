use anchor_lang::prelude::{AnchorDeserialize, AnchorSerialize, *};
use anchor_lang::solana_program::entrypoint::ProgramResult;
use anchor_lang::solana_program::{pubkey::Pubkey,program::{invoke_signed, invoke}};
use anchor_spl::token::{spl_token, TokenAccount};

declare_id!("EqJGZ36f9Xm8a9kLntuzdTN8HDjbTUEYC5aHtbjr3EAk");

#[program]
pub mod swap_coontract_test {

    use super::*;
    pub fn initialize(
        ctx: Context<Initialize>,
        seed: Vec<u8>,
        _bump: u8,
        sent_data: SwapData,
    ) -> ProgramResult {
        if ctx.accounts.system_program.key() != anchor_lang::system_program::ID {return  Err(error!(ERROR::NotSystemProgram).into());}
        if ctx.accounts.token_program.key() != anchor_spl::associated_token::ID {return  Err(error!(ERROR::NotTokenProgram).into());}
        let potential_pda = Pubkey::find_program_address(&[&seed[..]], &ctx.program_id.key());
        if potential_pda.0 != ctx.accounts.swap_data_account.key() {return Err(error!(ERROR::NotPda).into());} //else {msg!("Pda Checked")};

        let swap_data_account = &mut ctx.accounts.swap_data_account;

        if sent_data.status != TradeStatus::Pending.to_u8() {
                return  Err(error!(ERROR::UnexpectedData).into());
        }

        for item_id in 0..sent_data.items.len() {
            if sent_data.items[item_id].status != TradeStatus::Pending.to_u8() {
                return  Err(error!(ERROR::UnexpectedData).into());
            }
        }

        swap_data_account.initializer = ctx.accounts.signer.key();
        swap_data_account.items = sent_data.items;
        swap_data_account.status = TradeStatus::Pending.to_u8();

        Ok(())
    }

    pub fn deposit_nft(
        ctx: Context<DepositNft>,
        seed: Vec<u8>,
    ) -> ProgramResult {
        if ctx.accounts.system_program.key() != anchor_lang::system_program::ID {return  Err(error!(ERROR::NotSystemProgram).into());}
        if ctx.accounts.token_program.key() != anchor_spl::associated_token::ID {return  Err(error!(ERROR::NotTokenProgram).into());}

        let potential_pda = Pubkey::find_program_address(&[&seed[..]], &ctx.program_id.key());
        if potential_pda.0 != ctx.accounts.swap_data_account.key() {return Err(error!(ERROR::NotPda).into());} //else {msg!("Pda Checked")};

        let swap_data_account = &ctx.accounts.swap_data_account;
        let items_to_swap = &swap_data_account.items;
        let token_program = &ctx.accounts.token_program;
        let signer = &ctx.accounts.signer;
        let item_to_deposit = &ctx.accounts.item_to_deposit;
        let item_from_deposit = &ctx.accounts.item_from_deposit;
        
        if swap_data_account.status != TradeStatus::Pending.to_u8() {
            return  Err(error!(ERROR::NotReady).into());
        }

        for item_id in 0..items_to_swap.len() {
         if !( 
            items_to_swap[item_id].status == TradeStatus::Deposited.to_u8() 
         || items_to_swap[item_id].status == TradeStatus::Pending.to_u8() 
        ) {
            return  Err(error!(ERROR::NotReady).into());

          } else if items_to_swap[item_id].is_nft && items_to_swap[item_id].mint == item_to_deposit.mint && items_to_swap[item_id].status == 0 {

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

                break

            }
        }
        Ok(())
    }


    pub fn deposit_sol(
        ctx: Context<DepositSol>,
        seed: Vec<u8>,

    ) -> ProgramResult {
        if ctx.accounts.system_program.key() != anchor_lang::system_program::ID {return  Err(error!(ERROR::NotSystemProgram).into());}
        // if ctx.accounts.token_program.key() != anchor_spl::associated_token::ID {return  Err(error!(ERROR::NotTokenProgram).into());}

        let potential_pda = Pubkey::find_program_address(&[&seed[..]], &ctx.program_id.key());
        if potential_pda.0 != ctx.accounts.swap_data_account.key() {return Err(error!(ERROR::NotPda).into());} //else {msg!("Pda Checked")};


        let swap_data_account = &ctx.accounts.swap_data_account;
        let items_to_swap = &swap_data_account.items;
        let signer = &ctx.accounts.signer.to_account_info();

        if swap_data_account.status != TradeStatus::Pending.to_u8() {
            return  Err(error!(ERROR::NotReady).into());
        }

        for item_id in 0..items_to_swap.len() {
            if  !(items_to_swap[item_id].is_nft) 
            && items_to_swap[item_id].status == 0  
            && items_to_swap[item_id].owner == signer.key() {
                if items_to_swap[item_id].amount > 0 {
                    msg!("Deposit  Sent");
                    let amount_to_send = items_to_swap[item_id].amount.unsigned_abs() * (10 as u64).pow(9);

                    let ix = anchor_lang::solana_program::system_instruction::transfer(
                        &ctx.accounts.signer.key(),
                        &ctx.accounts.swap_data_account.key(),
                        amount_to_send,
                    );
                    anchor_lang::solana_program::program::invoke(
                        &ix,
                        &[
                            ctx.accounts.signer.to_account_info(),
                            ctx.accounts.swap_data_account.to_account_info(),
                        ],
                    )?;

                    //update status
                    ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Deposited.to_u8();
    
                    break;

                } else if items_to_swap[item_id].amount <= 0 {
                    msg!("nothing to deposit, your account was validated");
                    ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Deposited.to_u8();
                    break;
                } else {
                    return  Err(error!(ERROR::NotReady).into());
                }

            }
        }
        Ok(())
    }

    pub fn validate_deposit(
        ctx: Context<Validate>,
        seed: Vec<u8>,
        // bump: u8,
    ) -> ProgramResult {
        // if ctx.accounts.system_program.key() != anchor_lang::system_program::ID {return  Err(error!(ERROR::NotSystemProgram).into());}
        // if ctx.accounts.token_program.key() != anchor_spl::associated_token::ID {return  Err(error!(ERROR::NotTokenProgram).into());}

        let potential_pda = Pubkey::find_program_address(&[&seed[..]], &ctx.program_id.key());
        if potential_pda.0 != ctx.accounts.swap_data_account.key() {return Err(error!(ERROR::NotPda).into());} //else {msg!("Pda Checked")};


        let swap_data_account = ctx.accounts.swap_data_account.clone();
        let items_to_swap = &swap_data_account.items;

        if swap_data_account.status != TradeStatus::Pending.to_u8() {
            return  Err(error!(ERROR::NotReady).into());
        }

        let nbr_items = items_to_swap.len();
        let mut counter : usize=0;

        for item_id in 0..nbr_items{
            if items_to_swap[item_id].status != TradeStatus::Deposited.to_u8() {
                return  Err(error!(ERROR::NotReady).into());
            } else if items_to_swap[item_id].status == TradeStatus::Cancelled.to_u8(){
                ctx.accounts.swap_data_account.status  = TradeStatus::Cancelled.to_u8();
            }else{
                counter+=1
            }
        }

        if counter != nbr_items {
            return  Err(error!(ERROR::NotReady).into());
        } else {
            ctx.accounts.swap_data_account.status  = TradeStatus::Deposited.to_u8();
            msg!("state passed to Deposited")

        }

        Ok(())  
    }


    pub fn claim_sol(
        ctx: Context<ClaimSol>,
        seed: Vec<u8>,
        // bump: u8,
    ) -> ProgramResult {
        if ctx.accounts.system_program.key() != anchor_lang::system_program::ID {return  Err(error!(ERROR::NotSystemProgram).into());}
        // if ctx.accounts.token_program.key() != anchor_spl::associated_token::ID {return  Err(error!(ERROR::NotTokenProgram).into());}

        let potential_pda = Pubkey::find_program_address(&[&seed[..]], &ctx.program_id.key());
        if potential_pda.0 != ctx.accounts.swap_data_account.key() {return Err(error!(ERROR::NotPda).into());} //else {msg!("Pda Checked")};


        let swap_data_account = &ctx.accounts.swap_data_account;
        let items_to_swap = &swap_data_account.items;
        let signer = &ctx.accounts.signer;

      if swap_data_account.status != TradeStatus::Deposited.to_u8() {
        return  Err(error!(ERROR::NotReady).into());
      }

        for item_id in 0..items_to_swap.len() {
            if !items_to_swap[item_id].is_nft && items_to_swap[item_id].status == 1 &&  items_to_swap[item_id].destinary==signer.key() {
                
                if  items_to_swap[item_id].amount < 0 {
                        msg!("claim accepted, item status changed to claimed");
                    
                  let amount_to_send = items_to_swap[item_id].amount.unsigned_abs() * (10 as u64).pow(9);
      
                  let signer_account_info: &mut AccountInfo = &mut ctx.accounts.signer.to_account_info();
                  let swap_data_account_info: &mut AccountInfo =
                      &mut ctx.accounts.swap_data_account.to_account_info();
      
                  let signer_lamports_initial = signer_account_info.lamports();
                  let swap_data_lamports_initial = swap_data_account_info.lamports();
      
                  **ctx.accounts.signer.lamports.borrow_mut() =
                      signer_lamports_initial + (amount_to_send);
                  **ctx.accounts.swap_data_account.to_account_info().lamports.borrow_mut() =
                  swap_data_lamports_initial - amount_to_send;
                  
                } else {
                    msg!("nothing to claim, your account was validated");
                }
                    //update status
                    ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Claimed.to_u8();
                break
            } else if item_id == items_to_swap.len(){
                return  Err(error!(ERROR::NoSend).into());
            }
            
        }

        Ok(())

    }


    pub fn claim_nft(
        ctx: Context<ClaimNft>,
        seed: Vec<u8>,
        bump: u8,
    ) -> ProgramResult {
        if ctx.accounts.system_program.key() != anchor_lang::system_program::ID {return  Err(error!(ERROR::NotSystemProgram).into());}
        if ctx.accounts.token_program.key() != anchor_spl::associated_token::ID {return  Err(error!(ERROR::NotTokenProgram).into());}

        let potential_pda = Pubkey::find_program_address(&[&seed[..]], &ctx.program_id.key());
        if potential_pda.0 != ctx.accounts.swap_data_account.key() {return Err(error!(ERROR::NotPda).into());} //else {msg!("Pda Checked")};


        let swap_data_account = &ctx.accounts.swap_data_account;
        let items_to_swap = &swap_data_account.items;
        let signer = &ctx.accounts.signer;
        let user_ata = &ctx.accounts.item_to_deposit;
        let swap_data_ata = &ctx.accounts.item_from_deposit;

        if swap_data_account.status != TradeStatus::Deposited.to_u8() {
            return  Err(error!(ERROR::NotReady).into());
        }

        for item_id in 0..items_to_swap.len() {
            if items_to_swap[item_id].is_nft 
            && items_to_swap[item_id].status == 1 
            && items_to_swap[item_id].mint == user_ata.mint
            && items_to_swap[item_id].mint == swap_data_ata.mint
            && items_to_swap[item_id].destinary==signer.key() {

    
                let ix = spl_token::instruction::transfer(
                    &ctx.accounts.token_program.key,
                    &swap_data_ata.key(),
                    &user_ata.key(),
                    &swap_data_account.key(),
                    &[&swap_data_account.key()],
                    1,
                )?;
    
                invoke_signed(
                    &ix,
                    &[
                        ctx.accounts.token_program.clone(),
                        swap_data_ata.to_account_info(),
                        user_ata.to_account_info(),
                        swap_data_account.to_account_info(),
                    ],
                    &[&[&seed[..], &[bump]]],
                )?;
                    //update status
                    msg!("item changed to claimed");
                    ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Claimed.to_u8();

                break
             } else if item_id == items_to_swap.len(){
                return  Err(error!(ERROR::NoSend).into());
            }
        }

        Ok(())

    }

    pub fn validate_claimed(
        ctx: Context<Validate>,
        seed: Vec<u8>,
        // bump: u8,
    ) -> ProgramResult {
        // if ctx.accounts.system_program.key() != anchor_lang::system_program::ID {return  Err(error!(ERROR::NotSystemProgram).into());}
        // if ctx.accounts.token_program.key() != anchor_spl::associated_token::ID {return  Err(error!(ERROR::NotTokenProgram).into());}

        let potential_pda = Pubkey::find_program_address(&[&seed[..]], &ctx.program_id.key());
        if potential_pda.0 != ctx.accounts.swap_data_account.key() {return Err(error!(ERROR::NotPda).into());} //else {msg!("Pda Checked")};


        let swap_data_account = &ctx.accounts.swap_data_account;
        let items_to_swap = &swap_data_account.items;

        if swap_data_account.status != TradeStatus::Deposited.to_u8() {
            return  Err(error!(ERROR::NotReady).into());
        }

        let nbr_items = items_to_swap.len();
        let mut counter : usize=0;

        for item_id in 0..nbr_items{
            if items_to_swap[item_id].status != TradeStatus::Claimed.to_u8() {
                return  Err(error!(ERROR::NotReady).into());
            } else {
                counter+=1
            }
        }

        if counter != nbr_items {
            return  Err(error!(ERROR::NotReady).into());
        } else {
            ctx.accounts.swap_data_account.status  = TradeStatus::Claimed.to_u8();
            msg!("state passed to Claimed")

        }

        Ok(())  
    }


    pub fn cancel_sol(
        ctx: Context<ClaimSol>,
        seed: Vec<u8>,
        // bump: u8,
    ) -> ProgramResult {
           if ctx.accounts.system_program.key() != anchor_lang::system_program::ID {return  Err(error!(ERROR::NotSystemProgram).into());}
        // if ctx.accounts.token_program.key() != anchor_spl::associated_token::ID {return  Err(error!(ERROR::NotTokenProgram).into());}

        let potential_pda = Pubkey::find_program_address(&[&seed[..]], &ctx.program_id.key());
        if potential_pda.0 != ctx.accounts.swap_data_account.key() {return Err(error!(ERROR::NotPda).into());} //else {msg!("Pda Checked")};


        let swap_data_account = &ctx.accounts.swap_data_account;
        let items_to_swap = &swap_data_account.items;
        let signer = &ctx.accounts.signer;

      if swap_data_account.status != TradeStatus::Pending.to_u8() 
      && swap_data_account.status != TradeStatus::Cancelled.to_u8()  {
        return  Err(error!(ERROR::NotReady).into());
      }

        for item_id in 0..items_to_swap.len() {
            if !items_to_swap[item_id].is_nft && items_to_swap[item_id].status == 1 &&  items_to_swap[item_id].destinary==signer.key() {
                // msg!("claim accepted");

              if  items_to_swap[item_id].amount > 0 {
                msg!("money sending, item status changed to cancelled");

                  let amount_to_send = items_to_swap[item_id].amount.unsigned_abs() * (10 as u64).pow(9);
      
                  let signer_account_info: &mut AccountInfo = &mut ctx.accounts.signer.to_account_info();
                  let swap_data_account_info: &mut AccountInfo =
                      &mut ctx.accounts.swap_data_account.to_account_info();
      
                  let signer_lamports_initial = signer_account_info.lamports();
                  let swap_data_lamports_initial = swap_data_account_info.lamports();
      
                  **ctx.accounts.signer.lamports.borrow_mut() =
                      signer_lamports_initial + (amount_to_send);
                  **ctx.accounts.swap_data_account.to_account_info().lamports.borrow_mut() =
                  swap_data_lamports_initial - amount_to_send;
              } else {
                msg!("nothing to recover, you've validated the cancel tho");
              }
              //update status
                    ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::CancelledRecovered.to_u8();
                    if ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8() {
                        ctx.accounts.swap_data_account.status = TradeStatus::Cancelled.to_u8();
                        msg!("general status changed to cancelled")
                    }
                break
            } else if item_id == items_to_swap.len(){
                return  Err(error!(ERROR::NoSend).into());
            }
            
        }

        Ok(())

    }


    pub fn cancel_nft(
        ctx: Context<ClaimNft>,
        seed: Vec<u8>,
        bump: u8,
    ) -> ProgramResult {
        if ctx.accounts.system_program.key() != anchor_lang::system_program::ID {return  Err(error!(ERROR::NotSystemProgram).into());}
        if ctx.accounts.token_program.key() != anchor_spl::associated_token::ID {return  Err(error!(ERROR::NotTokenProgram).into());}

        let potential_pda = Pubkey::find_program_address(&[&seed[..]], &ctx.program_id.key());
        if potential_pda.0 != ctx.accounts.swap_data_account.key() {return Err(error!(ERROR::NotPda).into());} //else {msg!("Pda Checked")};

        let swap_data_account = &ctx.accounts.swap_data_account;
        let items_to_swap = &swap_data_account.items;
        let signer = &ctx.accounts.signer;
        let user_ata = &ctx.accounts.item_to_deposit;
        let swap_data_ata = &ctx.accounts.item_from_deposit;

        if swap_data_account.status != TradeStatus::Pending.to_u8() 
        && swap_data_account.status != TradeStatus::Cancelled.to_u8()  {
          return  Err(error!(ERROR::NotReady).into());
        }

        for item_id in 0..items_to_swap.len() {
            if items_to_swap[item_id].is_nft 
            && items_to_swap[item_id].status == 1 
            && items_to_swap[item_id].mint == user_ata.mint
            && items_to_swap[item_id].mint == swap_data_ata.mint
            && items_to_swap[item_id].owner==signer.key() {
    
                let ix = spl_token::instruction::transfer(
                    &ctx.accounts.token_program.key,
                    &swap_data_ata.key(),
                    &user_ata.key(),
                    &swap_data_account.key(),
                    &[&swap_data_account.key()],
                    1,
                )?;
    
                invoke_signed(
                    &ix,
                    &[
                        ctx.accounts.token_program.clone(),
                        swap_data_ata.to_account_info(),
                        user_ata.to_account_info(),
                        swap_data_account.to_account_info(),
                    ],
                    &[&[&seed[..], &[bump]]],
                )?;
                    msg!("item sent and status changed to cancelled");
                ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::CancelledRecovered.to_u8();
                
                if ctx.accounts.swap_data_account.status == TradeStatus::Pending.to_u8() {
                    msg!("general status changed to cancelled");
                    ctx.accounts.swap_data_account.status = TradeStatus::Cancelled.to_u8();
                }

                break
            } else if item_id == items_to_swap.len(){
                return  Err(error!(ERROR::NoSend).into());
            }
        }

        Ok(())

    }


    pub fn validate_cancelled(
        ctx: Context<Validate>,
        seed: Vec<u8>,
    ) -> ProgramResult {
        // if ctx.accounts.system_program.key() != anchor_lang::system_program::ID {return  Err(error!(ERROR::NotSystemProgram).into());}
        // if ctx.accounts.token_program.key() != anchor_spl::associated_token::ID {return  Err(error!(ERROR::NotTokenProgram).into());}

        let potential_pda = Pubkey::find_program_address(&[&seed[..]], &ctx.program_id.key());
        if potential_pda.0 != ctx.accounts.swap_data_account.key() {return Err(error!(ERROR::NotPda).into());} //else {msg!("Pda Checked")};

        let swap_data_account = &ctx.accounts.swap_data_account;
        let items_to_swap = &swap_data_account.items;

        if swap_data_account.status != TradeStatus::Cancelled.to_u8() {
            return  Err(error!(ERROR::NotReady).into());
        }

        let nbr_items = items_to_swap.len();
        let mut counter : usize=0;

        for item_id in 0..nbr_items{
            if items_to_swap[item_id].status != TradeStatus::Cancelled.to_u8() {
                return  Err(error!(ERROR::NotReady).into());
            } else {
                counter+=1
            }
        }

        if counter != nbr_items {
            return  Err(error!(ERROR::NotReady).into());
        } else {
            ctx.accounts.swap_data_account.status  = TradeStatus::CancelledRecovered.to_u8();
            msg!("state passed to CancelledRecovered")
        }

        Ok(())  
    }

}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8, sent_data : SwapData)]

pub struct Initialize<'info> {
    #[account(
        init,
        payer = signer,
        seeds = [&seed],
        bump,
        space=SwapData::size(sent_data)
    )]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(executable)]
    token_program: AccountInfo<'info>,
}

#[derive(Accounts)]

pub struct DepositNft<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(executable)]
    token_program: AccountInfo<'info>,
    #[account(mut)]
    swap_data_account:Account<'info, SwapData>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(mut)]
    item_from_deposit: Account<'info, TokenAccount>,
    #[account(mut)]
    item_to_deposit: Account<'info, TokenAccount>,
}

#[derive(Accounts)]

pub struct DepositSol<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(mut)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}


#[derive(Accounts)]

pub struct Validate<'info> {
    #[account(mut)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}



#[derive(Accounts)]

pub struct ClaimNft<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(executable)]
    token_program: AccountInfo<'info>,
    #[account(mut)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(mut)]
    item_from_deposit: Account<'info, TokenAccount>,
    #[account(mut)]
    item_to_deposit: Account<'info, TokenAccount>,
}

#[derive(Accounts)]

pub struct ClaimSol<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(mut)]
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

    pub fn size(swap_data_account:SwapData)->usize{
        return SwapData::LEN + (swap_data_account.items.len() * NftSwapItem::LEN );
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
            TradeStatus::Cancelled => 90,
            TradeStatus::CancelledRecovered => 91,
        }
    }
}


#[error_code]
pub enum ERROR {
    #[msg("User not part oof the trade")]
    UserNotPartOfTrade,
    #[msg("Mint not found")]
    MintNotFound,
    #[msg("Amount given isn't correct")]
    AmountIncorrect,
    #[msg("User should be receiving funds")]
    ShouldntSend,
    #[msg("Nothing was found in the smart contract to be sent to you")]
    NoSend,
    #[msg("amount given isn't corresponding to the Data")]
    AmountGivenIncorect,
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
}
