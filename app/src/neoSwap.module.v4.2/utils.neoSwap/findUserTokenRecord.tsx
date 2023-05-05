import { PublicKey } from '@solana/web3.js';
import { TOKEN_METADATA_PROGRAM } from './const.neoSwap';

export function findUserTokenRecord(Data: { mint: PublicKey; userMintAta: PublicKey }): {
    adddress: PublicKey;
    bump: number;
} {
    const AccountData = PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM.toBuffer(),
            // TOKEN_PROGRAM_ID.toBuffer(),
            Data.mint.toBuffer(),
            Buffer.from('token_record'),
            Data.userMintAta.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM
    );
    return { adddress: AccountData[0], bump: AccountData[1] };
}
