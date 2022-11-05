import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
import { NeoSwap as NeoSwapType } from "../target/types/neo_swap";
const { assert } = require("chai");
import SwapData from "../neoSwap.module.v4.12/utils.neoSwap/types.neo-swap/swapData.types.neoswap";
import NftSwapItem from "../neoSwap.module.v4.12/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
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
  // const anchorProgram = anchor.workspace
  //   .SwapCoontractTest as Program<NeoSwapType>;
  const program = anchor.workspace.NeoSwap as Program;
  const CONST_PROGRAM = "0002";
  const nbuser = 3;
  const nftNb = [0, 1, 2];
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
      console.log("XXXXXXXXXXXXXXX - user ", userKeypair.publicKey.toBase58());

      swapData.items.push({
        isNft: false,
        amount: new BN(0.25 * 10 ** 9),
        mint: userKeypair.publicKey,
        status: 0,
        owner: userKeypair.publicKey,
        destinary: userKeypair.publicKey,
      } as NftSwapItem);

      // let userNfts: PublicKey[] = [];

      for await (let mintNb of nftNb) {
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
          if (!userKeypairs[index].publicKey.equals(userKeypair.publicKey)) {
            swapData.items.push({
              isNft: true,
              amount: new BN(1),
              mint: mintPubkey,
              status: 0,
              owner: userKeypair.publicKey,
              destinary: userKeypairs[index].publicKey,
            } as NftSwapItem);
            // console.log("nft Item Added");
          }
        }
        // console.log("user init");
        const ataBalance =
          await program.provider.connection.getTokenAccountBalance(ata);
        console.log(
          "mint ",
          mintPubkey.toBase58(),
          // "\nwith balance: ",
          // ataBalance.value.amount,
          "\nwith ata: ",
          ata.toBase58(),
          "\n"
        );
      }
    }
  });

  it("initialize", async () => {
    const allInitData = await NeoSwap.allInitialize({
      program: program,
      signer: signer.publicKey,
      swapDataGiven: swapData,
      CONST_PROGRAM,
      // swapDataAccount: swapDataAccountGiven,
    });
    swapData = allInitData.swapData;
    pda = allInitData.pda;
    const allInitSendAllArray = allInitData.allInitSendAllArray;
    console.log("XXXXXXXXXXXXXXXXX-XXXXXXXXXX pda", pda.toBase58());

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
    let sendAllArray: {
      tx: anchor.web3.Transaction;
      signers?: anchor.web3.Signer[];
    }[] = [];
    for await (const userKeypair of userKeypairs) {
      const { depositSendAllArray } = await NeoSwap.deposit({
        program: program,
        signer: userKeypair.publicKey,
        swapDataAccount: pda,
        CONST_PROGRAM,
      });

      depositSendAllArray.forEach((transactionDeposit) => {
        transactionDeposit.signers = [userKeypair];
        transactionDeposit.tx.feePayer = userKeypair.publicKey;
      });
      sendAllArray.push(...depositSendAllArray);
    }
    const recentBlockhash = (
      await program.provider.connection.getLatestBlockhash()
    ).blockhash;

    sendAllArray.forEach((transactionDeposit) => {
      transactionDeposit.tx.recentBlockhash = recentBlockhash;
    });
    const transactionHashs = await program.provider.sendAll(sendAllArray);
    for await (const transactionHash of transactionHashs) {
      await program.provider.connection.confirmTransaction(transactionHash);
    }
    console.log("XXXXXXXXXXXXX deposited user ");
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

  it("initialize for cancel", async () => {
    const allInitData = await NeoSwap.allInitialize({
      program: program,
      signer: signer.publicKey,
      swapDataGiven: swapData,
      CONST_PROGRAM,
      // swapDataAccount: swapDataAccountGiven,
    });
    swapData = allInitData.swapData;
    pda = allInitData.pda;
    const allInitSendAllArray = allInitData.allInitSendAllArray;
    console.log("XXXXXXXXXXXXXXXXX-XXXXXXXXXX pda", pda.toBase58());

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
  it("Deposit for cancel", async () => {
    let sendAllArray: {
      tx: anchor.web3.Transaction;
      signers?: anchor.web3.Signer[];
    }[] = [];
    for await (const userKeypair of userKeypairs) {
      const { depositSendAllArray } = await NeoSwap.deposit({
        program: program,
        signer: userKeypair.publicKey,
        swapDataAccount: pda,
        CONST_PROGRAM,
      });

      depositSendAllArray.forEach((transactionDeposit) => {
        transactionDeposit.signers = [userKeypair];
        transactionDeposit.tx.feePayer = userKeypair.publicKey;
      });
      sendAllArray.push(...depositSendAllArray);
    }
    const recentBlockhash = (
      await program.provider.connection.getLatestBlockhash()
    ).blockhash;

    sendAllArray.forEach((transactionDeposit) => {
      transactionDeposit.tx.recentBlockhash = recentBlockhash;
    });
    const transactionHashs = await program.provider.sendAll(sendAllArray);
    for await (const transactionHash of transactionHashs) {
      await program.provider.connection.confirmTransaction(transactionHash);
    }
    console.log("XXXXXXXXXXXXX deposited user ");
  });
  it("cancel and close", async () => {
    const { allCancelSendAllArray } = await NeoSwap.cancelAndClose({
      program: program,
      signer: signer.publicKey,
      swapDataAccount: pda,
      CONST_PROGRAM,
    });

    const recentBlockhash = (
      await program.provider.connection.getLatestBlockhash()
    ).blockhash;

    allCancelSendAllArray.forEach((transactionDeposit) => {
      transactionDeposit.signers = [signer];
      transactionDeposit.tx.feePayer = signer.publicKey;
      transactionDeposit.tx.recentBlockhash = recentBlockhash;
    });

    const cancelAndCloseHash = await program.provider.sendAll(
      allCancelSendAllArray
    );

    for await (const hash of cancelAndCloseHash) {
      program.provider.connection.confirmTransaction(hash);
    }

    console.log("cancelAndCloseHash :", cancelAndCloseHash);
  });

  it("initialize for mishandling", async () => {
    const allInitData = await NeoSwap.allInitialize({
      program: program,
      signer: signer.publicKey,
      swapDataGiven: swapData,
      CONST_PROGRAM,
      // swapDataAccount: swapDataAccountGiven,
    });
    swapData = allInitData.swapData;
    pda = allInitData.pda;
    const allInitSendAllArray = allInitData.allInitSendAllArray;
    console.log("XXXXXXXXXXXXXXXXX-XXXXXXXXXX pda", pda.toBase58());

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

  it("reinitialize mishandling", async () => {
    const allInitData = await NeoSwap.allInitialize({
      program: program,
      signer: signer.publicKey,
      swapDataGiven: swapData,
      CONST_PROGRAM,
      // swapDataAccount: swapDataAccountGiven,
    });
    swapData = allInitData.swapData;
    pda = allInitData.pda;
    const allInitSendAllArray = allInitData.allInitSendAllArray;
    console.log("XXXXXXXXXXXXXXXXX-XXXXXXXXXX pda", pda.toBase58());

    const recentBlockhash = (
      await program.provider.connection.getLatestBlockhash()
    ).blockhash;

    for await (const transactionDeposit of allInitSendAllArray) {
      transactionDeposit.signers = [signer];
      transactionDeposit.tx.feePayer = signer.publicKey;
      transactionDeposit.tx.recentBlockhash = recentBlockhash;
    }

    try {
      const txhashs = await program.provider.sendAll(allInitSendAllArray);

      for await (const hash of txhashs) {
        program.provider.connection.confirmTransaction(hash);
      }

      console.log("initialized");
    } catch (error) {
      console.log("fails");

      assert.strictEqual(
        String(error).toLowerCase().includes("custom program error: 0x0"),
        true
      );
    }

    console.log("initialized");
  });

  it("wrong reinitialize mishandling", async () => {
    const allInitData = await NeoSwap.allInitialize({
      program: program,
      signer: userKeypairs[0].publicKey,
      swapDataGiven: swapData,
      CONST_PROGRAM,
      // swapDataAccount: swapDataAccountGiven,
    });
    swapData = allInitData.swapData;
    pda = allInitData.pda;
    const allInitSendAllArray = allInitData.allInitSendAllArray;
    console.log("XXXXXXXXXXXXXXXXX-XXXXXXXXXX pda", pda.toBase58());

    const recentBlockhash = (
      await program.provider.connection.getLatestBlockhash()
    ).blockhash;

    for await (const transactionDeposit of allInitSendAllArray) {
      transactionDeposit.signers = [userKeypairs[0]];
      transactionDeposit.tx.feePayer = userKeypairs[0].publicKey;
      transactionDeposit.tx.recentBlockhash = recentBlockhash;
    }

    // if (!program.provider.sendAll) throw console.error("no sendAndConfirm");
    try {
      const txhashs = await program.provider.sendAll(allInitSendAllArray);

      for await (const hash of txhashs) {
        program.provider.connection.confirmTransaction(hash);
      }

      console.log("initialized");
    } catch (error) {
      console.log("fails");

      assert.strictEqual(
        String(error).toLowerCase().includes("custom program error: 0x0"),
        true
      );
    }
  });

  it("wrong claim and close", async () => {
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
    try {
      const txhashs = await program.provider.sendAll(allClaimSendAllArray);

      for await (const hash of txhashs) {
        program.provider.connection.confirmTransaction(hash);
      }

      console.log("initialized");
    } catch (error) {
      console.log("fails");

      assert.strictEqual(
        String(error).toLowerCase().includes("custom program error: 0x1776"),
        true
      );
    }
  });

  it("cancel and close before deposit", async () => {
    const { allCancelSendAllArray } = await NeoSwap.cancelAndClose({
      program: program,
      signer: signer.publicKey,
      swapDataAccount: pda,
      CONST_PROGRAM,
    });

    const recentBlockhash = (
      await program.provider.connection.getLatestBlockhash()
    ).blockhash;

    allCancelSendAllArray.forEach((transactionDeposit) => {
      transactionDeposit.signers = [signer];
      transactionDeposit.tx.feePayer = signer.publicKey;
      transactionDeposit.tx.recentBlockhash = recentBlockhash;
    });

    const txhashs = await program.provider.sendAll(allCancelSendAllArray);

    for await (const hash of txhashs) {
      program.provider.connection.confirmTransaction(hash);
    }

    console.log("initialized");
  });

  it("Deposit for misshandling", async () => {
    let sendAllArray: {
      tx: anchor.web3.Transaction;
      signers?: anchor.web3.Signer[];
    }[] = [];
    try {
      for await (const userKeypair of userKeypairs) {
        const { depositSendAllArray } = await NeoSwap.deposit({
          program: program,
          signer: userKeypair.publicKey,
          swapDataAccount: pda,
          CONST_PROGRAM,
        });

        depositSendAllArray.forEach((transactionDeposit) => {
          transactionDeposit.signers = [userKeypair];
          transactionDeposit.tx.feePayer = userKeypair.publicKey;
        });
        sendAllArray.push(...depositSendAllArray);
      }
      const recentBlockhash = (
        await program.provider.connection.getLatestBlockhash()
      ).blockhash;

      sendAllArray.forEach((transactionDeposit) => {
        transactionDeposit.tx.recentBlockhash = recentBlockhash;
      });
      const transactionHashs = await program.provider.sendAll(sendAllArray);
      for await (const transactionHash of transactionHashs) {
        await program.provider.connection.confirmTransaction(transactionHash);
      }
      console.log("XXXXXXXXXXXXX deposited user ");
    } catch (error) {
      console.log(error);

      assert.strictEqual(
        String(error).toLowerCase().includes("PDA not initialized"),
        true
      );
    }
  });
});
