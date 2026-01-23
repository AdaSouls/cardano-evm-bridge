const FalconToken = artifacts.require("FalconToken.sol");
const FalconBridge = artifacts.require("FalconBridge.sol");

module.exports = async function (deployer, network, accounts) {
  // Deploy FalconToken (0 decimals)
  await deployer.deploy(FalconToken);
  const falconToken = await FalconToken.deployed();
  console.log("FalconToken deployed at:", falconToken.address);

  // Mint some test tokens (no decimals, so 1000 = 1000 FALCON)
  await falconToken.mint(accounts[0], "1000");
  console.log("1000 wFALCON minted to:", accounts[0]);

  // Deploy FalconBridge
  await deployer.deploy(FalconBridge, falconToken.address);
  const falconBridge = await FalconBridge.deployed();
  console.log("FalconBridge deployed at:", falconBridge.address);

  // Transfer admin to bridge so it can mint/burn
  await falconToken.updateAdmin(falconBridge.address);
  console.log("FalconToken admin updated to FalconBridge");
};
