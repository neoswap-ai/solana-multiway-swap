use anchor_lang::prelude::{AnchorDeserialize, AnchorSerialize, *};
use anchor_lang::solana_program::entrypoint::ProgramResult;
use anchor_lang::solana_program::program::{
     invoke_signed
    };
// use anchor_spl::token::{*,TokenAccount,Mint};

declare_id!("BRBpGfF6xmQwAJRfx7MKPZq1KEgTvVMfcNXHbs42w8Tz");

#[program]
pub mod swap_coontract_test {

    use anchor_lang::solana_program::system_instruction;
    use anchor_spl::token::spl_token;

    use super::*;
    pub fn initialize(
        ctx: Context<Initialize>,
        // _trade_ref: String,
        _seed: Vec<u8>,
        _bump: u8,
        sent_data: SwapData,
    ) -> ProgramResult {
        let swap_data_account = &mut ctx.accounts.swap_data_account;

        swap_data_account.initializer = sent_data.initializer;
        swap_data_account.is_complete = false;

        swap_data_account.user_a = sent_data.user_a;
        swap_data_account.user_a_amount = sent_data.user_a_amount;
        swap_data_account.user_a_nft = sent_data.user_a_nft;

        swap_data_account.user_b = sent_data.user_b;
        swap_data_account.user_b_amount = sent_data.user_b_amount;
        swap_data_account.user_b_nft = sent_data.user_b_nft;

        swap_data_account.user_c = sent_data.user_c;
        swap_data_account.user_c_amount = sent_data.user_c_amount;
        swap_data_account.user_c_nft = sent_data.user_c_nft;


        Ok(())
    }

    pub fn deposit(
        ctx: Context<Deposit>,
        // _trade_ref: String,
        // _seed: Vec<u8>,
        // _bump: u8,
        // nft_to_deposit: Pubkey,
        amount :u64
    ) -> ProgramResult {

        let swap_data_account = &ctx.accounts.swap_data_account;
        let token_program = &ctx.accounts.token_program;
        let deposit_pda_token_account = &ctx.accounts.deposit_pda_token_account;
        let signer = &ctx.accounts.signer;
        let user_token_account_to_deposit = &ctx.accounts.user_token_account_to_deposit;

        // let nft_to_deposit_mint = ctx.accounts.user_token_account_to_deposit;
        
    // let mut nb_try: u16 = 0;
        // let mut user_selected: u8;
        if signer.key == &swap_data_account.user_a.key() {
            if amount==1 {

             } else if  swap_data_account.user_a_amount.is_negative() {
                return Err(error!(SCERROR::ShouldntSend).into())
            } else if amount !=swap_data_account.user_a_amount.unsigned_abs() {
                return Err(error!(SCERROR::AmountIncorrect).into()) 
            }
            // user_selected = 0 as u8;
            // for nft_id in 0..swap_data_account.user_a_nft.len() {
                // if swap_data_account.user_a_nft.mint == nft_to_deposit_mint {
                    msg!("userA");
                                     
        anchor_spl::token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: user_token_account_to_deposit.to_account_info(),
                    to: deposit_pda_token_account.to_account_info(),
                    authority: signer.to_account_info(),
                },
            ),
            amount,
        )?;
                // } else {
                //     // nb_try += 1;
                //     return  Err(error!(SCERROR::MintNotFound).into());
                // }
            // }
        } else if signer.key == &swap_data_account.user_b.key() {
            msg!("userB")

        } else if signer.key == &swap_data_account.user_c.key() {
            msg!("userC")

        } else {
            return  Err(error!(SCERROR::UserNotPartOfTrade).into());
        }


        // ////////

       

        // ////////
        Ok(())
    }
   
    pub fn claim(
        ctx: Context<Claim>,
        // trade_ref: String,
        seed: Vec<u8>,
        bump: u8,
        amount_desired :u64,
        nft_to_deposit: bool,
    ) -> ProgramResult {

        let swap_data_account = &ctx.accounts.swap_data_account;

let mut amount:u64;
if ctx.accounts.signer.key == &swap_data_account.user_a.key() {
    msg!("userA");
    if nft_to_deposit{
        amount=0
    }else if swap_data_account.user_a_amount<0{
    msg!("money to get");

        amount = swap_data_account.user_a_amount.unsigned_abs();
    }else {amount=0}


} else if ctx.accounts.signer.key == &swap_data_account.user_b.key() {
    msg!("userB");
    if nft_to_deposit{
        amount=0
    }else if swap_data_account.user_b_amount<0{
    msg!("money to get");

        amount = swap_data_account.user_b_amount.unsigned_abs();
    }else {amount=0}

} else if ctx.accounts.signer.key == &swap_data_account.user_c.key() {
    msg!("userC");
    if nft_to_deposit{
        amount=0
    }else if swap_data_account.user_c_amount<0{
    msg!("money to get");

        amount = swap_data_account.user_c_amount.unsigned_abs();
    }else {amount=0}

} else {
    return  Err(error!(SCERROR::UserNotPartOfTrade).into());
}


if nft_to_deposit==true{
    msg!("NFT To Claim");

    let ix = spl_token::instruction::transfer(
        &ctx.accounts.token_program.key,
        &ctx.accounts.pda_token_account.to_account_info().key,
        &ctx.accounts.user_token_account_to_receive.to_account_info().key,
        &ctx.accounts.swap_data_account.key(),
        &[&ctx.accounts.swap_data_account.key()],
        1,
    )?;

    invoke_signed(
        &ix,
        &[
            ctx.accounts.token_program.clone(),
            ctx.accounts.pda_token_account.to_account_info(),
            ctx.accounts.user_token_account_to_receive.to_account_info(),
            ctx.accounts.swap_data_account.to_account_info(),
        ],
        &[&[&seed[..], &[bump]]],
    )?;
}else if amount>0{
    msg!("Sol To Claim");

     amount = swap_data_account.user_a_amount.unsigned_abs();
    if amount != amount_desired {return  Err(error!(SCERROR::AmountGivenIncorect).into());}

    let amount_to_send = amount*(10 as u64).pow(9);
    
    let signer_account_info: &mut AccountInfo = &mut ctx.accounts.signer.to_account_info();
    let pda_account_info: &mut AccountInfo = &mut ctx.accounts.pda_token_account.to_account_info();

    let signer_lamports_initial = signer_account_info.lamports();
    let pda_lamports_initial = pda_account_info.lamports();

    **ctx.accounts.signer.lamports.borrow_mut() = signer_lamports_initial +(amount_to_send);
    **ctx.accounts.pda_token_account.lamports.borrow_mut() = pda_lamports_initial -amount_to_send;

 } else {
    return  Err(error!(SCERROR::NoSend).into());

 }


        Ok(())
    }
   
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>, bump: u8)]

