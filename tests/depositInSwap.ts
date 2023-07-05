import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
const { assert } = require("chai");

// import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
import {
    Cluster,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import NeoSwap from "../app/src/neoSwap.module.v4.2";
import { neoSwapNpm, neoTypes } from "@biboux.neoswap/neo-swap-npm";
import { ErrorFeedback, NftSwapItem, SwapData, TradeStatus } from "../deleteme/types";

import signerSK from "../deleteme/signer";
const signer = Keypair.fromSecretKey(signerSK);
import user1Sk from "../deleteme/user1";
const user1 = Keypair.fromSecretKey(user1Sk);
import user2Sk from "../deleteme/user2";
const user2 = Keypair.fromSecretKey(user2Sk);
import user3Sk from "../deleteme/user3";
const user3 = Keypair.fromSecretKey(user3Sk);
import user4Sk from "../deleteme/user4";
const user4 = Keypair.fromSecretKey(user4Sk);
import user5Sk from "../deleteme/user5";
const user5 = Keypair.fromSecretKey(user5Sk);
import user6Sk from "../deleteme/user6";
const user6 = Keypair.fromSecretKey(user6Sk);

describe("FongibleTokens Test Unit", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    let program = anchor.workspace.NeoSwap as Program;
    let clusterOrUrl = "devnet" as Cluster;

    //normal
    let swapDataAccount: PublicKey = new PublicKey("62YacMZ9SjWAR9joCRAPextHxw8rKxBT7HcLhkAZrmfw");
    // let swapDataAccount: PublicKey = new PublicKey("3ZEg8U1ADpX4bx5z56UBabckt56MSf4gaeBgEd9RgSrB");

    it("Initializing Program", async () => {
        program = neoSwapNpm.utils.getProgram({ clusterOrUrl: "devnet", signer }); //as unknown as Program;
        console.log("programId", program.programId.toBase58());
        console.log("signer", signer.publicKey.toBase58());
    });
    it("deposit all NFT to  swap", async () => {
        if (swapDataAccount) {
            let data: { user: PublicKey; data: string[] }[] = [];
            // for await (const user of [user1, user2, user3, user4, user5, user6]) {
            await Promise.all(
                [user1, user2, user3, user4, user5, user6].map(async (user) => {
                    try {
                        const depositSwapDatauser =
                            await neoSwapNpm.createInstructions.prepareDepositSwapInstructions({
                                clusterOrUrl,
                                user: user.publicKey,
                                swapDataAccount,
                                // skipSimulation: true,
                            });
                        console.log("user", user.publicKey.toBase58());
                        console.log("depositSwapDatauser", depositSwapDatauser);

                        let transac = await neoSwapNpm.createInstructions.apiProcessorTranscript({
                            config: depositSwapDatauser.config,
                        });

                        let txh = await neoSwapNpm.utils.sendBundledTransactions({
                            clusterOrUrl: "devnet",
                            signer: user,
                            txsWithoutSigners: transac,
                        });
                        data.push({ user: user.publicKey, data: txh });
                        console.log("transactionhashes", depositSwapDatauser);
                    } catch (error) {
                        data.push({ user: user.publicKey, data: error });
                    }
                })
            );
            // }
            data.forEach((v) => console.log("deposit datas :", v.data));
        } else {
            console.log("swap not given");
        }
    });
});
