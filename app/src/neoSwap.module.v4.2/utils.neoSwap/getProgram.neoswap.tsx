import { AnchorProvider, Program } from '@project-serum/anchor';
import { neoSwapProgramAddress } from './const.neoSwap';
import { idl } from './idl';

/**
 * @notice construct program linked to Neoswap with provider data
 * @param {AnchorProvider} provider with active Connection
 * @return {Program}program => linked to neoswap program
 */
export function getProgram(provider: AnchorProvider): Program {
    return new Program(idl, neoSwapProgramAddress, provider);
}
