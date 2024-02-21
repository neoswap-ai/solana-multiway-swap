use ::{
    anchor_lang::{
        prelude::*,
        solana_program::{
            system_program::ID as SYSTEM_PROGRAM_ID,
            instruction::Instruction,
            program::invoke,
            pubkey::Pubkey,
            sysvar::ID as SYSVAR_INSTRUCTIONS_ID,
        },
    },
    anchor_spl::token::{ Mint, spl_token, Token, TokenAccount },
    mpl_token_metadata::{
        accounts::Metadata,
        instructions::TransferBuilder,
        programs::MPL_TOKEN_METADATA_ID,
        types::{ TokenStandard, TransferArgs },
    },
    spl_associated_token_account::ID as SPL_ASSOCIATED_TOKEN_ACCOUNT_ID,
};

declare_id!("2vumtPDSVo3UKqYYxMVbDaQz1K4foQf6A31KiUaii1M7");
// declare_id!("Et2RutKNHzB6XmsDXUGnDHJAGAsJ73gdHVkoKyV79BFY");
// declare_id!("HCg7NKnvWwWZdLXqDwZdjn9RDz9eLDYuSAcUHqeC1vmH");
// declare_id!("EU5zoiRSvPE5k1Fy49UJZvPMBKxzatdBGFJ11XPFD42Z");
// declare_id!("CtZHiWNnLu5rQuTN3jo7CmYDR8Wns6qXHn7taPvmnACp");

///@title List of function to manage NeoSwap's multi-items swaps
#[program]
pub mod neo_swap {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, _seed: Vec<u8>, sent_data: SwapData) -> Result<()> {
        require_eq!(sent_data.seed.len(), 32, MYERROR::SeedLengthIncorrect);

        // get Mint's metadata
        let collection = get_metadata(ctx.accounts.nft_metadata.to_account_info())
            .unwrap()
            .collection.unwrap();

        // Check if the collection is verified
        require!(collection.verified, MYERROR::UnVerifiedCollection);

        // Check if the collection is the same as the one provided
        require_keys_eq!(sent_data.maker_collection, collection.key, MYERROR::IncorrectCollection);

        // Write according Data into Swap's PDA
        ctx.accounts.swap_data_account.maker = ctx.accounts.signer.key();
        ctx.accounts.swap_data_account.maker_mint = ctx.accounts.mint.key();
        ctx.accounts.swap_data_account.maker_collection = sent_data.maker_collection;

        ctx.accounts.swap_data_account.bids = [].to_vec();

        // ctx.accounts.swap_data_account.taker = SYSTEM_PROGRAM_ID;
        // ctx.accounts.swap_data_account.accepted_bid_index = -1;

