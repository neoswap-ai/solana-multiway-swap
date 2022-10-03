import { BN, Program, Provider, utils, web3 } from '@project-serum/anchor';
import { WalletAdapterNetwork, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    clusterApiUrl,
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import {
    createTransferCheckedInstruction,
    createAssociatedTokenAccountInstruction,
    createAssociatedTokenAccount,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { FC, useCallback } from 'react';
import { idl } from './idl';
import { CONST_PROGRAM, splAssociatedTokenAccountProgramId } from './solana.const';
import { NftSwap, SwapData } from './solana.types';
import {
    createInstructionPdaAta,
    createInstructionPdasolAta,
    createTokenAccountCustom,
    findAtaUserFromMint,
} from './solana.utils';
import { claimNFTInstruction, depositNFTInstruction, depositTokenInstruction } from './solana.programInstruction';

window.Buffer = window.Buffer || require('buffer').Buffer;

const programId = new PublicKey('BRBpGfF6xmQwAJRfx7MKPZq1KEgTvVMfcNXHbs42w8Tz');

const opts = {
    preflightCommitment: 'confirmed' as any,
};
const network = WalletAdapterNetwork.Devnet;

export const Solana: FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, wallet } = useWallet();
    const anchorWallet = useAnchorWallet();

    const getProvider = async (): Promise<Provider> => {
        if (!anchorWallet) {
            throw new WalletNotConnectedError();
        } else {
            return new Provider(
                new Connection(clusterApiUrl(network), 'confirmed'),
                anchorWallet,
                opts.preflightCommitment
            );
        }
    };

    const getProgram = async () => {
        return new Program(idl, programId, await getProvider());
    };

    const initialize = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        // console.log('publicKey', publicKey.toBase58());
        const sentData: SwapData = {
            initializer: publicKey,
            isComplete: false,
            userA: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
            userAAmount: new BN(-1),
            userANft:
                // [
                {
                    mint: new PublicKey('7CZRVmsPoTs4bDjLGs2jMunBg54Lv1bdvmtWQVrFur5G'),
                    destinary: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
                } as NftSwap,
            // ]
            userB: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
            userBAmount: new BN(1),
            userBNft:
                // [
                {
                    mint: new PublicKey('DwPKNrMPg3ocBvzhrpAZmcKAjUiFcA1okpRnBACrucew'),
                    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
                } as NftSwap,
            // ],

            userC: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
            userCAmount: new BN(2),
            userCNft:
                // [
                {
                    mint: new PublicKey('UUCjpbeFwockd4RKYj8DmxSWWcxHrG5cJW1uoAhjeDc'),
                    destinary: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
                } as NftSwap,
            // ],
        };
        console.log('sentData', sentData);

        // 890880 lamports as of 2022-09-01
        const lamports = await connection.getMinimumBalanceForRentExemption(0);

        const program = await getProgram();
        console.log('program', program);
        const tradeRef =
            CONST_PROGRAM +
            sentData.userA?.toString().slice(0, 2) +
            sentData.userANft?.mint.toString().slice(0, 2) +
            sentData.userB?.toString().slice(0, 2) +
            sentData.userBNft?.mint.toString().slice(0, 2) +
            sentData.userC?.toString().slice(0, 2) +
            sentData.userCNft?.mint.toString().slice(0, 2);

        console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        console.log('swapDataAccount', swapDataAccount.toBase58());
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        // console.log('web3.SystemProgram.programId', web3.SystemProgram.programId.toBase58());
        // console.log('splAssociatedTokenAccountProgramId', splAssociatedTokenAccountProgramId.toBase58());
        try {
            const ix = await program.rpc.initialize(swapDataAccount_seed, swapDataAccount_bump, sentData, {
                accounts: {
                    swapDataAccount: swapDataAccount,
                    signer: publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: splAssociatedTokenAccountProgramId,
                },
            });
            console.log('ix', ix);
        } catch (error) {
            if (String(error).includes('0x0')) {
                console.error('PDA is already existing with this tradeRef', tradeRef, '\n', error);
            } else {
                console.error('error', error);
            }
        }

        // let tx = new Transaction().add(ix);
        // let tx2 = tx;
        // tx2.feePayer = publicKey;
        // tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        // const simulation = await connection.simulateTransaction(tx2);
        // console.log('simulation', simulation);

        // const res = await sendTransaction(tx, connection);

        // console.log('res', res);

        //
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicKey, connection]);

    const deposit = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        // console.log('publicKey', publicKey.toBase58());

        const sentData: SwapData = {
            initializer: publicKey,
            isComplete: false,
            userA: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
            userAAmount: new BN(-1),
            userANft:
                // [
                {
                    mint: new PublicKey('7CZRVmsPoTs4bDjLGs2jMunBg54Lv1bdvmtWQVrFur5G'),
                    destinary: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
                } as NftSwap,
            // ]
            userB: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
            userBAmount: new BN(1),
            userBNft:
                // [
                {
                    mint: new PublicKey('DwPKNrMPg3ocBvzhrpAZmcKAjUiFcA1okpRnBACrucew'),
                    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
                } as NftSwap,
            // ],

            userC: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
            userCAmount: new BN(2),
            userCNft:
                // [
                {
                    mint: new PublicKey('UUCjpbeFwockd4RKYj8DmxSWWcxHrG5cJW1uoAhjeDc'),
                    destinary: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
                } as NftSwap,
            // ],
        };
        console.log('sentData', sentData);

        // 890880 lamports as of 2022-09-01
        const lamports = await connection.getMinimumBalanceForRentExemption(0);

        const program = await getProgram();

        console.log('program', program);
        const tradeRef =
            CONST_PROGRAM +
            sentData.userA?.toString().slice(0, 2) +
            sentData.userANft?.mint.toString().slice(0, 2) +
            sentData.userB?.toString().slice(0, 2) +
            sentData.userBNft?.mint.toString().slice(0, 2) +
            sentData.userC?.toString().slice(0, 2) +
            sentData.userCNft?.mint.toString().slice(0, 2);

        console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        console.log('swapDataAccount', swapDataAccount.toBase58());
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccount)) as SwapData;

        console.log('SwapData', swapData);
        let mint: PublicKey;
        let amount: BN;
        console.log('swapData.userA', swapData.userA.toBase58());
        console.log('publickey', publicKey.toBase58());

        if (swapData.userA.toBase58() === publicKey.toBase58()) {
            console.log('userA');

            mint = swapData.userANft.mint;
            amount = swapData.userAAmount;
        } else if (swapData.userB.toBase58() === publicKey.toBase58()) {
            console.log('userB');

            mint = swapData.userBNft.mint;
            amount = swapData.userBAmount;
        } else if (swapData.userC.toBase58() === publicKey.toBase58()) {
            console.log('userC');

            mint = swapData.userCNft.mint;
            amount = swapData.userCAmount;
        } else {
            throw Error('User not known in the trade');
        }

        let txCreateMintAte = new Transaction();
        let createSolAccount;
        txCreateMintAte.add((await depositNFTInstruction(program, publicKey, mint, swapDataAccount)).transaction);

        if (amount.toNumber() > 0) {
            console.log('token to send');
            // const pdaSolAta = await createTokenAccountCustom(program.provider, swapDataAccount);
            // createSolAccount = await createInstructionPdasolAta(publicKey, program.provider);
            txCreateMintAte.add(
                web3.SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: swapDataAccount,
                    lamports: amount.toNumber() * 10 ** 9,
                })
                // await depositTokenInstruction(program, publicKey, mint, swapData.userAAmount.toNumber())
            );
        }
        txCreateMintAte.feePayer = publicKey;
        txCreateMintAte.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        const hash = await program.provider.send(txCreateMintAte);
        console.log('txCreateMintAte', txCreateMintAte);

        // const hash = await program.provider.send(txCreateMintAte);
        console.log('hash', hash);
        // const pdaMintAta = await getAssociatedTokenAddress(swapData.userANft.mint, swapDataAccount);

        // const pdaMintAta = await findAtaUserFromMint(program, swapData.userANft.mint, swapDataAccount);
        // console.log('pdaMintAta', pdaMintAta);

        // console.log('web3.SystemProgram.programId', web3.SystemProgram.programId.toBase58());
        // console.log('splAssociatedTokenAccountProgramId', splAssociatedTokenAccountProgramId.toBase58());
        // try {
        //     const ix = await program.rpc.initialize(swapDataAccount_seed, swapDataAccount_bump, sentData, {
        //         accounts: {
        //             swapDataAccount: swapDataAccount,
        //             signer: publicKey,
        //             systemProgram: web3.SystemProgram.programId,
        //             tokenProgram: splAssociatedTokenAccountProgramId,
        //         },
        //     });
        //     console.log('ix', ix);
        // } catch (error) {
        //     if (String(error).includes('0x0')) {
        //         console.error('PDA is already existing with this tradeRef', tradeRef, '\n', error);
        //     } else {
        //         console.error('error', error);
        //     }
        // }

        // let tx = new Transaction().add(ix);
        // let tx2 = tx;
        // tx2.feePayer = publicKey;
        // tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        // const simulation = await connection.simulateTransaction(tx2);
        // console.log('simulation', simulation);

        // const res = await sendTransaction(tx, connection);

        // console.log('res', res);

        //
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicKey, connection]);

    const claim = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        // console.log('publicKey', publicKey.toBase58());

        const sentData: SwapData = {
            initializer: publicKey,
            isComplete: false,
            userA: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
            userAAmount: new BN(-1),
            userANft:
                // [
                {
                    mint: new PublicKey('7CZRVmsPoTs4bDjLGs2jMunBg54Lv1bdvmtWQVrFur5G'),
                    destinary: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
                } as NftSwap,
            // ]
            userB: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
            userBAmount: new BN(1),
            userBNft:
                // [
                {
                    mint: new PublicKey('DwPKNrMPg3ocBvzhrpAZmcKAjUiFcA1okpRnBACrucew'),
                    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
                } as NftSwap,
            // ],

            userC: new PublicKey('GbBKQ9nok57CUKJeCgugoCbucQiuuoGZk1prrrbz3oqE'),
            userCAmount: new BN(2),
            userCNft:
                // [
                {
                    mint: new PublicKey('UUCjpbeFwockd4RKYj8DmxSWWcxHrG5cJW1uoAhjeDc'),
                    destinary: new PublicKey('4vc8rbxj2hsxPEPQp8QtfCof1vmAFL2ccL8J2aAAQfS8'),
                } as NftSwap,
            // ],
        };
        console.log('sentData', sentData);

        // 890880 lamports as of 2022-09-01
        const lamports = await connection.getMinimumBalanceForRentExemption(0);

        const program = await getProgram();

        console.log('program', program);
        const tradeRef =
            CONST_PROGRAM +
            sentData.userA?.toString().slice(0, 2) +
            sentData.userANft?.mint.toString().slice(0, 2) +
            sentData.userB?.toString().slice(0, 2) +
            sentData.userBNft?.mint.toString().slice(0, 2) +
            sentData.userC?.toString().slice(0, 2) +
            sentData.userCNft?.mint.toString().slice(0, 2);

        console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        console.log('swapDataAccount_bump', swapDataAccount_bump);

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccount)) as SwapData;

        console.log('SwapData', swapData);
        console.log('swapDataAccount_seed', swapDataAccount_seed);
        console.log('swapDataAccount_bump', swapDataAccount_bump);
        console.log('swapData.userAAmount.toNumber()', Math.abs(swapData.userAAmount.toNumber()));
        // let mint: PublicKey;
        // let amount: BN;
        console.log('swapData.userA', swapData.userA.toBase58());
        console.log('swapDataAccount', swapDataAccount.toBase58());
        console.log('publickey', publicKey.toBase58());

        let { transaction: createAccountTx, ata: userAta } = await claimNFTInstruction(
            program,
            publicKey,
            swapData.userANft.mint
        );
        createAccountTx.feePayer = publicKey;
        createAccountTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        if (createAccountTx.instructions.length !== 0) {
            const hash1 = await program.provider.send(createAccountTx);
            console.log('hash1', hash1);
        }
        let swapDataAta = await findAtaUserFromMint(program, swapData.userANft.mint, swapDataAccount);
        console.log('swapDataAta', swapDataAta.toBase58());

        const hash = await program.rpc.claim(swapDataAccount_seed, swapDataAccount_bump, new BN(1), true, {
            accounts: {
                systemProgram: web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                swapDataAccount: swapDataAccount,
                pdaTokenAccount: swapDataAta,
                signer: publicKey,
                userTokenAccountToReceive: userAta,
            },
        });
        console.log('hash', hash);

        // let txCreateMintAte = new Transaction();
        if (swapData.userAAmount.toNumber() < 0) {
            const hash = await program.rpc.claim(
                swapDataAccount_seed,
                swapDataAccount_bump,
                new BN(Math.abs(swapData.userAAmount.toNumber())),
                false,
                {
                    accounts: {
                        systemProgram: web3.SystemProgram.programId,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        swapDataAccount: swapDataAccount,
                        pdaTokenAccount: swapDataAccount,
                        signer: publicKey,
                        userTokenAccountToReceive: publicKey,
                    },
                }
            );
            console.log('hash', hash);
        }

        // txCreateMintAte.feePayer = publicKey;
        // txCreateMintAte.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        // const hash = await program.provider.send(txCreateMintAte);
        // // const hash = await program.provider.send(txCreateMintAte);
        // console.log('txCreateMintAte', txCreateMintAte);

        // const pdaMintAta = await getAssociatedTokenAddress(swapData.userANft.mint, swapDataAccount);

        // const pdaMintAta = await findAtaUserFromMint(program, swapData.userANft.mint, swapDataAccount);
        // console.log('pdaMintAta', pdaMintAta);

        // console.log('web3.SystemProgram.programId', web3.SystemProgram.programId.toBase58());
        // console.log('splAssociatedTokenAccountProgramId', splAssociatedTokenAccountProgramId.toBase58());
        // try {
        //     const ix = await program.rpc.initialize(swapDataAccount_seed, swapDataAccount_bump, sentData, {
        //         accounts: {
        //             swapDataAccount: swapDataAccount,
        //             signer: publicKey,
        //             systemProgram: web3.SystemProgram.programId,
        //             tokenProgram: splAssociatedTokenAccountProgramId,
        //         },
        //     });
        //     console.log('ix', ix);
        // } catch (error) {
        //     if (String(error).includes('0x0')) {
        //         console.error('PDA is already existing with this tradeRef', tradeRef, '\n', error);
        //     } else {
        //         console.error('error', error);
        //     }
        // }

        // let tx = new Transaction().add(ix);
        // let tx2 = tx;
        // tx2.feePayer = publicKey;
        // tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        // const simulation = await connection.simulateTransaction(tx2);
        // console.log('simulation', simulation);

        // const res = await sendTransaction(tx, connection);

        // console.log('res', res);

        //
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicKey, connection]);

    const onClick = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        // 890880 lamports as of 2022-09-01
        const lamports = await connection.getMinimumBalanceForRentExemption(0);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: Keypair.generate().publicKey,
                lamports,
            })
        );

        // const {
        //   context: { slot: minContextSlot },
        //   value: { blockhash, lastValidBlockHeight },
        // } = await connection.getLatestBlockhashAndContext();

        const signature = await sendTransaction(transaction, connection);
        console.log('signature', signature);

        // await connection.confirmTransaction({
        //   blockhash,
        //   lastValidBlockHeight,
        //   signature,
        // });
    }, [publicKey, sendTransaction, connection]);

    return (
        <div>
            <button onClick={onClick} disabled={!publicKey}>
                Send SOL to a random address!
            </button>
            <br />
            <button onClick={initialize} disabled={!publicKey}>
                initialize
            </button>{' '}
            {/* <br /> */}
            <button onClick={deposit} disabled={!publicKey}>
                Deposit
            </button>
            <br />
            <button onClick={claim} disabled={!publicKey}>
                claim
            </button>
            {/* <button onClick={deposit} disabled={!publicKey}>
            Deposit
          </button> */}
        </div>
    );
};
