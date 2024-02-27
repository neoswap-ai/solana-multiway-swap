use ::{
    anchor_lang::{
        prelude::*,
        solana_program::{
            instruction::Instruction,
            program::invoke,
            pubkey::Pubkey,
            // system_program::ID as SYSTEM_PROGRAM_ID,
            sysvar::instructions::ID as SYSVAR_INSTRUCTIONS_ID,
            pubkey,
        },
    },
    anchor_spl::token::{ spl_token, Mint, Token, TokenAccount },
    mpl_token_metadata::{
        accounts::Metadata,
        instructions::TransferBuilder,
        programs::MPL_TOKEN_METADATA_ID,
        types::{ TokenStandard, TransferArgs },
    },
    spl_associated_token_account::ID as SPL_ASSOCIATED_TOKEN_ACCOUNT_ID,
};

// declare_id!("2vumtPDSVo3UKqYYxMVbDaQz1K4foQf6A31KiUaii1M7"); // mainnet test
// declare_id!("Et2RutKNHzB6XmsDXUGnDHJAGAsJ73gdHVkoKyV79BFY");
// declare_id!("HCg7NKnvWwWZdLXqDwZdjn9RDz9eLDYuSAcUHqeC1vmH");
// declare_id!("EU5zoiRSvPE5k1Fy49UJZvPMBKxzatdBGFJ11XPFD42Z");
declare_id!("CtZHiWNnLu5rQuTN3jo7CmYDR8Wns6qXHn7taPvmnACp"); // devnet Test

///@title List of function to manage NeoSwap's multi-items swaps
#[program]
pub mod neo_swap {
    use solana_program::program::invoke_signed;

    use super::*;

    const _NS_FEE_ACCOUNT: Pubkey = pubkey!("FjecsBcSXQh4rjPSksh2eBiXUswcMpAwU25ykcr842j8");

    pub fn initialize(
        ctx: Context<Initialize>,
        mint: Pubkey,
        payment_mint: Pubkey,
        duration: i64
    ) -> Result<()> {
        let maker = ctx.accounts.maker.key();
        require!(duration.is_positive() || duration.eq(&0), MYERROR::SeedLengthIncorrect);

        // Write according Data into Swap's PDA
        ctx.accounts.swap_data_account.maker = maker;
        ctx.accounts.swap_data_account.maker_nft_mint = mint;

        ctx.accounts.swap_data_account.bids = [].to_vec();

        ctx.accounts.swap_data_account.royalties_paid = false;

        if duration.eq(&0) {
            ctx.accounts.swap_data_account.end_time = 0;
        } else {
            ctx.accounts.swap_data_account.end_time = Clock::get()?.unix_timestamp + duration;
        }
        ctx.accounts.swap_data_account.seed = get_seed_string(maker, mint);
        ctx.accounts.swap_data_account.payment_mint = payment_mint;

        Ok(())
    }

    pub fn make_swap(ctx: Context<MakeSwap>, bid_to_add: Bid) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;
        let maker = &ctx.accounts.maker;
        let mint_nft = &ctx.accounts.mint_nft;

        require_keys_eq!(swap_data_account.maker, maker.key(), MYERROR::NotMaker);
        require_keys_eq!(swap_data_account.maker_nft_mint, mint_nft.key(), MYERROR::MintIncorrect);

        require_keys_eq!(
            swap_data_account.payment_mint,
            ctx.accounts.mint_token.key(),
            MYERROR::MintIncorrect
        );

        //Add bid to the data
        swap_data_account.bids.push(bid_to_add.clone());
        msg!("bid_to_add {:?}", bid_to_add);

