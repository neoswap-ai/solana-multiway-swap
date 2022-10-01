import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { SwapData } from './solana.types';

export const splAssociatedTokenAccountProgramId = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// const sentData: SwapData = {
//     initializer: PublicKey,
//     isComplete: false,
//     userA: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//     userAAmount: new BN(-1),
//     userANft: [
//         {
//             nft: new PublicKey('DxKz618SSAiswCsUPZkmKDU9kUxXkNUC9uDfZYNEF6mY'),
//             destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//         },
//         {
//             nft: new PublicKey('7CZRVmsPoTs4bDjLGs2jMunBg54Lv1bdvmtWQVrFur5G'),
//             destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//         },
//     ],

//     userB: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//     userBAmount: new BN(1),
//     userBNft: [
//         {
//             nft: new PublicKey('DwPKNrMPg3ocBvzhrpAZmcKAjUiFcA1okpRnBACrucew'),
//             destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//         },
//     ],

//     userC: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//     userCAmount: new BN(2),
//     userCNft: [
//         {
//             nft: new PublicKey('UUCjpbeFwockd4RKYj8DmxSWWcxHrG5cJW1uoAhjeDc'),
//             destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
//         },
//     ],
// };