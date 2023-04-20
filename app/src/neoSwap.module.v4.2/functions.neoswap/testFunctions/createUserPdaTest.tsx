import { AnchorProvider, Program, Wallet } from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, Signer, Transaction, TransactionInstruction } from '@solana/web3.js';
import NeoSwap from '../..';
import boradcastToBlockchain from './boradcastToBlockchain';

export const createUserPdaTest = async (Data: {
    // swapDataAccount: PublicKey;
    // user: PublicKey;
    // signer: PublicKey;
    // CONST_PROGRAM: string;
    userKeypairs: {
        keypair: Keypair;
        tokens: {
            mint: PublicKey;
            ata: PublicKey;
        }[];
    }[];
    // userKeypairs: { keypair: Keypair[] };
    program: Program;
    signer: Keypair;
}): Promise<string[]> => {
    let sendAllArray: {
        tx: Transaction;
        signers?: Signer[];
    }[] = [];
 
    // const createsignderPdaData = await NeoSwap.createUserPda({
    //     program:Data.program,
    //     user: signer.publicKey,
    //     signer: signer.publicKey,
    // });

    // let signderPda = createsignderPdaData.userPda;
    // const signerInitSendAllArray = createsignderPdaData.addInitSendAllArray;
    // console.log("XXX-XXX signderPda", signderPda.toBase58());

    const recentBlockhash = (await Data.program.provider.connection.getLatestBlockhash()).blockhash;

    // signerInitSendAllArray.signers = [signer];
    // signerInitSendAllArray.tx.feePayer = signer.publicKey;
    // signerInitSendAllArray.tx.recentBlockhash = recentBlockhash;
    // sendAllArray.push(signerInitSendAllArray);

    // const createfeeCollectorPdaData = await NeoSwap.createUserPda({
    //     program,
    //     user: feeCollector.publicKey,
    //     signer: signer.publicKey,
    // });

    // let feeCollectorPda = createfeeCollectorPdaData.userPda;
    // const feeCollectorInitSendAllArray = createfeeCollectorPdaData.addInitSendAllArray;
    // console.log("XXX-XXX feeCollectorPda", feeCollectorPda.toBase58());

    // feeCollectorInitSendAllArray.signers = [signer];
    // feeCollectorInitSendAllArray.tx.feePayer = signer.publicKey;
    // feeCollectorInitSendAllArray.tx.recentBlockhash = recentBlockhash;
    // sendAllArray.push(feeCollectorInitSendAllArray);

    await Promise.all(
        Data.userKeypairs.map(async (userKeypair) => {
            await Data.program.provider.connection.requestAirdrop(
                userKeypair.keypair.publicKey,
                2 * LAMPORTS_PER_SOL
            );
            const createuserPdaData = await NeoSwap.createUserPda({
                program:Data.program,
                user: userKeypair.keypair.publicKey,
                signer: Data.signer.publicKey,
            });

            let userPda = createuserPdaData.userPda;
            const allInitSendAllArrayUser = createuserPdaData.addInitSendAllArray;
            console.log("XXX-XXX userPda", userPda.toBase58());

            allInitSendAllArrayUser.signers = [Data.signer];
            allInitSendAllArrayUser.tx.feePayer = Data.signer.publicKey;
            allInitSendAllArrayUser.tx.recentBlockhash = recentBlockhash;

            sendAllArray.push(allInitSendAllArrayUser);
        })
    );
    if (!Data.program.provider.sendAll) throw "noSendAll";

    // const txhashs = await Data.program.provider.sendAll(sendAllArray, {
    //     skipPreflight: true,
    // });

    // for await (const hash of txhashs) {
    //     program.provider.connection.confirmTransaction(hash);
    // }

    // console.log("sendAllArray", sendAllArray);
    const txhashs = await boradcastToBlockchain({ provider: Data.program.provider as AnchorProvider, sendAllArray });

    return txhashs;
};

export default createUserPdaTest;
