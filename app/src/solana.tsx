import { AnchorProvider, Program, web3 } from '@project-serum/anchor';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { idl } from './idl';
import { opts } from './solana.const';
import { fullData, network, programId, sentData, swapDataAccountGiven } from './solana.test';
import { SwapData } from './solana.types';
// import {
//     cIcancelNft,
//     cIcancelSol,
//     cIclaimNft,
//     cIclaimSol,
//     cIdepositNft,
//     cIdepositSol,
// } from './solana.programInstruction';
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

        let swapData:
            | { swapData: SwapData; swapDataAccount_seed: Buffer; swapDataAccount_bump: number }
            | {
                  swapDataAccount: PublicKey;
                  swapDataAccount_seed: Buffer;
                  swapDataAccount_bump: number;
              };

        try {
            swapData = await getSwapData(swapDataAccountGiven, program);
        } catch (error) {
            swapData = await getSeed(fullData, program);
        }

        console.log('SwapData', swapData);
    }, [publicKey, getProgram, getSwapData, getSeed]);

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

        const { validateInitSendAllArray } = await NeoSwap.validateInitialize({
            program,
            signer: publicKey,
            swapData: fullData,
        });
        let sendAllArray = await sendAllPopulateInstruction(program, validateInitSendAllArray);

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
            console.log('deposit transactionHash', transactionHash);
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
            console.log('claim transactionHash', transactionHash);
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
            if (!program.provider.sendAll) throw console.error('no sendAndConfirm');
            const transactionHash = await program.provider.sendAll(sendAllArray);
            console.log('cancel transactionHash', transactionHash);
        } catch (error) {
            programCatchError(error);
            throw console.error(error);
        }
    }, [publicKey, getProgram]);

    return (
        <div>
            <div>
                <button onClick={read} disabled={!publicKey}>
                    read
                </button>
            </div>
            <br />
            <div>
                {/* <button onClick={initInitialize} disabled={!publicKey}>
                    init initialize
                </button>
                <button onClick={addInitialize} disabled={!publicKey}>
                    add initialize
                </button>
                <button onClick={verifyInitialize} disabled={!publicKey}>
                    verify initialize
                </button>
                <br /> */}
                <button onClick={allInitialize} disabled={!publicKey}>
                    all initialize
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
            </div>
            <br />
            <div>
                <button onClick={claim} disabled={!publicKey}>
                    claim And Close
                </button>
                {/* <button onClick={validateClaimed} disabled={!publicKey}>
                    validateClaimed
                </button> */}
            </div>
            <br />
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
