import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
const { assert } = require("chai");
import { neoSwapNpm } from "@biboux.neoswap/neo-swap-npm";
import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { TokenStandard, Uses } from "@metaplex-foundation/mpl-token-metadata";
import NeoSwap from "../app/src/neoSwap.module.v4.2";
import {
    ItemStatus,
    TradeStatus,
} from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/status.type.neoswap";
import { getProgram } from "../app/src/neoSwap.module.v4.2/utils.neoSwap/getProgram.neoswap";
import signerSk from "../deleteme/signer";
import user1Sk from "../deleteme/user1";
import user2Sk from "../deleteme/user2";
import user3Sk from "../deleteme/user3";
import user1NSk from "../deleteme/user1Normal";
import user2NSk from "../deleteme/user2Normal";
import user3NSk from "../deleteme/user3Normal";
import SwapData from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/swapData.types.neoswap";
import { ErrorFeedback } from "@biboux.neoswap/neo-swap-npm/lib/es5/utils/types";

describe("swapCoontractTest", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    let program = anchor.workspace.NeoSwap as Program;

    let pda: PublicKey | undefined = new PublicKey("FjUNomDEpV1rjD1V82KRjYYUUbq2DXZhR6y5j6UzDtYg"); //new PublicKey("DjzPCDEVwwqgAo7SfdE1paugvSreQMsVv57co8WdHJgM"); //new PublicKey("GNg66w1XyQG3jMT1rMxrApU4ggJR3LokJLfqmVGg8myt"); // new PublicKey("8khwnKwc97MiSPPCtz42Q3NAwfyHa2WYnjYt4Dg3sphs"); //new PublicKey("A87ZnUTVPKVT9o9pANf9WLSkXkhQsM3qc3EL9RobYP8m"); //
    // let pda: PublicKey | undefined = undefined;

    let signer = Keypair.fromSecretKey(signerSk);
    let user1 = Keypair.fromSecretKey(user1Sk);
    // let user1MintToTransfer = new PublicKey("CEhATzrDTGRjBgitPrBaBcZFtq6HRGoQwtSD4Bp7hiHP");

    let user1MintToTransfer = new PublicKey("5DbFTVNZEucoM9iSr95b5Kki7XmYDiojVrcZE3Wdfpv7");
    // let user1MintToTransfer = new PublicKey("7nKwn8SxDq6jPaqX4oheSbD3oPTXQ9DopLQe7v5dzTPo");
    // let user1MintToTransfer = undefined;

    let user2 = Keypair.fromSecretKey(user2Sk);
    // let user2MintToTransfer = new PublicKey("8hvYkUC662orwr84WuR9Nf2ooEQP27g3hJwkMJDj6EbJ");

    let user2MintToTransfer = new PublicKey("YFLjioD3iS4wt7ixSo4g4hAwAR9tcq5g4bnbqd5XetB");
    // let user2MintToTransfer = new PublicKey("4Srj5WLMqngswe6aZLVMJbHbr2HJVAvt7cEQn8Uq2Nc7");
    // let user2MintToTransfer = undefined;

    let user3 = Keypair.fromSecretKey(user3Sk);
    // let user3MintToTransfer = new PublicKey("DASFJpdJ63V5wLCFxnMEnVWin3EHBopxKKeuJ6oivHXZ");

    let user3MintToTransfer = new PublicKey("86jssofCDfQYSTh9PS9UZ9ggarP7ZpCN4d7Z67Wi6rSV");
    // let user3MintToTransfer = undefined;

    let user1N = Keypair.fromSecretKey(user1NSk);
    // let user1NMintToTransfer = new PublicKey("5Z1aYsMCqsLEj3qCUZ5Vwj9e9fQdYtxpnAKMPJFsVNF4");

    let user1NMintToTransfer = new PublicKey("8dsV8DATmPqapx53XgQeDuzqBTWuyMR7oiJkPnsQJyWG");
    // let user1NMintToTransfer = undefined;

    let user2N = Keypair.fromSecretKey(user2NSk);
    // let user2NMintToTransfer = new PublicKey("FZWf8aYPVuoeaPMeNPh7cgdqM1X1ou5vgn8QKvp8Mczf");

    let user2NMintToTransfer = new PublicKey("ADsbDXWqQuQA37FKia3ntLeqN2LMRyDRkKAY5YZs6RXg");
    // let user2NMintToTransfer = undefined;

    let user3N = Keypair.fromSecretKey(user3NSk);
    // let user3NMintToTransfer = new PublicKey("E62gsZpVnbSQC4DkpBy2rS9PC6FiE2BMb7bxFjcSVxg9");

    // let user3NMintToTransfer = new PublicKey("DMUaX5iKGs29hU2KzPhQ7XBjNhBks3dxquLampY5wKMj");
    // let user3NMintToTransfer = new PublicKey("GzVAwJ44Pv9muhL8T27Hw1dHivZkVDguz7EYm8Yzrwm5");
    let user3NMintToTransfer = new PublicKey("DsaLPHCYveuCALVTNbRLWeXXbrgXS1FkocdVPw7kqZ2x");
    // let user3NMintToTransfer = undefined;

    let swapData: SwapData = {
        initializer: signer.publicKey,
        items: [],
        status: TradeStatus.Initializing,
        nbItems: 1,
        preSeed: "0009",
    };

    it("Initializing Program", async () => {
        program = getProgram(
            new anchor.AnchorProvider(
                new Connection(
                    "https://purple-alpha-orb.solana-devnet.quiknode.pro/da30b6f0da74d8a084df9aac72c5da241ab4f9a8/"
                ), //clusterApiUrl("devnet")),
                new anchor.Wallet(signer),
                {
                    commitment: "confirmed",
                }
            )
        );
        console.log("programId", program.programId.toBase58());
        console.log("signer", signer.publicKey.toBase58());
    });

    it("Mint NFTs ", async () => {
        if (!user1MintToTransfer) {
            let MintData = await NeoSwap.createPnft2({
                program,
                signer: user1,
                standard: TokenStandard.ProgrammableNonFungible,
                // destination: new PublicKey("5mG4wFjsnuuQWExTGqLN9ca2e5D1DBVZGDQKjGHJvJPQ"),
            });
            console.log("user1 MintData", MintData.mintAddress.toBase58());
        } else {
            console.log("user1 minting skipped");
        }
        if (!user2MintToTransfer) {
            let MintData = await NeoSwap.createPnft2({
                program,
                signer: user2,
                standard: TokenStandard.ProgrammableNonFungible,
            });
            console.log("user2 MintData", MintData.mintAddress.toBase58());
        } else {
            console.log("user2 minting skipped");
        }
        if (!user3MintToTransfer) {
            let MintData = await NeoSwap.createPnft2({
                program,
                signer: user3,
                standard: TokenStandard.ProgrammableNonFungible,
            });
            console.log("user3 MintData", MintData.mintAddress.toBase58());
        } else {
            console.log("user3 minting skipped");
            // metaplex find mint
        }

        if (!user1NMintToTransfer) {
            let { mintAddress: mintPk } = await NeoSwap.createPnft2({
                program,
                signer: user1N,
                standard: TokenStandard.FungibleAsset,
            });
            console.log("user1N mintPk", mintPk.toBase58());
        } else {
            console.log("user1N minting skipped");
        }
        if (!user2NMintToTransfer) {
            let { mintAddress: mintPk } = await NeoSwap.createPnft2({
                program,
                signer: user2N,
                standard: TokenStandard.FungibleAsset,
            });
            console.log("user2N mintPk", mintPk.toBase58());
        } else {
            console.log("user2N minting skipped");
        }
        if (!user3NMintToTransfer) {
            let { mintAddress: mintPk } = await NeoSwap.createPnft2({
                program,
                signer: user3N,
                standard: TokenStandard.NonFungible,
            });
            console.log("user3N mintPk", mintPk.toBase58());
        } else {
            console.log("user3N minting skipped");
        }
    });

    it("create SwapData", async () => {
        swapData.items.push({
            isNft: true,
            amount: new BN(1),
            mint: user1MintToTransfer,
            status: ItemStatus.NFTPending,
            owner: user1.publicKey,
            // destinary: new PublicKey('5mG4wFjsnuuQWExTGqLN9ca2e5D1DBVZGDQKjGHJvJPQ'),
            destinary: user2.publicKey,
        } as NftSwapItem);

        swapData.items.push({
            isNft: true,
            amount: new BN(1),
            mint: user2MintToTransfer,
            status: ItemStatus.NFTPending,
            owner: user2.publicKey,
            // destinary: new PublicKey('5mG4wFjsnuuQWExTGqLN9ca2e5D1DBVZGDQKjGHJvJPQ'),
            destinary: user3.publicKey,
        } as NftSwapItem);

        swapData.items.push({
            isNft: true,
            amount: new BN(1),
            mint: user3MintToTransfer,
            status: ItemStatus.NFTPending,
            owner: user3.publicKey,
            // destinary: new PublicKey('AkKM7KKpe5KMkL4RnV4WYFvMwNyxx5vSEbdRCZhBSPfk'),
            destinary: user1N.publicKey,
        } as NftSwapItem);

        swapData.items.push({
            isNft: true,
            amount: new BN(6),
            mint: user1NMintToTransfer,
            status: ItemStatus.NFTPending,
            owner: user1N.publicKey,
            // destinary: new PublicKey('AkKM7KKpe5KMkL4RnV4WYFvMwNyxx5vSEbdRCZhBSPfk'),
            destinary: user2N.publicKey,
        } as NftSwapItem);

        swapData.items.push({
            isNft: true,
            amount: new BN(6),
            mint: user2NMintToTransfer,
            status: ItemStatus.NFTPending,
            owner: user2N.publicKey,
            // destinary: new PublicKey('AByktSicY21ZoEDRn5dYdnAQc2AREDCB39XpF98zsZJj'),
            destinary: user3N.publicKey,
        } as NftSwapItem);

        swapData.items.push({
            isNft: true,
            amount: new BN(1),
            mint: user3NMintToTransfer,
            status: ItemStatus.NFTPending,
            owner: user3N.publicKey,
            // destinary: new PublicKey('AByktSicY21ZoEDRn5dYdnAQc2AREDCB39XpF98zsZJj'),
            destinary: user1.publicKey,
        } as NftSwapItem);
        console.log(swapData.items.length);
        swapData.nbItems = swapData.items.length;
    });

    it("initialize", async () => {
        // console.log(swapData.items.length);

        if (!pda) {
            const allInitData = await neoSwapNpm.initializeSwap({
                cluster: "devnet",
                signer: signer,
                swapData,
            });

            console.log("initialized", allInitData);
        } else {
            console.log("initiaize skipped", pda.toBase58());
        }
    });

    it("deposit NFT", async () => {
        let transactionHashs: { user: PublicKey; txh?: string[]; error?: unknown }[] = [];
        for await (const user of [user1N, user2N, user3N, user1, user2, user3]) {
            try {
                const { transactionHashes } = await neoSwapNpm.depositSwap({
                    cluster: "devnet",
                    signer: user,
                    swapDataAccount: pda,
                });
                console.log("transactionHashes", transactionHashes);
                transactionHashs.push({ user: user.publicKey, txh: transactionHashes });
            } catch (error) {
                transactionHashs.push({ user: user.publicKey, error });
            }
        }
        transactionHashs.forEach((v) => console.log("res", v));
        // console.log("transactionhashes", transactionHashs);
    });

    // it("claim and close", async () => {
    // const { allClaimSendAllArray } = await NeoSwap.claimAndClose({
    //         provider: program.provider as anchor.AnchorProvider,
    //         signer: signer.publicKey,
    //         swapDataAccount: pda,
    //         CONST_PROGRAM,
    //     });

    //     const recentBlockhash = (await program.provider.connection.getLatestBlockhash()).blockhash;

    //     allClaimSendAllArray.forEach((transactionDeposit) => {
    //         transactionDeposit.signers = [signer];
    //         transactionDeposit.tx.feePayer = signer.publicKey;
    //         transactionDeposit.tx.recentBlockhash = recentBlockhash;
    //     });

    //     const claimAndCloseHash = await program.provider.sendAll(allClaimSendAllArray, {
    //         skipPreflight: true,
    //     });
    //     console.log("claimAndCloseHash", claimAndCloseHash);

    //     for await (const hash of claimAndCloseHash) {
    // console.log(hash);
    //         program.provider.connection.confirmTransaction(hash);

    //     }

    //     console.log("claimAndCloseHash :", claimAndCloseHash);
    // });

    it("partial cancel and close from in trade user", async () => {
        let transactionHashs: {
            user: PublicKey;
            error?: unknown;
            txh?:
                | ErrorFeedback
                | {
                      transactionHashes: string[];
                  };
        }[] = [];

        for await (const user of [user1N, user2N, user3N, user1, user2, user3]) {
            try {
                const cancelAndCloseHash = await neoSwapNpm.cancelAndCloseSwap({
                    cluster: "devnet",
                    signer: user,
                    swapDataAccount: pda,
                });
                console.log("transactionHashes", cancelAndCloseHash);
                transactionHashs.push({ user: user.publicKey, txh: cancelAndCloseHash });
            } catch (error) {
                transactionHashs.push({ user: user.publicKey, error });
            }
        }
        transactionHashs.forEach((v) => console.log("res", v));
        const cancelAndCloseHash = await neoSwapNpm.cancelAndCloseSwap({
            signer,
            cluster: "devnet",
            swapDataAccount: pda,
        });

        console.log("cancelAndCloseHash :", cancelAndCloseHash);
    });

    it("finish cancel and close from signer", async () => {
        const cancelAndCloseHash = await neoSwapNpm.cancelAndCloseSwap({
            signer,
            cluster: "devnet",
            swapDataAccount: pda,
        });

        console.log("cancelAndCloseHash :", cancelAndCloseHash);
    });

    //UTILS FOR INITIALIZING
    // it("Create keypair", async () => {
    //     console.log(Keypair.generate().secretKey.toString());
    //     console.log(Keypair.generate().secretKey.toString());
    //     console.log(Keypair.generate().secretKey.toString());
    // });
    // it("show PK", async () => {
    //     // console.log("signer", signer.publicKey.toBase58());
    //     console.log("user1", user1.publicKey.toBase58());
    //     console.log("user2", user2.publicKey.toBase58());
    //     console.log("user3", user3.publicKey.toBase58());
    //     console.log("user1N", user1N.publicKey.toBase58());
    //     console.log("user2N", user2N.publicKey.toBase58());
    //     console.log("user3N", user3N.publicKey.toBase58());
    // });
});
