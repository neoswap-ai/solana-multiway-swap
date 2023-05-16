import { BN, Program, utils, Wallet } from '@project-serum/anchor';
import {
    Keypair,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    Signer,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import { TokenStandard, Uses } from '@metaplex-foundation/mpl-token-metadata';
// import { createInitializeV2Instruction } from '@metaplex-foundation/mpl-candy-machine-core';

import { appendTransactionToArray } from '../../utils.neoSwap/appendTransactionToArray.neosap';
import { convertAllTransaction } from '../../utils.neoSwap/convertAllTransaction.neoswap';
import { getSeedFromData } from '../../utils.neoSwap/getSeedfromData.neoswap';
import { TradeStatus } from '../../utils.neoSwap/types.neo-swap/status.type.neoswap';
import SwapData from '../../utils.neoSwap/types.neo-swap/swapData.types.neoswap';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SplTokenAccountsCoder } from '@project-serum/anchor/dist/cjs/coder/spl-token/accounts';
import { SplAssociatedTokenAccountsCoder } from '@project-serum/anchor/dist/cjs/coder/spl-associated-token/accounts';
import { splAssociatedTokenAccountProgramId } from '../../utils.neoSwap/const.neoSwap';

// import { createNft, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
// import { create } from '@metaplex-foundation/mpl-candy-machine';
// import {
//     createSignerFromKeypair,
//     generateSigner,
//     percentAmount,
//     signerIdentity,
//     signerPayer,
// } from '@metaplex-foundation/umi';
// import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
// import { mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine';

import { Connection } from '@solana/web3.js';
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber, token } from '@metaplex-foundation/js';

// Use the RPC endpoint of your choice.
/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const createSft = async (Data: { signer: Keypair; program: Program; standard: TokenStandard }) => {
    // const WALLET = new Wallet(Data.signer);
    // console.log('Wallet', WALLET.publicKey.toBase58());

    const METAPLEX = Metaplex.make(
        // new Connection('https://localhost:8899')
        // new Connection('http://127.0.0.1:8899')
        new Connection('https://api.devnet.solana.com')
    )
        .use(keypairIdentity(Data.signer))
        .use(
            bundlrStorage({
                // address: 'http://127.0.0.1:8899',
                address: 'https://devnet.bundlr.network',
                providerUrl:
                    'https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/',
                // 'http://127.0.0.1:8899',
                // 'https://localhost:8899',
                timeout: 60000,
            })
        );
    // console.log('METAPLEX', METAPLEX);
    // console.log(METAPLEX.rpc());
    // console.log(METAPLEX.programs());

    const CONFIG = {
        imgName: 'QuickNode Pixel',
        symbol: 'QNPIX',
        sellerFeeBasisPoints: 500, //500 bp = 5%
        creators: [{ address: Data.signer.publicKey, share: 100 }],
        metadata: 'https://arweave.net/yIgHNXiELgQqW8QIbFM9ibVV37jhvfyW3mFcZGRX-PA',
    };
    // console.log('CONFIG', CONFIG);
    // if (Data.standard === TokenStandard.FungibleAsset) {
    const transactionBuilder = await METAPLEX.nfts().create({
        uri: CONFIG.metadata,
        name: 'name',
        sellerFeeBasisPoints: CONFIG.sellerFeeBasisPoints,
        symbol: CONFIG.symbol,
        creators: CONFIG.creators,
        isMutable: true,
        isCollection: false,
        tokenStandard: Data.standard, //TokenStandard.ProgrammableNonFungible,
    });
    console.log(`   Success!🎉`);

    const { mintAddress, response: signature } = transactionBuilder;
    console.log(`   Minted SFT: https://explorer.solana.com/address/${mintAddress.toString()}?cluster=devnet`);
    console.log(`   Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    const transactionBuilder2 = METAPLEX.nfts()
        .builders()
        .mint({
            nftOrSft: { address: transactionBuilder.mintAddress, tokenStandard: Data.standard },
            // toOwner,
            amount: token(5),
        });
    // console.log();
    // } else {
    // const transactionBuilder = await METAPLEX.nfts().builders().create({
    //     uri: CONFIG.metadata,
    //     name: 'name',
    //     sellerFeeBasisPoints: CONFIG.sellerFeeBasisPoints,
    //     symbol: CONFIG.symbol,
    //     creators: CONFIG.creators,
    //     isMutable: true,
    //     isCollection: false,
    //     tokenStandard: Data.standard, //TokenStandard.ProgrammableNonFungible,
    //     ruleSet: null,
    // });
    // }

    // console.log('transactionBuilder', transactionBuilder);

    let { signature: t2, confirmResponse } = await METAPLEX.rpc().sendAndConfirmTransaction(
        transactionBuilder2
        // {skipPreflight: true,}
    );
    console.log('signature0', t2);

    if (confirmResponse.value.err) {
        throw new Error('failed to confirm transaction');
    }

    // if (Data.standard === TokenStandard.FungibleAsset) {
    //     const sft = await METAPLEX.nfts().use({
    //         mintAddress,

    //         // nftOrSft: { address: mintAddress, tokenStandard: TokenStandard.FungibleAsset },
    //         // amount: {
    //         //     basisPoints: toBigNumber(10),
    //         //     currency: { symbol: CONFIG.symbol, decimals: 0, namespace: 'spl-token' },
    //         // },
    //         // toToken:Data.signer.publicKey,
    //         // toOwner: ,
    //     });
    //     console.log('ssft', sft);
    // }
    return { mintAddress };
    // mintProgrammableNft(
    //     CONFIG.metadata,
    //     CONFIG.imgName,
    //     CONFIG.sellerFeeBasisPoints,
    //     CONFIG.symbol,
    //     CONFIG.creators
    // );
};

export default createSft;
