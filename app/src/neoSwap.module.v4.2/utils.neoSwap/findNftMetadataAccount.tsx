import { PublicKey } from '@solana/web3.js';
import { TOKEN_METADATA_PROGRAM } from './const.neoSwap';

export function findNftMetadataAccount(Data: { mint: PublicKey }): { adddress: PublicKey; bump: number } {
    const AccountData = PublicKey.findProgramAddressSync(
        [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM.toBuffer(), Data.mint.toBuffer()],
        TOKEN_METADATA_PROGRAM
    );
    return { adddress: AccountData[0], bump: AccountData[1] };
}
