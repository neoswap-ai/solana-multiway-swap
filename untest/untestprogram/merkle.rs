// mod metaplex_adapter;
use ::{
    mpl_bubblegum::{ state::{ TreeConfig, metaplex_adapter::MetadataArgs }, program::Bubblegum },
    spl_account_compression::{ program::SplAccountCompression, Noop },
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
    anchor_lang::solana_program::keccak,
    mpl_bubblegum::{
        utils::get_asset_id,
        state::leaf_schema::LeafSchema,
        //  bubblegum::compress
    },
    // metaplex_adapter::MetadataArgs,
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
        ctx: Context<ReadMerkleTree>,
        // root: [u8; 32],
        data_hash: [u8; 32],
        creator_hash: [u8; 32],
        nonce: u64,
        collection: Pubkey,
        metadata: MetadataArgs
    ) -> Result<()> {
        // let data = ctx.accounts.merkle_tree.deserialize_data().unwrap();
        let merkle_tree = ctx.accounts.merkle_tree.to_account_info();
        let owner = ctx.accounts.leaf_owner.to_account_info();
        let delegate = ctx.accounts.leaf_delegate.to_account_info();
        msg!("collection {:#?}", collection);

        msg!("merkle_tree {:#?}", merkle_tree.key);
        msg!("owner {:#?}", owner.key);

        let asset_id = get_asset_id(&merkle_tree.key(), nonce);
        msg!("asset_id {:#?}", asset_id);
        // msg!("data_hash {:#?}", data_hash);
        // msg!("creator_hash {:#?}", creator_hash);

        // Transfers must be initiated by either the leaf owner or leaf delegate.
        let _previous_leaf = LeafSchema::new_v0(
            asset_id,
            owner.key(),
            delegate.key(),
            nonce,
            data_hash,
            creator_hash
        );
        // msg!("previous_leaf {:#?}", previous_leaf);
        let metadata_args_hash = keccak::hashv(&[metadata.try_to_vec()?.as_slice()]);
        // Calculate new data hash.
        let meta = keccak
            ::hashv(
                &[&metadata_args_hash.to_bytes(), &metadata.seller_fee_basis_points.to_le_bytes()]
            )
            .to_bytes();

        msg!("meta {:#?}", meta);
        // let tt = wrap_application_data_v1(
        //     previous_leaf.to_event().try_to_vec()?,
        //     &ctx.accounts.log_wrapper
        // )?;
        // msg!("tt {:#?}", tt);
        // let merkle_tree_data = ctx.accounts.merkle_tree.deserialize_data().unwrap();
        // msg!("merkle_tree_data {:#?}", merkle_tree_data);
        Ok(())
    }
}

#[derive(Accounts)]
#[derive(Clone)]
pub struct ReadMerkleTree<'info> {
    #[account(mut)]
    signer: Signer<'info>,

    #[account(seeds = [merkle_tree.key().as_ref()], bump, seeds::program = bubblegum_program.key())]
    /// CHECK: This account is neither written to nor read from.
    pub tree_authority: Account<'info, TreeConfig>,
    /// CHECK: This account is checked in the instruction
    pub leaf_owner: UncheckedAccount<'info>,
    /// CHECK: This account is chekced in the instruction
    pub leaf_delegate: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: This account is modified in the downstream program
    pub merkle_tree: UncheckedAccount<'info>,
    pub log_wrapper: Program<'info, Noop>,
    pub compression_program: Program<'info, SplAccountCompression>,
    pub system_program: Program<'info, System>,
    pub bubblegum_program: Program<'info, Bubblegum>,
}

// #[account]
// #[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Eq, Debug)]

// // #[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Eq, Debug, Clone)]
// pub struct MetadataArgs {
//     /// The name of the asset
//     pub name: String,
//     /// The symbol for the asset
//     pub symbol: String,
//     /// URI pointing to JSON representing the asset
//     pub uri: String,
//     /// Royalty basis points that goes to creators in secondary sales (0-10000)
//     pub seller_fee_basis_points: u16,
//     // Immutable, once flipped, all sales of this metadata are considered secondary.
//     pub primary_sale_happened: bool,
//     // Whether or not the data struct is mutable, default is not
//     pub is_mutable: bool,
//     /// nonce for easy calculation of editions, if present
//     pub edition_nonce: Option<u8>,
//     /// Since we cannot easily change Metadata, we add the new DataV2 fields here at the end.
//     pub token_standard: Option<TokenStandard>,
//     /// Collection
//     pub collection: Option<Collection>,
//     /// Uses
//     pub uses: Option<Uses>,
//     pub token_program_version: TokenProgramVersion,
//     pub creators: Vec<Creator>,
// }

// pub enum TokenStandard {
//     NonFungible, // This is a master edition
//     FungibleAsset, // A token with metadata that can also have attributes
//     Fungible, // A token with simple metadata
//     NonFungibleEdition, // This is a limited edition
// }

// #[account]
// #[derive(PartialEq, Eq, Debug)]
// pub struct Uses {
//     // 17 bytes + Option byte
//     pub use_method: UseMethod, //1
//     pub remaining: u64, //8
//     pub total: u64, //8
// }

// #[account]
// #[derive(PartialEq, Eq, Debug)]
// pub struct Collection {
//     pub verified: bool,
//     pub key: Pubkey,
// }
// pub enum UseMethod {
//     Burn,
//     Multiple,
//     Single,
// }

// pub enum TokenProgramVersion {
//     Original,
//     Token2022,
// }

// #[account]
// #[derive(PartialEq, Eq, Debug)]
// pub struct Creator {
//     pub address: Pubkey,
//     pub verified: bool,
//     // In percentages, NOT basis points ;) Watch out!
//     pub share: u8,
// }