        //transfer Maker NFT
        let transfert_nft_data = create_p_nft_instruction(1, SendPNft {
            from: maker.to_account_info(),
            from_ata: ctx.accounts.maker_nft_ata.to_account_info(),
            to: swap_data_account.to_account_info(),
            to_ata: ctx.accounts.swap_data_account_nft_ata.to_account_info(),
            mint: mint_nft.to_account_info(),
            signer: maker.to_account_info(),
            auth_rules: ctx.accounts.auth_rules.clone(),
            auth_rules_program: ctx.accounts.auth_rules_program.to_account_info(),
            destination_token_record: ctx.accounts.destination_token_record.clone(),
            metadata_program: ctx.accounts.metadata_program.to_account_info(),
            nft_master_edition: ctx.accounts.nft_master_edition.clone(),
            nft_metadata: ctx.accounts.nft_metadata.to_account_info(),
            owner_token_record: ctx.accounts.owner_token_record.clone(),
            sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            ata_program: ctx.accounts.ata_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        }).unwrap();
        msg!(
            "transfer {:?} of {:?} from {:?} to {:?} ",
            1,
            ctx.accounts.mint_nft.key(),
            ctx.accounts.maker_nft_ata.key(),
            ctx.accounts.swap_data_account_nft_ata.key()
        );
        invoke(&transfert_nft_data.instruction, &transfert_nft_data.account_infos)?;

        //Calculate amount to send
        let mut amount_to_send = bid_to_add.fees.maker_neoswap_fee
            .checked_add(bid_to_add.fees.maker_royalties)
            .unwrap();

        if bid_to_add.amount.is_negative() {
            msg!("bid_to_add.amount {:?}", -bid_to_add.amount);
            amount_to_send = amount_to_send.checked_add(bid_to_add.amount.unsigned_abs()).unwrap();
        }

        //transfer Maker Token
        let transfert_token_data = get_transfer_token_ix(amount_to_send, SendToken {
            from: ctx.accounts.maker.to_account_info(),
            from_ata: ctx.accounts.maker_token_ata.clone(),
            to: swap_data_account.to_account_info(),
            to_ata: ctx.accounts.swap_data_account_token_ata.clone(),
            // mint: ctx.accounts.mint_token.clone(),
            token_program: ctx.accounts.token_program.to_account_info(),
        }).unwrap();

        msg!(
            "transfer {:?} of {:?} from {:?} to {:?} ",
            amount_to_send,
            swap_data_account.payment_mint,
            ctx.accounts.maker.key(),
            swap_data_account.key()
        );
        invoke(&transfert_token_data.instruction, &transfert_token_data.account_infos)?;

