import findOrCreateAta from '../../utils.neoSwap/findOrCreateAta.neoSwap';
import { BN, Program } from '@project-serum/anchor';
import {
    AccountMeta,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SystemProgram,
    TransactionInstruction,
    clusterApiUrl,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
    ConcurrentMerkleTreeAccount,
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from '@solana/spl-account-compression';
import { MPL_BUBBLEGUM_PROGRAM_ID } from '@metaplex-foundation/mpl-bubblegum';
// import {
//     METAPLEX_AUTH_RULES_PROGRAM,
//     SOLANA_SPL_ATA_PROGRAM_ID,
//     TOKEN_METADATA_PROGRAM,
//     authRules,
//     authRulesProgram,
//     splAssociatedTokenAccountProgramId,
// } from '../../utils.neoSwap/const.neoSwap';
// import { TokenStandard, Uses } from '@metaplex-foundation/mpl-token-metadata';

// import { findUserTokenRecord } from '../../utils.neoSwap/findUserTokenRecord';
// import { findNftMetadataAccount } from '../../utils.neoSwap/findNftMetadataAccount';
// import { findNftMasterEdition } from '../../utils.neoSwap/findNftMasterEdition';
// import { Metadata } from '@metaplex-foundation/js';
// import { findNftData } from '../../utils.neoSwap/findNftData';
// import { findNftDataAndMetadataAccount, findRuleSet } from '../../utils.neoSwap/getNftData';
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
export async function transferCnft(Data: {
    program: Program;
    signer: PublicKey;
    destinary: PublicKey;
    tokenId: PublicKey;
    // swapIdentity: SwapIdentity;
    // ataList: PublicKey[];
}): Promise<{ instructions: TransactionInstruction[] }> {
    let solanaUrl = clusterApiUrl('mainnet-beta');
    const treeDataReponse = await fetch(solanaUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'rpd-op-123',
            method: 'getAsset',
            params: {
                id: Data.tokenId.toString(),
            },
        }),
    });
    let treeData = (await treeDataReponse.json()).result;
    console.log('treeData Results', treeData);

    const treeProofResponse = await fetch(solanaUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'rpd-op-123',
            method: 'getAssetProof',
            params: {
                id: Data.tokenId.toString(),
            },
        }),
    });
    let treeProof = (await treeProofResponse.json()).result;

    console.log('treeProof Results', treeProof);

    // retrieve the merkle tree's account from the blockchain
    const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
        Data.program.provider.connection,
        new PublicKey(treeProof.tree_id)
    );
    console.log('treeAccount', treeAccount);

    // extract the needed values for our transfer instruction
    const treeAuthority = treeAccount.getAuthority();
    const canopyDepth = treeAccount.getCanopyDepth();

    console.log('treeAuthority', treeAuthority);
    console.log('canopyDepth', canopyDepth);

    const proofMeta: AccountMeta[] = treeProof.proof
        .slice(0, treeProof.proof.length - (!!canopyDepth ? canopyDepth : 0))
        .map((node: string) => ({
            pubkey: new PublicKey(node),
            isSigner: false,
            isWritable: false,
        }));
    console.log('proofMeta', proofMeta);
    // const proof = proofMeta.map((node: AccountMeta) => node.pubkey.toString());
    // console.log('proof', proof);

    // console.log('treeProof.root', treeProof.root);
    // console.log('treeData.data_hash', treeProof);
    // console.log('treeData.creator_hash', treeData.compression);

    let instructions = [];
    let root = new PublicKey(treeProof.root).toBytes();
    let dataHash = new PublicKey(treeData.compression.data_hash).toBytes();
    let creatorHash = new PublicKey(treeData.compression.creator_hash).toBytes();
    let nonce = new BN(treeData.compression.leaf_id);
    let index = new BN(treeData.compression.leaf_id);

    // console.log('nonce', nonce);
    console.log('args', root, dataHash, creatorHash, nonce, index);
    console.log(
        'accounts',
        '\nleafOwner:',
        Data.signer,
        '\nleafDelegate: ',
        Data.signer,
        '\ntreeAuthority',
        treeAuthority,
        ' \nmerkleTree:',
        treeProof.tree_id,
        ' \nnewLeafOwner:',
        Data.destinary,
        '\nlogWrapper:',
        SPL_NOOP_PROGRAM_ID,
        '\ncompressionProgram:',
        SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        '\nbubblegumProgram:',
        MPL_BUBBLEGUM_PROGRAM_ID,

        '\nsystemProgram:',
        SystemProgram.programId.toBase58(),
        ' \nanchorRemainingAccounts:',
        proofMeta
    );
    //@ts-ignore
    instructions.push(
        await Data.program.methods
            .transferCompressedNft(root, dataHash, creatorHash, nonce, index)
            .accounts({
                leafOwner: Data.signer,
                leafDelegate: Data.signer,
                treeAuthority,
                merkleTree: treeProof.tree_id,
                newLeafOwner: Data.destinary,
                logWrapper: SPL_NOOP_PROGRAM_ID,
                compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,

                // @ts-ignore
                systemProgram: SystemProgram.programId.toBase58(),
                // remainingAccounts: proof,
            })
            .remainingAccounts(proofMeta)
            .instruction()
    );
    // console.log("depositNftTx - seed", Data.swapIdentity.swapDataAccount_seed.toString());
    return { instructions };
}
// export default depositNft;