        ctx.accounts.swap_data_account.seed = sent_data.seed;
        ctx.accounts.swap_data_account.accepted_payement = sent_data.accepted_payement;
        Ok(())
    }

    pub fn deposit_initial_bid(ctx: Context<DepositInitialBid>, bid_to_add: Bid) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;
        let maker = &ctx.accounts.maker;
        let mint_nft = &ctx.accounts.mint_nft;

        let collection = get_metadata(ctx.accounts.nft_metadata.to_account_info())
            .unwrap()
            .collection.unwrap();

        require!(swap_data_account.accepted_bid_index.is_none(), MYERROR::UnexpectedState);
        require_keys_eq!(swap_data_account.maker, maker.key(), MYERROR::NotMaker);
        require_keys_eq!(swap_data_account.maker_mint, mint_nft.key(), MYERROR::MintIncorrect);
        require_keys_eq!(
            swap_data_account.maker_collection,
            collection.key,
            MYERROR::MintIncorrect
        );
        if ctx.accounts.mint_token.is_some() {
            let mint_token = ctx.accounts.mint_token.clone().unwrap();

            require_keys_eq!(
                swap_data_account.accepted_payement,
                mint_token.key(),
                MYERROR::MintIncorrect
            );
        } else {
            require_keys_eq!(
                swap_data_account.accepted_payement,
                SYSTEM_PROGRAM_ID,
                MYERROR::MintIncorrect
            );
        }

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
            auth_rules: ctx.accounts.auth_rules.to_account_info(),
            auth_rules_program: ctx.accounts.auth_rules_program.to_account_info(),
            destination_token_record: ctx.accounts.destination_token_record.to_account_info(),
            metadata_program: ctx.accounts.metadata_program.to_account_info(),
            nft_master_edition: ctx.accounts.nft_master_edition.to_account_info(),
            nft_metadata: ctx.accounts.nft_metadata.to_account_info(),
            owner_token_record: ctx.accounts.owner_token_record.to_account_info(),
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

        //transfer Maker Token
        if bid_to_add.amount.is_negative() {
            let transfert_token_data = get_transfer_token_ix(
                bid_to_add.amount.unsigned_abs(),
                SendToken {
                    from: ctx.accounts.maker.to_account_info(),
                    from_ata: ctx.accounts.maker_token_ata.clone(),
                    to: swap_data_account.to_account_info(),
                    to_ata: ctx.accounts.swap_data_account_token_ata.clone(),
                    mint: ctx.accounts.mint_token.clone(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                }
            ).unwrap();

            msg!(
                "transfer {:?} of {:?} from {:?} to {:?} ",
                bid_to_add.amount.unsigned_abs(),
                swap_data_account.accepted_payement,
                ctx.accounts.maker.key(),
                swap_data_account.key()
            );
            invoke(&transfert_token_data.instruction, &transfert_token_data.account_infos)?;
        }

        Ok(())
    }

    pub fn add_bid(ctx: Context<AddBid>, bid_to_add: Bid) -> Result<()> {
        let swap_data_account = &mut ctx.accounts.swap_data_account;
        let maker = &mut ctx.accounts.maker;

        require_keys_eq!(swap_data_account.maker, maker.key(), MYERROR::NotMaker);

        // search for duplicate
        let duplicate_index = swap_data_account.bids
            .iter()
            .position(|item_search| {
                item_search.collection == bid_to_add.collection &&
                    item_search.amount == bid_to_add.amount
            })
            .unwrap_or_else(|| 0);

        require!(
            duplicate_index != 0 &&
                !swap_data_account.bids[duplicate_index].collection.eq(&bid_to_add.collection),
            MYERROR::AlreadyExist
        );

        // check if have to send more?
        let mut token_balance = maker.lamports();
        if !swap_data_account.accepted_payement.eq(&SYSTEM_PROGRAM_ID) {
            let maker_token_ata = ctx.accounts.maker_token_ata
                .clone()
                .expect(&MYERROR::CannotFindAccount.to_string())
                .to_account_info();
            token_balance = maker_token_ata.lamports();
        }
        msg!("token_balance {:?}", token_balance);

        if bid_to_add.amount.is_negative() && bid_to_add.amount.unsigned_abs().gt(&token_balance) {
            let amount_to_send = bid_to_add.amount
                .unsigned_abs()
                .checked_add(token_balance)
                .unwrap();

            let transfert_token_data = get_transfer_token_ix(amount_to_send, SendToken {
                from: ctx.accounts.maker.to_account_info(),
                from_ata: ctx.accounts.maker_token_ata.clone(),
                to: swap_data_account.to_account_info(),
                to_ata: ctx.accounts.swap_data_account_token_ata.clone(),
                mint: ctx.accounts.mint_token.clone(),
                token_program: ctx.accounts.token_program.to_account_info(),
            }).unwrap();
            msg!(
                "transfer {:?} of {:?} from {:?} to {:?} ",
                bid_to_add.amount.unsigned_abs(),
                swap_data_account.accepted_payement,
                ctx.accounts.maker.key(),
                swap_data_account.key()
            );
            invoke(&transfert_token_data.instruction, &transfert_token_data.account_infos)?;
        }

        msg!("bid_to_add {:?} ", bid_to_add);
        ctx.accounts.swap_data_account.bids.push(bid_to_add);

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, seeds = [&seed[..]], bump, space = SwapData::LEN)]
    swap_data_account: Box<Account<'info, SwapData>>,
    #[account(mut)]
    signer: Signer<'info>,
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
    mint: Account<'info, Mint>,
    system_program: Program<'info, System>,
    /// CHECK: in constraints
    #[account(constraint = metadata_program.key().eq(&MPL_TOKEN_METADATA_ID) @ MYERROR::IncorrectMetadata)]
    metadata_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(seed: Vec<u8>)]
pub struct AddBid<'info> {
    #[account(
        mut,
        seeds = [&seed[..]],
        bump,
        constraint = swap_data_account.maker == maker.key() @ MYERROR::NotMaker
    )]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: inside the function Logic
    #[account(mut)]
    swap_data_account_token_ata: Option<Account<'info, TokenAccount>>,

    #[account(mut)]
    maker: Signer<'info>,
    /// CHECK: inside the function Logic
    #[account(mut,
        constraint = (
            maker_token_ata.owner.eq(maker.key) 
            || maker_token_ata.key().eq(maker.key)
        )  @ MYERROR::IncorrectOwner
    )]
    maker_token_ata: Option<Account<'info, TokenAccount>>,

    /// CHECK: in constraints
    mint_token: Option<Account<'info, Mint>>,
    token_program: Program<'info, Token>,
}
// #[derive(Accounts)]
// #[instruction(seed: Vec<u8>)]
// pub struct ValidateInitialize<'info> {
//     #[account(
//         mut,
//         seeds = [&seed[..]],
//         bump,
//         constraint = swap_data_account.initializer == signer.key() @ MYERROR::NotMaker
//     )]
//     swap_data_account: Box<Account<'info, SwapData>>,
//     #[account(mut)]
//     signer: Signer<'info>,
// }