pub struct Initialize<'info> {
    #[account(
        init,
        payer = signer,
        seeds = [&seed],
        bump,
        space=SwapData::LEN
    )]
    // #[account(mut)]
    swap_data_account: Account<'info, SwapData>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(executable)]
    token_program: AccountInfo<'info>,

}

#[derive(Accounts)]
// #[instruction(seed: Vec<u8>, bump: u8)]

pub struct Deposit<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(executable)]
    token_program: AccountInfo<'info>,
    // #[account(executable)]
    // program_id: AccountInfo<'info>,
    swap_data_account: Account<'info, SwapData>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(mut)]
    deposit_pda_token_account: UncheckedAccount<'info>,
    #[account(mut)]
    user_token_account_to_deposit: UncheckedAccount<'info>,
    // #[account(mut)]
    // deposit_pda_token_account: Account<'info, TokenAccount>,
    // #[account(mut)]
    // user_token_account_to_deposit: Account<'info,TokenAccount>,

}

#[derive(Accounts)]
// #[instruction(seed: Vec<u8>, bump: u8)]

pub struct Claim<'info> {
    #[account(executable)]
    system_program: AccountInfo<'info>,
    #[account(executable)]
    token_program: AccountInfo<'info>,
    // program_id: AccountInfo<'info>,
    #[account(mut)]
    swap_data_account: Account<'info, SwapData>,
    #[account(mut)]
    signer: Signer<'info>,
    #[account(mut)]
    pda_token_account: UncheckedAccount<'info>,
    #[account(mut)]
    user_token_account_to_receive: UncheckedAccount<'info>,
    // #[account(mut)]
    // deposit_pda_token_account: Account<'info, TokenAccount>,
    // #[account(mut)]
    // user_token_account_to_deposit: Account<'info,TokenAccount>,

}

#[account]
#[derive(Default)]
pub struct SwapData {
    pub initializer: Pubkey,
    pub is_complete: bool,
    pub user_a: Pubkey,
    pub user_a_amount: i64,
    pub user_a_nft: NftSwap,
    pub user_b: Pubkey,
    pub user_b_amount: i64,
    pub user_b_nft: NftSwap,
    pub user_c: Pubkey,
    pub user_c_amount: i64,
    pub user_c_nft: NftSwap,
}
impl SwapData {
    const LEN: usize = 8
        + 1 //bool
        + 32 * 4
        + 
        NftSwap::LEN 
            *(
            1 //sent_data.user_a_nft.len
            + 1 //user_b_nft.len
            + 1 //user_c_nft.len
            ) //NftSwap
    + 3 * 64; //i64
}

#[account]
#[derive(Default)]
pub struct NftSwap {
    mint: Pubkey,
    destinary: Pubkey,
}

impl NftSwap {
    const LEN: usize = 32 * 2;
}

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
    AmountGivenIncorect
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
//     swap_data_account: Account<'info, SwapData>,
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
//     swap_data_account: Account<'info, SwapData>,
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
    //         // for nft_id in 0..swap_data_account.user_a_nft.len() {
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