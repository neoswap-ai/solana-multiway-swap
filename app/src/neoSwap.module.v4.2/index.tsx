import allInitialize from './functions.neoswap/all.Initialize.neoSwap.module';
import deposit from './functions.neoswap/deposit.neoSwap.module';
import claimAndClose from './functions.neoswap/claimAndClose.neoSwap.module';
import cancelAndClose from './functions.neoswap/cancelAndClose.neoSwap.module';
import { getSwapDataFromPDA } from './utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { getSeedFromData } from './utils.neoSwap/getSeedfromData.neoswap';
import { createUserPda } from './functions.neoswap/subFunctions/createUserPda.neoSwap.sub';
import { userAddItemToSell } from './functions.neoswap/subFunctions/userAddItemToSell.neoSwap.sub';
import userAddItemToBuy from './functions.neoswap/subFunctions/userAddItemToBuy.neoSwap.sub';
import { userUpdateAmountTopUp } from './functions.neoswap/subFunctions/userUpdateAmountTopUp.neoSwap.sub';
import { transferUserApprovedNft } from './functions.neoswap/subFunctions/transferUserApprovedNft.neoSwap.sub';
import transferUserApprovedWsol from './functions.neoswap/subFunctions/transferUserApprovedWsol.neoSwap.sub';
import validateUserPdaItemsIx from './functions.neoswap/subFunctions/validateUserPdaItems.neoSwap.sub'
const NeoSwap = {
    /// Main
    allInitialize, /// creates instruction for initializing PDA, writing data and setting the trade state to depositing
    deposit, /// creates instruction for depositing all items related to the signer
    claimAndClose, /// creates instruction for sending all assets to users
    cancelAndClose, /// creates instruction for cancelingthe trade and sending back all assets
    /// Utils
    getSwapDataFromPDA, /// fetch and deserialize data from PDA
    getSeedFromData, /// reconstruct seed and
    ///Pre-sign
    createUserPda,
    userAddItemToSell,
    userAddItemToBuy,
    userUpdateAmountTopUp,
    transferUserApprovedNft,
    transferUserApprovedWsol,
    validateUserPdaItemsIx
};

export default NeoSwap;
