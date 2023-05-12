import { Program, utils, Wallet } from '@project-serum/anchor';
import {
    Keypair,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    Signer,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import { TokenStandard, Uses } from '@metaplex-foundation/mpl-token-metadata';
import * as beetSolana from '@metaplex-foundation/beet-solana';
// import { createInitializeV2Instruction } from '@metaplex-foundation/mpl-candy-machine-core';
import * as web3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import * as beet from '@metaplex-foundation/beet';

import { appendTransactionToArray } from '../../utils.neoSwap/appendTransactionToArray.neosap';
import { convertAllTransaction } from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
import { TradeStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SplTokenAccountsCoder } from '@project-serum/anchor/dist/cjs/coder/spl-token/accounts';
import { SplAssociatedTokenAccountsCoder } from '@project-serum/anchor/dist/cjs/coder/spl-associated-token/accounts';
import { splAssociatedTokenAccountProgramId } from '../../utils.neoSwap/const.neoSwap';

import { findMetadataPda, walletAdapterIdentity } from '@metaplex-foundation/js';
import { createCreateMetadataAccountV2Instruction, DataV2 } from '@metaplex-foundation/mpl-token-metadata';
import * as anchor from '@project-serum/anchor';
import {
    AccountLayout,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    getAssociatedTokenAddress,
    getMinimumBalanceForRentExemptMint,
    MINT_SIZE,
} from '@solana/spl-token';
import { ComputeBudgetProgram, sendAndConfirmRawTransaction, Connection } from '@solana/web3.js';
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber } from '@metaplex-foundation/js';
const DEVNET_POLICY_ALL = new PublicKey('6Huqrb4xxmmNA4NufYdgpmspoLmjXFd3qEfteCddLgSz');
const PROGRAM_ID = new PublicKey('ocp4vWUzA2z2XMYJ3QhM9vWdyoyoQwAFJhRdVTbvo9E');
// Use the RPC endpoint of your choice.

export type DynamicRoyaltyPriceLinear = {
    priceMint: beet.COption<web3.PublicKey>;
    startPrice: beet.bignum;
    endPrice: beet.bignum;
    startMultiplierBp: number;
    endMultiplierBp: number;
};
export const dynamicRoyaltyPriceLinearBeet = new beet.FixableBeetArgsStruct<DynamicRoyaltyPriceLinear>(
    [
        ['priceMint', beet.coption(beetSolana.publicKey)],
        ['startPrice', beet.u64],
        ['endPrice', beet.u64],
        ['startMultiplierBp', beet.u16],
        ['endMultiplierBp', beet.u16],
    ],
    'DynamicRoyaltyPriceLinear'
);
export const dynamicRoyaltyBeet = new beet.FixableBeetArgsStruct<DynamicRoyalty>(
    [
        ['version', beet.u8],
        ['kind', beet.u8],
        ['overrideRoyaltyBp', beet.coption(beet.u16)],
        ['kindPriceLinear', beet.coption(dynamicRoyaltyPriceLinearBeet)],
        ['reserved0', beet.uniformFixedSizeArray(beet.u8, 32)],
        ['reserved1', beet.uniformFixedSizeArray(beet.u8, 32)],
        ['reserved2', beet.uniformFixedSizeArray(beet.u8, 32)],
        ['reserved3', beet.uniformFixedSizeArray(beet.u8, 32)],
    ],
    'DynamicRoyalty'
);
/**
 * @category userTypes
 * @category generated
 */

export const initPolicyArgBeet = new beet.FixableBeetArgsStruct<InitPolicyArg>(
    [
        ['jsonRule', beet.coption(beet.utf8String)],
        ['dynamicRoyalty', beet.coption(dynamicRoyaltyBeet)],
    ],
    'InitPolicyArg'
);