        Ok(())
    }

    pub fn take_swap(ctx: Context<TakeSwap>, bid_to_accept: Bid) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;
        let maker = &ctx.accounts.maker;
        let taker = &ctx.accounts.taker;
        let taker_mint_nft = &ctx.accounts.taker_mint_nft;

        require!(swap_data_account.accepted_bid.is_none(), MYERROR::AlreadyTaken);
        require!(swap_data_account.taker_nft_mint.is_none(), MYERROR::AlreadyTaken);
        require!(swap_data_account.taker.is_none(), MYERROR::AlreadyTaken);

        require_keys_eq!(
            swap_data_account.payment_mint,
            ctx.accounts.mint_token.key(),
            MYERROR::MintIncorrect
        );

        // Find Bid to accept
        let found_bid_to_accept = swap_data_account.bids
            .iter()
            .find(|item_search| {
                item_search.collection.eq(&bid_to_accept.collection) &&
                    item_search.amount == bid_to_accept.amount &&
                    item_search.fees == bid_to_accept.fees
            })
            .unwrap_or_else(|| {
                msg!("bid_to_accept {:?}", bid_to_accept);
                panic!("Bid not found")
            })
            .clone();

        // checking if NFT is part of collection
        let meta = get_metadata(ctx.accounts.taker_mint_nft.to_account_info().clone());
        let meta_collection = meta.collection.expect(&MYERROR::CollectionNotFound.to_string());

        require!(meta_collection.verified, MYERROR::UnVerifiedCollection);
        require!(
            meta_collection.key.eq(&found_bid_to_accept.collection),
            MYERROR::IncorrectCollection
        );
        // Adding the Bid to the data:
        swap_data_account.accepted_bid = Some(found_bid_to_accept.clone());
        swap_data_account.taker = Some(taker.key());
        swap_data_account.taker_nft_mint = Some(taker_mint_nft.key());

        //transfer Maker NFT
        let transfert_nft_data = create_p_nft_instruction(1, SendPNft {
            from: taker.to_account_info(),
            from_ata: ctx.accounts.taker_nft_ata.to_account_info(),
            to: maker.to_account_info(),
            to_ata: ctx.accounts.maker_nft_ata.to_account_info(),
            mint: taker_mint_nft.to_account_info(),
            signer: taker.to_account_info(),
            auth_rules: ctx.accounts.auth_rules.clone(),
            auth_rules_program: ctx.accounts.auth_rules_program.to_account_info(),
            destination_token_record: ctx.accounts.destination_token_record.clone(),
            metadata_program: ctx.accounts.metadata_program.to_account_info(),
            nft_master_edition: ctx.accounts.nft_master_edition.clone(),
            nft_metadata: ctx.accounts.nft_metadata.to_account_info(),
            owner_token_record: ctx.accounts.owner_token_record.clone(),
            sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            ata_program: ctx.accounts.ata_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        }).unwrap();
        msg!(
            "transfer {:?} of {:?} from {:?} to {:?} ",
            1,
            taker_mint_nft.key(),
            ctx.accounts.taker_nft_ata.key(),
            ctx.accounts.maker_nft_ata.key()
        );
        invoke(&transfert_nft_data.instruction, &transfert_nft_data.account_infos)?;

        //Calculate amount to send
        if found_bid_to_accept.amount.is_positive() {
            // msg!("bid_to_add.amount {:?}", found_bid_to_accept);

            //transfer Maker Token
            let transfert_token_data = get_transfer_token_ix(
                found_bid_to_accept.amount.unsigned_abs(),
                SendToken {
                    from: taker.to_account_info(),
                    from_ata: ctx.accounts.taker_token_ata.clone(),
                    to: maker.clone(),
                    to_ata: ctx.accounts.maker_token_ata.clone(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                }
            ).unwrap();

            msg!(
                "transfer {:?} of {:?} from {:?} to {:?} ",
                found_bid_to_accept.amount.unsigned_abs(),
                swap_data_account.payment_mint,
                ctx.accounts.maker.key(),
                swap_data_account.key()
            );
            invoke(&transfert_token_data.instruction, &transfert_token_data.account_infos)?;
        }

        Ok(())
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

    pub fn add_bid(ctx: Context<AddBid>, bid_to_add: Bid) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;
        let maker = &mut ctx.accounts.maker;

        require_keys_eq!(swap_data_account.maker, maker.key(), MYERROR::NotMaker);
        require!(swap_data_account.taker.is_none(), MYERROR::UnexpectedState);

        // search for duplicate
        let duplicate_index = swap_data_account.bids
            .iter()
            .position(|item_search| { item_search.collection == bid_to_add.collection })
            .unwrap_or_else(|| 0);
        msg!("duplicate_index {:?}", duplicate_index);
        msg!(
            "swap_data_account.bids[duplicate_index] {:?} Vs bid_to_add {:?}",
            swap_data_account.bids[duplicate_index],
            bid_to_add
        );

        if
            duplicate_index == 0 &&
            !swap_data_account.bids[duplicate_index].collection.eq(&bid_to_add.collection)
        {
            msg!("ADD");
            swap_data_account.bids.push(bid_to_add.clone());
        } else {
            msg!("CHANGE");

            swap_data_account.bids[duplicate_index].amount = bid_to_add.amount;
        }

        // check if have to send more?
        let token_balance = ctx.accounts.swap_data_account_token_ata.amount;
        msg!("bid_to_add.amount {:?}", bid_to_add.amount);
        msg!("token_balance {:?}", token_balance);

        let mut amount_to_send: i64 = bid_to_add.amount
            .checked_add_unsigned(token_balance)
            .unwrap();
        msg!("amount_to_send {:?}", amount_to_send);

        if bid_to_add.amount.is_positive() && !token_balance.eq(&0) {
            amount_to_send = token_balance as i64;
            msg!("amount_to_send forced to  {:?}", amount_to_send);
        }

        if amount_to_send.is_negative() {
            let transfert_token_data = get_transfer_token_ix(
                amount_to_send.unsigned_abs(),
                SendToken {
                    from: ctx.accounts.maker.to_account_info(),
                    from_ata: ctx.accounts.maker_token_ata.clone(),
                    to: swap_data_account.to_account_info(),
                    to_ata: ctx.accounts.swap_data_account_token_ata.clone(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                }
            ).unwrap();

            msg!(
                "transfer {:?} of {:?} from {:?} to {:?} ",
                amount_to_send,
                swap_data_account.payment_mint,
                ctx.accounts.maker.key(),
                swap_data_account.key()
            );

            invoke(&transfert_token_data.instruction, &transfert_token_data.account_infos)?;
        } else {
            let transfert_token_data = get_transfer_token_ix(
                amount_to_send.unsigned_abs(),
                SendToken {
                    from: swap_data_account.to_account_info(),
                    from_ata: ctx.accounts.swap_data_account_token_ata.clone(),
                    to: ctx.accounts.maker.to_account_info(),
                    to_ata: ctx.accounts.maker_token_ata.clone(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                }
            ).unwrap();

            msg!(
                "transfer back {:?} of {:?} from {:?} to {:?} ",
                amount_to_send,
                swap_data_account.payment_mint,
                swap_data_account.key(),
                ctx.accounts.maker.key()
            );

            invoke_signed(
                &transfert_token_data.instruction,
                &transfert_token_data.account_infos,
                &[&[&swap_data_account.seed.as_bytes()[..]]]
            )?;
        }

        msg!("bid_to_add {:?} ", bid_to_add);

        Ok(())
    }
    pub fn override_time(ctx: Context<OverrideTime>, duration: i64) -> Result<()> {
        require!(ctx.accounts.swap_data_account.accepted_bid.is_none(), MYERROR::IncorrectState);
        ctx.accounts.swap_data_account.end_time = Clock::get()?.unix_timestamp + duration;
        Ok(())
    }
    // //claim
    //     let meta = get_metadata(ctx.accounts.nft_metadata.clone());
    // let creators = meta.creators.clone().unwrap();
    // creators.iter().for_each(|creator| {});
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

#[derive(Accounts)]
#[instruction(mint: Pubkey)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = maker,
        seeds = [&get_seed_buffer(maker.key(), mint)],
        bump,
        space = SwapData::LEN
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account( mut )]
    maker: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction()]
