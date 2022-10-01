use anchor_lang::prelude::{AnchorDeserialize, AnchorSerialize, *};
use anchor_lang::solana_program::entrypoint::ProgramResult;
// use anchor_lang::solana_program::program::{invoke, invoke_signed};
// use anchor_spl::token::{*,TokenAccount,Mint};

declare_id!("BRBpGfF6xmQwAJRfx7MKPZq1KEgTvVMfcNXHbs42w8Tz");

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

        swap_data_account.initializer = sent_data.initializer;
        swap_data_account.is_complete = false;

        swap_data_account.user_a = sent_data.user_a;
        // swap_data_account.user_a_amount = sent_data.user_a_amount;
        swap_data_account.user_a_nft1 = sent_data.user_a_nft1;
        swap_data_account.user_a_nft2 = sent_data.user_a_nft2;

        swap_data_account.user_b = sent_data.user_b;
        // swap_data_account.user_b_amount = sent_data.user_b_amount;
        swap_data_account.user_b_nft = sent_data.user_b_nft;

        swap_data_account.user_c = sent_data.user_c;
        // swap_data_account.user_c_amount = sent_data.user_c_amount;
        swap_data_account.user_c_nft = sent_data.user_c_nft;

        //user A ATA PDA linked to the NFT to transfer

        // for user_a_ata_id in 0..swap_data_account.user_a_nft.len() {
        //     let (user_a_ata_pda, user_a_ata_pda_bump) = Pubkey::find_program_address(
        //         &[
        //             &ctx.accounts.token_program.key.to_bytes(),
        //             &ctx.accounts.swap_data_account.key().to_bytes(),
        //             &ctx.accounts.swap_data_account.user_a_nft[user_a_ata_id].to_bytes(),
        //         ],
        //         ctx.accounts.program_id.key,
        //     );
        //     let user_a_ix = spl_token::instruction::initialize_account3(
        //         &ctx.accounts.token_program.key(),
        //         &user_a_ata_pda,
        //         &swap_data_account.user_a_nft[user_a_ata_id],
        //         &swap_data_account.user_a,
        //     )?;

        //     invoke_signed(
        //         &user_a_ix,
        //         &[
        //             ctx.accounts.token_program.clone(),
        //             user_a_ata_pda.
        //             ctx.accounts.referrer_token_account.clone(),
        //             ctx.accounts.source_account.to_account_info(),
        //         ],
        //         &[&[&seed[..], &[bump]]],
        //     )?;
        // }

        // for user_b_ata_id in 0..swap_data_account.user_b_nft.len() {}

        // for user_c_ata_id in 0..swap_data_account.user_c_nft.len() {}
        // need to create ATA linked to the mint they will have to receive

        Ok(())
    }

    // pub fn deposit(
    //     ctx: Context<Deposit>,
    //     _trade_ref: String,
    //     _seed: Vec<u8>,
    //     _bump: u8,
    //     nft_to_deposit: Pubkey,
    // ) -> ProgramResult {
    //     let swap_data_account = &ctx.accounts.swap_data_account;
    //     let token_program = &ctx.accounts.token_program;
    //     let deposit_pda_token_account = &ctx.accounts.deposit_pda_token_account;
    //     let signer = &ctx.accounts.signer;
    //     let user_token_account = &ctx.accounts.user_token_account;
    //     let mut nb_try: u16 = 0;
    //     let mut user_selected: u8;
    //     if signer.key == &swap_data_account.user_a {
    //         user_selected = 0 as u8;
    //         for nft_id in 0..swap_data_account.user_a_nft.len() {
    //             if swap_data_account.user_a_nft[nft_id] == ctx.accounts.user_token_account.mint {
    //                 let owner_change_ix = spl_token::instruction::set_authority(
    //                     token_program.key,
    //                     &user_token_account.key(),
    //                     Some(&deposit_pda_token_account.key()),
    //                     spl_token::instruction::AuthorityType::AccountOwner,
    //                     signer.key,
    //                     &[signer.key],
    //                 )?;

    //                 msg!("Calling the token program to transfer token account ownership...");
    //                 invoke(
    //                     &owner_change_ix,
    //                     &[
    //                         deposit_pda_token_account.to_account_info(),
    //                         signer.to_account_info(),
    //                         token_program.clone(),
    //                     ],
    //                 )?;
    //             } else {
    //                 nb_try += 1;
    //             }
    //         }
    //     } else if signer.key == &swap_data_account.user_b {
    //     } else if signer.key == &swap_data_account.user_c {
    //     } else {
    //         // return anchor_lang::prelude::ProgramError::Custom(10)// Err(error!(SCERROR::UserNotPartOfTrade));
    //         // return err!(MyError::UserNotPartOfTrade)//err!(MyError::UserNotPartOfTrade.into()); 
    //         // return err!(MyError::UserNotPartOfTrade)
    //         // return Err(error!(MyError::UserNotPartOfTrade))//Err(error!(MyError::UserNotPartOfTrade));
    //     }

    //     Ok(())
    // }
    // + Create PDAs for the 3 users and create ATA

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
    //     // let user_token_account=&ctx.accounts.user_token_account;

    //     // let owner_change_ix = spl_token::instruction::set_authority(
    //     //     token_program.key,
    //     //     &user_token_account.key(),
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
    //     // let user_token_account=&ctx.accounts.user_token_account;

    //     // let owner_change_ix = spl_token::instruction::set_authority(
    //     //     token_program.key,
    //     //     &user_token_account.key(),
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
}

#[derive(Accounts)]
#[instruction(trade_ref: String, seed: Vec<u8>, bump: u8)]

pub struct Initialize<'info> {
    #[account(
        init,
        payer = signer,
        seeds = [trade_ref.as_bytes(), &seed],
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
    // #[account(executable)]
    // program_id: AccountInfo<'info>,
    // #[account(executable)]
    // vesting_program: AccountInfo<'info>,
    // clock_sysvar: AccountInfo<'info>,
    // #[account(mut)]
    // vesting_token_account: Account<'info, TokenAccount>,
    // #[account(mut)]
    // destination_token_account: Account<'info, TokenAccount>,
}

// #[derive(Accounts)]
// #[instruction(trade_ref: String, user_seed: Vec<u8>, bump: u8)]

// pub struct Deposit<'info> {
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
//     user_token_account: Account<'info, TokenAccount>,
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
//     user_token_account: Account<'info, TokenAccount>,
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
//     user_token_account: Account<'info, TokenAccount>,

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

#[account]
#[derive(Default)]
pub struct SwapData {
    pub initializer: Pubkey,
    pub is_complete: bool,
    pub user_a: Pubkey,
    // pub user_a_amount: i64,
    pub user_a_nft1: Pubkey,
    pub user_a_nft2: Pubkey,
    pub user_b: Pubkey,
    // pub user_b_amount: i64,
    pub user_b_nft: Pubkey,
    pub user_c: Pubkey,
    // pub user_c_amount: i64,
    pub user_c_nft: Pubkey,
}

impl SwapData {
    const LEN: usize = 8
        + 1 //bool
        + 32* (
            4 
            + 2 //sent_data.user_a_nft.len
            + 1 //user_b_nft.len
            + 1 //user_c_nft.len
        ) ;//pubkey
        // + 3 * 64; //u8
}


#[error_code]
pub enum SCERROR {
    #[msg("User not part oof the trade")]
    UserNotPartOfTrade,
}