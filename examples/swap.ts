import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { neoTypes, neoSwap } from "@neoswap/solana";

// Import secret keys for the signer and users from specified paths. These keys are used to create Keypair objects.
// @ts-ignore is used to ignore TypeScript errors for missing modules as these paths are placeholders.
import signerSK from "PATH_TO_SIGNER_SK";
const signer = Keypair.fromSecretKey(signerSK);
// @ts-ignore
import user1Sk from "PATH_TO_USER1_SK";
const user1 = Keypair.fromSecretKey(user1Sk);
// @ts-ignore
import user2Sk from "PATH_TO_USER2_SK";
const user2 = Keypair.fromSecretKey(user2Sk);

anchor.setProvider(anchor.AnchorProvider.env());

let clusterOrUrl =
  "https://compatible-late-wildflower.solana-mainnet.quiknode.pro/58382ac09eaaeea48164b2f768abeb4b522bf3e0/";

let swapDataAccount: PublicKey = new PublicKey(
  "J2g2rtfjS549Cs2uxUP6VnssQZ1THhpfnLqjeEfgYxtD"
);

let swapInfo: neoTypes.SwapInfo = {
  currency: SystemProgram.programId.toBase58(),
  preSeed: "0035",
  users: [
    {
      address: user2.publicKey.toBase58(),
      items: {
        give: [
          {
            address: "2Tc5ysNhnboDtyysQgrLEN6AEb37Q7DZDqCoixgLLWHd",
            amount: 1,
            getters: [{ address: user1.publicKey.toBase58(), amount: 1 }],
          },
          {
            address: "98n9RpNnzwPRbKSVmizegAJ4rz5dhwHfunPQJJnkEhFX",
            amount: 1,
            getters: [{ address: user1.publicKey.toBase58(), amount: 1 }],
          },
        ],
        get: [
          {
            address: "GdzJNpcJVQQX2rPAWMS83cFF2qMyf9DtH7kyuAeXbF7i",
            amount: 1,
            givers: [{ address: user1.publicKey.toBase58(), amount: 1 }],
          },
          {
            address: "28S928mvfUAMwSXcRVmvEy4nLfvJWRHpb56icNyXaCam",
            amount: 1,
            givers: [{ address: user1.publicKey.toBase58(), amount: 1 }],
          },
          {
            address: "2XMTk7bhL57FE8rR55MjWjw4hoRm7mWnfTjQd8ULTA6H",
            amount: 1,
            givers: [{ address: user1.publicKey.toBase58(), amount: 1 }],
          },
        ],
        token: { amount: 50000 },
      },
    },
    {
      address: user1.publicKey.toBase58(),
      items: {
        give: [
          {
            address: "GdzJNpcJVQQX2rPAWMS83cFF2qMyf9DtH7kyuAeXbF7i",
            amount: 1,
            getters: [{ address: user2.publicKey.toBase58(), amount: 1 }],
          },
          {
            address: "2XMTk7bhL57FE8rR55MjWjw4hoRm7mWnfTjQd8ULTA6H",
            amount: 1,
            getters: [{ address: user2.publicKey.toBase58(), amount: 1 }],
          },
          {
            address: "28S928mvfUAMwSXcRVmvEy4nLfvJWRHpb56icNyXaCam",
            amount: 1,
            getters: [{ address: user2.publicKey.toBase58(), amount: 1 }],
          },
        ],
        get: [
          {
            address: "2Tc5ysNhnboDtyysQgrLEN6AEb37Q7DZDqCoixgLLWHd",
            amount: 1,
            givers: [{ address: user2.publicKey.toBase58(), amount: 1 }],
          },
          {
            address: "98n9RpNnzwPRbKSVmizegAJ4rz5dhwHfunPQJJnkEhFX",
            amount: 1,
            givers: [{ address: user2.publicKey.toBase58(), amount: 1 }],
          },
        ],
        token: { amount: -50000 },
      },
    },
  ],
};

async function name() {
  // Initializing the swap with the provided information
  const allInitData = await neoSwap.initializeSwap({
    clusterOrUrl,
    signer,
    swapInfo,
  });
  console.log("initialized", allInitData);

  // Getting swap data account information
  const swapdaata = await neoSwap.UTILS.getSwapDataAccountFromPublicKey({
    program: neoSwap.UTILS.getProgram({ clusterOrUrl }),
    swapDataAccount_publicKey: swapDataAccount,
  });
  console.log("swapdaata", swapdaata);

  // Preparing to deposit swap data for each user
  let data: { user: PublicKey; hashs: string[] }[] = [];
  await Promise.all(
    [user1, user2].map(async (user) => {
      try {
        // Preparing deposit swap instructions for each user
        const depositSwapDatauserprep =
          await neoSwap.CREATE_INSTRUCTIONS.prepareDepositSwapInstructions({
            clusterOrUrl,
            swapDataAccount,
            user: user.publicKey,
          });

        // Processing the API call for the deposit
        const depositSwapDatauser = await neoSwap.apiProcessor({
          apiProcessorData: depositSwapDatauserprep[0],
          clusterOrUrl,
          signer: user,
          simulation: false,
        });
        // Storing the transaction hashes
        data.push({ user: user.publicKey, hashs: depositSwapDatauser });
        console.log("transactionhashes", depositSwapDatauser);
      } catch (error) {
        data.push({ user: user.publicKey, hashs: error });
      }
    })
  );

  data.forEach((v) =>
    console.log(v.user.toBase58(), "\ndeposit datas :", v.hashs)
  );

  // Canceling and closing the swap, then logging the transaction hash
  const cancelAndCloseHash = await neoSwap.cancelAndCloseSwap({
    signer,
    clusterOrUrl,
    swapDataAccount,
  });

  console.log("cancelAndCloseHash", cancelAndCloseHash);
}
