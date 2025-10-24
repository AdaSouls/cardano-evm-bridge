import dotenv from 'dotenv';
import { useWallet } from "@meshsdk/react";
import {
  BlockfrostProvider,
  MeshTxBuilder,
  KoiosProvider,
  KoiosSupportedNetworks,
} from "@meshsdk/core";
dotenv.config({ path: __dirname + '/.env' });

const bridgeAddress = "addr_test1qqmceh6c3z9eeq55wz50c5szw59dtyjctyyev8l2xxgwrs8g5a36wxc9qt0ae44gxk9nsxd65dwdu7gr0fal8q0dvxzqzsz4jr"
const aldeaPolicyId = "99ad492da6e8a7afeccb91ac7492324686a69a701aa998be519db438";
const tokenNameHex = "414c444541";
const networkName = "garnet";
const ethAddress = "0xfe02781cc0fe76Bfd2D211430bfa97D2889fd853";
const aldeaAmount = "3000000";
const koiosNetwork = process.env.CARDANO_NETWORK!;
const koiosSecretToken = process.env.KOIOS_SECRET_TOKEN!;
const blockfrostProjectId = process.env.BLOCKFROST_PROJECT_ID!;

const koios = new KoiosProvider(koiosNetwork as KoiosSupportedNetworks, koiosSecretToken);

const blockfrostProvider = new BlockfrostProvider(blockfrostProjectId);

const txBuilder = new MeshTxBuilder({
  fetcher: blockfrostProvider,
  verbose: true,
});

async function BridgeFromCardanoToEvm() {

  const { wallet } = useWallet();

  const utxos = await wallet.getUtxos();
  const changeAddress = await wallet.getChangeAddress();

  const unsignedTx = await txBuilder
    .txOut(bridgeAddress, [{ unit: `${aldeaPolicyId + tokenNameHex}`, quantity: bridgeAmount }])
    .metadataValue(87, networkName)
    .metadataValue(88, ethAddress)
    .metadataValue(89, aldeaAmount)
    .changeAddress(changeAddress)
    .selectUtxosFrom(utxos)
    .complete();

  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);
  console.log("txHash", txHash);
  if (txHash) {
    koios.onTxConfirmed(
      txHash,
      () => {
        console.log("Assets bridged from Cardano to EVM");
      },
      100
    );
  }
}

BridgeFromCardanoToEvm();

