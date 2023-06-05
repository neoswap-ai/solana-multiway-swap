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
import { createMintToInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
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
import {
    Metaplex,
    keypairIdentity,
    bundlrStorage,
    toMetaplexFile,
    toBigNumber,
    token,
    Sft,
} from '@metaplex-foundation/js';

// Use the RPC endpoint of your choice.
/**
 * @notice creates instruction for adding all item (excluding element 0) to the swap's PDA data.
 * @param {SwapData} swapData Given Swap Data sorted
 * @param {PublicKey} signer /!\ signer should be initializer
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {Program} program program linked to NeoSwap
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}addInitSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const createPnft2 = async (Data: { signer: Keypair; program: Program; standard: TokenStandard }) => {
    // const WALLET = new Wallet(Data.signer);
    // console.log('Wallet', WALLET.publicKey.toBase58());

    const METAPLEX = Metaplex.make(
        // new Connection('https://localhost:8899')
        // new Connection('http://127.0.0.1:8899')
        Data.program.provider.connection
    )
        .use(keypairIdentity(Data.signer))
        .use(
            bundlrStorage({
                address: 'https://localhost:8899',
                // address: 'https://devnet.bundlr.network',
                providerUrl:
                    // 'https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/',
                    // 'http://127.0.0.1:8899',
                    'https://localhost:8899',
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
    //     const transactionBuilder = await METAPLEX.nfts().createSft({
    //         uri: CONFIG.metadata,
    //         name: 'name',
    //         sellerFeeBasisPoints: CONFIG.sellerFeeBasisPoints,
    //         symbol: CONFIG.symbol,
    //         creators: CONFIG.creators,
    //         isMutable: true,
    //         isCollection: false,
    //         tokenStandard: Data.standard, //TokenStandard.ProgrammableNonFungible,
    //     });
    //     // console.log();
    // } else {
    const transactionBuilder = await METAPLEX.nfts().builders().create({
        uri: CONFIG.metadata,
        name: 'name',
        sellerFeeBasisPoints: CONFIG.sellerFeeBasisPoints,
        symbol: CONFIG.symbol,
        creators: CONFIG.creators,
        isMutable: true,
        isCollection: false,
        tokenStandard: Data.standard, //TokenStandard.ProgrammableNonFungible,
        ruleSet: null,
    });
    // }

    // console.log('transactionBuilder', transactionBuilder);
    // console.log(METAPLEX);

    let signature = await METAPLEX.rpc().sendTransaction(transactionBuilder);
    // const blockData = await Data.program.provider.connection.getLatestBlockhash();
    // const tx = transactionBuilder.toTransaction(blockData);
    // tx.feePayer = Data.signer.publicKey;
    // tx.sign(Data.signer);

    // if (!Data.program.provider.sendAll) throw 'noSendAndConfirm';
    // let signature = await Data.program.provider.sendAll([{ tx, signers: [Data.signer] }], {
    //     skipPreflight: true,
    // });
    console.log('signature0', signature);

    // if (confirmResponse.value.err) {
    //     throw new Error('failed to confirm transaction');
    // }
    const { mintAddress, tokenAddress } = transactionBuilder.getContext();
    console.log(`   Success!🎉`);
    console.log(`   Minted NFT: https://explorer.solana.com/address/${mintAddress.toString()}?cluster=devnet`);
    console.log(`   Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    if (Data.standard === TokenStandard.FungibleAsset || Data.standard === TokenStandard.Fungible) {
        let amount = 5;
        if (Data.standard === TokenStandard.Fungible) amount = 150000;
        const tx = new Transaction().add(
            createMintToInstruction(
                mintAddress,
                tokenAddress,
                Data.signer.publicKey,
                amount
                // [Data.signer],
                // TOKEN_PROGRAM_ID
            )
        );
        // console.log(tx);

        if (!Data.program.provider.sendAll)
            throw {
                msg: 'noSend',
            };
        tx.feePayer = Data.signer.publicKey;
        tx.recentBlockhash = (await Data.program.provider.connection.getLatestBlockhash()).blockhash;
        const sft = await Data.program.provider.sendAll([{ tx: tx, signers: [Data.signer] }]);
        // const sft = await METAPLEX.nfts().mint({
        //     nftOrSft: { address: mintAddress, tokenStandard: TokenStandard.FungibleAsset },
        //     toToken: Data.signer.publicKey,
        //     amount: token(9),
        // });
        console.log('ssft', sft);
    }
    return { mintAddress, signature };
    // mintProgrammableNft(
    //     CONFIG.metadata,
    //     CONFIG.imgName,
    //     CONFIG.sellerFeeBasisPoints,
    //     CONFIG.symbol,
    //     CONFIG.creators
    // );
};

export default createPnft2;
