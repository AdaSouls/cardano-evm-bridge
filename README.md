# Cardano-EVM Bridge

Cardano-EVM Bridge is an open source toolkit that lets you bridge Native Assets from Cardano L1 to any Ethereum Virtual Machine (EVM) compatible chain. 

It includes:

- Cardano Validator Scripts (Aiken)
- EVM Smart Contracts (Solidity)
- Node Backend API (Webhook-Based)
- Off-Chain Code (TypeScript)

The Bridge works for a single Native Asset but it can be easily extended to support multiple assets, by listening to a greater number of webhooks. 

## How Does it Work?

### From Cardano to EVM

1) The user sends any `amount` of a Native Asset to the bridge payment address on Cardano
2) That initial transaction will have the address of the recipient on the EVM chain attached to it as `metadata`
3) The Node Backend API will listen to that deposit and will create a new transaction that locks the funds into our validator script (another Cardano address) as an UTXO
4) Those funds can only be unlocked using the Cardano-EVM Bridge owner's private key
5) Once that transaction is completed, the Node Backend API will `mint` the `ERC20` token to the address specified on the initial transaction on the EVM chain.

### From EVM to Cardano

1) The user calls the `burn` function on the `ERC20` token contract, with any `amount`, on the EVM chain, providing the Cardano address where the funds will be released
2) The Node Backend API will listen to that `burn` event an the EVM chain nd create a new transaction on Cardano, to unlock the `amount` of the Native Asset
3) Funds will be released to the Cardano address provided when calling the `burn` function

## Why Did We Build Cardano-EVM Bridge?

Because we wanted to bridge our Cardano Native Token to an EVM chain and we found out that there were no options to do it. 

So we had to do it ourselves.

## Setup

In order to run this project, the following steps need to be completed:

1) Install dependencies 
2) Generate Aiken validator's blueprint
3) Compile and deploy Solidity smart contracts
4) Setup Node Backend API 
5) Configure webhooks on Cardano blockchain

### Install Dependencies

1) Run the following command:

```
npm i
```

## Cardano Validators 

1) Check project and run tests:

```
aiken check
```

2) Build project:

```
aiken build
```

3) The blueprint of our validator is now available on `./plutus.json`

### Metadata

Cardano-EVM Bridge is compatible with the `metadata` format introduced by Milkomeda's Bridge. This way, the initial transaction that sends a Native Asset to the Bridge payment address must contain the following `labels`:

- `87: <chain_name>`
- `88: <recipient_address>`
- `89: <amount>`

## EVM Smart Contracts

1) Compile smart contracts:

```
truffle compile
```

2) Deploy smart contracts:

```
truffle migrate --network <chain_name>
```

3) OPTIONAL - Verify smart contracts:

a) Make sure that you provide a valid Etherscan API key under `api_keys.etherscan` in `truffle.config.js`

b) Run the following commands:

```
truffle run verify Token --network <chain_name>
truffle run verify BridgeEth --network <chain_name>
```

## Node Backend API

1) Assuming all dependencies has been installed with `npm i`, you can run the Backend API on localhost with:

```
npm run dev
```

### Cardano Webhooks

We can setup Blockfrost's webhooks to listen to events on the Cardano Blockchain. Our backend will be notified every time there is on-chain activity we care about.

We need two different webhooks to setup our Cardano-EVM Bridge:

1) Initial Bridge Event: this is the event that gets emitted every time the user deposits the Native Asset on the bridge payment address

Trigger conditions for this webhook:

- `recipient - EQUAL TO = <bridge_payment_address>`
- `policy id - EQUAL TO = <asset_policy_id>`
- `asset_hex - EQUAL TO = <asset_hex>`

2) Lock Bridge Event: 

Trigger conditions for this webhook: this is the event that gets emitted every time a Native Asset is locked on the Cardano script address

Trigger conditions for this webhook:

- `recipient - EQUAL TO = <bridge_script_address>`
- `policy id - EQUAL TO = <asset_policy_id>`
- `asset_hex - EQUAL TO = <asset_hex>`

### ngrok

In order to test webhooks on our localhost server, we can use [`ngrok`](https://ngrok.com/downloads):

```
ngrok http <PORT>
```

`PORT` number must match the one specified on the `.env` file and where our server listens on. 
 
This will give us a Base URL we can then provide as our Endpoint URL on Blockfrost.

## Off-Chain Code

Off-Chain code written in TypeScript + React is provided, to show interactions on both Cardano and Ethereum from a user's connected wallet:

1) Bridge from Cardano to EVM
2) Bridge from EVM to Cardano

