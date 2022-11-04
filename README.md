## solana-multiway-swap

# Front -> in folder/app:

>npm i

>npm start

# Program deployment -> in folder:

>anchor build
>
> -> follow the depolyment program

# Program testing 
> -> in folder: open and copy the content of goodIdl.json
> -> in folder/target/idl/neo_swap.json: open and select the content
> -> in folder: open CLI, enter "anchor test"
> -> in folder/target/idl/neo_swap.json: as soon as the content is updated, paste and save the content of goodIdl.json
> -> back to CLI for results

## Audit Readyness

This Repo holds the solana program and module for NeoSwap multi-user multi-item swap.

the PDA acts as an escrow to gather and redistribute all assets

## Versionning

> # solana version
>
> solana-cli 1.13.5 (src:959b760c; feat:1365939126)

> # npm version
>
> 8.18.0

> # rustc --version
>
> rustc 1.62.1 (e092d0b6b 2022-07-16)

> # rustup --version
>
> rustup 1.25.1 (bb60b1e89 2022-07-12)

## Assumptions

**Only Deposit is the function triggered by user**.
for development, the initializer is being a parameter but will be changed to fixed data in later versions.
*initializer is neoSwap's Backend*

**All NFTs are supported**

## Schemes

Program functions & User Trade:

[NeoSwap Functionning Schemes](https://)

## Librairies

# FrontEnd    
"@project-serum/anchor": "^0.25.0",
"@solana/wallet-adapter-base": "^0.9.17",
"@solana/wallet-adapter-react": "^0.15.19",
"@solana/wallet-adapter-react-ui": "^0.9.17",
"@solana/wallet-adapter-wallets": "^0.19.0",
"@solana/web3.js": "^1.63.1",
"react": "^18.2.0"
"@types/mocha": "^9.0.0",
"chai": "^4.3.4",
"mocha": "^9.0.3",
"ts-mocha": "^8.0.0",
"typescript": "^4.3.5"

# BackEnd

> anchor-lang = "0.25.0"
> anchor-spl= "0.25.0"
> spl-associated-token-account = "~1.0.3"