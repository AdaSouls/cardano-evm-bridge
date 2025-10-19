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

    // When we burn tokens on Eth, we have to unlock them on Cardano
    // convert amount from wei to eth before sending to cardano
    const weiToEthAmount = ethers.utils.formatEther(amount)
    let unlock = meshService.unlockAldeaTokens(weiToEthAmount, to, nonce)

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
    let tx = await web3BridgeEth.methods.mint(address, web3.utils.toBigInt(web3.utils.toWei(amount, "ether")), nonce).send({ from: admin[0].address });
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
