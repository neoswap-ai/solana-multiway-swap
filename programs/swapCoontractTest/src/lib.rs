use anchor_lang::prelude::{AnchorDeserialize, AnchorSerialize, *};
use anchor_lang::solana_program::entrypoint::ProgramResult;
use anchor_lang::solana_program::program::{invoke_signed, invoke};
use anchor_spl::token::{spl_token, TokenAccount};

declare_id!("EqJGZ36f9Xm8a9kLntuzdTN8HDjbTUEYC5aHtbjr3EAk");

#[program]
pub mod swap_coontract_test {

    use super::*;
    pub fn initialize(
        ctx: Context<Initialize>,
        // _trade_ref: String,
        _seed: Vec<u8>,
        _bump: u8,
        sent_data: SwapData,
    ) -> ProgramResult {
        let swap_data_account = &mut ctx.accounts.swap_data_account;

        if sent_data.status != TradeStatus::Pending.to_u8() {
            return  Err(error!(SCERROR::UnexpectedData).into());
        }

        for item_id in 0..sent_data.items.len() {
            if sent_data.items[item_id].status != TradeStatus::Pending.to_u8() {
                return  Err(error!(SCERROR::UnexpectedData).into());
            }
        }

        swap_data_account.initializer = sent_data.initializer;
        swap_data_account.items = sent_data.items;

        Ok(())
    }

    pub fn deposit_nft(
        ctx: Context<DepositNft>,
    ) -> ProgramResult {
        let swap_data_account = &ctx.accounts.swap_data_account;
        let items_to_swap = &swap_data_account.items;
        let token_program = &ctx.accounts.token_program;
        let signer = &ctx.accounts.signer;
        let item_to_deposit = &ctx.accounts.item_to_deposit;
        let item_from_deposit = &ctx.accounts.item_from_deposit;

        for item_id in 0..items_to_swap.len() {
            if items_to_swap[item_id].is_nft && items_to_swap[item_id].mint == item_to_deposit.mint && items_to_swap[item_id].status == 0 {

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
    ) -> ProgramResult {
        let swap_data_account = &ctx.accounts.swap_data_account;
        let items_to_swap = &swap_data_account.items;
        let signer = &ctx.accounts.signer.to_account_info();

        for item_id in 0..items_to_swap.len() {
            // msg!("for loop");
            // msg!("is_nft {:}",!(items_to_swap[item_id].is_nft) );
            // msg!("status {:}",items_to_swap[item_id].status);
            // msg!("owner {:}",items_to_swap[item_id].owner);
            // msg!("signer {:}",signer.key());
            // msg!("amount {:}",items_to_swap[item_id].amount);
            // msg!("mint {:}",items_to_swap[item_id].mint);
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
                    return  Err(error!(SCERROR::NotReady).into());
                }

            }
        }
        Ok(())
    }

    pub fn validate_deposit(
        ctx: Context<ValidateDeposit>,
        // seed: Vec<u8>,
        // bump: u8,
    ) -> ProgramResult {
        let swap_data_account = &ctx.accounts.swap_data_account;
        let items_to_swap = &swap_data_account.items;

        if swap_data_account.status != TradeStatus::Pending.to_u8() {
            return  Err(error!(SCERROR::NotReady).into());
        }

        let nbr_items = items_to_swap.len();
        let mut counter : usize=0;

        for item_id in 0..nbr_items{
            if items_to_swap[item_id].status != TradeStatus::Deposited.to_u8() {
                return  Err(error!(SCERROR::NotReady).into());
            } else {
                counter+=1
            }
        }

        if counter != nbr_items {
            return  Err(error!(SCERROR::NotReady).into());
        } else {
            ctx.accounts.swap_data_account.status  = TradeStatus::Deposited.to_u8();
        }

        Ok(())  
    }


    pub fn claim_sol(
        ctx: Context<ClaimSol>,
        // seed: Vec<u8>,
        // bump: u8,
    ) -> ProgramResult {

        let swap_data_account = &ctx.accounts.swap_data_account;
        let items_to_swap = &swap_data_account.items;
        let signer = &ctx.accounts.signer;

      if swap_data_account.status != TradeStatus::Deposited.to_u8() {
        return  Err(error!(SCERROR::NotReady).into());
      }

        for item_id in 0..items_to_swap.len() {
            if !items_to_swap[item_id].is_nft && items_to_swap[item_id].status == 1 && items_to_swap[item_id].amount < 0 && items_to_swap[item_id].destinary==signer.key() {

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

                    //update status
                    ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Claimed.to_u8();

                break
            }
        }

        Ok(())

    }


