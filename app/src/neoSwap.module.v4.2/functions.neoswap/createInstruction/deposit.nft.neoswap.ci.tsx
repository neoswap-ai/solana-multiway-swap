import findOrCreateAta from '../../utils.neoSwap/findOrCreateAta.neoSwap';
import { Program } from '@project-serum/anchor';
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
    METAPLEX_AUTH_RULES_PROGRAM,
    SOLANA_SPL_ATA_PROGRAM_ID,
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
import { SwapIdentity } from '@biboux.neoswap/neo-swap-npm';
import { findNftDataAndMetadataAccount, findRuleSet } from '../../utils.neoSwap/getNftData';
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
    swapIdentity: SwapIdentity;
    ataList: PublicKey[];
}): Promise<{ instructions: TransactionInstruction[]; mintAta: PublicKey[] }> {
    let instructions = [];
    let mintAta = [];
    console.log('swapId Pk', Data.swapIdentity);

    const { mintAta: userAta, instruction: userAtaIx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.signer,
        mint: Data.mint,
        signer: Data.signer,
        // isFrontEndFunction: false,
    });
    if (userAtaIx && !Data.ataList.includes(userAta)) {
        instructions.push(...userAtaIx);
        mintAta.push(userAta);
        console.log('createUserAta CancelNft Tx Added', userAtaIx);
    } else {
        console.log('user Ata skipped', userAta.toBase58());
    }

    const { mintAta: pdaAta, instruction: pdaAtaIx } = await findOrCreateAta({
        connection: Data.program.provider.connection,
        owner: Data.swapIdentity.swapDataAccount_publicKey,
        mint: Data.mint,
        signer: Data.signer,
        // isFrontEndFunction: false,
    });
    // console.log("pdaAtaIx", pdaAta.toBase58());
    if (pdaAtaIx && !Data.ataList.includes(pdaAta)) {
        instructions.push(...pdaAtaIx);
        mintAta.push(pdaAta);
        console.log('createPdaAta DepositNft Tx Added', pdaAta.toBase58());
    } else {
        console.log('pda Ata skipped', pdaAta.toBase58());
    }

    const {
        tokenStandard,
        metadataAddress: nftMetadata,
        metadataBump: nftMetadata_bump,
    } = await findNftDataAndMetadataAccount({
        connection: Data.program.provider.connection,
        mint: Data.mint,
    });

    if (tokenStandard === TokenStandard.ProgrammableNonFungible) {
        ///if New metaplex standard
        const { adddress: nftMasterEdition } = findNftMasterEdition({
            mint: Data.mint,
        });
        // console.log('nftMasterEdition', nftMasterEdition.toBase58());

        const { adddress: ownerTokenRecord } = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: userAta,
        });
        // console.log("ownerTokenRecord", ownerTokenRecord.toBase58());

        const { adddress: destinationTokenRecord } = findUserTokenRecord({
            mint: Data.mint,
            userMintAta: pdaAta,
        });
        // console.log('destinationTokenRecord', destinationTokenRecord.toBase58());

        const authRules = await findRuleSet({
            connection: Data.program.provider.connection,
            mint: Data.mint,
        });
        instructions.push(
            await Data.program.methods
                .depositNft(
                    Data.swapIdentity.swapDataAccount_seed
                    // Data.swapIdentity.swapDataAccount_bump,
                    // nftMetadata_bump
                )
                .accounts({
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                    signer: Data.signer.toBase58(),
                    itemFromDeposit: userAta.toBase58(),
                    mint: Data.mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    itemToDeposit: pdaAta.toBase58(),
                    nftMasterEdition: nftMasterEdition.toBase58(),
                    ownerTokenRecord: ownerTokenRecord.toBase58(),
                    destinationTokenRecord: destinationTokenRecord.toBase58(),
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                    authRules,
                })
                .instruction()
        );
        // console.log("depositNftTx - seed", Data.swapIdentity.swapDataAccount_seed.toString());
    } else {
        instructions.push(
            await Data.program.methods
                .depositNft(
                    Data.swapIdentity.swapDataAccount_seed,
                    // Data.swapIdentity.swapDataAccount_bump,
                    // nftMetadata_bump
                )
                .accounts({
                    systemProgram: SystemProgram.programId.toBase58(),
                    metadataProgram: TOKEN_METADATA_PROGRAM,
                    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY.toBase58(),
                    splTokenProgram: TOKEN_PROGRAM_ID.toBase58(),
                    splAtaProgram: SOLANA_SPL_ATA_PROGRAM_ID,
                    swapDataAccount: Data.swapIdentity.swapDataAccount_publicKey.toBase58(),
                    signer: Data.signer.toBase58(),
                    itemFromDeposit: userAta.toBase58(),
                    mint: Data.mint.toBase58(),
                    nftMetadata: nftMetadata.toBase58(),
                    itemToDeposit: pdaAta.toBase58(),
                    nftMasterEdition: Data.signer.toBase58(),
                    ownerTokenRecord: Data.signer.toBase58(),
                    destinationTokenRecord: Data.signer.toBase58(),
                    authRulesProgram: METAPLEX_AUTH_RULES_PROGRAM,
                    authRules: Data.signer.toBase58(),
                })
                .instruction()
        );
    }
    console.log('from: ', userAta.toBase58(), '\nto: ', pdaAta.toBase58(), '\nmint: ', Data.mint.toBase58());
    return { instructions, mintAta };
}
export default depositNft;
