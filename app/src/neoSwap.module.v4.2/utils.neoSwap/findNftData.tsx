import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_METADATA_PROGRAM } from './const.neoSwap';
import { Metaplex } from '@metaplex-foundation/js';
import { TokenStandard, Uses } from '@metaplex-foundation/mpl-token-metadata';

export async function findNftData(Data: {
    connection: Connection;
    mint: PublicKey;
}): Promise<{ tokenStandard: TokenStandard | null; metadataAddress: PublicKey; metadataBump: number }> {
    const metaplex = new Metaplex(Data.connection);
    const nft = await metaplex.nfts().findByMint({ mintAddress: Data.mint });
    // console.log('nftData', nft);
    const AccountData = PublicKey.findProgramAddressSync(
        [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM.toBuffer(), Data.mint.toBuffer()],
        TOKEN_METADATA_PROGRAM
    );
    return { tokenStandard: nft.tokenStandard, metadataAddress: nft.metadataAddress, metadataBump: AccountData[1] };
}