    pub fn claim_nft(
        ctx: Context<ClaimNft>,
        seed: Vec<u8>,
        bump: u8,
    ) -> ProgramResult {

        let swap_data_account = &ctx.accounts.swap_data_account;
        let items_to_swap = &swap_data_account.items;
        let signer = &ctx.accounts.signer;
        let user_ata = &ctx.accounts.item_to_deposit;
        let swap_data_ata = &ctx.accounts.item_from_deposit;

      if swap_data_account.status != TradeStatus::Deposited.to_u8() {
        return  Err(error!(SCERROR::NotReady).into());
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
                    ctx.accounts.swap_data_account.items[item_id].status = TradeStatus::Claimed.to_u8();

                break
            }
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
    // #[account(mut)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(executable)]
    token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
// #[instruction(seed: Vec<u8>, bump: u8)]

pub struct DepositNft<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(executable)]
    token_program: AccountInfo<'info>,
    // #[account(executable)]
    // program_custom: AccountInfo<'info>,
    #[account(mut)]
    swap_data_account:Account<'info, SwapData>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(mut)]
    item_from_deposit: Account<'info, TokenAccount>,
    // item_from_deposit: UncheckedAccount<'info>,
    #[account(mut)]
    item_to_deposit: Account<'info, TokenAccount>,
    // item_to_deposit: UncheckedAccount<'info>,
    // #[account(mut)]
    // deposit_pda_token_account: Account<'info, TokenAccount>,
    // #[account(mut)]
    // user_token_account_to_deposit: Account<'info,TokenAccount>,
}

#[derive(Accounts)]
// #[instruction(seed: Vec<u8>, bump: u8)]

pub struct DepositSol<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    // #[account(executable)]
    // token_program: AccountInfo<'info>,
    // #[account(executable)]
    // program_custom: AccountInfo<'info>,
    #[account(mut)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    // #[account(mut)]
    // item_from_deposit: Account<'info, TokenAccount>,
    // // item_from_deposit: UncheckedAccount<'info>,
    // #[account(mut)]
    // item_to_deposit: Account<'info, TokenAccount>,
    // item_to_deposit: UncheckedAccount<'info>,
    // #[account(mut)]
    // deposit_pda_token_account: Account<'info, TokenAccount>,
    // #[account(mut)]
    // user_token_account_to_deposit: Account<'info,TokenAccount>,
}


#[derive(Accounts)]
// #[instruction(seed: Vec<u8>, bump: u8)]

pub struct ValidateDeposit<'info> {
    
    #[account(mut)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
}




#[derive(Accounts)]
// #[instruction(seed: Vec<u8>, bump: u8)]

pub struct ClaimNft<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(executable)]
    token_program: AccountInfo<'info>,
    // #[account(executable)]
    // program_id: AccountInfo<'info>,
    #[account(mut)]
    swap_data_account:Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(mut)]
    item_from_deposit: Account<'info, TokenAccount>,
    #[account(mut)]
    item_to_deposit: Account<'info, TokenAccount>,
}

// #[instruction(seed: Vec<u8>, bump: u8)]
#[derive(Accounts)]

pub struct ClaimSol<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    // #[account(executable)]
    // program_id: AccountInfo<'info>,
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
    Unallocated
}

impl TradeStatus {
    pub fn from_u8(status: u8) -> TradeStatus {
        match status {
            0 => TradeStatus::Pending,
            1 => TradeStatus::Deposited,
            2 => TradeStatus::Claimed,
            3 => TradeStatus::Unallocated,
            _ => panic!("Invalid Proposal Status"),
        }
    }

    pub fn to_u8(&self) -> u8 {
        match self {
            TradeStatus::Pending => 0,
            TradeStatus::Deposited => 1,
            TradeStatus::Claimed => 2,
            TradeStatus::Unallocated => 2,
        }
    }
}
// #[account]
// #[derive(Default)]
// pub struct SolSwapItem {
//     deposit: Vec<solSwapItemDeposit>,
//     claim: Vec<u64>,
// }

// impl SolSwapItem {
//     const LEN: usize = 8 + 32 * 2 + 64 * 1 + 1 * 2;
// }

// #[account]
// #[derive(Default)]
// pub struct solSwapItemDeposit {
//     amount: i64,
//     claim: Vec<u64>,
// }
#[error_code]
pub enum SCERROR {
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
    #[msg("Not ready for claim yet")]
    NotReady,
    #[msg("Given data isn't fitting")]
    UnexpectedData,
}

