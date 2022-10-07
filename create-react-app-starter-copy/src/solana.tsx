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
import { cIclaimNft, cIclaimSol, cIdepositNft, cIdepositSol } from './solana.programInstruction';

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

    const getProgram = useCallback(async () => {
        return new Program(idl, programId, await getProvider());
    }, [getProvider]);

    const getSeed = useCallback((sentData: SwapData) => {
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
            if (String(error).includes('0x0')) {
                console.error('PDA is already existing with this tradeRef', tradeRef, '\n', error);
            } else {
                console.error('error', error);
            }
        }
    }, [publicKey, getProgram, getSeed]);

    const deposit = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        const program = await getProgram();
        console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;

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

        console.log('SwapData', swapData);

        let depositNFTInstructionTransaction = new Transaction();

        for (let item = 0; item < swapData.items.length; item++) {
            let e = swapData.items[item];
            console.log('element', item, ' \n', e);

            switch (e.isNft) {
                case true:
                    if (e.owner.toBase58() === publicKey.toBase58() && e.status === 0) {
                        depositNFTInstructionTransaction.add(
                            (await cIdepositNft(program, publicKey, e.mint, swapDataAccount)).transaction
                        );
                    }
                    break;
                case false:
                    if (e.owner.toBase58() === publicKey.toBase58() && e.status === 0) {
                        depositNFTInstructionTransaction.add(await cIdepositSol(program, publicKey, swapDataAccount));
                    }
                    break;
            }
        }

        depositNFTInstructionTransaction.feePayer = publicKey;
        depositNFTInstructionTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        console.log('depositNFTInstructionTransaction', depositNFTInstructionTransaction);

        if (depositNFTInstructionTransaction.instructions.length > 0) {
            const hash = await program.provider.send(depositNFTInstructionTransaction);
            console.log('hash\n', hash);
        } else {
            console.log('Nothing to deposit');
        }
    }, [publicKey, getProgram, getSeed, connection]);

    const validateTrade = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        sentData.initializer = publicKey;
        // console.log('sentData', sentData);

        const program = await getProgram();
        console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;

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

        const transactionHash = await program.rpc.validateDeposit({
            accounts: {
                swapDataAccount: swapDataAccount,
                signer: publicKey,
            },
        });

        console.log('transactionHash', transactionHash);
        // try {
        // } catch (error) {
        //     if (String(error).includes('0x0')) {
        //         console.error('PDA is already existing with this tradeRef', tradeRef, '\n', error);
        //     } else {
        //         console.error('error', error);
        //     }
        // }
    }, [publicKey, getProgram, getSeed]);

    const claim = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        const program = await getProgram();
        console.log('program', program);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccountGiven)) as SwapData;
        console.log(swapData);

        const tradeRef = getSeed(swapData);
        console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        let claimNFTInstructionTransaction = new Transaction();

        for (let item = 0; item < swapData.items.length; item++) {
            let e = swapData.items[item];
            console.log('element', item, ' \n', e);

            switch (e.isNft) {
                case true:
                    if (e.destinary.toBase58() === publicKey.toBase58() && e.status === 1) {
                        claimNFTInstructionTransaction.add(
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
                        claimNFTInstructionTransaction.add(
                            (await cIclaimSol(program, publicKey, swapDataAccount)).transaction
                        );
                        console.log('claimSolinstruction added');
                    }
                    break;
            }
        }

        claimNFTInstructionTransaction.feePayer = publicKey;
        claimNFTInstructionTransaction.recentBlockhash = (
            await program.provider.connection.getLatestBlockhash()
        ).blockhash;
        console.log('claimNFTInstructionTransaction', claimNFTInstructionTransaction);

        if (claimNFTInstructionTransaction.instructions.length > 0) {
            const hash = await program.provider.send(claimNFTInstructionTransaction);
            console.log('hash', hash);
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

        const transactionHash = await program.rpc.validateClaimed({
            accounts: {
                swapDataAccount: swapDataAccount,
                signer: publicKey,
            },
        });

        console.log('transactionHash', transactionHash);
    }, [publicKey, getProgram, getSeed]);

    return (
        <div>
            <br />
            <button onClick={initialize} disabled={!publicKey}>
                initialize
            </button>
            <br />
            <button onClick={deposit} disabled={!publicKey}>
                Deposit
            </button>
            <br />
            <button onClick={validateTrade} disabled={!publicKey}>
                validateTrade
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
    );
};