pub struct MakeSwap<'info> {
    #[account(
        mut,
        seeds = [&swap_data_account.seed.as_bytes()], 
        bump,
        constraint = maker.key().eq(&swap_data_account.maker)  @ MYERROR::NotMaker
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: in constraints
    #[account(
        mut,
        constraint = swap_data_account_nft_ata.owner == swap_data_account.to_account_info().key()  @ MYERROR::IncorrectOwner
    )]
    swap_data_account_nft_ata: Account<'info, TokenAccount>,
    /// CHECK: inside the function Logic
    #[account( mut )]
    swap_data_account_token_ata: Account<'info, TokenAccount>,

    #[account( mut )]
    maker: Signer<'info>,
    #[account(
        mut,
        constraint = maker_nft_ata.mint == mint_nft.key() @ MYERROR::MintIncorrect,
        constraint = maker_nft_ata.owner == maker.key() @ MYERROR::IncorrectOwner
    )]
    maker_nft_ata: Account<'info, TokenAccount>,
    /// CHECK: inside the function Logic
    #[account( mut,
            constraint = (
                maker_token_ata.owner.eq(maker.key) 
                || maker_token_ata.key().eq(maker.key)
            )  @ MYERROR::IncorrectOwner
        )]
    maker_token_ata: Account<'info, TokenAccount>,
    #[account(constraint = maker_nft_ata.mint == mint_nft.key()  @ MYERROR::MintIncorrect)]
    mint_nft: Account<'info, Mint>,
    mint_token: Account<'info, Mint>,

    /// CHECK: in constraints
    #[account( mut,
        seeds =[
            b"metadata".as_ref(),
            metadata_program.key().as_ref(),
            mint_nft.key().as_ref()],
        bump,
        owner = metadata_program.key() @ MYERROR::IncorrectMetadata,
        seeds::program = metadata_program.key()
    )]
    nft_metadata: AccountInfo<'info>,
    /// CHECK: in constraints
    nft_master_edition: Option<AccountInfo<'info>>,
    /// CHECK: in constraints
    #[account( mut )]
    owner_token_record: Option<AccountInfo<'info>>,
    /// CHECK: in constraints
    #[account( mut )]
    destination_token_record: Option<AccountInfo<'info>>,
    /// CHECK: account checked in CPI
    auth_rules: Option<AccountInfo<'info>>,
    system_program: Program<'info, System>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&MPL_TOKEN_METADATA_ID) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = sysvar_instructions.key().eq(&SYSVAR_INSTRUCTIONS_ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = ata_program.key().eq(&SPL_ASSOCIATED_TOKEN_ACCOUNT_ID)  @ MYERROR::IncorrectSplAta)]
    ata_program: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    auth_rules_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction()]
