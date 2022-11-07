import { BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

type NftSwapItem = {
  isNft: boolean;
  mint: PublicKey;
  amount: BN;
  owner: PublicKey;
  destinary: PublicKey;
  status: number;
};
export default NftSwapItem;