// pub fn claim(
//     ctx: Context<Claim>,
//     trade_ref: String,
//     seed: Vec<u8>,
//     _bump: u8,
// ) -> ProgramResult {
//     let swap_data_account = &ctx.accounts.swap_data_account;
//     // let token_program = &ctx.accounts.token_program;
//     // let deposit_pda_token_account = &ctx.accounts.deposit_pda_token_account;
//     // let signer = &ctx.accounts.signer;
//     // let user_token_account_to_deposit=&ctx.accounts.user_token_account_to_deposit;

//     // let owner_change_ix = spl_token::instruction::set_authority(
//     //     token_program.key,
//     //     &user_token_account_to_deposit.key(),
//     //     Some(&deposit_pda_token_account.key()),
//     //     spl_token::instruction::AuthorityType::AccountOwner,
//     //     signer.key,
//     //     &[signer.key],
//     // )?;

//     // msg!("Calling the token program to transfer token account ownership...");
//     // invoke(
//     //     &owner_change_ix,
//     //     &[
//     //         deposit_pda_token_account.to_account_info(),
//     //         signer.to_account_info(),
//     //         token_program.clone(),
//     //     ],
//     // )?;

// anchor_spl::token::close_account(CpiContext::new_with_signer(
//     ctx.accounts.token_program.to_account_info(),
//     anchor_spl::token::CloseAccount {
//         account: ctx
//             .accounts
//             .escrowed_tokens_of_offer_maker
//             .to_account_info(),
//         destination: ctx.accounts.who_made_the_offer.to_account_info(),
//         authority: ctx
//             .accounts
//             .escrowed_tokens_of_offer_maker
//             .to_account_info(),
//     },
//     &[&[
//         ctx.accounts.offer.key().as_ref(),
//         &[ctx.accounts.offer.escrowed_tokens_of_offer_maker_bump],
//     ]],
// ))

//     Ok(())
// }

// pub fn close(
//     ctx: Context<Close>,
//     _trade_ref: String,
//     seed: Vec<u8>,
//     _bump: u8,
// ) -> ProgramResult {
//     // let swap_data_account = &ctx.accounts.swap_data_account;
//     // let token_program = &ctx.accounts.token_program;
//     // let deposit_pda_token_account = &ctx.accounts.deposit_pda_token_account;
//     // let signer = &ctx.accounts.signer;
//     // let user_token_account_to_deposit=&ctx.accounts.user_token_account_to_deposit;

//     // let owner_change_ix = spl_token::instruction::set_authority(
//     //     token_program.key,
//     //     &user_token_account_to_deposit.key(),
//     //     Some(&deposit_pda_token_account.key()),
//     //     spl_token::instruction::AuthorityType::AccountOwner,
//     //     signer.key,
//     //     &[signer.key],
//     // )?;

//     // msg!("Calling the token program to transfer token account ownership...");
//     // invoke(
//     //     &owner_change_ix,
//     //     &[
//     //         deposit_pda_token_account.to_account_info(),
//     //         signer.to_account_info(),
//     //         token_program.clone(),
//     //     ],
//     // )?;

//     Ok(())
// }
// + Create PDAs for the 3 users and create ATA

// #[derive(Accounts)]
// // #[instruction(trade_ref: String, user_seed: Vec<u8>, bump: u8)]

// pub struct Claim<'info> {
//     #[account(executable)]
//     system_program: AccountInfo<'info>,
//     #[account(executable)]
//     token_program: AccountInfo<'info>,
//     // #[account(executable)]
//     // program_id: AccountInfo<'info>,
//     swap_data_account:Box<Account<'info, SwapData>>,
//     #[account(mut)]
//     signer: Signer<'info>,
//     #[account(mut)]
//     deposit_pda_token_account: Account<'info, TokenAccount>,
//     #[account(mut)]
//     user_token_account_to_deposit: Account<'info, TokenAccount>,
//     // #[account(mut)]
//     // vesting_account: AccountInfo<'info>,
//     // #[account(mut)]
//     // vesting_token_account: Account<'info, TokenAccount>,
//     // #[account(mut)]
//     // destination_token_account: Account<'info, TokenAccount>,
//     // #[account(executable)]
//     // vesting_program: AccountInfo<'info>,
//     // clock_sysvar: AccountInfo<'info>,
// }

// #[derive(Accounts)]
// // #[instruction(trade_ref: String, user_seed: Vec<u8>, bump: u8)]

