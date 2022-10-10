// 0x1 - > not enough funds (token / nft or sol)
export const errorMachiavelique = 'error';


export async function programCatchError(error:any) {
    
    if (String(error).includes('0x0')) {
        console.error('PDA is already existing with this tradeRef\n', error);
    // } else if (String(error).includes('0x0') ){
    //     console.error('error', error);
    } else {
        console.error('error', error);
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