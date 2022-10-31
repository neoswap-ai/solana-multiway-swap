import * as anchor from "@project-serum/anchor";
import { BN, Idl, Program } from "@project-serum/anchor";
import { SwapCoontractTest } from "../target/types/swap_coontract_test";
import {
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createMint,
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
} from "@solana/spl-token";
// import {
//   createAssociatedTokenAccount,
//   createMint,
//   mintToChecked,
// } from "@solana/spl-token";
// import neoSwap from "../app/src/neoSwap.module/neoSwap.module";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  NftSwapItem,
  SwapData,
} from "../neoSwap.module/utils.neoSwap/types.neoSwap";
import from "neo-swapwap";
import { sendAllPopulateInstruction } from "../app/src/solana.utils";
import { splAssociatedTokenAccountProgramId } from "../app/src/solana.const";
describe("swapCoontractTest", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  // const program = anchor.workspace
  //   .SwapCoontractTest as Program<SwapCoontractTest>;

  const programToSend = anchor.workspace.SwapCoontractTest as Program<Idl>;
  // let txHashArray: string[];
  // let Daata: Array<{
  //   userKeypair: Keypair;
  //   userNfts: Array<PublicKey>;
  //   amount?: number;
  // }> = [];
  let userKeypairs: Keypair[] = [];

  let signer = Keypair.generate();
  let pda: PublicKey;
  let swapData: SwapData = {
    initializer: signer.publicKey,
    items: [
      {
        isNft: false,
        amount: new BN(-1),
        destinary: signer.publicKey,
        mint: signer.publicKey,
        owner: signer.publicKey,
        status: 1,
      },
    ],
    status: 80,
  };

  it("initializing signer account", async () => {
    const airdropSignature =
      await programToSend.provider.connection.requestAirdrop(
        signer.publicKey,
        2 * LAMPORTS_PER_SOL
      );
    // .then(async airdropSignatureSigner=>{

    console.log("signer airdrop done", signer.publicKey.toBase58());

    for (let userId = 0; userId <= 2; userId++) {
      userKeypairs.push(Keypair.generate());
    }
    for await (const userKeypair of userKeypairs) {
      const airdropSignature =
        await programToSend.provider.connection.requestAirdrop(
          userKeypair.publicKey,
          2 * LAMPORTS_PER_SOL
        );
      console.log("user airdrop done  ", userKeypair.publicKey.toBase58());
    }
  });

  it("users instruction", async () => {
    let allTx: Transaction[] = [];

    let SendAllArray: {
      tx: anchor.web3.Transaction;
      signers?: anchor.web3.Signer[];
    }[] = [];
    const blockhash = (
      await programToSend.provider.connection.getLatestBlockhash()
    ).blockhash;
    // userKeypairs.forEach(async (userKeypair) => {
    for await (const userKeypair of userKeypairs) {
      // }
      swapData.items.push({
        isNft: false,
        amount: new BN(1 / userKeypairs.length),
        mint: userKeypair.publicKey,
        status: 0,
        owner: userKeypair.publicKey,
        destinary: userKeypair.publicKey,
      } as NftSwapItem);
      // console.log("user");
      // let userIx: TransactionInstruction[] = [];
      let userNfts: PublicKey[] = [];

      for await (let mintNb of [0, 1, 2]) {
        // let mintPubkey = await
        // it("createMint", async () => {

        const mint = Keypair.generate();
        userNfts.push(mint.publicKey);
        console.log("mint ", mint.publicKey.toBase58());

        const [userMintAta, mintAta_bump] = await PublicKey.findProgramAddress(
          [
            userKeypair.publicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mint.publicKey.toBuffer(),
          ],
          splAssociatedTokenAccountProgramId
        );

        let userTx: Transaction = new Transaction().add(
          SystemProgram.createAccount({
            fromPubkey: userKeypair.publicKey,
            newAccountPubkey: mint.publicKey,
            space: MINT_SIZE,
            lamports: await getMinimumBalanceForRentExemptMint(
              programToSend.provider.connection
            ),
            programId: TOKEN_PROGRAM_ID,
          }),
          // ),
          // ];
          // userTx.push(
          //   new Transaction().add(
          createInitializeMintInstruction(
            mint.publicKey, // mint pubkey
            0, // decimals
            userKeypair.publicKey, // mint authority
            userKeypair.publicKey // freeze
          ),
          // ),
          // );
          // userTx.push(
          //   new Transaction().add(
          createAssociatedTokenAccountInstruction(
            userKeypair.publicKey, // payer
            userMintAta, // ata
            userKeypair.publicKey, // owner
            mint.publicKey // mint
          ),
          // )
          // );
          // userTx.push(
          //   new Transaction().add(
          createMintToCheckedInstruction(
            mint.publicKey, // mint
            userMintAta, // receiver ata
            userKeypair.publicKey, // mint authority
            10, // amount
            0 // decimals
          )
        );
        // );

        for (let index = 0; index < userKeypairs.length; index++) {
          const userToSend = userKeypairs[index];
          if (userToSend.publicKey !== userKeypair.publicKey) {
            swapData.items.push({
              isNft: true,
              amount: new BN(1),
              mint: mint.publicKey,
              status: 0,
              owner: userKeypair.publicKey,
              destinary: userToSend.publicKey,
            } as NftSwapItem);
          }
        }

        // userTx.forEach((iUserTx) => {
        userTx.feePayer = userKeypair.publicKey;
        userTx.recentBlockhash = blockhash;
        
        let txhashs = await programToSend.provider.connection.sendTransaction(userTx);
        SendAllArray.push({ tx: userTx, signers: [userKeypair] });
        // });
      }
    }
    // let tt: VersionedTransaction = {};
    console.log("txhashs : ", txhashs);
  });
  //
  // userKeypairs.forEach(async (userKeypair) => {
  // for (let index = 0; index < userKeypairs.length; index++) {

  // it("user 0", async () => {
  //   const userKeypair = userKeypairs[0];
  //   let userNfts: PublicKey[] = [];

  //   // const airdropSignature =
  //   //   await
  //   programToSend.provider.connection
  //     .requestAirdrop(userKeypair.publicKey, 2 * LAMPORTS_PER_SOL)
  //     .then((airdropSignature) => {
  //       console.log("airdrop done user :", userKeypair.publicKey.toBase58());

  //       // creating 10 Mints per user
  //       for (let mintNb = 0; mintNb < 9; mintNb++) {
  //         // let mintPubkey = await
  //         it("createMint", async () => {
  //           const mintPubkey = createMint(
  //             programToSend.provider.connection, // conneciton
  //             userKeypair, // fee payer
  //             userKeypair.publicKey, // mint authority
  //             userKeypair.publicKey, // freeze authority
  //             0 // decimals
  //           ).then((mintPubkey) => {
  //             console.log("createMint done");

  //             // let ata = await
  //             // const ata = await
  //             createAssociatedTokenAccount(
  //               programToSend.provider.connection, // connection
  //               userKeypair, // fee payer
  //               mintPubkey, // mint
  //               userKeypair.publicKey // owner,
  //             ).then((ata) => {
  //               console.log("create ata done");

  //               // let txhash = await
  //               // const txhash = await
  //               mintToChecked(
  //                 programToSend.provider.connection, // connection
  //                 userKeypair, // fee payer
  //                 mintPubkey, // mint
  //                 ata, // receiver (sholud be a token account)
  //                 userKeypair.publicKey, // mint authority
  //                 10, // amount. if your decimals is 8, you mint 10^8 for 1 token.
  //                 0 // decimals
  //               ).then((txhash) => {
  //                 console.log("minted to  done");

  //                 txHashArray.push(txhash);
  //                 userNfts.push(mintPubkey);
  //               });

  //               // });
  //             });
  //           });
  //         });
  //         // });
  //       }
  //       Daata.push({ userKeypair, userNfts });
  //     });
  // });
  // it("user 1", async () => {
  //   const userKeypair = userKeypairs[1];
  //   let userNfts: PublicKey[] = [];

  //   // const airdropSignature =
  //   //   await
  //   programToSend.provider.connection
  //     .requestAirdrop(userKeypair.publicKey, 2 * LAMPORTS_PER_SOL)
  //     .then((airdropSignature) => {
  //       console.log("airdrop done user :", userKeypair.publicKey.toBase58());

  //       // creating 10 Mints per user
  //       for (let mintNb = 0; mintNb < 9; mintNb++) {
  //         // let mintPubkey = await
  //         it("createMint", async () => {
  //           const mintPubkey = createMint(
  //             programToSend.provider.connection, // conneciton
  //             userKeypair, // fee payer
  //             userKeypair.publicKey, // mint authority
  //             userKeypair.publicKey, // freeze authority
  //             0 // decimals
  //           ).then((mintPubkey) => {
  //             console.log("createMint done");

  //             // let ata = await
  //             // const ata = await
  //             createAssociatedTokenAccount(
  //               programToSend.provider.connection, // connection
  //               userKeypair, // fee payer
  //               mintPubkey, // mint
  //               userKeypair.publicKey // owner,
  //             ).then((ata) => {
  //               console.log("create ata done");

  //               // let txhash = await
  //               // const txhash = await
  //               mintToChecked(
  //                 programToSend.provider.connection, // connection
  //                 userKeypair, // fee payer
  //                 mintPubkey, // mint
  //                 ata, // receiver (sholud be a token account)
  //                 userKeypair.publicKey, // mint authority
  //                 10, // amount. if your decimals is 8, you mint 10^8 for 1 token.
  //                 0 // decimals
  //               ).then((txhash) => {
  //                 console.log("minted to  done");

  //                 txHashArray.push(txhash);
  //                 userNfts.push(mintPubkey);
  //               });

  //               // });
  //             });
  //           });
  //         });
  //         // });
  //       }
  //       Daata.push({ userKeypair, userNfts });
  //     });
  // });
  // it("user 2", async () => {
  //   const userKeypair = userKeypairs[2];
  //   let userNfts: PublicKey[] = [];

  //   // const airdropSignature =
  //   //   await
  //   programToSend.provider.connection
  //     .requestAirdrop(userKeypair.publicKey, 2 * LAMPORTS_PER_SOL)
  //     .then((airdropSignature) => {
  //       console.log("airdrop done user :", userKeypair.publicKey.toBase58());

  //       // creating 10 Mints per user
  //       for (let mintNb = 0; mintNb < 9; mintNb++) {
  //         // let mintPubkey = await
  //         it("createMint", async () => {
  //           const mintPubkey = createMint(
  //             programToSend.provider.connection, // conneciton
  //             userKeypair, // fee payer
  //             userKeypair.publicKey, // mint authority
  //             userKeypair.publicKey, // freeze authority
  //             0 // decimals
  //           ).then((mintPubkey) => {
  //             console.log("createMint done");

  //             // let ata = await
  //             // const ata = await
  //             createAssociatedTokenAccount(
  //               programToSend.provider.connection, // connection
  //               userKeypair, // fee payer
  //               mintPubkey, // mint
  //               userKeypair.publicKey // owner,
  //             ).then((ata) => {
  //               console.log("create ata done");

  //               // let txhash = await
  //               // const txhash = await
  //               mintToChecked(
  //                 programToSend.provider.connection, // connection
  //                 userKeypair, // fee payer
  //                 mintPubkey, // mint
  //                 ata, // receiver (sholud be a token account)
  //                 userKeypair.publicKey, // mint authority
  //                 10, // amount. if your decimals is 8, you mint 10^8 for 1 token.
  //                 0 // decimals
  //               ).then((txhash) => {
  //                 console.log("minted to  done");

  //                 txHashArray.push(txhash);
  //                 userNfts.push(mintPubkey);
  //               });

  //               // });
  //             });
  //           });
  //         });
  //         // });
  //       }
  //       Daata.push({ userKeypair, userNfts });
  //     });
  // });
  // it("user 3", async () => {
  //   const userKeypair = userKeypairs[3];
  //   let userNfts: PublicKey[] = [];

  //   // const airdropSignature =
  //   //   await
  //   programToSend.provider.connection
  //     .requestAirdrop(userKeypair.publicKey, 2 * LAMPORTS_PER_SOL)
  //     .then((airdropSignature) => {
  //       console.log("airdrop done user :", userKeypair.publicKey.toBase58());

  //       // creating 10 Mints per user
  //       for (let mintNb = 0; mintNb < 9; mintNb++) {
  //         // let mintPubkey = await
  //         it("createMint", async () => {
  //           const mintPubkey = createMint(
  //             programToSend.provider.connection, // conneciton
  //             userKeypair, // fee payer
  //             userKeypair.publicKey, // mint authority
  //             userKeypair.publicKey, // freeze authority
  //             0 // decimals
  //           ).then((mintPubkey) => {
  //             console.log("createMint done");

  //             // let ata = await
  //             // const ata = await
  //             createAssociatedTokenAccount(
  //               programToSend.provider.connection, // connection
  //               userKeypair, // fee payer
  //               mintPubkey, // mint
  //               userKeypair.publicKey // owner,
  //             ).then((ata) => {
  //               console.log("create ata done");

  //               // let txhash = await
  //               // const txhash = await
  //               mintToChecked(
  //                 programToSend.provider.connection, // connection
  //                 userKeypair, // fee payer
  //                 mintPubkey, // mint
  //                 ata, // receiver (sholud be a token account)
  //                 userKeypair.publicKey, // mint authority
  //                 10, // amount. if your decimals is 8, you mint 10^8 for 1 token.
  //                 0 // decimals
  //               ).then((txhash) => {
  //                 console.log("minted to  done");

  //                 txHashArray.push(txhash);
  //                 userNfts.push(mintPubkey);
  //               });

  //               // });
  //             });
  //           });
  //         });
  //         // });
  //       }
  //       Daata.push({ userKeypair, userNfts });
  //     });
  // });
  // it("user 4", async () => {
  //   const userKeypair = userKeypairs[4];
  //   let userNfts: PublicKey[] = [];

  //   // const airdropSignature =
  //   //   await
  //   programToSend.provider.connection
  //     .requestAirdrop(userKeypair.publicKey, 2 * LAMPORTS_PER_SOL)
  //     .then((airdropSignature) => {
  //       console.log("airdrop done user :", userKeypair.publicKey.toBase58());

  //       // creating 10 Mints per user
  //       for (let mintNb = 0; mintNb < 9; mintNb++) {
  //         // let mintPubkey = await
  //         it("createMint", async () => {
  //           const mintPubkey = createMint(
  //             programToSend.provider.connection, // conneciton
  //             userKeypair, // fee payer
  //             userKeypair.publicKey, // mint authority
  //             userKeypair.publicKey, // freeze authority
  //             0 // decimals
  //           ).then((mintPubkey) => {
  //             console.log("createMint done");

  //             // let ata = await
  //             // const ata = await
  //             createAssociatedTokenAccount(
  //               programToSend.provider.connection, // connection
  //               userKeypair, // fee payer
  //               mintPubkey, // mint
  //               userKeypair.publicKey // owner,
  //             ).then((ata) => {
  //               console.log("create ata done");

  //               // let txhash = await
  //               // const txhash = await
  //               mintToChecked(
  //                 programToSend.provider.connection, // connection
  //                 userKeypair, // fee payer
  //                 mintPubkey, // mint
  //                 ata, // receiver (sholud be a token account)
  //                 userKeypair.publicKey, // mint authority
  //                 10, // amount. if your decimals is 8, you mint 10^8 for 1 token.
  //                 0 // decimals
  //               ).then((txhash) => {
  //                 console.log("minted to  done");

  //                 txHashArray.push(txhash);
  //                 userNfts.push(mintPubkey);
  //               });

  //               // });
  //             });
  //           });
  //         });
  //         // });
  //       }
  //       Daata.push({ userKeypair, userNfts });
  //     });
  // });
  // }

  // it("initialize Data2", async () => {
  //   for (let users_nb = 0; users_nb < Daata.length; users_nb++) {
  //     const userData = Daata[users_nb];

  //     let solItemToAdd: NftSwapItem = {
  //       amount: new BN(1 / Daata.length),
  //       destinary: userData.userKeypair.publicKey,
  //       isNft: true,
  //       mint: userData.userKeypair.publicKey,
  //       owner: userData.userKeypair.publicKey,
  //       status: 0,
  //     };
  //     swapData.items.push(solItemToAdd);
  //     console.log("sol item added");

  //     userData.userNfts.forEach((nftData) => {
  //       for (let users_nb2 = 0; users_nb2 < Daata.length; users_nb2++) {
  //         const userData2 = Daata[users_nb2];

  //         let nftItemToAdd: NftSwapItem = {
  //           amount: new BN(1),
  //           destinary: userData2.userKeypair.publicKey,
  //           isNft: true,
  //           mint: nftData,
  //           owner: userData.userKeypair.publicKey,
  //           status: 0,
  //         };
  //         swapData.items.push(nftItemToAdd);
  //         console.log("nft item added");
  //       }
  //     });
  //   }
  //   //

  //   // Daata.forEach((userData) => {});
  // });

  it("initialize", async () => {
    const allInitData = await NeoSwap.allInitialize({
      program: programToSend,
      signer: signer.publicKey,
      swapData,
      // swapDataAccount: swapDataAccountGiven,
    });

    const allInitSendAllArray = allInitData.allInitSendAllArray;
    pda = allInitData.pda;

    const sendInitArray = await sendAllPopulateInstruction(
      programToSend,
      allInitSendAllArray
    );

    sendInitArray.forEach((ss) => {
      ss.signers = [signer];
    });

    if (!programToSend.provider.sendAll)
      throw console.error("no sendAndConfirm");

    const transactionHash = await programToSend.provider.sendAll(sendInitArray);
    console.log("initialized", transactionHash);
  });

  it("Deposit", async () => {
    for await (const userKeypair of userKeypairs) {
      const { depositSendAllArray } = await NeoSwap.deposit({
        program: programToSend,
        signer: userKeypair.publicKey,
        swapDataAccount: pda,
      });
      depositSendAllArray.forEach((ss) => {
        ss.signers = [userKeypair];
      });
      let sendAllArray = await sendAllPopulateInstruction(
        programToSend,
        depositSendAllArray
      );
      const transactionHash = await programToSend.provider.sendAll(
        sendAllArray
      );
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
      program: programToSend,
      signer: signer.publicKey,
      swapDataAccount: pda,
    });

    let claimAndCloseArraysendAllArray = await sendAllPopulateInstruction(
      programToSend,
      allClaimSendAllArray
    );

    claimAndCloseArraysendAllArray.forEach((ss) => {
      ss.signers = [signer];
    });

    const claimAndCloseHash = await programToSend.provider.sendAll(
      claimAndCloseArraysendAllArray
    );

    console.log("claimAndCloseHash :", claimAndCloseHash);
  });

  // it("re init", async () => {
  //   const allInitData = await NeoSwap.allInitialize({
  //     program: programToSend,
  //     signer: signer.publicKey,
  //     swapData,
  //     // swapDataAccount: swapDataAccountGiven,
  //   });

  //   const allInitSendAllArray = allInitData.allInitSendAllArray;
  //   pda = allInitData.pda;

  //   const sendInitArray = await sendAllPopulateInstruction(
  //     programToSend,
  //     allInitSendAllArray
  //   );

  //   sendInitArray.forEach((ss) => {
  //     ss.signers = [signer];
  //   });

  //   if (!programToSend.provider.sendAll)
  //     throw console.error("no sendAndConfirm");

  //   const transactionHash = await programToSend.provider.sendAll(sendInitArray);
  //   console.log("initialized", transactionHash);
  // });

  // it("re Deposit", async () => {
  //   Daata.forEach(async (userData) => {
  //     const { depositSendAllArray } = await NeoSwap.deposit({
  //       program: programToSend,
  //       signer: userData.userKeypair.publicKey,
  //       swapDataAccount: pda,
  //     });

  //     depositSendAllArray.forEach((ss) => {
  //       ss.signers = [userData.userKeypair];
  //     });

  //     let sendAllArray = await sendAllPopulateInstruction(
  //       programToSend,
  //       depositSendAllArray
  //     );

  //     // try {
  //     if (!programToSend.provider.sendAll)
  //       throw console.error("no sendAndConfirm");

  //     // const signed tx = await programToSend.provider.
  //     const transactionHash = await programToSend.provider.sendAll(
  //       sendAllArray
  //     );
  //     console.log(
  //       "deposit user ",
  //       userData.userKeypair.publicKey.toBase58(),
  //       " transactionHash",
  //       transactionHash
  //     );

  //     // setTimeout(() => {
  //     console.log("deposited done");

  //     // } catch (error) {
  //     //     programCatchError(error);
  //     //     throw console.error(error);
  //     // }
  //   });
  // });

  // it("cancel and close", async () => {
  //   const { allCancelSendAllArray } = await NeoSwap.cancelAndClose({
  //     program: programToSend,
  //     signer: signer.publicKey,
  //     swapDataAccount: pda,
  //   });
  //   let sendAllArray = await sendAllPopulateInstruction(
  //     programToSend,
  //     allCancelSendAllArray
  //   );

  //   if (!programToSend.provider.sendAll)
  //     throw console.error("no sendAndConfirm");
  //   const transactionHash = await programToSend.provider.sendAll(sendAllArray);
  //   console.log("cancel transactionHash", transactionHash);
  // });
});
