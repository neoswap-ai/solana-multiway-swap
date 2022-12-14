import { NftSwapItem, SwapData } from './solana.types';
import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

/// DEV
export const network = WalletAdapterNetwork.Devnet;
export const programId = new PublicKey('5CihstNRfYL87s4b7y24UmesKSV6poNLS9ku3DArknx9');

/// MAIN
// export const network = WalletAdapterNetwork.Mainnet;
// export const programId = new PublicKey('');

export const CONST_PROGRAM: string = '0013';
export const swapDataAccountGiven = new PublicKey('FNxg7sUfvCzjuPnSs2JH4x91A2GWmEAmGpLugfNqSBRJ');

// const persvoNft = new PublicKey('986QZarnBgBZcyuW7HsQuoxm5eN8m28Ho6Ue3iXbA7LH');
// const persAddress = new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW');
// const bibouxAddress = new PublicKey('7vMRz58y5JUe3tpEiWdNMfzLmqusG5mtdMPxYehahZWL');
// const bibouxNft = new PublicKey('7uVCii3LzvuZK5xWh6mEjFsznwgEiPSwSuPsNzWUMNRh');

const bibouxNft = new PublicKey('986QZarnBgBZcyuW7HsQuoxm5eN8m28Ho6Ue3iXbA7LH');
const bibouxAddress = new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW');
const persAddress = new PublicKey('7vMRz58y5JUe3tpEiWdNMfzLmqusG5mtdMPxYehahZWL');
const persvoNft = new PublicKey('7uVCii3LzvuZK5xWh6mEjFsznwgEiPSwSuPsNzWUMNRh');

const i11 = {
    isNft: false,
    amount: new BN(0.5 * 10 ** 9),
    owner: bibouxAddress,
    destinary: bibouxAddress,
    mint: bibouxAddress,
    status: 1,
};

const i12 = {
    isNft: true,
    amount: new BN(1),
    owner: bibouxAddress,
    destinary: persAddress,
    mint: bibouxNft,
    status: 0,
};

const i21 = {
    isNft: false,
    amount: new BN(-0.5 * 10 ** 9),
    owner: persAddress,
    destinary: persAddress,
    mint: persAddress,
    status: 0,
};

const i22 = {
    isNft: true,
    amount: new BN(1),
    owner: persAddress,
    destinary: bibouxAddress,
    mint: persvoNft,
    status: 0,
};

export const fullData = {
    initializer: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    status: 80,
    items: [i11, i12, i21, i22],
};

export const sentData: SwapData = {
    initializer: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
    status: 80,
    items: [i11] as Array<NftSwapItem>,
};
