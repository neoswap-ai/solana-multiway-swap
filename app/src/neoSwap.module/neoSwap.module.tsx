// import { validateClaimed } from './functions.neoswap/validateClaimed.neoSwap.module';
import { initInitialize } from './functions.neoswap/init.Initialize.neoSwap.module';
import { allInitialize } from './functions.neoswap/all.Initialize.neoSwap.module';
import { validateInitialize } from './functions.neoswap/validate.Initialize.neoSwap.module';
import { getSwapDataFromPDA, getSeedFromData } from './utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { deposit } from './functions.neoswap/deposit.neoSwap.module';
import { claimAndClose } from './functions.neoswap/claimAndClose.neoSwap.module';
import { cancelAndClose } from './functions.neoswap/cancelAndClose.neoSwap.module';
import { saddInitialize as addInitialize } from './functions.neoswap/sadd.Initialize.neoSwap.module';

const NeoSwap = {
    initInitialize,
    addInitialize,
    validateInitialize,
    allInitialize,
    deposit,
    // validateClaimed,
    claimAndClose,
    cancelAndClose,
    getSwapDataFromPDA,
    getSeedFromData,
};

export default NeoSwap;
