use ::{
    anchor_lang::{
        prelude::*,
        solana_program::{
            // self,
            // instruction::Instruction,
            // program::{ invoke, invoke_signed },
            pubkey::Pubkey,
            // system_program::ID as SYSTEM_PROGRAM_ID,
            // clock::Clock,
        },
    },
    // anchor_spl::{
    //     associated_token::AssociatedToken,
    //     token::{ spl_token, Mint, Token, TokenAccount },
    // },
    // mpl_bubblegum::{ state::TreeConfig },
    // // mpl_bubblegum::{CollectionVerification,bubblegum::verify_collection,DecompressV1,bubblegum::decompress_v1,},

    // mpl_token_metadata::{
    //     instruction::{ builders::TransferBuilder, InstructionBuilder, TransferArgs },
    //     state::{ Metadata, TokenMetadataAccount },
    // },
    // spl_account_compression::{ program::SplAccountCompression, Noop },
    // spl_associated_token_account,
};

declare_id!("7H73hAEk1R1EXXgheDBdAn3Un3W7SQKMuKtwpfU67eet");
///@title List of function to manage NeoSwap's multi-items swaps
#[program]
pub mod neo_swap {
    use super::*;

    pub fn read_merkle_tree(
        ctx: Context<ReadMerkleTree>
        // root: [u8; 32],
        // data_hash: [u8; 32],
        // creator_hash: [u8; 32],
        // nonce: u64,
        // index: u32
    ) -> Result<()> {
        // let data = ctx.accounts.merkle_tree.deserialize_data().unwrap();
        let mkai = ctx.accounts.merkle_tree.to_account_info();
        msg!("mkai {:#?}", mkai.data);
        // let merkle_tree_data = ctx.accounts.merkle_tree.deserialize_data().unwrap();
        // msg!("merkle_tree_data {:#?}", merkle_tree_data);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ReadMerkleTree<'info> {
    #[account(mut)]
    signer: Signer<'info>,
    /// CHECK: n
    #[account(mut)]
    merkle_tree: AccountInfo<'info>,
}