export const createOCP = async (Data: {
    program: Program;
    signer: Keypair;
    // connection: Connection;
    // wallet: anchor.Wallet;
    // policy: DEVNET_POLICY_ALL;
}) => {
    let policy = DEVNET_POLICY_ALL;
    const metaplex = new Metaplex(Data.program.provider.connection);
    metaplex.use(walletAdapterIdentity(Data.signer));

    const mintKeypair = new Keypair();
    const targetTokenAccount = await getAssociatedTokenAddress(mintKeypair.publicKey, Data.signer.publicKey);

    const tx: Transaction = await createNewMintTransaction(
        Data.program.provider.connection,
        Data.signer,
        mintKeypair,
        Data.signer.publicKey,
        Data.signer.publicKey
    );

    tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: LARGER_COMPUTE_UNIT }),
        createWrapInstruction({
            mint: mintKeypair.publicKey,
            policy,
            freezeAuthority: Data.signer.publicKey,
            mintAuthority: Data.signer.publicKey,
            mintState: findMintStatePk(mintKeypair.publicKey),
            from: Data.signer.publicKey,
            instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            cmtProgram: CMT_PROGRAM,
            metadata: findMetadataPda(mintKeypair.publicKey),
        }),
        createInitAccountInstruction({
            policy,
            freezeAuthority: findFreezeAuthorityPk(policy),
            mint: mintKeypair.publicKey,
            metadata: findMetadataPda(mintKeypair.publicKey),
            mintState: findMintStatePk(mintKeypair.publicKey),
            from: Data.signer.publicKey,
            fromAccount: targetTokenAccount,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            cmtProgram: CMT_PROGRAM,
            payer: Data.signer.publicKey,
        }),
        ocpCreateMintToInstruction({
            policy,
            freezeAuthority: findFreezeAuthorityPk(policy),
            mint: mintKeypair.publicKey,
            metadata: findMetadataPda(mintKeypair.publicKey),
            mintState: findMintStatePk(mintKeypair.publicKey),
            from: Data.signer.publicKey,
            fromAccount: targetTokenAccount,
            instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            cmtProgram: CMT_PROGRAM,
            payer: Data.signer.publicKey,
        })
    );
    tx.feePayer = Data.signer.publicKey;
    tx.recentBlockhash = (await Data.program.provider.connection.getLatestBlockhash()).blockhash;
    tx.partialSign(mintKeypair);
    new Wallet(Data.signer).signTransaction(tx)
    // tx.partialSign(mintKeypair);

    try {
        const sig = await sendAndConfirmRawTransaction(Data.program.provider.connection, tx.serialize());
        // if (!Data.program.provider.send) throw '';
        // const sig = await Data.program.provider.send(tx);
        console.log('hash', sig);
        return [mintKeypair.publicKey, targetTokenAccount];
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export default createOCP;

const createNewMintTransaction = async (
    connection: Connection,
    payer: Keypair,
    mintKeypair: Keypair,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey
) => {
    //Get the minimum lamport balance to create a new account and avoid rent payments
    const requiredBalance = await getMinimumBalanceForRentExemptMint(connection);
    //metadata account associated with mint
    const metadataPDA = findMetadataPda(mintKeypair.publicKey);

    const ON_CHAIN_METADATA = {
        name: 'xyzname',
        symbol: 'xyz',
        uri: 'example.com',
        sellerFeeBasisPoints: 500,
        creators: [{ address: Keypair.generate().publicKey, verified: false, share: 100 }],
        collection: null,
        uses: null,
    } as DataV2;

    const createNewTokenTransaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: MINT_SIZE,
            lamports: requiredBalance,
            programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
            mintKeypair.publicKey, //Mint Address
            0, //Number of Decimals of New mint
            mintAuthority, //Mint Authority
            freezeAuthority, //Freeze Authority
            TOKEN_PROGRAM_ID
        ),
        createCreateMetadataAccountV2Instruction(
            {
                metadata: metadataPDA,
                mint: mintKeypair.publicKey,
                mintAuthority: mintAuthority,
                payer: payer.publicKey,
                updateAuthority: mintAuthority,
            },
            {
                createMetadataAccountArgsV2: {
                    data: ON_CHAIN_METADATA,
                    isMutable: true,
                },
            }
        )
    );

    return createNewTokenTransaction;
};