// pub struct Close<'info> {
//     #[account(executable)]
//     system_program: AccountInfo<'info>,
//     #[account(executable)]
//     token_program: AccountInfo<'info>,
//     // #[account(executable)]
//     // program_id: AccountInfo<'info>,
//     swap_data_account:Box<Account<'info, SwapData>>,
//     #[account(mut)]
//     signer: Signer<'info>,
//     #[account(mut)]
//     deposit_pda_token_account: Account<'info, TokenAccount>,
//     #[account(mut)]
//     user_token_account_to_deposit: Account<'info, TokenAccount>,

//     // #[account(mut)]
//     // vesting_account: AccountInfo<'info>,
//     // #[account(mut)]
//     // vesting_token_account: Account<'info, TokenAccount>,
//     // #[account(mut)]
//     // destination_token_account: Account<'info, TokenAccount>,
//     // #[account(executable)]
//     // vesting_program: AccountInfo<'info>,
//     // clock_sysvar: AccountInfo<'info>,
// }

// pub fn deposit_nft(
//     ctx: Context<Deposit>,
//     // _trade_ref: String,
//     // _seed: Vec<u8>,
//     // _bump: u8,
//     // nft_to_deposit: Pubkey,
// ) -> ProgramResult {

//     let swap_data_account = &ctx.accounts.swap_data_account;
//     let token_program = &ctx.accounts.token_program;
//     let deposit_pda_token_account = &ctx.accounts.deposit_pda_token_account;
//     let signer = &ctx.accounts.signer;
//     let user_token_account_to_deposit = &ctx.accounts.user_token_account_to_deposit;

//     let nft_to_deposit_mint = ctx.accounts.user_token_account_to_deposit;
//     // let mut nb_try: u16 = 0;
//     // let mut user_selected: u8;
//     if signer.key == &swap_data_account.user_a.key() {
//         // user_selected = 0 as u8;
//         // for item_id in 0..swap_data_account.user_a_nft.len() {
//             if swap_data_account.user_a_nft.mint == nft_to_deposit_mint {
//                 msg!("userA");

//     anchor_spl::token::transfer(
//         CpiContext::new(
//             token_program.to_account_info(),
//             anchor_spl::token::Transfer {
//                 from: user_token_account_to_deposit.to_account_info(),
//                 to: deposit_pda_token_account.to_account_info(),
//                 authority: signer.to_account_info(),
//             },
//         ),
//         1,
//     )?;
//             } else {
//                 // nb_try += 1;
//                 return  Err(error!(SCERROR::MintNotFound).into());
//             }
//         // }
//     } else if signer.key == &swap_data_account.user_b.key() {
//         msg!("userB")

//     } else if signer.key == &swap_data_account.user_c.key() {
//         msg!("userC")

//     } else {
//         return  Err(error!(SCERROR::UserNotPartOfTrade).into());
//     }

//     // ////////

