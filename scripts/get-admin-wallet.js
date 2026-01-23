require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { MeshWallet, BlockfrostProvider, resolvePaymentKeyHash } = require("@meshsdk/core");

const mnemonic = process.env.CARDANO_ADMIN_MNEMONIC;

if (!mnemonic) {
  console.error("Error: CARDANO_ADMIN_MNEMONIC not set in .env");
  process.exit(1);
}

const blockfrostProvider = new BlockfrostProvider(process.env.BLOCKFROST_PROJECT_ID);

const wallet = new MeshWallet({
  networkId: 0,
  fetcher: blockfrostProvider,
  key: {
    type: 'mnemonic',
    words: mnemonic.split(',').map(word => word.trim()),
  },
});

async function main() {
  const addresses = await wallet.getUsedAddresses();
  const address = addresses[0] || await wallet.getChangeAddress();
  const pubKeyHash = resolvePaymentKeyHash(address);
  
  console.log("=== Admin Wallet ===");
  console.log("");
  console.log("Address:", address);
  console.log("PubKeyHash (owner):", pubKeyHash);
}

main().catch(console.error);