let tokenAccountRent = 0;

export const getTokenAccountRent = async (conn: Connection) => {
    if (tokenAccountRent) {
        return tokenAccountRent;
    }
    tokenAccountRent = await conn.getMinimumBalanceForRentExemption(AccountLayout.span);
    return tokenAccountRent;
};

export const createPolicyFixture = async (conn: Connection, payer: Keypair) => {
    const uuid = Keypair.generate().publicKey;
    const policy = findPolicyPk(uuid);
    const jsonRule = JSON.stringify({
        events: [],
        conditions: {
            or: [
                { field: 'action', operator: 'string_not_equals', value: 'transfer' },
                {
                    and: [
                        {
                            field: 'program_ids',
                            operator: 'string_does_not_contain_any',
                            value: [
                                'aaaa111111111111111111111111',
                                'bbbb111111111111111111111111',
                                'cccc111111111111111111111111',
                            ],
                        },
                        {
                            or: [
                                {
                                    field: 'to',
                                    operator: 'string_not_equals',
                                    value: '11111111111111111111111111111111',
                                },
                                {
                                    field: 'metadata/name',
                                    operator: 'string_has_substring',
                                    value: '(winner)',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    });
    const dr = createDynamicRoyaltyStruct({
        startMultiplierBp: 10000,
        endMultiplierBp: 0,
        startPrice: new anchor.BN(0),
        endPrice: new anchor.BN(5 * web3.LAMPORTS_PER_SOL),
    });
    const ix = createInitPolicyInstruction(
        { policy, uuid, authority: payer.publicKey },
        { arg: { jsonRule, dynamicRoyalty: dr } }
    );
    await process_tx(conn, [ix], [payer]);
    return policy;
};

export const LARGER_COMPUTE_UNIT = 1_400_000;
export const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({ units: LARGER_COMPUTE_UNIT });

export const CMT_PROGRAM = new PublicKey('CMTQqjzH6Anr9XcPVt73EFDTjWkJWPzH7H6DtvhHcyzV');

export const findPolicyPk = (uuid: PublicKey) => {
    return PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('policy'), uuid.toBuffer()], PROGRAM_ID)[0];
};

export const findMintStatePk = (mint: PublicKey) => {
    return PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('mint_state'), mint.toBuffer()], PROGRAM_ID)[0];
};

export const findFreezeAuthorityPk = (policy: PublicKey) => {
    return PublicKey.findProgramAddressSync([policy.toBuffer()], CMT_PROGRAM)[0];
};

export const createDynamicRoyaltyStruct = ({
    startPrice,
    endPrice,
    startMultiplierBp,
    endMultiplierBp,
}: {
    startPrice: anchor.BN;
    endPrice: anchor.BN;
    startMultiplierBp: number;
    endMultiplierBp: number;
}): DynamicRoyalty => {
    const dynamicRoyalty = {
        version: 0,
        kind: 0,
        overrideRoyaltyBp: null,
        kindPriceLinear: {
            priceMint: null,
            startPrice,
            endPrice,
            startMultiplierBp,
            endMultiplierBp,
        },
        reserved0: new Array(32).fill(0),
        reserved1: new Array(32).fill(0),
        reserved2: new Array(32).fill(0),
        reserved3: new Array(32).fill(0),
    };
    return dynamicRoyalty;
};

export const parsePriceLinearDynamicRoyaltyStruct = (jsonStr: string) => {
    if (jsonStr === '' || jsonStr === 'null') {
        return null;
    }

    const { startPrice, endPrice, startMultiplierBp, endMultiplierBp } = JSON.parse(jsonStr);
    return createDynamicRoyaltyStruct({
        startPrice: new anchor.BN(startPrice),
        endPrice: new anchor.BN(endPrice),
        startMultiplierBp: Number(startMultiplierBp),
        endMultiplierBp: Number(endMultiplierBp),
    });
};

export const process_tx = async (
    conn: Connection,
    ixs: TransactionInstruction[],
    signers: Keypair[]
): Promise<string> => {
    const tx = new Transaction();
    tx.feePayer = signers[0].publicKey;
    tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
    tx.add(...ixs);
    tx.partialSign(...signers);
    try {
        const sig = await conn.sendRawTransaction(tx.serialize());
        await conn.confirmTransaction(sig);
        return sig;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export function createWrapInstruction(
    accounts: WrapInstructionAccounts,
    programId = new web3.PublicKey('ocp4vWUzA2z2XMYJ3QhM9vWdyoyoQwAFJhRdVTbvo9E')
) {
    const [data] = wrapStruct.serialize({
        instructionDiscriminator: wrapInstructionDiscriminator,
    });
    const keys: web3.AccountMeta[] = [
        {
            pubkey: accounts.policy,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.freezeAuthority,
            isWritable: false,
            isSigner: true,
        },
        {
            pubkey: accounts.mintAuthority,
            isWritable: false,
            isSigner: true,
        },
        {
            pubkey: accounts.mint,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.metadata,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.mintState,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.from,
            isWritable: true,
            isSigner: true,
        },
        {
            pubkey: accounts.tokenProgram ?? splToken.TOKEN_PROGRAM_ID,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.cmtProgram,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.instructions,
            isWritable: false,
            isSigner: false,
        },
    ];

    const ix = new web3.TransactionInstruction({
        programId,
        keys,
        data,
    });
    return ix;
}
export type WrapInstructionAccounts = {
    policy: web3.PublicKey;
    freezeAuthority: web3.PublicKey;
    mintAuthority: web3.PublicKey;
    mint: web3.PublicKey;
    metadata: web3.PublicKey;
    mintState: web3.PublicKey;
    from: web3.PublicKey;
    tokenProgram?: web3.PublicKey;
    systemProgram?: web3.PublicKey;
    cmtProgram: web3.PublicKey;
    instructions: web3.PublicKey;
};

export const wrapInstructionDiscriminator = [178, 40, 10, 189, 228, 129, 186, 140];

export const wrapStruct = new beet.BeetArgsStruct<{
    instructionDiscriminator: number[] /* size: 8 */;
}>([['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]], 'WrapInstructionArgs');

export function createInitAccountInstruction(
    accounts: InitAccountInstructionAccounts,
    programId = new web3.PublicKey('ocp4vWUzA2z2XMYJ3QhM9vWdyoyoQwAFJhRdVTbvo9E')
) {
    const [data] = initAccountStruct.serialize({
        instructionDiscriminator: initAccountInstructionDiscriminator,
    });
    const keys: web3.AccountMeta[] = [
        {
            pubkey: accounts.policy,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.freezeAuthority,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.mint,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.metadata,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.mintState,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.payer,
            isWritable: true,
            isSigner: true,
        },
        {
            pubkey: accounts.from,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.fromAccount,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.tokenProgram ?? splToken.TOKEN_PROGRAM_ID,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.associatedTokenProgram,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.cmtProgram,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.instructions,
            isWritable: false,
            isSigner: false,
        },
    ];

    const ix = new web3.TransactionInstruction({
        programId,
        keys,
        data,
    });
    return ix;
}
export type InitAccountInstructionAccounts = {
    policy: web3.PublicKey;
    freezeAuthority: web3.PublicKey;
    mint: web3.PublicKey;
    metadata: web3.PublicKey;
    mintState: web3.PublicKey;
    payer: web3.PublicKey;
    from: web3.PublicKey;
    fromAccount: web3.PublicKey;
    tokenProgram?: web3.PublicKey;
    systemProgram?: web3.PublicKey;
    associatedTokenProgram: web3.PublicKey;
    cmtProgram: web3.PublicKey;
    instructions: web3.PublicKey;
};

export const initAccountInstructionDiscriminator = [169, 188, 158, 199, 9, 151, 101, 125];

export const initAccountStruct = new beet.BeetArgsStruct<{
    instructionDiscriminator: number[] /* size: 8 */;
}>([['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]], 'InitAccountInstructionArgs');

export function createInitPolicyInstruction(
    accounts: InitPolicyInstructionAccounts,
    args: InitPolicyInstructionArgs,
    programId = new web3.PublicKey('ocp4vWUzA2z2XMYJ3QhM9vWdyoyoQwAFJhRdVTbvo9E')
) {
    const [data] = initPolicyStruct.serialize({
        instructionDiscriminator: initPolicyInstructionDiscriminator,
        ...args,
    });
    const keys: web3.AccountMeta[] = [
        {
            pubkey: accounts.policy,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.uuid,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.authority,
            isWritable: true,
            isSigner: true,
        },
        {
            pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
            isWritable: false,
            isSigner: false,
        },
    ];

    const ix = new web3.TransactionInstruction({
        programId,
        keys,
        data,
    });
    return ix;
}

export type InitPolicyInstructionAccounts = {
    policy: web3.PublicKey;
    uuid: web3.PublicKey;
    authority: web3.PublicKey;
    systemProgram?: web3.PublicKey;
};

export const initPolicyInstructionDiscriminator = [45, 234, 110, 100, 209, 146, 191, 86];

export type InitPolicyInstructionArgs = {
    arg: InitPolicyArg;
};
/**
 * @category Instructions
 * @category InitPolicy
 * @category generated
 */
export const initPolicyStruct = new beet.FixableBeetArgsStruct<
    InitPolicyInstructionArgs & {
        instructionDiscriminator: number[] /* size: 8 */;
    }
>(
    [
        ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
        ['arg', initPolicyArgBeet],
    ],
    'InitPolicyInstructionArgs'
);
export type InitPolicyArg = {
    jsonRule: beet.COption<string>;
    dynamicRoyalty: beet.COption<DynamicRoyalty>;
};

/**
 * @category userTypes
 * @category generated
 */

export type DynamicRoyalty = {
    version: number;
    kind: number;
    overrideRoyaltyBp: beet.COption<number>;
    kindPriceLinear: beet.COption<DynamicRoyaltyPriceLinear>;
    reserved0: number[] /* size: 32 */;
    reserved1: number[] /* size: 32 */;
    reserved2: number[] /* size: 32 */;
    reserved3: number[] /* size: 32 */;
};

/**
 * @category userTypes
 * @category generated
 */

export type MintToInstructionAccounts = {
    policy: web3.PublicKey;
    freezeAuthority: web3.PublicKey;
    mint: web3.PublicKey;
    metadata: web3.PublicKey;
    mintState: web3.PublicKey;
    payer: web3.PublicKey;
    from: web3.PublicKey;
    fromAccount: web3.PublicKey;
    tokenProgram?: web3.PublicKey;
    systemProgram?: web3.PublicKey;
    cmtProgram: web3.PublicKey;
    instructions: web3.PublicKey;
};

export const mintToInstructionDiscriminator = [241, 34, 48, 186, 37, 179, 123, 192];
export const mintToStruct = new beet.BeetArgsStruct<{
    instructionDiscriminator: number[] /* size: 8 */;
}>([['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]], 'MintToInstructionArgs');

export function ocpCreateMintToInstruction(
    accounts: MintToInstructionAccounts,
    programId = new web3.PublicKey('ocp4vWUzA2z2XMYJ3QhM9vWdyoyoQwAFJhRdVTbvo9E')
) {
    const [data] = mintToStruct.serialize({
        instructionDiscriminator: mintToInstructionDiscriminator,
    });
    const keys: web3.AccountMeta[] = [
        {
            pubkey: accounts.policy,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.freezeAuthority,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.mint,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.metadata,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.mintState,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.payer,
            isWritable: true,
            isSigner: true,
        },
        {
            pubkey: accounts.from,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.fromAccount,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: accounts.tokenProgram ?? splToken.TOKEN_PROGRAM_ID,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.cmtProgram,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: accounts.instructions,
            isWritable: false,
            isSigner: false,
        },
    ];

    const ix = new web3.TransactionInstruction({
        programId,
        keys,
        data,
    });
    return ix;
}
