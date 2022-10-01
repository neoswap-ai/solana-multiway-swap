import { BN, Program, Provider, utils, web3 } from '@project-serum/anchor';
import { WalletAdapterNetwork, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { idl } from './idl';
import { splAssociatedTokenAccountProgramId } from './solana.const';
import { NftSwap, SwapData } from './solana.types';

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
        const userANft: NftSwap = {
            mint: new PublicKey('DxKz618SSAiswCsUPZkmKDU9kUxXkNUC9uDfZYNEF6mY'),
            destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
        };

        
        const sentData: SwapData = {
            initializer: publicKey,
            isComplete: false,
            userA: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
            userAAmount: new BN(-1),
            userANft:
                // [
                userANft,
            // {
            //     nft: new PublicKey('7CZRVmsPoTs4bDjLGs2jMunBg54Lv1bdvmtWQVrFur5G'),
            //     destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
            // },
            // ],
            userB: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
            userBAmount: new BN(1),
            userBNft:
                // [
                {
                    mint: new PublicKey('DwPKNrMPg3ocBvzhrpAZmcKAjUiFcA1okpRnBACrucew'),
                    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
                } as NftSwap,
            // ],

            userC: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
            userCAmount: new BN(2),
            userCNft:
                // [
                {
                    mint: new PublicKey('UUCjpbeFwockd4RKYj8DmxSWWcxHrG5cJW1uoAhjeDc'),
                    destinary: new PublicKey('6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW'),
                } as NftSwap,
            // ],
        };
        console.log('sentData', sentData);

        // 890880 lamports as of 2022-09-01
        const lamports = await connection.getMinimumBalanceForRentExemption(0);

        const program = await getProgram();
        console.log('program', program);

        const tradeRef =
            Math.ceil(Math.random() * 10 ** 8).toString() +
            sentData.userANft?.mint.toString().slice(0, 4) +
            sentData.userBNft?.mint.toString().slice(0, 4) +
            sentData.userCNft?.mint.toString().slice(0, 4);

        console.log('tradeRef', tradeRef);

        const swapDataAccount_seed: Buffer = utils.bytes.base64.decode(tradeRef);
        // new TextEncoder().encode(
        //     tradeRef
        //     // +
        //         // sentData.userANft1?.toString().slice(0, 3) +
        //         // sentData.userBNft?.toString().slice(0, 3) +
        //         // sentData.userCNft?.toString().slice(0, 3)
        // );
        console.log('swapDataAccount_seed', swapDataAccount_seed);

        const [swapDataAccount, swapDataAccount_bump] = await PublicKey.findProgramAddress(
            [swapDataAccount_seed],
            programId
        );

        console.log('swapDataAccount', swapDataAccount.toBase58());
        console.log('swapDataAccount_bump', swapDataAccount_bump);

        console.log('web3.SystemProgram.programId', web3.SystemProgram.programId.toBase58());
        console.log('splAssociatedTokenAccountProgramId', splAssociatedTokenAccountProgramId.toBase58());
        console.log('publicKey', publicKey.toBase58());

        const ix = await program.rpc.initialize(swapDataAccount_seed, swapDataAccount_bump, sentData, {
            accounts: {
                swapDataAccount: swapDataAccount,
                signer: publicKey,
                systemProgram: web3.SystemProgram.programId,
                tokenProgram: splAssociatedTokenAccountProgramId,
            },
        });
        console.log('ix', ix);

        // let tx = new Transaction().add(ix);
        // const res = await sendTransaction(tx, connection);

        // console.log("res", res);

        //
    }, [publicKey, sendTransaction, connection, getProgram]);

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
            </button>
            {/* <button onClick={deposit} disabled={!publicKey}>
            Deposit
          </button> */}
        </div>
    );
};
