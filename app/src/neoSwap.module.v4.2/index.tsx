import allInitialize from './functions.neoswap/all.Initialize.neoSwap.module';
import deposit from './functions.neoswap/deposit.neoSwap.module';
import claimAndClose from './functions.neoswap/claimAndClose.neoSwap.module';
import cancelAndClose from './functions.neoswap/cancelAndClose.neoSwap.module';
import { getSwapDataFromPDA } from './utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { getSeedFromData } from './utils.neoSwap/getSeedfromData.neoswap';
import createPnft2 from './functions.neoswap/subFunctions/createPNFT2.neoSwap.sub';
import createNft from './functions.neoswap/subFunctions/createNFT.neoSwap.sub';
import depositNft from './functions.neoswap/createInstruction/deposit.nft.neoswap.ci';
// import transferPNFT from './functions.neoswap/subFunctions/transferPNFT.neoSwap.sub ';

const NeoSwap = {
    /// Main
    allInitialize, /// creates instruction for initializing PDA, writing data and setting the trade state to depositing
    deposit, /// creates instruction for depositing all items related to the signer
    claimAndClose, /// creates instruction for sending all assets to users
    cancelAndClose, /// creates instruction for cancelingthe trade and sending back all assets
    /// Utils
    getSwapDataFromPDA, /// fetch and deserialize data from PDA
    getSeedFromData, /// reconstruct seed and
    /// Test
    createPnft2, /// creates instruction for creating new pNFT
    createNft, /// creates instruction for creating new NFT
    // transferPNFT, /// creates instruction for transferring pNFT
    depositNft
};

export default NeoSwap;