#[derive(Accounts)]
#[instruction()]
pub struct DepositInitialBid<'info> {
    #[account(mut,seeds = [&swap_data_account.seed], bump)]
    swap_data_account: Box<Account<'info, SwapData>>,
    /// CHECK: in constraints
    #[account(
        mut,
        constraint = swap_data_account_nft_ata.owner == swap_data_account.to_account_info().key()  @ MYERROR::IncorrectOwner
    )]
    swap_data_account_nft_ata: Account<'info, TokenAccount>,
    /// CHECK: inside the function Logic
    #[account(mut)]
    swap_data_account_token_ata: Option<Account<'info, TokenAccount>>,

    #[account(mut)]
    maker: Signer<'info>,
    #[account(
        mut,
        constraint = maker_nft_ata.mint == mint_nft.key() @ MYERROR::MintIncorrect,
        constraint = maker_nft_ata.owner == maker.key() @ MYERROR::IncorrectOwner
    )]
    maker_nft_ata: Account<'info, TokenAccount>,
    /// CHECK: inside the function Logic
    #[account(mut,
            constraint = (
                maker_token_ata.owner.eq(maker.key) 
                || maker_token_ata.key().eq(maker.key)
            )  @ MYERROR::IncorrectOwner
        )]
    maker_token_ata: Option<Account<'info, TokenAccount>>,
    #[account(constraint = maker_nft_ata.mint == mint_nft.key()  @ MYERROR::MintIncorrect)]
    mint_nft: Account<'info, Mint>,
    mint_token: Option<Account<'info, Mint>>,

    /// CHECK: in constraints
    #[account(mut,
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
    nft_master_edition: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(mut)]
    owner_token_record: AccountInfo<'info>,
    /// CHECK: in constraints
    #[account(mut)]
    destination_token_record: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    auth_rules: AccountInfo<'info>,
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

#[account]
#[derive(Default)]
pub struct SwapData {
    pub maker: Pubkey, // maker Pubkey
    pub maker_mint: Pubkey, // mint of the maker
    pub maker_collection: Pubkey, // collection of the maker

    pub bids: Vec<Bid>, // List of possible bids Taker can accept

    pub taker: Option<Pubkey>, // taker Pubkey
    pub accepted_bid_index: Option<i8>, // index of accepted bid if Taker accepted one

    pub accepted_payement: Pubkey, // token accepted for payment
    pub seed: Vec<u8>, // String to initialize PDA's seed
}
impl SwapData {
    const LEN: usize =
        8 + //Base
        25 * Bid::LEN + //bid len
        32 + //seed
        32 * 3; //Pubkey
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct Bid {
    collection: Pubkey, // Mint of the NFT. if item not NFT expected PublicKey should be system_program
    amount: i64, // amount of tokens or lamports to transfer. amount < 0 maker gives
}
impl Bid {
    const LEN: usize = 32 + 8;
}

pub enum TradeStatus {
    Initializing,
    Initialized,
    Accepted,
    Closed,
    Canceling,
}
impl TradeStatus {
    pub fn from_u8(status: u8) -> TradeStatus {
        match status {
            0 => TradeStatus::Initializing,
            1 => TradeStatus::Initialized,
            2 => TradeStatus::Accepted,
            3 => TradeStatus::Closed,

            100 => TradeStatus::Canceling,

            _ => panic!("Invalid Proposal Status"),
        }
    }

    pub fn to_u8(&self) -> u8 {
        match self {
            TradeStatus::Initializing => 0,
            TradeStatus::Initialized => 1,
            TradeStatus::Accepted => 2,
            TradeStatus::Closed => 3,

            TradeStatus::Canceling => 100,
        }
    }
}
pub struct SendPNft<'info> {
    from: AccountInfo<'info>,
    from_ata: AccountInfo<'info>,
    to: AccountInfo<'info>,
    to_ata: AccountInfo<'info>,
    mint: AccountInfo<'info>,
    signer: AccountInfo<'info>,
    nft_metadata: AccountInfo<'info>,
    nft_master_edition: AccountInfo<'info>,
    owner_token_record: AccountInfo<'info>,
    destination_token_record: AccountInfo<'info>,
    auth_rules_program: AccountInfo<'info>,
    auth_rules: AccountInfo<'info>,
    metadata_program: AccountInfo<'info>,
    sysvar_instructions: AccountInfo<'info>,
    ata_program: AccountInfo<'info>,
    token_program: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
}
pub struct SendToken<'info> {
    from: AccountInfo<'info>,
    from_ata: Option<Account<'info, TokenAccount>>,

    to: AccountInfo<'info>,
    to_ata: Option<Account<'info, TokenAccount>>,

    mint: Option<Account<'info, Mint>>,

    token_program: AccountInfo<'info>,
}
pub struct TransferData<'a> {
    instruction: Instruction,
    account_infos: Vec<AccountInfo<'a>>,
}

