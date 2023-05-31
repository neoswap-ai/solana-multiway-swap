import findOrCreateAta from '../../utils.neoSwap/findOrCreateAta.neoSwap';
import { Program } from '@project-serum/anchor';
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
    TOKEN_METADATA_PROGRAM,
    authRules,
    authRulesProgram,
    splAssociatedTokenAccountProgramId,
} from '../../utils.neoSwap/const.neoSwap';
import { TokenStandard, Uses } from '@metaplex-foundation/mpl-token-metadata';

import { findUserTokenRecord } from '../../utils.neoSwap/findUserTokenRecord';
import { findNftMetadataAccount } from '../../utils.neoSwap/findNftMetadataAccount';
import { findNftMasterEdition } from '../../utils.neoSwap/findNftMasterEdition';
import { Metadata } from '@metaplex-foundation/js';
import { findNftData } from '../../utils.neoSwap/findNftData';
// import from '@metaplex-foundation/js';

/**
 * @notice creates instruction for depositing a NFT Item
 * @param {Program} program program linked to NeoSwap
 * @param {PublicKey} signer user that sends NFT
 * @param {PublicKey} mint mint addtress of the NFT to transfer
 * @param {PublicKey} swapDataAccount Swap's PDA
 * @param {Buffer} swapDataAccount_seed Seed linked to PDA
 * @param {number} swapDataAccount_bump Bump linked to PDA
 * @param {Array<PublicKey>} ataList list of ATA created until now
 * @return {TransactionInstruction[]}instruction => list of instruction created for depositing NFT
 * @return {PublicKey[]}mintAta => updated list of ATA created until now
 */
