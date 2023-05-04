import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
const { assert } = require("chai");
import SwapData from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/swapData.types.neoswap";
import NftSwapItem from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/nftSwapItem.types.neoswap";
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
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Signer,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
    clusterApiUrl,
} from "@solana/web3.js";
import NeoSwap from "../app/src/neoSwap.module.v4.2";
import {
    ItemStatus,
    TradeStatus,
} from "../app/src/neoSwap.module.v4.2/utils.neoSwap/types.neo-swap/status.type.neoswap";
import { swapDataAccountGiven } from "../app/src/solana.test";
import Solana from "../app/src/solana";
import { getProgram } from "../app/src/neoSwap.module.v4.2/utils.neoSwap/getProgram.neoswap";
import { sk } from "../deleteme/signer";
describe("swapCoontractTest", () => {
    anchor.setProvider(anchor.AnchorProvider.env());

    let program = anchor.workspace.NeoSwap as Program;
    const CONST_PROGRAM = "0002";
    const nbuser = 3;
    const nftNb = [0];
    let userKeypairs: Keypair[] = [];

    let signer = Keypair.fromSecretKey(sk);
    // let mintToTransfer = new PublicKey("BJ5TwcvJGuPTCUHZe38ksX17aPxcVrutkDF3rzjaZZ7y");
    // let mintToTransfer = new PublicKey("3WVAyCKNypAv99xCW7ZpFrjzg8GTgRmg4cgRbAbYcRDo");
    // let mintToTransfer = undefined
    // let mintToTransfer = new PublicKey("HBYWeF2VtsTe6yF6QyzE9wRTt9kV8jbEwsC4HRbgPQoM");
    // let mintToTransfer = new PublicKey("HBYWeF2VtsTe6yF6QyzE9wRTt9kV8jbEwsC4HRbgPQoM");
    let mintToTransfer = new PublicKey("EDzmVDKmRB8dnKkhVzo8pGrhYpC9QdYpBYcy7wsj13P9");
    let destinary = new PublicKey("5mG4wFjsnuuQWExTGqLN9ca2e5D1DBVZGDQKjGHJvJPQ");

    let unauthorizedKeypair: Keypair;
    let pda: PublicKey;
    let swapData: SwapData = {
        initializer: signer.publicKey,
        items: [
            {
                isNft: false,
                amount: new anchor.BN(-0.25 * nbuser * 10 ** 9),
                destinary: new PublicKey("11111111111111111111111111111111"),
                mint: new PublicKey("11111111111111111111111111111111"),
                owner: signer.publicKey,
                status: ItemStatus.SolToClaim,
            },
        ],
        status: TradeStatus.Initializing,
        nb_items: 1,
    };

    it("Initializing accounts", async () => {
        program = getProgram(
            new anchor.AnchorProvider(
                new Connection(clusterApiUrl("devnet")),
                new anchor.Wallet(signer),
                {
                    commitment: "confirmed",
                }
            )
        );
        console.log("programId", program.programId.toBase58());
    });

    it("Mint pNFT", async () => {
        if (!mintToTransfer) {
            let MintData = await NeoSwap.createPnft2({
                program,
                signer: signer,
            });
            mintToTransfer = MintData.mintAddress;
        } else {
            console.log("minting skipped");
        }
    });

    it("Transfer pNFT", async () => {
        // signer= Keypair.fromSeed()
        //  test writing dev code just here
        console.log("signer wallet", Keypair.fromSecretKey(sk).publicKey.toBase58());

        // console.log(Keypair.generate().secretKey.toString());
        let MintData = await NeoSwap.transferPNFT({
            destinary,
            mintToDeposit: mintToTransfer,
            program,
            signer: signer,
        });
    });
});
