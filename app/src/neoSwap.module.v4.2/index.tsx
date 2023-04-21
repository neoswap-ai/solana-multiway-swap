import { allInitialize } from './functions.neoswap/all.Initialize.neoSwap.module';
import { depositUserOnly } from './functions.neoswap/depositUserOnly.neoSwap.module';
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
import getUserPdaData from './functions.neoswap/subFunctions/getUserPdaData.neoSwap.sub';
// import validateUserPdaItemsIx from './functions.neoswap/subFunctions/validateUserPdaItems.neoSwap.sub';
// import validatePresigningSwap from './functions.neoswap/subFunctions/validatePresigningSwap.neoSwap.sub';
import boradcastToBlockchain from './functions.neoswap/testFunctions/boradcastToBlockchain';
import depositPresigned from './functions.neoswap/depositPresigned.neoSwap.module';
import { updateAmountToTopupTest } from './functions.neoswap/testFunctions/updateAmountToTopupTest';
import createUserPdaTest from './functions.neoswap/testFunctions/createUserPdaTest';
import createNft from './functions.neoswap/testFunctions/createNft';
import airdropDev from './utils.neoSwap/airdropDev';
import userAddItemToSellTest from './functions.neoswap/testFunctions/userAddItemToSellTest';
import userAddItemToBuyTest from './functions.neoswap/testFunctions/userAddItemToBuyTest';
const NeoSwap = {
    /// Main
    allInitialize, /// creates instruction for initializing PDA, writing data and setting the trade state to depositing
    depositUserOnly, /// creates instruction for depositing all items related to the signer
    depositPresigned,
    claimAndClose, /// creates instruction for sending all assets to users
    cancelAndClose, /// creates instruction for cancelingthe trade and sending back all assets
    /// Utils
    getSwapDataFromPDA, /// fetch and deserialize data from PDA
    getSeedFromData, /// reconstruct seed and
    boradcastToBlockchain,
    airdropDev,
    ///Pre-sign
    createUserPda,
    getUserPdaData,
    userAddItemToSell,
    userAddItemToBuy,
    userUpdateAmountTopUp,
    transferUserApprovedNft,
    transferUserApprovedWsol,
    ///test
    // fillUserPda,
    updateAmountToTopupTest,
    createUserPdaTest,
    createNft,
    userAddItemToSellTest,
    userAddItemToBuyTest,
};

export default NeoSwap;
