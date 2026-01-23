const cbor = require("cbor");
const axios = require("axios");
const config = require("../config/config");
const BorosProvider = require("./boros.provider");
const HybridSubmitter = require("./hybrid.submitter");

// Cardano
const { 
  BlockfrostProvider, 
  MeshTxBuilder,
  serializePlutusScript,
  MeshWallet, 
  resolvePaymentKeyHash,
  deserializeAddress,
  resolveDataHash,
  mConStr0,
} = require("@meshsdk/core");
const blockchainProvider = new BlockfrostProvider(config.cardano.blockfrost.projectId);
const borosProvider = new BorosProvider(config.cardano.boros.url);
const hybridSubmitter = new HybridSubmitter(borosProvider, blockchainProvider);

// Cardano Script
const plutusScript = require("../../plutus.json");
const script = {
  code: cbor
    .encode(Buffer.from(plutusScript.validators[0].compiledCode, "hex"))
    .toString("hex"),
  version: "V3",
};
const { address: scriptAddress } = serializePlutusScript(script, undefined, 0, false);

// ALDEA Token
const aldeaPolicyId = "99ad492da6e8a7afeccb91ac7492324686a69a701aa998be519db438";
const tokenNameHex = "414c444541";

// Cardano Wallet (using HybridSubmitter - tries Boros first, falls back to Blockfrost)
const cardanoAdminWallet = new MeshWallet({
  networkId: 0, // 0: testnet, 1: mainnet
  fetcher: blockchainProvider, // Use Blockfrost for fetching data
  submitter: hybridSubmitter, // Use HybridSubmitter (Boros with Blockfrost fallback)
  key: {
    type: 'mnemonic',
    words: config.cardano.adminMnemonic.split(',').map(word => word.trim()),
  },
});

async function lockAldeaTokens(address, amount, nonce) {

  console.log("address is: ", address);
  console.log("amount is: ", amount);
  console.log("nonce is: ", nonce);
  const adminAddress = (await cardanoAdminWallet.getUsedAddresses())[0];
  const adminHash = resolvePaymentKeyHash(adminAddress);
  const utxos = await cardanoAdminWallet.getUtxos();
  const changeAddress = await cardanoAdminWallet.getChangeAddress();

  // Create a fresh tx builder for each transaction to avoid state accumulation
  const txBuilder = new MeshTxBuilder({
    fetcher: blockchainProvider,
    verbose: true,
  });

  const unsignedTx = await txBuilder
    .txOut(scriptAddress, [{ unit: `${aldeaPolicyId+tokenNameHex}`, quantity: amount }])
    .txOutInlineDatumValue(mConStr0([adminHash]))
    .metadataValue(87, "pyrope")
    .metadataValue(88, address)
    .metadataValue(89, amount)
    .changeAddress(changeAddress)
    .selectUtxosFrom(utxos)
    .complete();
  
  console.log("Unsigned transaction:", JSON.stringify(unsignedTx, null, 2));
  
  const signedTx = await cardanoAdminWallet.signTx(unsignedTx);
  console.log("Signed transaction (CBOR):", signedTx);
  
  const txHash = await cardanoAdminWallet.submitTx(signedTx);

  console.log("Transaction Hash: ", txHash);
  
  if (txHash) {
    // Monitor transaction status using Blockfrost
    try {
      console.log(`Transaction ${txHash} submitted successfully via Boros`);
      // Wait a bit for confirmation (optional - can implement polling if needed)
      await new Promise(resolve => setTimeout(resolve, 2000));
      return txHash;
    } catch (error) {
      console.error("Error monitoring transaction:", error);
      return txHash; // Return txHash anyway as it was submitted
    }
  } else {
    return "";
  }
}

async function unlockAldeaTokens(amount, to, nonce) {
  const adminAddress = (await cardanoAdminWallet.getUsedAddresses())[0];
  const changeAddress = await cardanoAdminWallet.getChangeAddress();
  const adminHash = resolvePaymentKeyHash(adminAddress);
  const collateral = await cardanoAdminWallet.getCollateral();
  console.log("This is the collateral: ", collateral);
  console.log(`I have to send ${amount.toString()} ALDEA tokens to: `, to);
  
  console.log("The nonce received is: ", nonce.toString());
  console.log("Script address is: ", scriptAddress);
  let newAmount = amount.toString().split('.').join("");
  console.log(`I have to send ${newAmount.toString()} ALDEA tokens to: `, to);
  const assetUtxo = await _getAssetUtxo({
    scriptAddress: scriptAddress,
    asset: `${aldeaPolicyId+tokenNameHex}`,
    datum: mConStr0([adminHash]),
  });
  console.log("Asset UTXO: ", assetUtxo);

  const utxos = await cardanoAdminWallet.getUtxos();

  // get the PubKeyHash of the wallet
  const { pubKeyHash } = deserializeAddress(adminAddress);

  console.log("Using as input: ", assetUtxo.input.txHash);
  console.log("Using as index: ", assetUtxo.input.outputIndex);
  console.log("Amount is: ", assetUtxo.output.amount);
  console.log("Address is: ", assetUtxo.output.address);

  // Create a fresh tx builder for each transaction to avoid state accumulation
  const txBuilder = new MeshTxBuilder({
    fetcher: blockchainProvider,
    verbose: true,
  });

  let unsignedTx 
  try {
    unsignedTx = await txBuilder
      .spendingPlutusScriptV3()
      .txIn(assetUtxo.input.txHash, assetUtxo.input.outputIndex, assetUtxo.output.amount, assetUtxo.output.address)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr0([]))
      .txInScript(script.code)
      .txOut(to, assetUtxo.output.amount)
      .changeAddress(changeAddress)
      .txInCollateral(
        collateral[0].input.txHash,
        collateral[0].input.outputIndex,
        collateral[0].output.amount,
        collateral[0].output.address,
      )
      .requiredSignerHash(pubKeyHash)
      .selectUtxosFrom(utxos)
      .complete();
  } catch (e) {
    console.log("There has been an error creating the tx: ", e);
    console.log("Tx: ", unsignedTx);
    return;
  }
  
  console.log("This is the transaction built: ", unsignedTx);

  const signedTx = await cardanoAdminWallet.signTx(unsignedTx, true);
  const txHash = await cardanoAdminWallet.submitTx(signedTx);

  if (txHash) {
    console.log(`Unlock transaction ${txHash} submitted successfully via Boros`);
    return txHash;
  } else {
    console.error("Failed to submit unlock transaction");
    return null;
  }
}

async function _getAssetUtxo({scriptAddress, asset, datum}) {
  
  // Use Blockfrost to fetch UTxOs instead of Koios
  const utxos = await blockchainProvider.fetchAddressUTxOs(scriptAddress, asset);

  const dataHash = resolveDataHash(datum);
  const utxo = utxos.find((utxo) => {
    return utxo.output.dataHash === dataHash;
  });

  return utxo;
}

module.exports = {
  lockAldeaTokens,
  unlockAldeaTokens,
};
