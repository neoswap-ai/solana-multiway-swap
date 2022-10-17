import { Program, Provider, utils, web3 } from '@project-serum/anchor';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { idl } from './idl';
import { splAssociatedTokenAccountProgramId, opts } from './solana.const';
import { CONST_PROGRAM, fullData, network, programId, sentData, swapDataAccountGiven } from './solana.test';
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

window.Buffer = window.Buffer || require('buffer').Buffer;

export const Solana: FC = () => {
    const { publicKey } = useWallet();
    const anchorWallet = useAnchorWallet();

    const getProvider = useCallback(async (): Promise<Provider> => {
        if (!anchorWallet) {
            throw new WalletNotConnectedError();
        } else {
            return new Provider(
                new Connection(clusterApiUrl(network), opts.preflightCommitment),
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

    const initInitialize = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        sentData.initializer = publicKey;
        console.log('sentData', sentData);
        // let sum = new BN(0);
        // for (let index = 0; index < sentData.items.length; index++) {
        //     const element = sentData.items[index];
        //     if (!element.isNft) {
        //         sum = sum.add(element.amount);
        //     }
        // }
        // if (sum.toNumber() !== 0) {
        //     console.log('sum', sum.toNumber());
        //     throw console.error('balance at the end of trade not null');
        // }

        const program = await getProgram();

        const tradeRef = getSeed(fullData);
        console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        console.log('swapDataAccount', swapDataAccount.toBase58());
        console.log('swapDataAccount_bump', swapDataAccount_bump);
        // let newSentData = sentData;
        // newSentData.items = new Array(sentData.items[0]);
        // console.log("newSentData",newSentData);

        try {
            const transactionHash = await program.rpc.initInitialize(
                swapDataAccount_seed,
                swapDataAccount_bump,
                sentData,
                7,
                {
                    accounts: {
                        swapDataAccount: swapDataAccount,
                        signer: publicKey,
                        systemProgram: web3.SystemProgram.programId,
                        splTokenProgram: splAssociatedTokenAccountProgramId,
                    },
                }
            );
            console.log('initialize transactionHash', transactionHash);
        } catch (error) {
            programCatchError(error);
        }
    }, [publicKey, getProgram, getSeed]);

    const addInitialize = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        sentData.initializer = publicKey;

        const program = await getProgram();

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log('SwapData', swapData);
        if (swapData.status !== 80) throw console.error('Trade not in waiting for initialized state');

        const tradeRef = getSeed(fullData);
        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        console.log('swapDataAccount', swapDataAccount.toBase58());
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        let depositTransaction = new Transaction();
        for (let index = 1; index < fullData.items.length; index++) {
            const element = fullData.items[index];
            depositTransaction.add(
                program.instruction.initializeAdd(swapDataAccount_seed, swapDataAccount_bump, element, {
                    accounts: {
                        swapDataAccount: swapDataAccount,
                        signer: publicKey,
                    },
                })
            );
        }

        try {
            depositTransaction.feePayer = publicKey;
            depositTransaction.recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;
            const transactionHash = await program.provider.send(depositTransaction);

            console.log('initialize transactionHash', transactionHash);
        } catch (error) {
            programCatchError(error);
        }
    }, [publicKey, getProgram, getSeed]);

    const verifyInitialize = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        sentData.initializer = publicKey;
        console.log('sentData', sentData);

        const program = await getProgram();
        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log('SwapData', swapData);
        if (swapData.status !== 80) throw console.error('Trade not in waiting for initialized state');

        const tradeRef = getSeed(fullData);
        console.log('tradeRef', tradeRef);
        if (getSeed(fullData) !== getSeed(swapData)) {
            console.log('data missing');
        }
        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        console.log('swapDataAccount', swapDataAccount.toBase58());
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        try {
            const transactionHash = await program.rpc.validateInitialize(swapDataAccount_seed, swapDataAccount_bump, {
                accounts: {
                    swapDataAccount: swapDataAccount,
                    signer: publicKey,
                    // systemProgram: web3.SystemProgram.programId,
                    // splTokenProgram: splAssociatedTokenAccountProgramId,
                },
            });
            console.log('initialize transactionHash', transactionHash);
        } catch (error) {
            programCatchError(error);
        }
    }, [publicKey, getProgram, getSeed]);

    const deposit = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        const program = await getProgram();
        // console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log('SwapData', swapData);
        if (swapData.status !== 0) throw console.error('Trade not in waiting for deposit state');

        const tradeRef = getSeed(swapData);
        // console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        // console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        console.log('swapDataAccount', swapDataAccount.toBase58());
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        let depositInstructionTransaction = new Transaction();

        for (let item = 0; item < swapData.items.length; item++) {
            let e = swapData.items[item];
            // console.log('element', item, ' \n', e);

            switch (e.isNft) {
                case true:
                    if (e.owner.toBase58() === publicKey.toBase58() && e.status === 0) {
                        depositInstructionTransaction.add(
                            (
                                await cIdepositNft(
                                    program,
                                    publicKey,
                                    e.mint,
                                    swapDataAccount,
                                    swapDataAccount_seed,
                                    swapDataAccount_bump
                                )
                            ).transaction
                        );
                    }
                    break;
                case false:
                    if (e.owner.toBase58() === publicKey.toBase58() && e.status === 0) {
                        depositInstructionTransaction.add(
                            await cIdepositSol(
                                program,
                                publicKey,
                                swapDataAccount,
                                swapDataAccount_seed,
                                swapDataAccount_bump
                            )
                        );
                    }
                    break;
            }
        }

        depositInstructionTransaction.feePayer = publicKey;
        depositInstructionTransaction.recentBlockhash = (
            await program.provider.connection.getLatestBlockhash()
        ).blockhash;

        if (depositInstructionTransaction.instructions.length > 0) {
            try {
                const hash = await program.provider.send(depositInstructionTransaction);
                console.log('deposit transaction hash\n', hash);
            } catch (error) {
                programCatchError(error);
            }
        } else {
            console.log('Nothing to deposit');
        }
    }, [publicKey, getProgram, getSeed]);

    const read = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        const program = await getProgram();

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log('SwapData', swapData);
    }, [publicKey, getProgram]);

    const cancel = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        const program = await getProgram();
        // console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log('SwapData', swapData);
        if (!(swapData.status === 0 || swapData.status === 90)) {
            throw console.error('Trade not able to be canceled');
        }
        const tradeRef = getSeed(swapData);
        // console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        // console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        let cancelInstructionTransaction = new Transaction();

        for (let item = 0; item < swapData.items.length; item++) {
            let e = swapData.items[item];
            // console.log('element', item, ' \n', e);

            switch (e.isNft) {
                case true:
                    if (e.owner.toBase58() === publicKey.toBase58() && (e.status === 1 || e.status === 0)) {
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
                    if (e.destinary.toBase58() === publicKey.toBase58() && (e.status === 1 || e.status === 0)) {
                        cancelInstructionTransaction.add(
                            (
                                await cIcancelSol(
                                    program,
                                    publicKey,
                                    swapDataAccount,
                                    swapDataAccount_seed,
                                    swapDataAccount_bump
                                )
                            ).transaction
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
        // console.log('cancelInstructionTransaction', cancelInstructionTransaction);

        if (cancelInstructionTransaction.instructions.length > 0) {
            try {
                const hash = await program.provider.send(cancelInstructionTransaction);
                console.log('cancel Transaction hash', hash);
            } catch (error) {
                programCatchError(error);
            }
        } else {
            console.log('Nothing to cancel');
        }
    }, [publicKey, getProgram, getSeed]);

    const validateCancel = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        sentData.initializer = publicKey;
        // console.log('sentData', sentData);

        const program = await getProgram();
        // console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log('swapData', swapData);
        if (swapData.status !== 90) throw console.error('Trade not in waiting to be cancelled');

        const tradeRef = getSeed(swapData);

        // console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        // console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        // console.log('swapDataAccount', swapDataAccount.toBase58());
        // console.log('swapDataAccount_bump', swapDataAccount_bump);

        try {
            const transactionHash = await program.rpc.validateCancelled(swapDataAccount_seed, swapDataAccount_bump, {
                accounts: {
                    systemProgram: web3.SystemProgram.programId,
                    splTokenProgram: splAssociatedTokenAccountProgramId,
                    swapDataAccount: swapDataAccount,
                    signer: publicKey,
                },
            });

            console.log('validateCancelled transactionHash', transactionHash);
        } catch (error) {
            programCatchError(error);
        }
    }, [publicKey, getProgram, getSeed]);

    const validateDeposit = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        sentData.initializer = publicKey;
        // console.log('sentData', sentData);

        const program = await getProgram();
        // console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log('swapData', swapData);
        if (swapData.status !== 0) throw console.error('Trade not in waiting to be validated');

        const tradeRef = getSeed(swapData);

        // console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        // console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        console.log('swapDataAccount', swapDataAccount.toBase58());
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        try {
            const transactionHash = await program.rpc.validateDeposit(swapDataAccount_seed, swapDataAccount_bump, {
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
        // console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log('swapData :', swapData);
        if (swapData.status !== 1) throw console.error('Trade not in waiting for claim state');

        const tradeRef = getSeed(swapData);
        // console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        // console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        // console.log('swapDataAccount_bump', swapDataAccount_bump);

        let claimInstructionTransaction = new Transaction();

        for (let item = 0; item < swapData.items.length; item++) {
            let e = swapData.items[item];
            // console.log('element', item, ' \n', e);

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
                            (
                                await cIclaimSol(
                                    program,
                                    publicKey,
                                    swapDataAccount,
                                    swapDataAccount_seed,
                                    swapDataAccount_bump
                                )
                            ).transaction
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
        // console.log('claimInstructionTransaction', claimInstructionTransaction);

        if (claimInstructionTransaction.instructions.length > 0) {
            try {
                const hash = await program.provider.send(claimInstructionTransaction);
                console.log('claim transaction hash', hash);
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
        // console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log('swapData', swapData);
        if (swapData.status !== 1) throw console.error('Trade not in waiting to be changed to claimed');

        const tradeRef = getSeed(swapData);
        // console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        // console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );
        // console.log('swapDataAccount', swapDataAccount.toBase58());
        // console.log('swapDataAccount_bump', swapDataAccount_bump);
        try {
            const transactionHash = await program.rpc.validateClaimed(swapDataAccount_seed, swapDataAccount_bump, {
                accounts: {
                    systemProgram: web3.SystemProgram.programId,
                    splTokenProgram: splAssociatedTokenAccountProgramId,
                    swapDataAccount: swapDataAccount,
                    signer: publicKey,
                },
            });

            console.log('validateClaimed transaction Hash', transactionHash);
        } catch (error) {
            programCatchError(error);
        }
    }, [publicKey, getProgram, getSeed]);

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
                <button onClick={validateDeposit} disabled={!publicKey}>
                    validateDeposit
                </button>
                <br />
            </div>
            <div>
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
                <button onClick={validateCancel} disabled={!publicKey}>
                    validateCancel
                </button>
            </div>
        </div>
    );
};
