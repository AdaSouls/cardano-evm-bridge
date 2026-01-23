const cbor = require("cbor");
const { serializePlutusScript } = require("@meshsdk/core");

const plutusScript = require("../plutus.json");

const script = {
  code: cbor
    .encode(Buffer.from(plutusScript.validators[0].compiledCode, "hex"))
    .toString("hex"),
  version: "V3",
};

// networkId: 0 = testnet/preprod, 1 = mainnet
const { address: preprodAddress } = serializePlutusScript(script, undefined, 0, false);
const { address: mainnetAddress } = serializePlutusScript(script, undefined, 1, false);

console.log("=== ALDEA Bridge Validator ===");
console.log("");
console.log("Validator Hash:", plutusScript.validators[0].hash);
console.log("");
console.log("Preprod Address:", preprodAddress);
console.log("Mainnet Address:", mainnetAddress);