pub struct TakeSwap<'info> {
    #[account(
        mut,
        seeds = [&swap_data_account.seed.as_bytes()],
        bump,
        constraint = maker.key().eq(&swap_data_account.maker)  @ MYERROR::NotMaker
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: Maker
    maker: AccountInfo<'info>,
    #[account( mut, constraint = maker_nft_ata.owner == maker.key()  @ MYERROR::IncorrectOwner )]
    maker_nft_ata: Account<'info, TokenAccount>,
    #[account( mut, constraint = maker_nft_ata.owner == maker.key()  @ MYERROR::IncorrectOwner )]
    maker_token_ata: Account<'info, TokenAccount>,

    #[account( mut )]
    taker: Signer<'info>,
    #[account(
        mut,
        constraint = taker_nft_ata.mint == mint_token.key() @ MYERROR::MintIncorrect,
        constraint = taker_nft_ata.owner == taker.key() @ MYERROR::IncorrectOwner
    )]
    taker_nft_ata: Account<'info, TokenAccount>,
    #[account( mut,
        constraint = taker_token_ata.mint == mint_token.key() @ MYERROR::MintIncorrect,
        constraint = taker_token_ata.owner.eq(taker.key) @ MYERROR::IncorrectOwner
    )]
    taker_token_ata: Account<'info, TokenAccount>,

    taker_mint_nft: Account<'info, Mint>,
    #[account(constraint = mint_token.key().eq(&swap_data_account.payment_mint)  @ MYERROR::MintIncorrect)]
    mint_token: Account<'info, Mint>,

    /// CHECK: in constraints
    #[account( mut,
        seeds =[
            b"metadata".as_ref(),
            metadata_program.key().as_ref(),
            taker_mint_nft.key().as_ref()],
        bump,
        owner = metadata_program.key() @ MYERROR::IncorrectMetadata,
        seeds::program = metadata_program.key()
    )]
    nft_metadata: AccountInfo<'info>,
    /// CHECK: in constraints
    nft_master_edition: Option<AccountInfo<'info>>,
    /// CHECK: in constraints
    #[account( mut )]
    owner_token_record: Option<AccountInfo<'info>>,
    /// CHECK: in constraints
    #[account( mut )]
    destination_token_record: Option<AccountInfo<'info>>,
    /// CHECK: account checked in CPI
    auth_rules: Option<AccountInfo<'info>>,
    system_program: Program<'info, System>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&MPL_TOKEN_METADATA_ID) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(constraint = sysvar_instructions.key().eq(&SYSVAR_INSTRUCTIONS_ID) @ MYERROR::IncorrectSysvar)]
    sysvar_instructions: AccountInfo<'info>,
    token_program: Program<'info, Token>,
    /// CHECK: in constraints
    #[account(constraint = ata_program.key().eq(&SPL_ASSOCIATED_TOKEN_ACCOUNT_ID)  @ MYERROR::IncorrectSplAta)]
    ata_program: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    auth_rules_program: AccountInfo<'info>,
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

