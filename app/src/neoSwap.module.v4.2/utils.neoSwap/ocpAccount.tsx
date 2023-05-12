import { PublicKey } from '@solana/web3.js';
import { CMT_PROGRAM, OCP_PROGRAM_ID } from './const.neoSwap';
import { utils } from '@project-serum/anchor';

export const findPolicyPk = (uuid: PublicKey) => {
    return PublicKey.findProgramAddressSync([utils.bytes.utf8.encode('policy'), uuid.toBuffer()], OCP_PROGRAM_ID)[0];
};

export const findMintStatePk = (mint: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [utils.bytes.utf8.encode('mint_state'), mint.toBuffer()],
        OCP_PROGRAM_ID
    )[0];
};

export const findFreezeAuthorityPk = (policy: PublicKey) => {
    return PublicKey.findProgramAddressSync([policy.toBuffer()], CMT_PROGRAM)[0];
};
