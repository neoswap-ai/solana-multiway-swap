import { AnchorProvider, BN, Program, web3 } from '@project-serum/anchor';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { idl } from './idl';
import { opts } from './solana.const';
import { fullData, network, programId, sentData, swapDataAccountGiven, userKeypairs } from './solana.test';
import { NftSwapItem, SwapData } from './solana.types';
// import {
//     cIcancelNft,
//     cIcancelSol,
//     cIclaimNft,
//     cIclaimSol,
//     cIdepositNft,
//     cIdepositSol,
// } from './solana.programInstruction';
import { programCatchError } from './solana.errors';
import NeoSwap from 'neo-swap';
import { sendAllPopulateInstruction } from './solana.utils';
import { createAssociatedTokenAccount, createMint, mintToChecked } from '@solana/spl-token';
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
            console.log('PDA exist');
        } catch (error) {
            swapData = await getSeed(fullData, program);
            console.log('PDA not initialized');
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
        console.log('PDA :', allInitSendAllArray[0].tx.instructions[0]?.keys[0].pubkey.toBase58());

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

        {
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

    const all = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        const program = await getProgram();
        if (!program.provider.sendAll) throw console.error('no sendAndConfirm');

        let txHashArray: string[];
        let Daata: Array<{ userKeypair: Keypair; userNfts: Array<PublicKey>; amount?: number }> = [];

        // setTimeout(async () => {
        userKeypairs.forEach(async (userKeypair) => {
            let userNfts: PublicKey[] = [];
            setTimeout(async () => {
                const airdropSignature = await program.provider.connection.requestAirdrop(
                    userKeypair.publicKey,
                    2 * LAMPORTS_PER_SOL
                );
                console.log('airdrop done');

                // creating 10 Mints per user
                for (let mintNb = 0; mintNb < 9; mintNb++) {
                    setTimeout(async () => {
                        let mintPubkey = await createMint(
                            program.provider.connection, // conneciton
                            userKeypair, // fee payer
                            userKeypair.publicKey, // mint authority
                            userKeypair.publicKey, // freeze authority
                            0 // decimals
                        );
                        console.log('createMint done');

                        setTimeout(async () => {
                            let ata = await createAssociatedTokenAccount(
                                program.provider.connection, // connection
                                userKeypair, // fee payer
                                mintPubkey, // mint
                                userKeypair.publicKey // owner,
                            );
                            console.log('create ata done');

                            setTimeout(async () => {
                                let txhash = await mintToChecked(
                                    program.provider.connection, // connection
                                    userKeypair, // fee payer
                                    mintPubkey, // mint
                                    ata, // receiver (sholud be a token account)
                                    userKeypair.publicKey, // mint authority
                                    10, // amount. if your decimals is 8, you mint 10^8 for 1 token.
                                    0 // decimals
                                );
                                console.log('minted to  done');

                                txHashArray.push(txhash);
                                userNfts.push(mintPubkey);
                            }, 8000);
                        }, 8000);
                    }, 8000);
                }
            }, 8000);

            Daata.push({ userKeypair, userNfts });
        });

        let swapData: SwapData = {
            initializer: publicKey,
            items: [
                {
                    isNft: false,
                    amount: new BN(-1),
                    destinary: publicKey,
                    mint: publicKey,
                    owner: publicKey,
                    status: 1,
                },
            ],
            status: 80,
        };

        for (let users_nb = 0; users_nb < Daata.length; users_nb++) {
            const userData = Daata[users_nb];

            let solItemToAdd: NftSwapItem = {
                amount: new BN(1 / Daata.length),
                destinary: userData.userKeypair.publicKey,
                isNft: true,
                mint: userData.userKeypair.publicKey,
                owner: userData.userKeypair.publicKey,
                status: 0,
            };
            swapData.items.push(solItemToAdd);

            userData.userNfts.forEach((nftData) => {
                for (let users_nb2 = 0; users_nb2 < Daata.length; users_nb2++) {
                    const userData2 = Daata[users_nb2];

                    let nftItemToAdd: NftSwapItem = {
                        amount: new BN(1),
                        destinary: userData2.userKeypair.publicKey,
                        isNft: true,
                        mint: nftData,
                        owner: userData.userKeypair.publicKey,
                        status: 0,
                    };
                    swapData.items.push(nftItemToAdd);
                }
            });
        }
        // }, 8000);

        // Daata.forEach((userData) => {});

        const { allInitSendAllArray, pda } = await NeoSwap.allInitialize({
            program,
            signer: publicKey,
            swapData,
            // swapDataAccount: swapDataAccountGiven,
        });
        const sendInitArray = await sendAllPopulateInstruction(program, allInitSendAllArray);

        setTimeout(async () => {
            if (!program.provider.sendAll) throw console.error('no sendAndConfirm');

            const transactionHash = await program.provider.sendAll(sendInitArray);
            console.log('initialized', transactionHash);
            console.log('initialized  done');
        }, 8000);

        Daata.forEach(async (userData) => {
            const { depositSendAllArray } = await NeoSwap.deposit({
                program,
                signer: userData.userKeypair.publicKey,
                swapDataAccount: pda,
            });

            depositSendAllArray.forEach((ss) => {
                ss.signers = [userData.userKeypair];
            });

            let sendAllArray = await sendAllPopulateInstruction(program, depositSendAllArray);
            setTimeout(async () => {
                // try {
                if (!program.provider.sendAll) throw console.error('no sendAndConfirm');

                // const signed tx = await program.provider.
                const transactionHash = await program.provider.sendAll(sendAllArray);
                console.log(
                    'deposit user ',
                    userData.userKeypair.publicKey.toBase58(),
                    ' transactionHash',
                    transactionHash
                );
            }, 8000);
            setTimeout(() => {
                console.log('deposited done');
            }, 8000);

            // } catch (error) {
            //     programCatchError(error);
            //     throw console.error(error);
            // }
        });

        const { allClaimSendAllArray } = await NeoSwap.claimAndClose({
            program,
            signer: publicKey,
            swapDataAccount: pda,
        });

        let claimAndCloseArraysendAllArray = await sendAllPopulateInstruction(program, allClaimSendAllArray);

        // try {
        if (!program.provider.sendAll) throw console.error('no sendAndConfirm');

        // const signed tx = await program.provider.
        const claimAndCloseHash = await program.provider.sendAll(claimAndCloseArraysendAllArray);
        setTimeout(() => {
            console.log('deposited done');
        }, 8000);

        console.log('claimAndCloseHash :', claimAndCloseHash);
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
                <button onClick={all} disabled={!publicKey}>
                    all
                </button>
            </div>
        </div>
    );
};

export default Solana;