fn get_metadata(nft_metadata: AccountInfo) -> Result<Metadata> {
    let metadata: Metadata = Metadata::safe_deserialize(
        &nft_metadata.to_account_info().data.borrow()
    ).unwrap();
    Ok(metadata)
}
fn get_transfer_token_ix(lamport: u64, ctx: SendToken<'_>) -> Result<TransferData<'_>> {
    let instruction;
    let account_infos;

    if ctx.mint.is_none() {
        instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.from.key(),
            &ctx.to.key(),
            lamport
        );

        account_infos = [ctx.from.to_account_info(), ctx.to.to_account_info()].to_vec();
    } else {
        let from_ata = ctx.from_ata
            .expect(&MYERROR::CannotFindAccount.to_string())
            .to_account_info();
        let to_ata = ctx.to_ata.expect(&MYERROR::CannotFindAccount.to_string()).to_account_info();

        instruction = spl_token::instruction::transfer(
            &ctx.token_program.key,
            &from_ata.key(),
            &to_ata.key(),
            &ctx.from.key(),
            &[&ctx.from.key()],
            lamport
        )?;

        account_infos = [
            ctx.token_program.to_account_info(),
            ctx.from.to_account_info(),
            ctx.to.to_account_info(),
            from_ata,
            to_ata,
        ].to_vec();
    }
    let transfer_token_data = TransferData {
        instruction,
        account_infos: account_infos.to_vec(),
    };
    Ok(transfer_token_data)
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
        ctx.sysvar_instructions.to_account_info(),
        ctx.metadata_program.to_account_info()
    ];

    let metadata: Metadata = Metadata::safe_deserialize(
        &ctx.nft_metadata.to_account_info().data.borrow()
    )?;
    if matches!(metadata.token_standard, Some(TokenStandard::ProgrammableNonFungible)) {
        msg!("pnft");
        transfer_builder
            .edition(Some(ctx.nft_master_edition.key()))
            .token_record(Some(ctx.owner_token_record.key()))
            .destination_token_record(Some(ctx.destination_token_record.key()))
            .authorization_rules_program(Some(ctx.auth_rules_program.key()))
            .authorization_rules(Some(ctx.auth_rules.key()));

        account_infos.push(ctx.nft_master_edition.to_account_info());
        account_infos.push(ctx.owner_token_record.to_account_info());
        account_infos.push(ctx.destination_token_record.to_account_info());
        account_infos.push(ctx.auth_rules_program.to_account_info());
        account_infos.push(ctx.auth_rules.to_account_info());
    }

    let instruction = transfer_builder
        .transfer_args(TransferArgs::V1 {
            amount,
            authorization_data: None,
        })
        .instruction();

    let transfer_pnft_data = TransferData {
        instruction,
        account_infos,
    };

    Ok(transfer_pnft_data)
}

#[error_code]
pub enum MYERROR {
    /// NS ERRORS 8000-8999

    /// Data errors 8000-8099
    #[msg("List of Bids is empty")]
    EmptyBids,
    #[msg("Incorrect Mint")]
    MintIncorrect,
    #[msg("Given seed length is Incorrect")]
    SeedLengthIncorrect,
    #[msg("The status given is not correct")]
    UnexpectedState,

    /// User errors 8100-8199
    #[msg("wrong signer, only maker can perform this action")]
    NotMaker,
    #[msg("wrong address for Taker")]
    NotTaker,
    #[msg("Owner Given is incorrect")]
    IncorrectOwner,

    /// Item errors 8200-8299
    #[msg("Collection is unverified")]
    UnVerifiedCollection,
    #[msg("Collection doesnt't match givent mint collection")]
    IncorrectCollection,

    /// Pda errors 8300-8399
    #[msg("The item you're trying to add already exists in the SDA")]
    AlreadyExist,
    #[msg("Cannot find the account")]
    CannotFindAccount,
    /// Program errors 8900-8999
    #[msg("Incorrect Sysvar Instruction Program")]
    IncorrectSysvar,
    #[msg("Incorrect Metadata Program")]
    IncorrectMetadata,
    #[msg("Incorrect Token ATA Program")]
    IncorrectSplAta,

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
