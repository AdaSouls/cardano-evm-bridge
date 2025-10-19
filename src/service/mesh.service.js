const cbor = require("cbor");
const config = require("../config/config");

// Cardano
const { 
  BlockfrostProvider, 
  MeshTxBuilder,
  KoiosProvider, 
  serializePlutusScript,
  MeshWallet, 
  resolvePaymentKeyHash,
  deserializeAddress,
  resolveDataHash,
  mConStr0,
} = require("@meshsdk/core");
const blockchainProvider = new BlockfrostProvider(config.cardano.blockfrost.projectId);
const koios = new KoiosProvider(config.cardano.network, config.cardano.koios.secretToken);

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
const aldeaPolicyId = "4084c311448c4d9bfa49c7cf6c83d7b1bb54ced13296e6a2d4211196";
const tokenNameHex = "5465737420414c444541";

// Cardano Wallet
const cardanoAdminWallet = new MeshWallet({
  networkId: 0, // 0: testnet, 1: mainnet
  fetcher: blockchainProvider,
  submitter: blockchainProvider,
  key: {
    type: 'mnemonic',
    words: ["***REMOVED***"],
  },
});

// Tx Builder
const txBuilder = new MeshTxBuilder({
  fetcher: blockchainProvider,
  //evaluator: blockchainProvider,
  verbose: true,
});

async function lockAldeaTokens(address, amount, nonce) {

  console.log("address is: ", address);
  console.log("amount is: ", amount);
  console.log("nonce is: ", nonce);
  const adminAddress = (await cardanoAdminWallet.getUsedAddresses())[0];
  const adminHash = resolvePaymentKeyHash(adminAddress);
  const utxos = await cardanoAdminWallet.getUtxos();
  const changeAddress = await cardanoAdminWallet.getChangeAddress();

  const unsignedTx = await txBuilder
    .txOut(scriptAddress, [{ unit: `${aldeaPolicyId+tokenNameHex}`, quantity: amount }])
    .txOutInlineDatumValue(mConStr0([adminHash]))
    .metadataValue(87, "pyrope")
    .metadataValue(88, address)
    .metadataValue(89, amount)
    .changeAddress(changeAddress)
    .selectUtxosFrom(utxos)
    .complete();
  
  const signedTx = await cardanoAdminWallet.signTx(unsignedTx);
  const txHash = await cardanoAdminWallet.submitTx(signedTx);

  console.log(txHash)
  if (txHash) {
    let koiosTx = await koios.onTxConfirmed(txHash, () => {
      console.log(`Tx ${txHash} submitted successfully.`)
    });
    console.log("Koios TX: ", koiosTx);
    return koiosTx;
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

  let unsignedTx 
  try {
    unsignedTx = await txBuilder
      .spendingPlutusScriptV3()
      .txIn(assetUtxo.input.txHash, assetUtxo.input.outputIndex, assetUtxo.output.amount, assetUtxo.output.address)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr0([adminHash]))
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
    koios.onTxConfirmed(txHash, () => {
      console.log(`Tx ${txHash} submitted successfully.`)
    });
  }
}

async function _getAssetUtxo({scriptAddress, asset, datum}) {
  
  const utxos = await koios.fetchAddressUTxOs(scriptAddress, asset);

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
