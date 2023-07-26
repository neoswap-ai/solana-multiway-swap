import { Connection, PublicKey } from '@solana/web3.js';
import { utils } from '@project-serum/anchor';
import { TOKEN_METADATA_PROGRAM, METAPLEX_AUTH_RULES } from '../utils.neoSwap/const.neoSwap';
// import { Metaplex } from "@metaplex-foundation/js";
const { Metaplex } = require('@metaplex-foundation/js');

export async function findNftDataAndMetadataAccount(Data: { connection: Connection; mint: PublicKey }) {
    // console.log(preSeed);
    try {
        const metaplex = new Metaplex(Data.connection);
        const nft = await metaplex.nfts().findByMint({ mintAddress: Data.mint });
        // console.log('nftData', nft);
        const AccountData = PublicKey.findProgramAddressSync(
            [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM.toBuffer(), Data.mint.toBuffer()],
            TOKEN_METADATA_PROGRAM
        );
        return {
            tokenStandard: nft.tokenStandard,
            metadataAddress: nft.metadataAddress,
            metadataBump: AccountData[1],
        };
    } catch (error) {
        throw error;
    }
}

export function findNftMasterEdition(Data: { mint: PublicKey }) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM.toBuffer(), Data.mint.toBuffer(), Buffer.from('edition')],
        TOKEN_METADATA_PROGRAM
    )[0];
}

export function findUserTokenRecord(Data: { mint: PublicKey; userMintAta: PublicKey }) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM.toBuffer(),
            Data.mint.toBuffer(),
            Buffer.from('token_record'),
            Data.userMintAta.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM
    )[0];
}

export async function findRuleSet(Data: { connection: Connection; mint: PublicKey }): Promise<string> {
    const metaplex = new Metaplex(Data.connection);
    const nft = await metaplex.nfts().findByMint({ mintAddress: Data.mint });
    // console.log("nft", nft.programmableConfig.ruleSet);
    if (nft.programmableConfig?.ruleSet) {
        return nft.programmableConfig.ruleSet.toString();
    } else {
        return METAPLEX_AUTH_RULES.toString();
    }
}
