import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";

import SwapData from "../neoSwap.module.v4.12/utils.neoSwap/types.neo-swap/swapData.types.neoswap";
import NftSwapItem from "../neoSwap.module.v4.12/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
import { SwapCoontractTest } from "../target/types/swap_coontract_test";
import { splAssociatedTokenAccountProgramId } from "../neoSwap.module.v4.12/utils.neoSwap/const.neoSwap";
import {
  createAssociatedTokenAccount,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createMint,
  mintToChecked,
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
} from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import NeoSwap from "../neoSwap.module.v4.12";

describe("swapCoontractTest", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const anchorProgram = anchor.workspace
    .SwapCoontractTest as Program<SwapCoontractTest>;
  const program = anchor.workspace.SwapCoontractTest as Program;
  const CONST_PROGRAM = "0000";
  const nbuser = 4;
  let userKeypairs: Keypair[] = [];

  let signer = Keypair.generate();
  let pda: PublicKey;
  let swapData: SwapData = {
    initializer: signer.publicKey,
    items: [
      {
        isNft: false,
        amount: new anchor.BN(-0.25 * nbuser * 10 ** 9),
        destinary: signer.publicKey,
        mint: signer.publicKey,
        owner: signer.publicKey,
        status: 1,
      },
    ],
    status: 80,
  };

  it("Initializing accounts", async () => {
    // Add your test here.

    const airdropSignature = await program.provider.connection.requestAirdrop(
      signer.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    // .then(async airdropSignatureSigner=>{

    console.log("signer airdrop done", signer.publicKey.toBase58());

    for (let userId = 0; userId < nbuser; userId++) {
      userKeypairs.push(Keypair.generate());
    }

    for await (const userKeypair of userKeypairs) {
      await program.provider.connection.confirmTransaction(
        await program.provider.connection.requestAirdrop(
          userKeypair.publicKey,
          2 * LAMPORTS_PER_SOL
        )
      );
      console.log("user airdrop done", userKeypair.publicKey.toBase58());
    }
  });

  it("users instruction", async () => {
    for await (const userKeypair of userKeypairs) {
      // }
      swapData.items.push({
        isNft: false,
        amount: new BN(0.25 * 10 ** 9),
        mint: userKeypair.publicKey,
        status: 0,
        owner: userKeypair.publicKey,
        destinary: userKeypair.publicKey,
      } as NftSwapItem);

      // let userNfts: PublicKey[] = [];

      for await (let mintNb of [0, 1]) {
        const mint = Keypair.generate();
        // userNfts.push(mint.publicKey);
        console.log("mint ", mint.publicKey.toBase58());

        const [userMintAta, mintAta_bump] = await PublicKey.findProgramAddress(
          [
            userKeypair.publicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mint.publicKey.toBuffer(),
          ],
          splAssociatedTokenAccountProgramId
        );

        let mintPubkey = await createMint(
          program.provider.connection, // conneciton
          userKeypair, // fee payer
          userKeypair.publicKey, // mint authority
          userKeypair.publicKey, // freeze authority
          0 // decimals
        );

        let ata = await createAssociatedTokenAccount(
          program.provider.connection, // conneciton
          userKeypair, // fee payer
          mintPubkey, // mint
          userKeypair.publicKey // owner,
        );

        await mintToChecked(
          program.provider.connection, // conneciton
          userKeypair, // fee payer
          mintPubkey, // mint
          ata, // receiver
          userKeypair.publicKey, // mint authority
          10, // amount.
          0 // decimals
        );

        for (let index = 0; index < userKeypairs.length; index++) {
          if (userKeypairs[index].publicKey !== userKeypair.publicKey) {
            swapData.items.push({
              isNft: true,
              amount: new BN(1),
              mint: mint.publicKey,
              status: 0,
              owner: userKeypair.publicKey,
              destinary: userKeypairs[index].publicKey,
            } as NftSwapItem);
          }
        }
        console.log("user init");
      }
    }
  });

  it("initialize", async () => {
    const allInitData = await NeoSwap.allInitialize({
      program: program,
      signer: signer.publicKey,
      swapData,
      CONST_PROGRAM,
      // swapDataAccount: swapDataAccountGiven,
    });

    const allInitSendAllArray = allInitData.allInitSendAllArray;
    pda = allInitData.pda;

    const recentBlockhash = (
      await program.provider.connection.getLatestBlockhash()
    ).blockhash;

    for await (const transactionDeposit of allInitSendAllArray) {
      transactionDeposit.signers = [signer];
      transactionDeposit.tx.feePayer = signer.publicKey;
      transactionDeposit.tx.recentBlockhash = recentBlockhash;
    }

    // if (!program.provider.sendAll) throw console.error("no sendAndConfirm");
    const txhashs = await program.provider.sendAll(allInitSendAllArray);

    for await (const hash of txhashs) {
      program.provider.connection.confirmTransaction(hash);
    }

    console.log("initialized");
  });

  it("Deposit", async () => {
    for await (const userKeypair of userKeypairs) {
      const { depositSendAllArray } = await NeoSwap.deposit({
        program: program,
        signer: userKeypair.publicKey,
        swapDataAccount: pda,
        CONST_PROGRAM,
      });

      const recentBlockhash = (
        await program.provider.connection.getLatestBlockhash()
      ).blockhash;

      depositSendAllArray.forEach((transactionDeposit) => {
        transactionDeposit.signers = [userKeypair];
        transactionDeposit.tx.feePayer = userKeypair.publicKey;
        transactionDeposit.tx.recentBlockhash = recentBlockhash;
      });

      const transactionHash = await program.provider.sendAll(
        depositSendAllArray
      );

      for await (const txhash of transactionHash) {
        program.provider.connection.confirmTransaction(txhash);
      }
      console.log(
        "deposit user ",
        userKeypair.publicKey.toBase58(),
        " transactionHash",
        transactionHash
      );
    }
  });

  it("claim and close", async () => {
    const { allClaimSendAllArray } = await NeoSwap.claimAndClose({
      program: program,
      signer: signer.publicKey,
      swapDataAccount: pda,
      CONST_PROGRAM,
    });

    const recentBlockhash = (
      await program.provider.connection.getLatestBlockhash()
    ).blockhash;

    allClaimSendAllArray.forEach((transactionDeposit) => {
      transactionDeposit.signers = [signer];
      transactionDeposit.tx.feePayer = signer.publicKey;
      transactionDeposit.tx.recentBlockhash = recentBlockhash;
    });

    const claimAndCloseHash = await program.provider.sendAll(
      allClaimSendAllArray
    );

    for await (const hash of claimAndCloseHash) {
      program.provider.connection.confirmTransaction(hash);
    }

    console.log("claimAndCloseHash :", claimAndCloseHash);
  });
});