export async function depositNft(Data: {
    program: Program;
    signer: PublicKey;
    mint: PublicKey;
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
    ataList: Array<PublicKey>;
}): Promise<{ instruction: TransactionInstruction[]; mintAta: PublicKey[] }> {
    let instruction: TransactionInstruction[] = [];
    let mintAta: PublicKey[] = [...Data.ataList];

    const { mintAta: userMintAta, instruction: ixCreateUserMintAta } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.signer,
        mint: Data.mint,
        signer: Data.signer,
    });

    let addUserTx = true;
    mintAta.forEach((ata) => {
        if (ata.equals(userMintAta)) {
            addUserTx = false;
        }
    });

    if (ixCreateUserMintAta && addUserTx) {
        console.log('CreateUserAta Deposit Tx added');
        ixCreateUserMintAta.forEach((ixCreateUserMintAtaItem) => {
            instruction.push(ixCreateUserMintAtaItem);
        });
        mintAta.push(userMintAta);
    }

    const { mintAta: pdaMintAta, instruction: ixCreatePdaMintAta } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.swapDataAccount,
        mint: Data.mint,
        signer: Data.signer,
    });

    let addPdaTx = true;
    mintAta.forEach((ata) => {
        if (ata.equals(pdaMintAta)) {
            addPdaTx = false;
        }
    });
    if (ixCreatePdaMintAta && addPdaTx) {
        console.log('CreatePdaAta Deposit Tx added');
        ixCreatePdaMintAta.forEach((ixCreatePdaMintAtaItem) => {
            instruction.push(ixCreatePdaMintAtaItem);
        });
        mintAta.push(pdaMintAta);
    }
    const {
        tokenStandard,
        metadataAddress: nftMetadata,
        metadataBump: nftMetadata_bump,
    } = await findNftData({
        connection: Data.program.provider.connection,
        mint: Data.mint,
    });
    // console.log('findData', nftData);
    // const { bump: nftMetadata_bump } = findNftMetadataAccount({ mint: Data.mint });
    console.log('nftMetadata', nftMetadata.toBase58());
    console.log('tokenStandard', tokenStandard);

    if (tokenStandard === TokenStandard.ProgrammableNonFungible) {
        ///if New metaplex standard
        const { adddress: nftMasterEdition, bump: nftMasterEdition_bump } = findNftMasterEdition({ mint: Data.mint });
        console.log('nftMasterEdition', nftMasterEdition.toBase58());
        const { adddress: ownerTokenRecord, bump: ownerTokenRecord_bump } = findUserTokenRecord({
            mint: Data.mint,
            userMintAta,
        });
        console.log('ownerTokenRecord', ownerTokenRecord.toBase58());
        const { adddress: destinationTokenRecord, bump: destinationTokenRecord_bump } = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: pdaMintAta,
        });
        // console.log('destinationTokenRecord', destinationTokenRecord.toBase58());
        // console.log('swapDataAccount_seed', Data.swapDataAccount_seed);
        // console.log('swapDataAccount_bump', Data.swapDataAccount_bump);
        // console.log('nftMetadata_bump', nftMetadata_bump);
        // console.log('nftMasterEdition_bump', nftMasterEdition_bump);
        // console.log('ownerTokenRecord_bump', ownerTokenRecord_bump);
        // console.log('destinationTokenRecord_bump', destinationTokenRecord_bump);
        // console.log('TOKEN_METADATA_PROGRAM', TOKEN_METADATA_PROGRAM);
        // console.log('SYSVAR_INSTRUCTIONS_PUBKEY', SYSVAR_INSTRUCTIONS_PUBKEY);
        // console.log('TOKEN_PROGRAM_ID', TOKEN_PROGRAM_ID);
        // console.log('splAssociatedTokenAccountProgramId', splAssociatedTokenAccountProgramId);
        // console.log('Data.swapDataAccount', Data.swapDataAccount);
        // console.log('Data.signer', Data.signer);
        // console.log('userMintAta', userMintAta);
        // console.log('Data.mint', Data.mint);
        // console.log('nftMetadata', nftMetadata);
        // console.log('pdaMintAta', pdaMintAta);
        // console.log('nftMasterEdition', nftMasterEdition);
        // console.log('ownerTokenRecord', ownerTokenRecord);
        // console.log('destinationTokenRecord', destinationTokenRecord);
        // console.log('authRulesProgram', authRulesProgram);
        // console.log('authRules', authRules);

        instruction.push(
            await Data.program.methods
                .depositNft(
                    Data.swapDataAccount_seed,
                    Data.swapDataAccount_bump,
                    // nftMetadata_seed,
                    nftMetadata_bump,
                    nftMasterEdition_bump,
                    ownerTokenRecord_bump,
                    destinationTokenRecord_bump
                )
                .accounts({
                    systemProgram: SystemProgram.programId.toString(),
                    metadataProgram: TOKEN_METADATA_PROGRAM.toString(),
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toString(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toString(),
                    splAtaProgram: splAssociatedTokenAccountProgramId.toString(),
                    swapDataAccount: Data.swapDataAccount.toString(),
                    signer: Data.signer.toString(),
                    itemFromDeposit: userMintAta.toString(),
                    mint: Data.mint.toString(),
                    nftMetadata: nftMetadata.toString(),
                    itemToDeposit: pdaMintAta.toString(),
                    nftMasterEdition: nftMasterEdition.toString(),
                    ownerTokenRecord: ownerTokenRecord.toString(),
                    destinationTokenRecord: destinationTokenRecord.toString(),
                    authRulesProgram: authRulesProgram.toString(),
                    authRules: authRules.toString(),
                })
                .instruction()
        );
    } else {
        console.log('2');
        const { adddress: nftMasterEdition, bump: nftMasterEdition_bump } = findNftMasterEdition({ mint: Data.mint });
        console.log('nftMasterEdition', nftMasterEdition.toBase58());
        const { adddress: ownerTokenRecord, bump: ownerTokenRecord_bump } = findUserTokenRecord({
            mint: Data.mint,
            userMintAta,
        });
        console.log('ownerTokenRecord', ownerTokenRecord.toBase58());
        const { adddress: destinationTokenRecord, bump: destinationTokenRecord_bump } = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: pdaMintAta,
        });
        instruction.push(
            await Data.program.methods

                .depositNft(
                    Data.swapDataAccount_seed,
                    Data.swapDataAccount_bump,
                    nftMetadata_bump,
                    nftMasterEdition_bump,
                    ownerTokenRecord_bump,
                    destinationTokenRecord_bump
                )
                .accounts({
                    systemProgram: SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                    splTokenProgram: TOKEN_PROGRAM_ID,
                    splAtaProgram: splAssociatedTokenAccountProgramId,
                    swapDataAccount: Data.swapDataAccount,
                    signer: Data.signer,
                    itemFromDeposit: userMintAta,
                    mint: Data.mint,
                    nftMetadata,
                    itemToDeposit: pdaMintAta,
                    // nftMasterEdition,
                    // ownerTokenRecord,
                    // destinationTokenRecord,
                    // authRulesProgram,
                    // authRules,
                    nftMasterEdition: Data.program.programId,
                    ownerTokenRecord: Data.program.programId,
                    destinationTokenRecord: Data.program.programId,
                    authRulesProgram: Data.program.programId,
                    authRules: Data.program.programId,
                })
                .instruction()
        );
    }
    console.log('from: ', userMintAta.toBase58(), '\nto: ', pdaMintAta.toBase58(), '\nmint: ', Data.mint.toBase58());
    return { instruction, mintAta };
}
export default depositNft;