//     // ////////
//     Ok(())
// }
// + Create PDAs for the 3 users and create ATA

  // if signer.key == &swap_data_account.user_a.key() {
        //     if amount == 1 {
        //     } else if swap_data_account.user_a_amount.is_negative() {
        //         return Err(error!(SCERROR::ShouldntSend).into());
        //     } else if amount != swap_data_account.user_a_amount.unsigned_abs() {
        //         return Err(error!(SCERROR::AmountIncorrect).into());
        //     }
        //     // user_selected = 0 as u8;
        //     // for item_id in 0..swap_data_account.user_a_nft.len() {
        //     // if swap_data_account.user_a_nft.mint == nft_to_deposit_mint {
        //     msg!("userA");

        //     anchor_spl::token::transfer(
        //         CpiContext::new(
        //             token_program.to_account_info(),
        //             anchor_spl::token::Transfer {
        //                 from: user_token_account_to_deposit.to_account_info(),
        //                 to: deposit_pda_token_account.to_account_info(),
        //                 authority: signer.to_account_info(),
        //             },
        //         ),
        //         amount,
        //     )?;
        //     // } else {
        //     //     // nb_try += 1;
        //     //     return  Err(error!(SCERROR::MintNotFound).into());
        //     // }
        //     // }
        // } else if signer.key == &swap_data_account.user_b.key() {
        //     msg!("userB")
        // } else if signer.key == &swap_data_account.user_c.key() {
        //     msg!("userC")
        // } else {
        //     return Err(error!(SCERROR::UserNotPartOfTrade).into());
        // }

    //     pub fn claim(
    //         ctx: Context<Claim>,
    //         // trade_ref: String,
    //         seed: Vec<u8>,
    //         bump: u8,
    //         amount_desired: u64,
    //         nft_to_deposit: bool,
    //     ) -> ProgramResult {
    //         let swap_data_account = &ctx.accounts.swap_data_account;
    //         let user_ata = &ctx.accounts.user_token_account_to_receive;
    //         let pda_ata = &ctx.accounts.pda_token_account;
    // let signer = &ctx.accounts.signer;
    //         let is_ready_to_claim:bool;
    //         let mut amount:u64=0;
    //         swap_data_account.items.len();
    //         if nft_to_deposit==false{
    //             swap_data_account.items.iter().enumerate().for_each(
    //                     |(i,nftSwapItemIter )|{
    //                         if nftSwapItemIter.status==0 {
    //                             return Err(error!(SCERROR::NotReady).into());                        
    //                         }else if nftSwapItemIter.destinary==signer.key()||nftSwapItemIter.amount.is_negative(){
    //                             amount = nftSwapItemIter.amount.unsigned_abs()
    //                         }else{
    //                             return Err(error!(SCERROR::NotReady).into());
    //                         }
    //                     })
    //             }else {
                    
    //             }
    
    //         let mut amount: u64;
    //         if ctx.accounts.signer.key == &swap_data_account..key() {
    //             msg!("userA");
    //             if nft_to_deposit {
    //                 amount = 0
    //             } else if swap_data_account.user_a_amount < 0 {
    //                 msg!("money to get");
    
    //                 amount = swap_data_account.user_a_amount.unsigned_abs();
    //             } else {
    //                 amount = 0
    //             }
    //         } else if ctx.accounts.signer.key == &swap_data_account.user_b.key() {
    //             msg!("userB");
    //             if nft_to_deposit {
    //                 amount = 0
    //             } else if swap_data_account.user_b_amount < 0 {
    //                 msg!("money to get");
    
    //                 amount = swap_data_account.user_b_amount.unsigned_abs();
    //             } else {
    //                 amount = 0
    //             }
    //         } else if ctx.accounts.signer.key == &swap_data_account.user_c.key() {
    //             msg!("userC");
    //             if nft_to_deposit {
    //                 amount = 0
    //             } else if swap_data_account.user_c_amount < 0 {
    //                 msg!("money to get");
    
    //                 amount = swap_data_account.user_c_amount.unsigned_abs();
    //             } else {
    //                 amount = 0
    //             }
    //         } else {
    //             return Err(error!(SCERROR::UserNotPartOfTrade).into());
    //         }
    
    //         if nft_to_deposit == true {
    //             msg!("NFT To Claim");
    
    //             let ix = spl_token::instruction::transfer(
    //                 &ctx.accounts.token_program.key,
    //                 &ctx.accounts.pda_token_account.to_account_info().key,
    //                 &ctx.accounts
    //                     .user_token_account_to_receive
    //                     .to_account_info()
    //                     .key,
    //                 &ctx.accounts.swap_data_account.key(),
    //                 &[&ctx.accounts.swap_data_account.key()],
    //                 1,
    //             )?;
    
    //             invoke_signed(
    //                 &ix,
    //                 &[
    //                     ctx.accounts.token_program.clone(),
    //                     ctx.accounts.pda_token_account.to_account_info(),
    //                     ctx.accounts.user_token_account_to_receive.to_account_info(),
    //                     ctx.accounts.swap_data_account.to_account_info(),
    //                 ],
    //                 &[&[&seed[..], &[bump]]],
    //             )?;
    //         } else if amount > 0 {
    //             msg!("Sol To Claim");
    
    //             amount = toget;
    //             if amount != amount_desired {
    //                 return Err(error!(SCERROR::AmountGivenIncorect).into());
    //             }
    
    //             let amount_to_send = amount * (10 as u64).pow(9);
    
    //             let signer_account_info: &mut AccountInfo = &mut ctx.accounts.signer.to_account_info();
    //             let pda_account_info: &mut AccountInfo =
    //                 &mut ctx.accounts.pda_token_account.to_account_info();
    
    //             let signer_lamports_initial = signer_account_info.lamports();
    //             let pda_lamports_initial = pda_account_info.lamports();
    
    //             **ctx.accounts.signer.lamports.borrow_mut() =
    //                 signer_lamports_initial + (amount_to_send);
    //             **ctx.accounts.pda_token_account.lamports.borrow_mut() =
    //                 pda_lamports_initial - amount_to_send;
    //         } else {
    //             return Err(error!(SCERROR::NoSend).into());
    //         }
    
    //         Ok(())
    //     }