#[derive(Accounts)]
#[instruction()]
pub struct AddBid<'info> {
    #[account(
        mut,
        seeds = [&swap_data_account.seed.as_bytes()],
        bump,
        constraint = swap_data_account.maker == maker.key() @ MYERROR::NotMaker
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: inside the function Logic
    #[account( mut )]
    swap_data_account_token_ata: Account<'info, TokenAccount>,

    #[account( mut )]
    maker: Signer<'info>,
    /// CHECK: inside the function Logic
    #[account( mut,
        constraint = (
            maker_token_ata.owner.eq(maker.key) 
            || maker_token_ata.key().eq(maker.key)
        )  @ MYERROR::IncorrectOwner
    )]
    maker_token_ata: Account<'info, TokenAccount>,

    /// CHECK: in constraints
    mint_token: Account<'info, Mint>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction()]
pub struct OverrideTime<'info> {
    #[account(
        mut,
        seeds = [&swap_data_account.seed.as_bytes()], 
        bump,
        constraint = maker.key().eq(&swap_data_account.maker)  @ MYERROR::NotMaker
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account( mut )]
    maker: Signer<'info>,
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

#[account]
#[derive(Default)]
pub struct SwapData {
    pub maker: Pubkey, // maker Pubkey
    pub maker_nft_mint: Pubkey, // mint of the maker's NFT

    pub bids: Vec<Bid>, // List of possible bids Taker can accept

    pub taker: Option<Pubkey>, // taker Pubkey
    pub taker_nft_mint: Option<Pubkey>, // mint of the taker's NFT
    pub accepted_bid: Option<Bid>, // index of accepted bid when Taker accepted one

    pub end_time: i64, // time until when the trade valid

    pub royalties_paid: bool, // if royalties have been paid

    pub payment_mint: Pubkey, // token accepted for payment
    pub seed: String, // String to initialize PDA's seed
}
impl SwapData {
    const LEN: usize =
        8 + //Base
        1 + //Royalties
        8 + //i64
        (25 + 1) * Bid::LEN + //bid len
        32 + //seed
        32 * 5; //Pubkey
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug, PartialEq)]
pub struct Bid {
    collection: Pubkey, // collection of the NFT aker wants to get
    amount: i64, // amount of tokens to transfer. amount < 0 maker gives
    fees: Fees, // Object fith amounts that need to be sent for paying fees
}
impl Bid {
    const LEN: usize = 32 + 8 + Fees::LEN;
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug, PartialEq)]
pub struct Fees {
    maker_neoswap_fee: u64,
    taker_neoswap_fee: u64, // Destinary : hardcoded

    taker_royalties: u64,
    maker_royalties: u64, // Destinary : Creators
}
impl Fees {
    const LEN: usize = 8 * 4;
}

// pub enum TradeStatus {
//     Initializing = 0,
//     Initialized = 1,
//     Accepted = 2,
//     Closed = 3,
//     Canceling = 100,
// }
// impl TradeStatus {
//     pub fn from_u8(status: u8) -> TradeStatus {
//         match status {
//             0 => TradeStatus::Initializing,
//             1 => TradeStatus::Initialized,
//             2 => TradeStatus::Accepted,
//             3 => TradeStatus::Closed,

//             100 => TradeStatus::Canceling,

//             _ => panic!("Invalid Proposal Status"),
//         }
//     }

//     pub fn to_u8(&self) -> u8 {
//         match self {
//             TradeStatus::Initializing => 0,
//             TradeStatus::Initialized => 1,
//             TradeStatus::Accepted => 2,
//             TradeStatus::Closed => 3,

