import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PublicKey } from '@solana/web3.js';

export const splAssociatedTokenAccountProgramId = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const opts = {
    preflightCommitment: 'confirmed' as any,
};

/// DEV
export const network = WalletAdapterNetwork.Devnet;
export const programId = new PublicKey('EqJGZ36f9Xm8a9kLntuzdTN8HDjbTUEYC5aHtbjr3EAk');

/// MAIN
// export const network = WalletAdapterNetwork.Mainnet;
// export const programId = new PublicKey('');
