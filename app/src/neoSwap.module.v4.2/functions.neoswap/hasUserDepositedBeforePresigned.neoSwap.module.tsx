import { AnchorProvider } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { getSwapDataFromPDA } from '../utils.neoSwap/getSwapDataFromPDA.neoSwap';
import { ItemStatus, TradeStatus } from '../utils.neoSwap/types.neo-swap/status.type.neoswap';

/**
 * @notice creates depositing instructions related to user
 * @dev fetch information from PDA, creates all instruction for depositing assets related to signer.
 * @param {PublicKey} swapDataAccount Swap's PDA account to cancel.
 * @param {PublicKey} signer user that deposits
 * @param {string} CONST_PROGRAM 4 character string to initialize the seed
 * @param {AnchorProvider} provider with active Connection
 * @return {Array<{tx: Transaction; signers?: Signer[] | undefined;}>}depositSendAllArray => object with all transactions ready to be added recentblockhash and sent using provider.sendAll
 */
export const hasUserDepositedBeforePresigned = async (Data: {
    swapDataAccount: PublicKey;
    CONST_PROGRAM: string;
    provider: AnchorProvider;
}): Promise<boolean> => {
    const swapData = await getSwapDataFromPDA({
        provider: Data.provider,
        CONST_PROGRAM: Data.CONST_PROGRAM,
        swapDataAccount: Data.swapDataAccount,
    }).catch((error) => {
        throw console.error(error);
    });

    // console.log('swapData', swapData.swapData.items);

    if (swapData.swapData.status !== TradeStatus.WaitingToDeposit)
        throw console.error('Trade not in waiting for deposit state');
    for await (let swapDataItem of swapData.swapData.items) {
        if (!swapDataItem.isPresigning) {
            switch (swapDataItem.isNft) {
                case true:
                    if (swapDataItem.status === ItemStatus.NFTPending) {
                        console.log(
                            'YYYY - error Deposit NFT X X ',
                            swapDataItem.mint.toBase58(),
                            'status',
                            swapDataItem.status,
                            '- XXX '
                        );
                        return false;
                    }

                    break;
                case false:
                    if (swapDataItem.status === ItemStatus.SolPending) {
                        console.log('YYYYYY error - Deposit sol item - XXXXXXX', swapDataItem.status);
                        return false;
                    }
                    break;
            }
        }
        // else if (swapDataItem.isPresigning) {
        // } else {
        //     console.log('presigning value error');
        //     throw { msg: 'presigning value error' };
        // }
    }

    return true;
};

export default hasUserDepositedBeforePresigned;
