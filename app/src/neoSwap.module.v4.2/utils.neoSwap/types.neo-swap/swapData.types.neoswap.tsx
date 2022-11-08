import { PublicKey } from "@solana/web3.js";
import NftSwapItem from "./nftSwapItem.types.neoswap";

type SwapData = {
  initializer: PublicKey;
  status: number;
  items: Array<NftSwapItem>;
};

export default SwapData;
