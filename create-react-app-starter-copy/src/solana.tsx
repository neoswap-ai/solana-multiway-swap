import { Program, Provider, utils, web3 } from '@project-serum/anchor';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { idl } from './idl';
import {
    CONST_PROGRAM,
    splAssociatedTokenAccountProgramId,
    programId,
    opts,
    network,
    sentData,
    swapDataAccountGiven,
} from './solana.const';
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
import { seed } from '@project-serum/anchor/dist/cjs/idl';

window.Buffer = window.Buffer || require('buffer').Buffer;

export const Solana: FC = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const anchorWallet = useAnchorWallet();

    const getProvider = useCallback(async (): Promise<Provider> => {
        if (!anchorWallet) {
            throw new WalletNotConnectedError();
        } else {
            return new Provider(
                new Connection(clusterApiUrl(network), 'confirmed'),
                anchorWallet,
                opts.preflightCommitment
            );
        }
    }, [anchorWallet]);

    const getProgram = useCallback(async (): Promise<Program> => {
        return new Program(idl, programId, await getProvider());
    }, [getProvider]);

    const getSeed = useCallback((sentData: SwapData): string => {
        let addSeed_temp: string = '';
        for (let item = 0; item < sentData.items.length; item++) {
            addSeed_temp += sentData.items[item].mint.toString().slice(0, 4);
        }
        return CONST_PROGRAM + addSeed_temp;

        // return new Program(idl, programId, await getProvider());
    }, []);

    const initialize = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        sentData.initializer = publicKey;
        console.log('sentData', sentData);

        const program = await getProgram();
        console.log('program', program);

        const tradeRef = getSeed(sentData);

        console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        console.log('swapDataAccount', swapDataAccount.toBase58());
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        try {
            const transactionHash = await program.rpc.initialize(swapDataAccount_seed, swapDataAccount_bump, sentData, {
                accounts: {
                    swapDataAccount: swapDataAccount,
                    signer: publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: splAssociatedTokenAccountProgramId,
                },
            });
            console.log('transactionHash', transactionHash);
        } catch (error) {
            programCatchError(error);
        }
    }, [publicKey, getProgram, getSeed]);

    const deposit = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        const program = await getProgram();
        console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log('SwapData', swapData);
        if (swapData.status !== 0) throw console.error('Trade not in waiting for deposit state');

        const tradeRef = getSeed(swapData);
        console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        console.log('swapDataAccount', swapDataAccount.toBase58());
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        let depositInstructionTransaction = new Transaction();

        for (let item = 0; item < swapData.items.length; item++) {
            let e = swapData.items[item];
            console.log('element', item, ' \n', e);

            switch (e.isNft) {
                case true:
                    if (e.owner.toBase58() === publicKey.toBase58() && e.status === 0) {
                        depositInstructionTransaction.add(
                            (await cIdepositNft(program, publicKey, e.mint, swapDataAccount, swapDataAccount_seed))
                                .transaction
                        );
                    }
                    break;
                case false:
                    if (e.owner.toBase58() === publicKey.toBase58() && e.status === 0) {
                        depositInstructionTransaction.add(
                            await cIdepositSol(program, publicKey, swapDataAccount, swapDataAccount_seed)
                        );
                    }
                    break;
            }
        }

        depositInstructionTransaction.feePayer = publicKey;
        depositInstructionTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        console.log('depositInstructionTransaction', depositInstructionTransaction);

        if (depositInstructionTransaction.instructions.length > 0) {
            try {
                const hash = await program.provider.send(depositInstructionTransaction);
                console.log('hash\n', hash);
            } catch (error) {
                programCatchError(error);
            }
        } else {
            console.log('Nothing to deposit');
        }
    }, [publicKey, getProgram, getSeed, connection]);

    const cancel = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        const program = await getProgram();
        console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log(swapData);
        if (!(swapData.status === 0 || swapData.status > 89)) {
            throw console.error('Trade not able to be canceled');
        }
        const tradeRef = getSeed(swapData);
        console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        let cancelInstructionTransaction = new Transaction();

        for (let item = 0; item < swapData.items.length; item++) {
            let e = swapData.items[item];
            console.log('element', item, ' \n', e);

            switch (e.isNft) {
                case true:
                    if (e.owner.toBase58() === publicKey.toBase58() && e.status === 1) {
                        cancelInstructionTransaction.add(
                            (
                                await cIcancelNft(
                                    program,
                                    publicKey,
                                    e.mint,
                                    swapDataAccount,
                                    swapDataAccount_seed,
                                    swapDataAccount_bump
                                )
                            ).transaction
                        );
                        console.log('cancelNftinstruction added');
                    }
                    break;
                case false:
                    if (e.destinary.toBase58() === publicKey.toBase58() && e.status === 1) {
                        cancelInstructionTransaction.add(
                            (await cIcancelSol(program, publicKey, swapDataAccount, swapDataAccount_seed)).transaction
                        );
                        console.log('cancelSolinstruction added');
                    }
                    break;
            }
        }

        cancelInstructionTransaction.feePayer = publicKey;
        cancelInstructionTransaction.recentBlockhash = (
            await program.provider.connection.getLatestBlockhash()
        ).blockhash;
        console.log('cancelInstructionTransaction', cancelInstructionTransaction);

        if (cancelInstructionTransaction.instructions.length > 0) {
            try {
                const hash = await program.provider.send(cancelInstructionTransaction);
                console.log('hash', hash);
            } catch (error) {
                programCatchError(error);
            }
        } else {
            console.log('Nothing to cancel');
        }
    }, [publicKey, getProgram, getSeed]);

    const validateDeposit = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        sentData.initializer = publicKey;
        // console.log('sentData', sentData);

        const program = await getProgram();
        console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        if (swapData.status !== 0) throw console.error('Trade not in waiting to be validated');

        const tradeRef = getSeed(swapData);

        console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        console.log('swapDataAccount', swapDataAccount.toBase58());
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        try {
            const transactionHash = await program.rpc.validateDeposit(swapDataAccount_seed,{
                accounts: {
                    swapDataAccount: swapDataAccount,
                    signer: publicKey,
                },
            });

            console.log('transactionHash', transactionHash);
        } catch (error) {
            programCatchError(error);
        }
    }, [publicKey, getProgram, getSeed]);

    const claim = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        const program = await getProgram();
        console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log(swapData);

        if (swapData.status !== 1) throw console.error('Trade not in waiting for claim state');

        const tradeRef = getSeed(swapData);
        console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        let claimInstructionTransaction = new Transaction();

        for (let item = 0; item < swapData.items.length; item++) {
            let e = swapData.items[item];
            console.log('element', item, ' \n', e);

            switch (e.isNft) {
                case true:
                    if (e.destinary.toBase58() === publicKey.toBase58() && e.status === 1) {
                        claimInstructionTransaction.add(
                            (
                                await cIclaimNft(
                                    program,
                                    publicKey,
                                    e.mint,
                                    swapDataAccount,
                                    swapDataAccount_seed,
                                    swapDataAccount_bump
                                )
                            ).transaction
                        );
                        console.log('claimNftinstruction added');
                    }
                    break;
                case false:
                    if (e.destinary.toBase58() === publicKey.toBase58() && e.status === 1) {
                        claimInstructionTransaction.add(
                            (await cIclaimSol(program, publicKey, swapDataAccount, swapDataAccount_seed)).transaction
                        );
                        console.log('claimSolinstruction added');
                    }
                    break;
            }
        }

        claimInstructionTransaction.feePayer = publicKey;
        claimInstructionTransaction.recentBlockhash = (
            await program.provider.connection.getLatestBlockhash()
        ).blockhash;
        console.log('claimInstructionTransaction', claimInstructionTransaction);

        if (claimInstructionTransaction.instructions.length > 0) {
            try {
                const hash = await program.provider.send(claimInstructionTransaction);
                console.log('hash', hash);
            } catch (error) {
                programCatchError(error);
            }
        } else {
            console.log('Nothing to claim');
        }
    }, [publicKey, getProgram, getSeed]);

    const validateClaimed = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        const program = await getProgram();
        console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log('swapData', swapData);
        if (swapData.status !== 1) throw console.error('Trade not in waiting to be changed to claimed');

        const tradeRef = getSeed(swapData);
        console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );
        console.log('swapDataAccount', swapDataAccount.toBase58());
        console.log('swapDataAccount_bump', swapDataAccount_bump);
        try {
            const transactionHash = await program.rpc.validateClaimed(swapDataAccount_seed,{
                accounts: {
                    swapDataAccount: swapDataAccount,
                    signer: publicKey,
                },
            });

            console.log('transactionHash', transactionHash);
        } catch (error) {
            programCatchError(error);
        }
    }, [publicKey, getProgram, getSeed]);

    return (
        <div>
            <div>
                <br />
                <button onClick={initialize} disabled={!publicKey}>
                    initialize
                </button>
                <br />
                <button onClick={deposit} disabled={!publicKey}>
                    Deposit
                </button>
                <button onClick={validateDeposit} disabled={!publicKey}>
                    validateDeposit
                </button>
                <br />
                <button onClick={claim} disabled={!publicKey}>
                    claim
                </button>
                <button onClick={validateClaimed} disabled={!publicKey}>
                    validateClaimed
                </button>
                <br />
            </div>
            <div>
                <button onClick={cancel} disabled={!publicKey}>
                    Cancel
                </button>
            </div>
        </div>
    );
};
