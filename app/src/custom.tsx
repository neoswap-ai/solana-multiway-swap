import {
  BN,
  getProvider,
  Idl,
  Program,
  Provider,
  web3,
} from "@project-serum/anchor";
import {
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import React, { FC, useCallback } from "react";
// import { network } from "./App";
import {
  opts,
  splAssociatedTokenAccountProgramId,
  // getAtaPda,
  // getUserMint,
  // create3TokenAccount,
  SwapData,
} from "./util";
import { idl } from "./idl";
// import { ESCROW_ACCOUNT_DATA_LAYOUT } from "./util";

// let _window = window as any;
window.Buffer = window.Buffer || require("buffer").Buffer;

const network = WalletAdapterNetwork.Devnet;
export const Custom: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, wallet } = useWallet();
  const anchorWallet = useAnchorWallet();

  ///TEST
  const programId = new PublicKey(
    "BRBpGfF6xmQwAJRfx7MKPZq1KEgTvVMfcNXHbs42w8Tz"
  );
  ///

  const getProvider = async (): Promise<Provider> => {
    if (!anchorWallet) {
      throw new WalletNotConnectedError();
    } else {
      return new Provider(
        new Connection(clusterApiUrl(network), "confirmed"),
        anchorWallet,
        opts.preflightCommitment
      );
    }
  };

  const getProgram = async () => {
    return new Program(idl, programId, await getProvider());
  };

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
    console.log("signature", signature);

    // await connection.confirmTransaction({
    //   blockhash,
    //   lastValidBlockHeight,
    //   signature,
    // });
  }, [publicKey, sendTransaction, connection]);

  const initialize = useCallback(async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    const sentData: SwapData = {
      initializer: publicKey,
      isComplete: false,
      userA: new PublicKey("6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW"),
      // userAAmount: new BN(-1),
      userANft1: new PublicKey("DxKz618SSAiswCsUPZkmKDU9kUxXkNUC9uDfZYNEF6mY"),
      userANft2: new PublicKey("7CZRVmsPoTs4bDjLGs2jMunBg54Lv1bdvmtWQVrFur5G"),
      userB: new PublicKey("6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW"),
      // userBAmount: new BN(1),
      userBNft: new PublicKey("DwPKNrMPg3ocBvzhrpAZmcKAjUiFcA1okpRnBACrucew"),
      userC: new PublicKey("6mBWjWA8dMVrtYjhM7HoF59TbbdLt2U5gqPmahcUJtiW"),
      // userCAmount: new BN(2),
      userCNft: new PublicKey("UUCjpbeFwockd4RKYj8DmxSWWcxHrG5cJW1uoAhjeDc"),
    };

    const program = await getProgram();
    console.log("program", program);

    const tradeRef = Math.ceil(Math.random() * 10 ** 5).toString();
    console.log("tradeRef", tradeRef);

    const swapDataAccount_seed: Uint8Array = new TextEncoder().encode(
      tradeRef +
        sentData.userANft1.toString().slice(0, 3) +
        sentData.userANft2.toString().slice(0, 3) +
        sentData.userBNft.toString().slice(0, 3) +
        sentData.userCNft.toString().slice(0, 3)
    );
    console.log("swapDataAccount_seed", swapDataAccount_seed);

    const [swapDataAccount, swapDataAccount_bump] =
      await PublicKey.findProgramAddress([swapDataAccount_seed], programId);

    console.log("swapDataAccount", swapDataAccount.toBase58());
    console.log("swapDataAccount_bump", swapDataAccount_bump);
    console.log("sentData", sentData);

    // const [swapDataAtaMintA1, swapDataAtaMintA1_bump] = await getAtaPda(
    //   swapDataAccount,
    //   sentData.userANft1
    // );
    // console.log(
    //   "swapDataAtaMintA1",
    //   swapDataAtaMintA1,
    //   "swapDataAtaMintA1_bump",
    //   swapDataAtaMintA1_bump
    // );

    // const [swapDataAtaMintA2, swapDataAtaMintA2_bump] = await getAtaPda(
    //   swapDataAccount,
    //   sentData.userANft2
    // );
    // console.log(
    //   "swapDataAtaMintA2",
    //   swapDataAtaMintA2.toBase58(),
    //   "swapDataAtaMintA2_bump",
    //   swapDataAtaMintA2_bump
    // );

    // const [swapDataAtaMintB, swapDataAtaMintB_bump] = await getAtaPda(
    //   swapDataAccount,
    //   sentData.userBNft
    // );
    // console.log(
    //   "swapDataAtaMintB",
    //   swapDataAtaMintB.toBase58(),
    //   "swapDataAtaMintB_bump",
    //   swapDataAtaMintB_bump
    // );

    // const [swapDataAtaMintC, swapDataAtaMintC_bump] = await getAtaPda(
    //   swapDataAccount,
    //   sentData.userCNft
    // );
    // console.log(
    //   "swapDataAtaMintC",
    //   swapDataAtaMintC.toBase58(),
    //   "swapDataAtaMintC_bump",
    //   swapDataAtaMintC_bump
    // );

    // const holdSolAtas = await create3TokenAccount(
    //   program.provider,
    //   web3.SystemProgram.programId,
    //   swapDataAccount
    // );
    // console.log("holdSolAtasacc1", holdSolAtas.acc1.toBase58());
    // console.log("holdSolAtasacc2", holdSolAtas.acc2.toBase58());
    // console.log("holdSolAtasacc3", holdSolAtas.acc3.toBase58());
    // console.log("holdSolAtassignature", holdSolAtas.signature);

    console.log(
      "web3.SystemProgram.programId",
      web3.SystemProgram.programId.toBase58()
    );
    console.log(
      "splAssociatedTokenAccountProgramId",
      splAssociatedTokenAccountProgramId.toBase58()
    );
    console.log("publicKey", publicKey.toBase58());

    const ix = await program.rpc.initialize(
      swapDataAccount_seed,
      swapDataAccount_bump,
      sentData,
      {
        accounts: {
          swapDataAccount: swapDataAccount,
          signer: publicKey,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: splAssociatedTokenAccountProgramId,
        },
      }
    );
    console.log("ix", ix);

    // let tx = new Transaction().add(ix);
    // const res = await sendTransaction(tx, connection);

    // console.log("res", res);
    ///////////////////

    // const escrowKeypair = new Keypair();
    // const createEscrowAccountIx = SystemProgram.createAccount({
    //   space: ESCROW_ACCOUNT_DATA_LAYOUT.span,
    //   lamports: await connection.getMinimumBalanceForRentExemption(
    //     ESCROW_ACCOUNT_DATA_LAYOUT.span
    //   ),
    //   fromPubkey: publicKey,
    //   newAccountPubkey: escrowKeypair.publicKey,
    //   programId: programId,
    // });

    ///////////
    // const lamports = await connection.getMinimumBalanceForRentExemption(0);

    // const transaction = new Transaction().add(
    //   SystemProgram.transfer({
    //     fromPubkey: publicKey,
    //     toPubkey: Keypair.generate().publicKey,
    //     lamports,
    //   })
    // );

    // const {
    //   context: { slot: minContextSlot },
    //   value: { blockhash, lastValidBlockHeight },
    // } = await connection.getLatestBlockhashAndContext();

    // const signature = await sendTransaction(transaction, connection, {
    //   minContextSlot,
    // });

    // await connection.confirmTransaction({
    //   blockhash,
    //   lastValidBlockHeight,
    //   signature,
    // });
  }, [publicKey, sendTransaction, connection, getProgram, programId]);

  const deposit = useCallback(async () => {
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

    const {
      context: { slot: minContextSlot },
      value: { blockhash, lastValidBlockHeight },
    } = await connection.getLatestBlockhashAndContext();

    const signature = await sendTransaction(transaction, connection, {
      minContextSlot,
    });

    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature,
    });
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
      <button onClick={deposit} disabled={!publicKey}>
        Deposit
      </button>
    </div>
  );
};
