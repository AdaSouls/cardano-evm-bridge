const Token = artifacts.require("Token.sol");
const BridgeEth = artifacts.require("BridgeEth.sol");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Token);
  const token = await Token.deployed();
  await token.mint(accounts[0], "100000000000000000000000000000");
  console.log("Tokens minted to: ", accounts[0]);
  await deployer.deploy(BridgeEth, token.address);
  const bridgeEth = await BridgeEth.deployed();
  await token.updateAdmin(bridgeEth.address);
};
