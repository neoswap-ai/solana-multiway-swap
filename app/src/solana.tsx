import { AnchorProvider, Program } from '@project-serum/anchor';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { idl } from './idl';
import { opts } from './solana.const';
import { CONST_PROGRAM, fullData, network, programId, swapDataAccountGiven } from './solana.test';
import { SwapData } from './solana.types';
import { programCatchError } from './solana.errors';
import NeoSwap from './neoSwap.module.v4.2';
import { getSeed, getSwapData, sendAllPopulateInstruction } from './solana.utils';
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

    /// fetch data from swap's PDA or construct the relevant seed according to Data to send
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
            swapData = await getSeed(fullData);
        }

        console.log('SwapData', swapData);
    }, [publicKey, getProgram]);

    /// Triggers initializing PDA and Setting up Swap's data
    const allInitialize = useCallback(async () => {
        const program = await getProgram();
        if (!publicKey) throw console.error('not connected');

        const { allInitSendAllArray, pda } = await NeoSwap.allInitialize({
            provider: program.provider as AnchorProvider,
            signer: publicKey,
            swapDataGiven: fullData,
            CONST_PROGRAM: CONST_PROGRAM,
        });

        console.log('Save pda into solana.test.tsx as swapDataAccountGiven: ', pda.toBase58());
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

    /// Triggers depositing all assets the connected user should deposit
    const deposit = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        const program = await getProgram();
        if (!program.provider.sendAll) throw console.error('no sendAndConfirm');

        const { depositSendAllArray } = await NeoSwap.deposit({
            provider: program.provider as AnchorProvider,
            signer: publicKey,
            swapDataAccount: swapDataAccountGiven,
            CONST_PROGRAM,
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

    /// Triggers sending expected assets and closing the PDA
    const claim = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        const program = await getProgram();
        if (!program.provider.sendAll) throw console.error('no sendAndConfirm');

        const { allClaimSendAllArray } = await NeoSwap.claimAndClose({
            provider: program.provider as AnchorProvider,
            signer: publicKey,
            swapDataAccount: swapDataAccountGiven,
            CONST_PROGRAM,
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

    /// Triggers cancelling the trade sending back locked assets and closing the PDA
    const cancel = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        const program = await getProgram();

        const { allCancelSendAllArray } = await NeoSwap.cancelAndClose({
            provider: program.provider as AnchorProvider,
            signer: publicKey,
            swapDataAccount: swapDataAccountGiven,
            CONST_PROGRAM,
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
                    read swapData
                </button>
            </div>
            <br />
            <div>
                <button onClick={allInitialize} disabled={!publicKey}>
                    all initialize
                </button>
            </div>
            <br />
            <div>
                <button onClick={deposit} disabled={!publicKey}>
                    Deposit
                </button>
            </div>
            <br />
            <div>
                <button onClick={claim} disabled={!publicKey}>
                    claim And Close
                </button>
            </div>
            <br />
            <div>
                <button onClick={cancel} disabled={!publicKey}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default Solana;
