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
    // return { adddress: AccountData[0], bump: AccountData[1] };
    return { tokenStandard: nft.tokenStandard, metadataAddress: nft.metadataAddress, metadataBump: AccountData[1] };

    // {
    //     model: 'sft',
    //     updateAuthorityAddress: PublicKey [PublicKey(ATq3ZVkaKHvAUt18Epw9EYdWb7BwBrc6RJvBLThUaGN9)] {
    //       _bn: <BN: 8c989b682d0aeeedfd1d4ce18303f6414cb173995ff878bbed97741ad558d4be>
    //     },
    //     json: {
    //       name: 'QuickNode Pixel',
    //       description: 'Pixel infrastructure for everyone!',
    //       image: 'https://arweave.net/toDD51CZzdD_8LxJjrELwfXqGE0MlO_3P_GlUBu1Kpo',
    //       attributes: [ [Object], [Object], [Object] ],
    //       properties: { files: [Array] }
    //     },
    //     jsonLoaded: true,
    //     name: 'name',
    //     symbol: 'QNPIX',
    //     uri: 'https://arweave.net/yIgHNXiELgQqW8QIbFM9ibVV37jhvfyW3mFcZGRX-PA',
    //     isMutable: true,
    //     primarySaleHappened: false,
    //     sellerFeeBasisPoints: 500,
    //     editionNonce: 255,
    //     creators: [
    //       {
    //         address: [PublicKey [PublicKey(ATq3ZVkaKHvAUt18Epw9EYdWb7BwBrc6RJvBLThUaGN9)]],
    //         verified: true,
    //         share: 100
    //       }
    //     ],
    //     tokenStandard: 1,
    //     collection: null,
    //     collectionDetails: null,
    //     uses: null,
    //     programmableConfig: null,
    //     address: PublicKey [PublicKey(D8Gpn8CQJyoT4PbnPVUxZQdnmFJosaoFBLMbzvxNiuX9)] {
    //       _bn: <BN: b42933650d844052575530327cc41998654b8b9cb20ba44703934a135277e1fc>
    //     },
    //     metadataAddress: Pda [PublicKey(7G4H6S5JdSH44MWtSv1trpEXt1z1BC8hD8ZvYautDjjE)] {
    //       _bn: <BN: 5d018a1fe55905f7a607d7f1a24b00b9c0172237da25c021d21f6c048bf66ec9>,
    //       bump: 255
    //     },
    //     mint: {
    //       model: 'mint',
    //       address: PublicKey [PublicKey(D8Gpn8CQJyoT4PbnPVUxZQdnmFJosaoFBLMbzvxNiuX9)] {
    //         _bn: <BN: b42933650d844052575530327cc41998654b8b9cb20ba44703934a135277e1fc>
    //       },
    //       mintAuthorityAddress: PublicKey [PublicKey(ATq3ZVkaKHvAUt18Epw9EYdWb7BwBrc6RJvBLThUaGN9)] {
    //         _bn: <BN: 8c989b682d0aeeedfd1d4ce18303f6414cb173995ff878bbed97741ad558d4be>
    //       },
    //       freezeAuthorityAddress: PublicKey [PublicKey(ATq3ZVkaKHvAUt18Epw9EYdWb7BwBrc6RJvBLThUaGN9)] {
    //         _bn: <BN: 8c989b682d0aeeedfd1d4ce18303f6414cb173995ff878bbed97741ad558d4be>
    //       },
    //       decimals: 0,
    //       supply: { basisPoints: <BN: 6>, currency: [Object] },
    //       isWrappedSol: false,
    //       currency: { symbol: 'QNPIX', decimals: 0, namespace: 'spl-token' }
    //     }
    //   }
    // return nft;
}
