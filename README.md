# solana-multiway-swap

### Front -> in folder/app:

>npm i

>npm start

### Program deployment -> in folder:

>anchor build
>
> -> follow the depolyment program

### Program testing 

> -> in *folder*: open and copy the content of good_idl.json
>
> -> in *folder/target/idl/neo_swap.json*: open and select the content
>
> -> in *folder*: open CLI, enter "anchor test"
>
> -> in *folder/target/idl/neo_swap.json*: as soon as the content is updated, paste and save the content of good_idl.json. /!\ quick action needed.
>
> -> back to CLI for results

Because of anchor recent changes, the IDL isn't supported as intended so the newly created IDL isn't compliant to the new way anchor sets up JS objects.

We then need to quickly overwrite the content of the IDL with the accurate one before testing starts.

# Audit Readyness

This Repo holds the solana program and module for NeoSwap multi-user multi-item swap.

the PDA acts as an escrow to gather and redistribute all assets

# Versionning

> ### solana version
>
> solana-cli 1.13.5 (src:959b760c; feat:1365939126)

> ### npm version
>
> 8.18.0

> ### rustc --version
>
> rustc 1.62.1 (e092d0b6b 2022-07-16)

> ### rustup --version
>
> rustup 1.25.1 (bb60b1e89 2022-07-12)

# Assumptions

**Only Deposit is the function triggered by user**.

for development, the initializer is being a parameter but will be changed to fixed data in later versions.

*initializer is neoSwap's Backend*

**All NFTs are supported**

# Schemes

 Program functions & User Trade:
 
 [NeoSwap Functionning Schemes](https://drive.google.com/drive/folders/16G1mz_wwIxH0qMsZRWn68o39zNqMJZQW?usp=share_link)

# Librairies

### FrontEnd    

#### Dependencies

> "@project-serum/anchor": "^0.25.0"
>
> "@solana/wallet-adapter-base": "^0.9.17"
>
> "@solana/wallet-adapter-react": "^0.15.19"
>
> "@solana/wallet-adapter-react-ui": "^0.9.17"
>
> "@solana/wallet-adapter-wallets": "^0.19.0"
>
> "@solana/web3.js": "^1.63.1"
>
> "@solana/spl-token": "^0.3.5"
>
> "react": "^18.2.0"
>
> "react-dom": "^18.2.0"
>
> "react-scripts": "^5.0.1

#### Dev Dependencies

> "mocha": "^10.1.0"
>
> "ts-mocha": "^10.0.0"
>
> "chai": "^4.3.4"
>
> "typescript": "^4.3.5"
>
> "react-app-rewired": "^2.2.1"
>
> "process": "^0.11.10"
>
> "shx": "^0.3.4"
>
> "source-map-loader": "^4.0.0"
>
> "@types/mocha": "^10.0.0"
>
> "@testing-library/jest-dom": "^5.16.5"
>
> "@testing-library/react": "^13.3.0"
>
> "@testing-library/user-event": "^14.4.3"
>
> "@types/jest": "^28.1.7"
>
> "@types/react": "^18.0.0"
>
> "@types/react-dom": "^18.0.0"
>
> "@types/testing-library__jest-dom": "^5.14.5"    


### BackEnd

> anchor-lang = "0.25.0"
>
> anchor-spl= "0.25.0"
>
> spl-associated-token-account = "~1.0.3"

