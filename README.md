<div align="center">
  <a href="https://neoswap.ai/wp-content/uploads/2022/08/logo-small-2.png">
    <img src="https://mma.prnewswire.com/media/2009538/NeoSwap_AI_Logo.jpg?w=400" alt="Logo">
  </a>

  <h3 align="center">NeoSwap Multiway Swap</h3>

</div>

# Table of Contents

1. [About The Project](#about-the-project)
2. [Installation](#installation)
3. [Audit readyness](#audit-readyness)
4. [Versionning](#versionning)
5. [Schemes](#schemes)
6. [Assumptions](#assumptions)
7. [License](#license)
8. [Contact](#contact)

# About The Project

A multi-way swap refers to a trading arrangement involving more than two parties, where each party can trade assets in such a way that all participants benefit. This concept is particularly useful in contexts where direct exchanges between two parties might not be possible or optimal. The project allows performing multiway swaps on the Solana blockchain. This project facilitates multi-way swaps on the Solana blockchain.

# Installation

### Front → in folder/app:

> npm i

> npm start

### Program deployment → in folder:

> anchor build
>
> → follow the depolyment program

### Program testing

> → in _folder_: open and copy the content of good_idl.json
>
> → in _folder/target/idl/neo_swap.json_: open and select the content
>
> → in _folder_: open CLI, enter "anchor test"
>
> → in _folder/target/idl/neo_swap.json_: as soon as the content is updated, paste and save the content of good_idl.json. /!\ quick action needed.
>
> → back to CLI for results.

Because of anchor recent changes, the IDL isn't supported as intended so the newly created IDL isn't compliant to the new way anchor sets up JS objects.

/!\ We then need to quickly overwrite the content of the IDL with the accurate one before testing starts.

# Versionning

- Solana CLI: 1.13.5 (source: 959b760c; feature: 1365939126)
- NPM: 8.18.0
- Rust Compiler (rustc): 1.62.1 (e092d0b6b 2022-07-16)
- Rustup: 1.25.1 (bb60b1e89 2022-07-12)

# Audit Readyness

This Repo holds the solana program and module for NeoSwap multi-user multi-item swap.
The PDA acts as an escrow to gather and redistribute all assets.

# Assumptions

**Only Deposit is the function triggered by user**.

for development, the initializer is being a parameter but will be changed to fixed data in later versions.

_initializer is neoSwap's Backend_

**All NFTs are supported**

# Schemes

Program functions & User Trade:

[NeoSwap Functionning Schemes](https://drive.google.com/drive/u/3/folders/1DvQP9BeMN7KUdf2yNtDQ9SnQ450nVQeh)

# License

This project is licensed under the Apache 2.0 License - see the [LICENSE.md](LICENSE.md) file for details.

# Contact

> kuba.kwiecien@neoswap.ai
