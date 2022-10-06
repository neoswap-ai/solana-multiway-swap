import { BN, Program, Provider, utils, web3 } from '@project-serum/anchor';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { FC, useCallback } from 'react';
import { idl } from './idl';
import { CONST_PROGRAM, splAssociatedTokenAccountProgramId, programId, opts, network, sentData } from './solana.const';
import { SwapData } from './solana.types';
import { cIdepositNFT, cIdepositSol } from './solana.programInstruction';

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
        // console.log('publicKey', publicKey.toBase58());

        console.log('sentData', sentData);

        const program = await getProgram();

        console.log('program', program);
        // const tradeRef =
        //     CONST_PROGRAM +
        //     sentData.userA?.toString().slice(0, 2) +
        //     sentData.userANft?.mint.toString().slice(0, 2) +
        //     sentData.userB?.toString().slice(0, 2) +
        //     sentData.userBNft?.mint.toString().slice(0, 2) +
        //     sentData.userC?.toString().slice(0, 2) +
        //     sentData.userCNft?.mint.toString().slice(0, 2);

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

        const swapData: SwapData = (await program.account.swapData.fetch(swapDataAccount)) as SwapData;
        console.log('SwapData', swapData);

        let depositNFTInstructionTransaction = new Transaction();

        for (let item = 0; item < swapData.items.length; item++) {
            let e = swapData.items[item];
            console.log('element', item, ' \n', e);

            switch (e.isNft) {
                case true:
                    if (e.owner.toBase58() === publicKey.toBase58() && e.status === 0) {
                        depositNFTInstructionTransaction.add(
                            (await cIdepositNFT(program, publicKey, e.mint, swapDataAccount)).transaction
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
            console.log('hash', hash);
        } else {
            console.log('Nothing to deposit');
        }
    }, [publicKey, getProgram, getSeed, connection]);

    const claim = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();
        // console.log('publicKey', publicKey.toBase58());

        console.log('sentData', sentData);

        const program = await getProgram();

        console.log('program', program);
        // const tradeRef =
        //     CONST_PROGRAM +
        //     sentData.userA?.toString().slice(0, 2) +
        //     sentData.userANft?.mint.toString().slice(0, 2) +
        //     sentData.userB?.toString().slice(0, 2) +
        //     sentData.userBNft?.mint.toString().slice(0, 2) +
        //     sentData.userC?.toString().slice(0, 2) +
        //     sentData.userCNft?.mint.toString().slice(0, 2);

        const tradeRef = getSeed(sentData);
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
        // console.log('swapData.userAAmount.toNumber()', Math.abs(swapData.userAAmount.toNumber()));
        // // let mint: PublicKey;
        // // let amount: BN;
        // console.log('swapData.userA', swapData.userA.toBase58());
        // console.log('swapDataAccount', swapDataAccount.toBase58());
        // console.log('publickey', publicKey.toBase58());

        // // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // let { transaction: createClaimNFTx, ata: userAta } = await claimNFTInstruction(
        //     program,
        //     publicKey,
        //     swapData.userBNft.mint,
        //     swapDataAccount,
        //     swapDataAccount_seed,
        //     swapDataAccount_bump
        // );

        // if (swapData.userAAmount.toNumber() < 0) {
        //     const getSolInstruction = program.instruction.claim(
        //         swapDataAccount_seed,
        //         swapDataAccount_bump,
        //         new BN(Math.abs(swapData.userAAmount.toNumber())),
        //         false,
        //         {
        //             accounts: {
        //                 systemProgram: web3.SystemProgram.programId,
        //                 tokenProgram: TOKEN_PROGRAM_ID,
        //                 swapDataAccount: swapDataAccount,
        //                 pdaTokenAccount: swapDataAccount,
        //                 signer: publicKey,
        //                 userTokenAccountToReceive: publicKey,
        //             },
        //         }
        //     );

        //     createClaimNFTx.add(getSolInstruction);
        // }
        // createClaimNFTx.feePayer = publicKey;
        // createClaimNFTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        // const hash1 = await program.provider.send(createClaimNFTx);
        // console.log('hash1', hash1);
    }, [publicKey, getProgram, getSeed, connection]);

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
            <button onClick={claim} disabled={!publicKey}>
                claim
            </button>
        </div>
    );
};
