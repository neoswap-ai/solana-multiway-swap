import findOrCreateAta from '../../utils.neoSwap/findOrCreateAta.neoSwap';
import { Program, web3 } from '@project-serum/anchor';
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
    TOKEN_METADATA_PROGRAM,
    authRules,
    authRulesProgram,
    splAssociatedTokenAccountProgramId,
} from '../../utils.neoSwap/const.neoSwap';
import { findNftMetadataAccount } from '../../utils.neoSwap/findNftMetadataAccount';
import { findNftMasterEdition } from '../../utils.neoSwap/findNftMasterEdition';
import { findUserTokenRecord } from '../../utils.neoSwap/findUserTokenRecord';

/**
 * @notice creates instruction for claiming a NFT Item for a user
 * @param {Program} program program linked to NeoSwap
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {PublicKey} user user that receives NFT
 * @param {PublicKey} mint mint addtress of the NFT to transfer
 * @param {PublicKey} swapDataAccount Swap's PDA
 * @param {Buffer} swapDataAccount_seed Seed linked to PDA
 * @param {number} swapDataAccount_bump Bump linked to PDA
 * @param {Array<PublicKey>} ataList list of ATA created until now
 * @return {TransactionInstruction[]}instruction => list of instruction created for claiming NFT
 * @return {PublicKey[]}mintAta => updated list of ATA created until now
 */
export async function claimNft(Data: {
    program: Program;
    signer: PublicKey;
    user: PublicKey;
    mint: PublicKey;
    swapDataAccount: PublicKey;
    swapDataAccount_seed: Buffer;
    swapDataAccount_bump: number;
    ataList: Array<PublicKey>;
}): Promise<{ instruction: TransactionInstruction[]; mintAta: PublicKey[] }> {
    let instruction: TransactionInstruction[] = [];
    let mintAta: PublicKey[] = [];

    const { mintAta: userMintAta, instruction: userMintAtaTx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.user,
        mint: Data.mint,
        signer: Data.signer,
    });
    mintAta.push(userMintAta);

    let addUserTx = true;
    Data.ataList.forEach((ata) => {
        if (ata.toString() === userMintAta.toString()) {
            addUserTx = false;
        }
    });
    if (userMintAtaTx && addUserTx) {
        userMintAtaTx.forEach((userMintAtaTxItem) => {
            instruction.push(userMintAtaTxItem);
        });
        console.log('createUserAta ClaimNft Tx Added');
    }

    const { mintAta: pdaMintAta, instruction: pdaMintAtaTx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.swapDataAccount,
        mint: Data.mint,
        signer: Data.signer,
    });
    mintAta.push(pdaMintAta);

    let addPdaTx = true;
    Data.ataList.forEach((ata) => {
        if (ata.toString() === pdaMintAta.toString()) {
            addPdaTx = false;
        }
    });
    if (pdaMintAtaTx && addPdaTx) {
        pdaMintAtaTx.forEach((pdaMintAtaTxItem) => {
            instruction.push(pdaMintAtaTxItem);
        });

        console.log('createPdaAta ClaimNft Tx Added');
    }

    const { adddress: nftMetadata, bump: nftMetadata_bump } = findNftMetadataAccount({ mint: Data.mint });
    console.log('nftMetadata', nftMetadata.toBase58());
    // console.log(((await Data.program.provider.connection.getAccountInfo(nftMetadata))?));

    // const tokenMetadata = programs.metadata.Metadata.findByOwnerV2(connection, walletPublicKey);

    // let res = await Metadata.daata().Metadata.fromAccountAddress(Data.program.provider.connection, nftMetadata);
    // Data.program.provider.connection.
    if (true) {
        ///if pNFT
        const { adddress: nftMasterEdition, bump: nftMasterEdition_bump } = findNftMasterEdition({ mint: Data.mint });
        // console.log('nftMasterEdition', nftMasterEdition.toBase58());
        const { adddress: ownerTokenRecord, bump: ownerTokenRecord_bump } = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: pdaMintAta,
        });
        // console.log('ownerTokenRecord', ownerTokenRecord.toBase58());
        const { adddress: destinationTokenRecord, bump: destinationTokenRecord_bump } = findUserTokenRecord({
            mint: Data.mint,
            userMintAta,
        });
        // console.log('destinationTokenRecord', destinationTokenRecord.toBase58());

        instruction.push(
            await Data.program.methods
                .claimNft(
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
                    user: Data.user,
                    signer: Data.signer,
                    itemFromDeposit: pdaMintAta,
                    itemToDeposit: userMintAta,
                    mint: Data.mint,
                    nftMetadata,
                    nftMasterEdition,
                    ownerTokenRecord,
                    destinationTokenRecord,
                    authRulesProgram,
                    authRules,
                })
                .instruction()
        );
    } else {
        instruction.push(
            await Data.program.methods
                .claimNft(Data.swapDataAccount_seed, Data.swapDataAccount_bump, nftMetadata_bump)
                .accounts({
                    systemProgram: SystemProgram.programId,
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                    splTokenProgram: TOKEN_PROGRAM_ID,
                    splAtaProgram: splAssociatedTokenAccountProgramId,
                    swapDataAccount: Data.swapDataAccount,
                    user: Data.user,
                    signer: Data.signer,
                    itemFromDeposit: pdaMintAta,
                    itemToDeposit: userMintAta,
                    mint: Data.mint,
                    nftMetadata,
                })
                .instruction()
        );
    }
    // const claimNftTx = await Data.program.methods
    //     .claimNft(Data.swapDataAccount_seed, Data.swapDataAccount_bump)
    //     .accounts({
    //         systemProgram: web3.SystemProgram.programId,
    //         tokenProgram: TOKEN_PROGRAM_ID,
    //         swapDataAccount: Data.swapDataAccount,
    //         user: Data.user,
    //         signer: Data.signer,
    //         itemFromDeposit: pdaMintAta,
    //         itemToDeposit: userMintAta,
    //     })
    //     .instruction();

    // instruction.push(claimNftTx);
    return { instruction, mintAta };
}

export default claimNft;
