// EVM
const { Web3 } = require("web3");
const ethers = require("ethers");
const config = require("../config/config");
const web3 = new Web3(config.evm.rpc);
const provider = new ethers.providers.WebSocketProvider(config.evm.wss);
const admin = web3.eth.accounts.wallet.add(config.evm.adminPrivateKey);

// Ethereum Smart Contract 
const BridgeEthContract = require('../../build/contracts/BridgeEth.json');
const web3BridgeEth = new web3.eth.Contract(
  BridgeEthContract.abi,
  BridgeEthContract.networks['695569'].address
);
const bridgeEth = new ethers.Contract(
  BridgeEthContract.networks['695569'].address,
  BridgeEthContract.abi,
  provider,
);

// Cardano
const meshService = require("../service/mesh.service");

function listenBurnEvents() {

  bridgeEth.on("Burn", (from, to, amount, date, nonce, step) => {
    console.log(`${amount.toString()} TOKENS BURNED`);

    console.log("Burned from: ", from);
    console.log("Unlock to: ", to);
    console.log("Amount: ", amount);
    console.log("Nonce: ", nonce);
    console.log("Date: ", date);
    console.log("Step: ", step);

    // When we burn tokens on EVM, we have to unlock them on Cardano
    // EVM uses 18 decimals, Cardano uses 6 decimals
    // Divide by 10^12 to convert from 18 to 6 decimals
    const evmAmount = BigInt(amount.toString()); // amount from EVM in 18 decimal units
    const cardanoAmount = evmAmount / BigInt(1000000000000); // convert to 6 decimal units
    
    console.log(`Converting: ${evmAmount.toString()} EVM units (18 decimals) → ${cardanoAmount.toString()} Cardano units (6 decimals)`);
    
    let unlock = meshService.unlockAldeaTokens(cardanoAmount.toString(), to, nonce)

    if (unlock === null) {
      console.log("Unlock didn't work :", unlock)
    } else {
      console.log("Unlock worked: ", unlock)
    }
    return;
  })

}

async function mintAldeaTo(address, amount, originalTxHash) {
  let nonce = web3.utils.sha3(originalTxHash)
  try {
    // Cardano uses 6 decimals, EVM uses 18 decimals
    // Multiply by 10^12 to convert from 6 to 18 decimals
    const cardanoAmount = BigInt(amount); // amount from Cardano in 6 decimal units
    const evmAmount = cardanoAmount * BigInt(1000000000000); // convert to 18 decimal units
    
    console.log(`Converting: ${amount} Cardano units (6 decimals) → ${evmAmount.toString()} EVM units (18 decimals)`);
    
    let tx = await web3BridgeEth.methods.mint(address, evmAmount, nonce).send({ from: admin[0].address });
    return tx;
  } catch (e) {
    console.log("Error with minting transaction: ", e);
    return null
  }
}

module.exports = {
  mintAldeaTo,
  listenBurnEvents,
};
