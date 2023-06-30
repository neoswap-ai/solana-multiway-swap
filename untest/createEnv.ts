import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";

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

    let currency = new PublicKey("9RruPYjoWoWcYQsoy981qMFdnervBpsbPohUP3NrPidn");
    // let user1 = Keypair.fromSecretKey(user1Sk);
    // let user2 = Keypair.fromSecretKey(user2Sk);
    // let user3 = Keypair.fromSecretKey(user3Sk);
    // let user1N = Keypair.fromSecretKey(user1NSk);
    // let user2N = Keypair.fromSecretKey(user2NSk);
    // let user3N = Keypair.fromSecretKey(user3NSk);

    // let signer = Keypair.fromSecretKey(signerSk);

    // // UTILS FOR INITIALIZING
    it("Create keypair", async () => {
        console.log(Keypair.generate().secretKey);
        //     // console.log(Keypair.generate().secretKey.toString());
        //     // console.log(Keypair.generate().secretKey.toString());
    });
    it("show PK", async () => {
        console.log("signer", signer.publicKey.toBase58());
        console.log("user1", user1.publicKey.toBase58());
        console.log("user2", user2.publicKey.toBase58());
        console.log("user3", user3.publicKey.toBase58());
        console.log("user4", user4.publicKey.toBase58());
        console.log("user5", user5.publicKey.toBase58());
        console.log("user6", user6.publicKey.toBase58());
    });
});
