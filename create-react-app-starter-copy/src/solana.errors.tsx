// 0x1 - > not enough funds (token / nft or sol)
export const errorMachiavelique = 'error';

export async function programCatchError(error: any) {
    if (String(error).includes('User rejected the request')) {
        console.error('Cancelled by user');
    } else if (String(error).includes('0x0')) {
        console.error('PDA is already existing with this tradeRef \n', error);
    } else if (String(error).includes('0x1770')) {
        console.error('User not part of the trade', error);
    } else if (String(error).includes('0x1771')) {
        console.error('Mint not found', error);
    } else if (String(error).includes('0x1772')) {
        console.error("Amount given isn't correct", error);
    } else if (String(error).includes('0x1773')) {
        console.error("User shouldn't be sending funds", error);
    } else if (String(error).includes('0x1774')) {
        console.error('Nothing was found in the smart contract to be sent to you', error);
    } else if (String(error).includes('0x1775')) {
        console.error("Sum of amounts is Not Null", error);
    } else if (String(error).includes('0x1776')) {
        console.error('Not ready for claim', error);
    } else if (String(error).includes('0x1777')) {
        console.error("Given data isn't fitting", error);
    } else if (String(error).includes('0x1778')) {
        console.error('wrong system program Id passed', error);
    } else if (String(error).includes('0x1779')) {
        console.error('wrong Pda program Id passed', error);
    } else if (String(error).includes('0x177a')) {
        console.error('wrong Pda program Id passed', error);
    } else if (String(error).includes('0x177b')) {
        console.error('wrong signer, should be initializer to perform this action', error);
    } else if (String(error).includes('0x177c')) {
        console.error('wrong bump', error);
        } else if (String(error).includes('0x177d')) {
            console.error('The status given is not correct', error);
        // } else if (String(error).includes('0x177e')) {
        //     console.error('XXXXXXXXXXXXXXXXX', error);
        // } else if (String(error).includes('0x177f')) {
        //     console.error('XXXXXXXXXXXXXXXXX', error);
        // } else if (String(error).includes('0x1780')) {
        //     console.error('XXXXXXXXXXXXXXXXX', error);
        // } else if (String(error).includes('0x1781')) {
        //     console.error('XXXXXXXXXXXXXXXXX', error);
        // } else if (String(error).includes('0x1782')) {
        //     console.error('XXXXXXXXXXXXXXXXX', error);
        // } else if (error.code === "0x1783") {
        //     console.error('JJ1', error);
        // } else if (String(error).includes('0x1783')) {
        //     console.error('JJ', error);
        // } else if (String(error).includes('0x1782')) {
        //     console.error('Token ', error);
    } else {
        console.error(error);
    }
}
// ERROR {
//     #[msg("User not part oof the trade")]
//     UserNotPartOfTrade,
//     #[msg("Mint not found")]
//     MintNotFound,
//     #[msg("Amount given isn't correct")]
//     AmountIncorrect,
//     #[msg("User should be receiving funds")]
//     ShouldntSend,
//     #[msg("Nothing was found in the smart contract to be sent to you")]
//     NoSend,
//     #[msg("amount given isn't corresponding to the Data")]
//     AmountGivenIncorect,
//     #[msg("Not ready for claim yet")] 0x1776
//     NotReady,
//     #[msg("Given data isn't fitting")]
//     UnexpectedData,
// }
