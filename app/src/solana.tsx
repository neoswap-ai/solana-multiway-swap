import { AnchorProvider, Program, utils, web3 } from '@project-serum/anchor';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { idl } from './idl';
import { splAssociatedTokenAccountProgramId, opts } from './solana.const';
import { fullData, network, programId, sentData, swapDataAccountGiven } from './solana.test';
import { SwapData } from './solana.types';
import {
    cIcancelNft,
    cIcancelSol,
    cIclaimNft,
    cIclaimSol,
    cIdepositNft,
    cIdepositSol,
} from './solana.programInstruction';
import { programCatchError } from './solana.errors';
import NeoSwap from './neoSwap.module/neoSwap.module';
import { sendAllPopulateInstruction } from './solana.utils';
window.Buffer = window.Buffer || require('buffer').Buffer;

const Solana: FC = () => {
    const { publicKey } = useWallet();
    const anchorWallet = useAnchorWallet();

    const getProvider = useCallback(async (): Promise<AnchorProvider> => {
        if (!anchorWallet) {
            throw new WalletNotConnectedError();
        } else {
            return new AnchorProvider(
                new Connection(clusterApiUrl(network), opts.preflightCommitment),
                anchorWallet,
                opts.preflightCommitment
            );
        }
    }, [anchorWallet]);

    const getProgram = useCallback(async (): Promise<Program> => {
        return new Program(idl, programId, await getProvider());
    }, [getProvider]);

    const getSeed = useCallback(
        async (
            sentData: SwapData,
            program: Program
        ): Promise<{
            swapDataAccount: web3.PublicKey;
            swapDataAccount_seed: Buffer;
            swapDataAccount_bump: number;
        }> => {
            return await NeoSwap.getSeedFromData({ swapData: sentData, program: program });
        },
        []
    );
    const getSwapData = useCallback(
        async (
            swapDataAccount: PublicKey,
            program: Program
        ): Promise<{
            swapData: SwapData;
            swapDataAccount_seed: Buffer;
            swapDataAccount_bump: number;
        }> => {
            return await NeoSwap.getSwapDataFromPDA({ swapDataAccount, program });
        },
        []
    );

    const read = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        const program = await getProgram();
        // const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(publicKey.toString() + publicKey.toString());
        // console.log(swapDataAccount_seed);
        // const [x, y] = await PublicKey.findProgramAddress([swapDataAccount_seed], program.programId);
        // console.log(x);
        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log('SwapData', swapData);
    }, [publicKey, getProgram]);

    const initInitialize = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        const program = await getProgram();
        if (!program.provider.sendAll) throw console.error('program Incorrect');

        // sentData.initializer = publicKey;

        console.log('sentData', sentData);
        const { initinitSendAllArray } = await NeoSwap.initInitialize({
            program,
            signer: publicKey,
            swapData: fullData,
        });

        const initInitTransaction = await sendAllPopulateInstruction(program, initinitSendAllArray);
        try {
            const transactionHash = await program.provider.sendAll(initInitTransaction);

            console.log('initialize transactionHash', transactionHash);
        } catch (error) {
            programCatchError(error);
            const hash = String(error).slice(136, 223);
            console.log('hash', hash);

            // const conftr = await program.provider.connection.confirmTransaction(hash, 'processed');

            // console.log('conftr', conftr);
        }
    }, [publicKey, getProgram]);

    const addInitialize = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        const program = await getProgram();
        if (!program.provider.sendAll) throw console.error('no sendAndConfirm');

        const { addInitSendAllArray } = await NeoSwap.addInitialize({
            program,
            signer: publicKey,
            swapData: fullData,
        });
        let sendAllArray = await sendAllPopulateInstruction(program, addInitSendAllArray);

        try {
            const transactionHash = await program.provider.sendAll(sendAllArray);
            console.log('initialize transactionHash', transactionHash);
        } catch (error) {
            programCatchError(error);
            throw console.error(error);
        }
    }, [publicKey, getProgram]);

    const verifyInitialize = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        const program = await getProgram();
        if (!program.provider.sendAll) throw console.error('no sendAndConfirm');

        const { verifInitSendAllArray } = await NeoSwap.verifyInitialize({
            program,
            signer: publicKey,
            swapData: fullData,
        });
        let sendAllArray = await sendAllPopulateInstruction(program, verifInitSendAllArray);

        try {
            const transactionHash = await program.provider.sendAll(sendAllArray);
            console.log('initialize transactionHash', transactionHash);
        } catch (error) {
            programCatchError(error);
            throw console.error(error);
        }
    }, [publicKey, getProgram]);

    const allInitialize = useCallback(async () => {
        const program = await getProgram();
        if (!publicKey) throw console.error('not connected');

        const { allInitSendAllArray } = await NeoSwap.allInitialize({
            program,
            signer: publicKey,
            swapData: fullData,
        });
        const allinitTransactionSendAllArray = await sendAllPopulateInstruction(program, allInitSendAllArray);
        try {
            if (!program.provider.sendAll) throw console.error('no sendAndConfirm');

            const allInitTransaction = await program.provider.sendAll(allinitTransactionSendAllArray);
            console.log('initialize transactionHash', allInitTransaction);
        } catch (error) {
            programCatchError(error);

            throw console.error(error);
        }
    }, [getProgram, publicKey]);

    const deposit = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        const program = await getProgram();
        if (!program.provider.sendAll) throw console.error('no sendAndConfirm');

        const { depositSendAllArray } = await NeoSwap.deposit({
            program,
            signer: publicKey,
            swapDataAccount: swapDataAccountGiven,
        });
        let sendAllArray = await sendAllPopulateInstruction(program, depositSendAllArray);

        try {
            const transactionHash = await program.provider.sendAll(sendAllArray);
            console.log('initialize transactionHash', transactionHash);
        } catch (error) {
            programCatchError(error);
            throw console.error(error);
        }
    }, [publicKey, getProgram]);

    const claim = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        const program = await getProgram();
        if (!program.provider.sendAll) throw console.error('no sendAndConfirm');

        const { allClaimSendAllArray } = await NeoSwap.claimAndClose({
            program,
            signer: publicKey,
            swapDataAccount: swapDataAccountGiven,
        });

        let sendAllArray = await sendAllPopulateInstruction(program, allClaimSendAllArray);

        try {
            const transactionHash = await program.provider.sendAll(sendAllArray);
            console.log('initialize transactionHash', transactionHash);
        } catch (error) {
            programCatchError(error);
            throw console.error(error);
        }
    }, [publicKey, getProgram]);

    const cancel = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        const program = await getProgram();

        const { allCancelSendAllArray } = await NeoSwap.cancelAndClose({
            program,
            signer: publicKey,
            swapDataAccount: swapDataAccountGiven,
        });
        let sendAllArray = await sendAllPopulateInstruction(program, allCancelSendAllArray);

        try {
            // for (let index = 0; index < sendAllArray.length; index++) {
            //     const element = sendAllArray[index];

            if (!program.provider.sendAll) throw console.error('no sendAndConfirm');
            const transactionHash = await program.provider.sendAll(sendAllArray);
            console.log('initialize transactionHash', transactionHash);
            // }
        } catch (error) {
            programCatchError(error);
            throw console.error(error);
        }
    }, [publicKey, getProgram]);

    // const deposit = useCallback(async () => {
    //     if (!publicKey) throw new WalletNotConnectedError();

    //     const program = await getProgram();
    //     // console.log('program', program);
    //     if (!program.provider.sendAndConfirm) throw console.error('no provider');

    //     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
    //     console.log('SwapData', swapData);

    //     const swapDataFromSeed = await getSeed(fullData, program);

    //     console.log('swapDataFromSeed', swapDataFromSeed);
    //     if (getSeed(fullData, program) !== getSeed(swapData, program)) {
    //         console.log('data missing');
    //     }

    //     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
    //         swapDataFromSeed.swapDataAccount_seed,
    //         programId
    //     );
    //     // const tradeRef = getSeed(swapData);
    //     // // console.log('tradeRef', tradeRef);

    //     // const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
    //     // // console.log('swapDataAccount_seed', swapDataAccount_seed);

    //     // const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
    //     //     [swapDataAccount_seed],
    //     //     programId
    //     // );

    //     console.log('swapDataAccount', swapDataAccount.toBase58());
    //     console.log('swapDataAccount_bump', swapDataAccount_bump);

    //     let depositInstructionTransaction = new Transaction();
    //     let ataList: Array<PublicKey> = [];
    //     for (let item = 0; item < swapData.items.length; item++) {
    //         let e = swapData.items[item];
    //         // console.log('element', item, ' \n', e);

    //         switch (e.isNft) {
    //             case true:
    //                 if (e.owner.toBase58() === publicKey.toBase58() && e.status === 0) {
    //                     let depositing = await cIdepositNft(
    //                         program,
    //                         publicKey,
    //                         e.mint,
    //                         swapDataAccount,
    //                         swapDataFromSeed.swapDataAccount_seed,
    //                         swapDataAccount_bump,
    //                         ataList
    //                     );
    //                     ataList.push(depositing.ata);
    //                     depositInstructionTransaction.add(depositing.transaction);
    //                     console.log('ataList', ataList);
    //                 }
    //                 break;
    //             case false:
    //                 if (e.owner.toBase58() === publicKey.toBase58() && e.status === 0) {
    //                     depositInstructionTransaction.add(
    //                         await cIdepositSol(
    //                             program,
    //                             publicKey,
    //                             swapDataAccount,
    //                             swapDataFromSeed.swapDataAccount_seed,
    //                             swapDataAccount_bump
    //                         )
    //                     );
    //                 }
    //                 break;
    //         }
    //     }
    //     //         let arrowToDel: Array<number> = [];
    //     //         for (let index1 = 0; index1 < depositInstructionTransaction.instructions.length; index1++) {
    //     //             const element1 = depositInstructionTransaction.instructions[index1];
    //     //             for (let index2 = index1 + 1; index2 < depositInstructionTransaction.instructions.length; index2++) {
    //     //                 const element2 = depositInstructionTransaction.instructions[index2];
    //     //                 console.log('element1.data ', index1, '\n', (element1.data.buffer));
    //     //                 console.log('element2.keys', index2, '\n', (element2.data.buffer));

    //     //                 if (element1.data.buffer === element2.data.buffer) {
    //     //                     console.log('elem1===elem2');

    //     //                     arrowToDel.push(index2);
    //     //                 }
    //     //             }
    //     //         }
    //     // console.log("arrowToDel",arrowToDel);

    //     //         for (let index3 = arrowToDel.length; index3 > 0; index3--) {
    //     //             const element = arrowToDel[index3];
    //     //             depositInstructionTransaction.instructions = [
    //     //                 ...depositInstructionTransaction.instructions.slice(0, element - 1),
    //     //                 ...depositInstructionTransaction.instructions.slice(element),
    //     //             ];
    //     //         }
    //     depositInstructionTransaction.feePayer = publicKey;
    //     depositInstructionTransaction.recentBlockhash = (
    //         await program.provider.connection.getLatestBlockhash()
    //     ).blockhash;
    //     console.log(depositInstructionTransaction);

    //     if (depositInstructionTransaction.instructions.length > 0) {
    //         try {
    //             const hash = await program.provider.sendAndConfirm(depositInstructionTransaction);
    //             console.log('deposit transaction hash\n', hash);
    //         } catch (error) {
    //             programCatchError(error);
    //             const hash = String(error).slice(136, 223);
    //             console.log('hash', hash);
    //             const conftr = await program.provider.connection.confirmTransaction(hash, 'processed');
    //             console.log('conftr', conftr);
    //         }
    //     } else {
    //         console.log('Nothing to deposit');
    //     }
    // }, [publicKey, getProgram, getSeed]);

    // const cancel = useCallback(async () => {
    //     if (!publicKey) throw new WalletNotConnectedError();

    //     const program = await getProgram();
    //     if (!program.provider.sendAndConfirm) throw console.error('no provider');
    //     // console.log('program', program);

    //     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
    //     console.log('SwapData', swapData);
    //     if (!(swapData.status === 0 || swapData.status === 90)) {
    //         throw console.error('Trade not able to be canceled');
    //     }
    //     const swapDataFromSeed = await getSeed(fullData, program);

    //     console.log('swapDataFromSeed', swapDataFromSeed);
    //     if (getSeed(fullData, program) !== getSeed(swapData, program)) {
    //         console.log('data missing');
    //     }

    //     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
    //         [swapDataFromSeed.swapDataAccount_seed],
    //         programId
    //     );
    //     console.log('swapDataAccount_bump', swapDataAccount_bump);

    //     let cancelInstructionTransaction = new Transaction();

    //     for (let item = 0; item < swapData.items.length; item++) {
    //         let e = swapData.items[item];
    //         // console.log('element', item, ' \n', e);

    //         switch (e.isNft) {
    //             case true:
    //                 if (e.status === 1 || e.status === 0) {
    //                     cancelInstructionTransaction.add(
    //                         (
    //                             await cIcancelNft(
    //                                 program,
    //                                 publicKey,
    //                                 e.owner,
    //                                 e.mint,
    //                                 swapDataAccount,
    //                                 swapDataFromSeed.swapDataAccount_seed,
    //                                 swapDataAccount_bump
    //                             )
    //                         ).transaction
    //                     );
    //                     console.log('cancelNftinstruction added');
    //                 }
    //                 break;
    //             case false:
    //                 if (e.destinary.toBase58() === publicKey.toBase58() && (e.status === 1 || e.status === 0)) {
    //                     cancelInstructionTransaction.add(
    //                         (
    //                             await cIcancelSol(
    //                                 program,
    //                                 e.owner,
    //                                 publicKey,
    //                                 swapDataAccount,
    //                                 swapDataFromSeed.swapDataAccount_seed,
    //                                 swapDataAccount_bump
    //                             )
    //                         ).transaction
    //                     );
    //                     console.log('cancelSolinstruction added');
    //                 }
    //                 break;
    //         }
    //     }

    //     cancelInstructionTransaction.feePayer = publicKey;
    //     cancelInstructionTransaction.recentBlockhash = (
    //         await program.provider.connection.getLatestBlockhash()
    //     ).blockhash;
    //     // console.log('cancelInstructionTransaction', cancelInstructionTransaction);

    //     if (cancelInstructionTransaction.instructions.length > 0) {
    //         try {
    //             const hash = await program.provider.sendAndConfirm(cancelInstructionTransaction);
    //             console.log('cancel Transaction hash', hash);
    //         } catch (error) {
    //             programCatchError(error);
    //         }
    //     } else {
    //         console.log('Nothing to cancel');
    //     }
    // }, [publicKey, getProgram, getSeed]);

    // const validateCancel = useCallback(async () => {
    //     if (!publicKey) throw new WalletNotConnectedError();
    //     sentData.initializer = publicKey;
    //     // console.log('sentData', sentData);

    //     const program = await getProgram();
    //     // console.log('program', program);

    //     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
    //     console.log('swapData', swapData);
    //     if (swapData.status !== 90) throw console.error('Trade not in waiting to be cancelled');

    //     const swapDataFromSeed = await getSeed(fullData, program);

    //     console.log('swapDataFromSeed', swapDataFromSeed);
    //     if (getSeed(fullData, program) !== getSeed(swapData, program)) {
    //         console.log('data missing');
    //     }

    //     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
    //         [swapDataFromSeed.swapDataAccount_seed],
    //         programId
    //     );

    //     // console.log('swapDataAccount', swapDataAccount.toBase58());
    //     // console.log('swapDataAccount_bump', swapDataAccount_bump);

    //     try {
    //         const transactionHash = await program.methods
    //             .validateCancelled(swapDataFromSeed.swapDataAccount_seed, swapDataAccount_bump)
    //             .accounts({
    //                 // accounts: {
    //                 systemProgram: web3.SystemProgram.programId,
    //                 splTokenProgram: splAssociatedTokenAccountProgramId,
    //                 swapDataAccount: swapDataAccount,
    //                 signer: publicKey,
    //                 // },
    //             })
    //             .rpc();

    //         console.log('validateCancelled transactionHash', transactionHash);
    //     } catch (error) {
    //         programCatchError(error);
    //     }
    // }, [publicKey, getProgram, getSeed]);

    // const validateDeposit = useCallback(async () => {
    //     if (!publicKey) throw new WalletNotConnectedError();
    //     sentData.initializer = publicKey;
    //     // console.log('sentData', sentData);

    //     const program = await getProgram();
    //     // console.log('program', program);

    //     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
    //     console.log('swapData', swapData);
    //     if (swapData.status !== 0) throw console.error('Trade not in waiting to be validated');

    //     const swapDataFromSeed = await getSeed(fullData, program);

    //     console.log('swapDataFromSeed', swapDataFromSeed);
    //     if (getSeed(fullData, program) !== getSeed(swapData, program)) {
    //         console.log('data missing');
    //     }

    //     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
    //         [swapDataFromSeed.swapDataAccount_seed],
    //         programId
    //     );

    //     console.log('swapDataAccount', swapDataAccount.toBase58());
    //     console.log('swapDataAccount_bump', swapDataAccount_bump);

    //     try {
    //         const transactionHash = await program.methods
    //             .validateDeposit(swapDataFromSeed.swapDataAccount_seed, swapDataAccount_bump)
    //             .accounts({
    //                 // accounts: {
    //                 swapDataAccount: swapDataAccount,
    //                 signer: publicKey,
    //                 // },
    //             })
    //             .rpc();

    //         console.log('transactionHash', transactionHash);
    //     } catch (error) {
    //         programCatchError(error);
    //     }
    // }, [publicKey, getProgram, getSeed]);

    // const claim = useCallback(async () => {
    //     if (!publicKey) throw new WalletNotConnectedError();

    //     const program = await getProgram();
    //     if (!program.provider.sendAndConfirm) throw console.error('no provider');
    //     // console.log('program', program);

    //     const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
    //     console.log('swapData :', swapData);
    //     if (swapData.status !== 1) throw console.error('Trade not in waiting for claim state');

    //     const swapDataFromSeed = await getSeed(swapData, program);
    //     // console.log('tradeRef', tradeRef);

    //     // const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
    //     // console.log('swapDataAccount_seed', swapDataAccount_seed);

    //     const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
    //         [swapDataFromSeed.swapDataAccount_seed],
    //         programId
    //     );

    //     // console.log('swapDataAccount_bump', swapDataAccount_bump);

    //     let claimInstructionTransaction = new Transaction();

    //     for (let item = 0; item < swapData.items.length; item++) {
    //         let e = swapData.items[item];
    //         // console.log('element', item, ' \n', e);

    //         switch (e.isNft) {
    //             case true:
    //                 if (e.status === 1) {
    //                     console.log(e.destinary.toBase58());
    //                     claimInstructionTransaction.add(
    //                         (
    //                             await cIclaimNft(
    //                                 program,
    //                                 publicKey,
    //                                 e.destinary,
    //                                 e.mint,
    //                                 swapDataAccount,
    //                                 swapDataFromSeed.swapDataAccount_seed,
    //                                 swapDataAccount_bump
    //                             )
    //                         ).transaction
    //                     );
    //                     console.log('claimNftinstruction added');
    //                 }
    //                 break;
    //             case false:
    //                 if (e.status === 1) {
    //                     claimInstructionTransaction.add(
    //                         (
    //                             await cIclaimSol({
    //                                 program,
    //                                 user: e.owner,
    //                                 publicKey,
    //                                 swapDataAccount,
    //                                 swapDataAccount_seed: swapDataFromSeed.swapDataAccount_seed,
    //                                 swapDataAccount_bump,
    //                             })
    //                         ).transaction
    //                     );
    //                     console.log('claimSolinstruction added');
    //                 }
    //                 break;
    //         }
    //     }

    //     claimInstructionTransaction.feePayer = publicKey;
    //     claimInstructionTransaction.recentBlockhash = (
    //         await program.provider.connection.getLatestBlockhash()
    //     ).blockhash;
    //     // console.log('claimInstructionTransaction', claimInstructionTransaction);

    //     if (claimInstructionTransaction.instructions.length > 0) {
    //         try {
    //             const hash = await program.provider.sendAndConfirm(claimInstructionTransaction);
    //             console.log('claim transaction hash', hash);
    //         } catch (error) {
    //             programCatchError(error);
    //         }
    //     } else {
    //         console.log('Nothing to claim');
    //     }
    // }, [publicKey, getProgram, getSeed]);

    // const validateClaimed = useCallback(async () => {
    //     if (!publicKey) throw new WalletNotConnectedError();

    //     const program = await getProgram();
    //     if (!program.provider.sendAndConfirm) throw new WalletNotConnectedError();

    //     const { validateClaimedTransaction } = await NeoSwap.validateClaimed({
    //         userPublickey: publicKey,
    //         program,
    //         // CONST_PROGRAM,
    //         swapDataAccount: swapDataAccountGiven,
    //     });

    //     validateClaimedTransaction.feePayer = publicKey;
    //     validateClaimedTransaction.recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     try {
    //         const hash = await program.provider.sendAndConfirm(validateClaimedTransaction);
    //         console.log('claim transaction hash', hash);
    //     } catch (error) {
    //         programCatchError(error);
    //     }
    // }, [publicKey, getProgram, getSeed]);

    return (
        <div>
            <div>
                <button onClick={initInitialize} disabled={!publicKey}>
                    init initialize
                </button>
                <button onClick={addInitialize} disabled={!publicKey}>
                    add initialize
                </button>
                <button onClick={verifyInitialize} disabled={!publicKey}>
                    verify initialize
                </button>
                <br />
                <button onClick={allInitialize} disabled={!publicKey}>
                    all initialize
                </button>
            </div>
            <div>
                <button onClick={read} disabled={!publicKey}>
                    read
                </button>
            </div>
            <br />
            <div>
                <button onClick={deposit} disabled={!publicKey}>
                    Deposit
                </button>
                {/* <button onClick={validateDeposit} disabled={!publicKey}>
                    validateDeposit
                </button> */}
                <br />
            </div>
            <div>
                <button onClick={claim} disabled={!publicKey}>
                    claim And Close
                </button>
                {/* <button onClick={validateClaimed} disabled={!publicKey}>
                    validateClaimed
                </button> */}
                <br />
            </div>
            <div>
                <button onClick={cancel} disabled={!publicKey}>
                    Cancel
                </button>
                {/* <button onClick={validateCancel} disabled={!publicKey}>
                    validateCancel
                </button> */}
            </div>
        </div>
    );
};

export default Solana;