//             TradeStatus::Canceling => 100,
//         }
//     }
// }
pub struct SendPNft<'info> {
    from: AccountInfo<'info>,
    from_ata: AccountInfo<'info>,
    to: AccountInfo<'info>,
    to_ata: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    signer: AccountInfo<'info>,
    nft_metadata: AccountInfo<'info>,
    nft_master_edition: Option<AccountInfo<'info>>,
    owner_token_record: Option<AccountInfo<'info>>,
    destination_token_record: Option<AccountInfo<'info>>,
    auth_rules_program: AccountInfo<'info>,
    auth_rules: Option<AccountInfo<'info>>,
    metadata_program: AccountInfo<'info>,
    sysvar_instructions: AccountInfo<'info>,
    ata_program: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
}
pub struct SendToken<'info> {
    from: AccountInfo<'info>,
    from_ata: Account<'info, TokenAccount>,

    to: AccountInfo<'info>,
    to_ata: Account<'info, TokenAccount>,

    // mint: Account<'info, Mint>,

    token_program: AccountInfo<'info>,
}
pub struct TransferData<'a> {
    instruction: Instruction,
    account_infos: Vec<AccountInfo<'a>>,
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

fn get_seed_buffer(maker: Pubkey, mint: Pubkey) -> Vec<u8> {
    let seed_str = get_seed_string(maker, mint);
    msg!("seed_str {:?}", seed_str);
    seed_str.as_bytes().to_vec()
}
fn get_seed_string(maker: Pubkey, mint: Pubkey) -> String {
    maker.to_string().split_at(16).0.to_owned() + mint.to_string().split_at(16).0
}
fn get_metadata(nft_metadata: AccountInfo) -> Metadata {
    Metadata::safe_deserialize(&nft_metadata.data.borrow()).unwrap()
}
fn get_transfer_token_ix(lamport: u64, ctx: SendToken<'_>) -> Result<TransferData<'_>> {
    let instruction = spl_token::instruction::transfer(
        &ctx.token_program.key,
        &ctx.from_ata.key(),
        &ctx.to_ata.key(),
        &ctx.from.key(),
        &[&ctx.from.key()],
        lamport
    )?;

    let account_infos = [
        ctx.token_program.to_account_info(),
        ctx.from.to_account_info(),
        ctx.to.to_account_info(),
        ctx.from_ata.to_account_info(),
        ctx.to_ata.to_account_info(),
    ].to_vec();

    Ok(TransferData {
        instruction,
        account_infos,
    })
}
fn create_p_nft_instruction(amount: u64, ctx: SendPNft<'_>) -> Result<TransferData<'_>> {
    let mut transfer_builder = TransferBuilder::new();
    transfer_builder
        .token(ctx.from_ata.key())
        .token_owner(ctx.from.key())
        .destination_token(ctx.to_ata.key())
        .destination_owner(ctx.to.key())
        .mint(ctx.mint.key())
        .metadata(ctx.nft_metadata.key())
        .authority(ctx.from.key())
        .payer(ctx.signer.key())
        .system_program(ctx.system_program.key())
        .sysvar_instructions(ctx.sysvar_instructions.key())
        .spl_token_program(ctx.token_program.key())
        .spl_ata_program(ctx.ata_program.key());

    // creating vase transfer info
    let mut account_infos: Vec<AccountInfo<'_>> = vec![
        ctx.from.to_account_info(),
        ctx.from_ata.to_account_info(),
        ctx.to.to_account_info(),
        ctx.to_ata.to_account_info(),
        ctx.mint.to_account_info(),
        ctx.nft_metadata.to_account_info(),
        ctx.signer.to_account_info(),
        ctx.system_program.to_account_info(),
        ctx.sysvar_instructions.to_account_info(),
        ctx.token_program.to_account_info(),
        ctx.ata_program.to_account_info(),
        ctx.metadata_program.to_account_info()
    ];

    let metadata: Metadata = Metadata::safe_deserialize(
        &ctx.nft_metadata.to_account_info().data.borrow()
    )?;
    if matches!(metadata.token_standard, Some(TokenStandard::ProgrammableNonFungible)) {
        msg!("pnft");

        let nft_master_edition = ctx.nft_master_edition.unwrap();
        let owner_token_record = ctx.owner_token_record.unwrap();
        let destination_token_record = ctx.destination_token_record.unwrap();
        let auth_rules = ctx.auth_rules.unwrap();

        transfer_builder
            .edition(Some(nft_master_edition.key()))
            .token_record(Some(owner_token_record.key()))
            .destination_token_record(Some(destination_token_record.key()))
            .authorization_rules_program(Some(ctx.auth_rules_program.key()))
            .authorization_rules(Some(auth_rules.key()));

        account_infos.push(nft_master_edition);
        account_infos.push(owner_token_record);
        account_infos.push(destination_token_record);
        account_infos.push(ctx.auth_rules_program.to_account_info());
        account_infos.push(auth_rules);
    }

    let instruction = transfer_builder
        .transfer_args(TransferArgs::V1 {
            amount,
            authorization_data: None,
        })
        .instruction();

    Ok(TransferData {
        instruction,
        account_infos,
    })
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

#[error_code]
pub enum MYERROR {
    /// NS ERRORS 6000-6999

    /// Data errors 6000-6099
    #[msg("List of Bids is empty")]
    EmptyBids,
    #[msg("Incorrect Mint")]
    MintIncorrect,
    #[msg("Given seed length is Incorrect")]
    SeedLengthIncorrect,
    #[msg("The status given is not correct")]
    UnexpectedState,

    /// User errors 6100-6199
    #[msg("wrong signer, only maker can perform this action")]
    NotMaker,
    #[msg("wrong address for Taker")]
    NotTaker,
    #[msg("Owner Given is incorrect")]
    IncorrectOwner,

    /// Item errors 6200-6299
    #[msg("Collection is unverified")]
    UnVerifiedCollection,
    #[msg("Collection doesnt't match givent mint collection")]
    IncorrectCollection,

    /// Pda errors 6300-6399
    #[msg("The item you're trying to add already exists in the SDA")]
    AlreadyExist,
    #[msg("Cannot find the account")]
    CannotFindAccount,
    #[msg("Swap is not in the adequate state to perform this action")]
    IncorrectState,
    #[msg("Cannot find the given collection in the SDA")]
    CollectionNotFound,
    #[msg("Swap already accepted")]
    AlreadyTaken,

    /// Program errors 6900-6999
    #[msg("Incorrect Sysvar Instruction Program")]
    IncorrectSysvar = 900,
    #[msg("Incorrect Metadata Program")]
    IncorrectMetadata = 901,
    #[msg("Incorrect Token ATA Program")]
    IncorrectSplAta = 902,

    // #[msg("User not part of the trade")]
    // UserNotPartOfTrade,

    // AmountIncorrect,
    // #[msg("User shouldn't be sending funds")]
    // ShouldntSend,
    // #[msg("Nothing was found in the program to be sent to the swap or you")]
    // NoSend,
    // #[msg("Sum of trade isn't null")]
    // SumNotNull,
    // #[msg("Not ready for claim")]
    // NotReady,
    // #[msg("Given data isn't fitting")]
    // SeedLengthIncorrect,
    // #[msg("wrong system program Id passed")]
    // NotSystemProgram,
    // #[msg("wrong token program Id passed")]
    // NotTokenProgram,
    // #[msg("wrong Pda program Id passed")]
    // NotPda,
    // #[msg("wrong bump")]
    // NotBump,

    // #[msg("owner checks unsuccessfuls")]
    // InvalidAccountData,
    // #[msg("Incorrect init data length")]
    // IncorrectLength,
    // #[msg("Not enough funds")]
    // NotEnoughFunds,

    // #[msg("Missing some account passed")]
    // RemainingAccountNotFound,
    // #[msg("Failed to build the instruction")]
    // InstructionBuilderFailed,
    // #[msg("This is not a programmableNft")]
    // NotProgrammableNft,

    // #[msg("Incorrect token reccord account")]
    // IncorrectTokenRecord,
    // #[msg("Not authorized to perform this action")]
    // NotAuthorized,
    // #[msg("PreSeed has too many character (max: 32)")]
    // PreSeedTooLong,
    // #[msg("The list of token accepted for payment is empty")]
    // NoAcceptedPaymentGiven,
}
