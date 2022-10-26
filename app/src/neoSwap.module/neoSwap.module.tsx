import { validateClaimed } from './functions.neoswap/validateClaimed.neoSwap.module';
import { initInitialize } from './functions.neoswap/init.Initialize.neoSwap.module';
import { allInitialize } from './functions.neoswap/all.Initialize.neoSwap.module';
import { addInitialize } from './functions.neoswap/add.Initialize.neoSwap.module';
import { verifyInitialize } from './functions.neoswap/verif.Initialize.neoSwap.module';
import { getSwapDataFromPDA, getSeedFromData } from './utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { deposit } from './functions.neoswap/deposit.neoSwap.module';
import { claimAndClose } from './functions.neoswap/claimAndClose.neoSwap.module';
import { cancelAndClose } from './functions.neoswap/cancelAndClose.neoSwap.module';

const NeoSwap = {
    validateClaimed,
    initInitialize,
    addInitialize,
    allInitialize,
    getSwapDataFromPDA,
    getSeedFromData,
    verifyInitialize,
    deposit,
    claimAndClose,
    cancelAndClose
};

export default NeoSwap;
