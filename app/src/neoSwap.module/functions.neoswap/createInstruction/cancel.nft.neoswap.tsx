import { findOrCreateAta } from '../../utils.neoSwap/findOrCreateAta.neoSwap';
import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';

import { types } from 'secretjs';
import { CONST_PROGRAM } from '../../utils.neoSwap/const.neoSwap';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';


export async function cancelNft(Data:{
    program: Program,
    signer: PublicKey,
    user: PublicKey,
    mint: PublicKey,
    swapDataAccount: PublicKey,
    swapDataAccount_seed: Buffer,
    swapDataAccount_bump: number}
): Promise<{ transaction: Transaction; userMintAta: PublicKey }> {
    let transaction: Transaction = new Transaction();

    const { mintAta: userMintAta, transaction: userMintAtaTx } = await findOrCreateAta(Data.program, Data.user, Data.mint, Data.signer);
    if (userMintAtaTx) {
        transaction.add(userMintAtaTx);
        console.log('createUserAta Cancel Nft Tx Added');
    }

    const { mintAta: swapDataAta, transaction: pdaMintAtaTx } = await findOrCreateAta(
        Data.program,
        Data.swapDataAccount,
        Data.mint,
        Data.signer
    );
    if (pdaMintAtaTx) {
        transaction.add(pdaMintAtaTx);
        console.log('createPdaAta Cancel Nft Tx Added');
    }

    const cancelNftTx = await Data.program.methods
        .cancelNft(Data.swapDataAccount_seed, Data.swapDataAccount_bump)
        .accounts({
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            swapDataAccount: Data.swapDataAccount,
            user: Data.user,
            signer: Data.signer,
            itemFromDeposit: swapDataAta,
            itemToDeposit: userMintAta,
        })
        .instruction();

    transaction.add(cancelNftTx);
    // console.log('cancel NFT Tx added');

    return { transaction, userMintAta };
}
