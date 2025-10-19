import dotenv from 'dotenv'; 
import { useWallet } from "@meshsdk/react";
import {
  BlockfrostProvider, 
  MeshTxBuilder,
  KoiosProvider,
  KoiosSupportedNetworks,
} from "@meshsdk/core";
dotenv.config({ path: __dirname+'/.env' });

const bridgeAddress = "addr_test1qrhj03e9dtdhjpu7ju5cdv6kcj2jy5kt4kk34mt70dent5tknpg5syvme5n9v9kynwfke48a8asajnpdhehghne0zgeqlxn3am"
const aldeaPolicyId = "4084c311448c4d9bfa49c7cf6c83d7b1bb54ced13296e6a2d4211196";
const tokenNameHex = "5465737420414c444541";
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
      .txOut(bridgeAddress, [{ unit: `${aldeaPolicyId+tokenNameHex}`, quantity: bridgeAmount }])
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

