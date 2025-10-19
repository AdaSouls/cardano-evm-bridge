const catchAsync = require("../util/catchAsync");
const blockfrostService = require("../service/blockfrost.service");
const bridgeService = require("../service/bridge.service");
const errorService = require("../service/error.service");
const meshService = require("../service/mesh.service");
const { address } = require('../validation/custom.validation');

const aldeaBridgeEvent = catchAsync(async (req, res) => {
  const webhookEvent = req.body;
  
  if (webhookEvent.type === "transaction") {
    console.log("Transaction Object: ", webhookEvent.payload[0].tx);
    console.log("Transaction Inputs: ", webhookEvent.payload[0].inputs);
    console.log("Transaction Outputs: ", webhookEvent.payload[0].outputs);
    
    // Get tx metadata from blockfrost
    let txMetadata = await blockfrostService.getTxMetadata(webhookEvent.payload[0].tx.hash);

    console.log("METADATA");
    console.log("--------");
    console.log(txMetadata.data);
    console.log("--------");

    // Validate tx metadata
    switch(txMetadata.data[0].json_metadata.network) { // chain      
      case "pyrope":
        console.log(`Label ${txMetadata.data[0].label} = CHAIN = ${txMetadata.data[0].json_metadata.network}`);
        console.log(`Label ${txMetadata.data[0].label} = ADDRESS = ${txMetadata.data[0].json_metadata.destination}`);
        console.log(`Label ${txMetadata.data[0].label} = AMOUNT = ${txMetadata.data[0].json_metadata.amount}`);
        // Validate the address in label 88 and the amount in label 89 and perform the locking of tokens to the script address on cardano
        if(address(txMetadata.data[0].json_metadata.destination)) {
          
          let lock = await meshService.lockAldeaTokens(txMetadata.data[0].json_metadata.destination, txMetadata.data[0].json_metadata.amount, webhookEvent.payload[0].tx.hash)
          
          if (lock === null) {
            errorService.internalError(res);
            return;
          } else {
            console.log("Locking worked: ", lock);
            res.status(200).send();
          }
        } else {
          console.log(`Address ${txMetadata.data[0].json_metadata} is not valid`);
          errorService.internalError(res);
          return;
        }
        break;
      default:
        console.log(`Chain ${txMetadata.data[0].json_metadata} not supported or wrong/missing label 87 metadata`);
        errorService.internalError(res);
        return;
    }
  } else {
    console.log("webhook type is: ", webhookEvent.type);
    errorService.internalError(res);
    return;
  }
});

const aldeaLockEvent = catchAsync(async (req, res) => {
  const webhookEvent = req.body;
  console.log(webhookEvent);
  if (webhookEvent.type === "transaction") {
    console.log("Transaction Object: ", webhookEvent.payload[0].tx);
    console.log("Transaction Inputs: ", webhookEvent.payload[0].inputs);
    console.log("Transaction Outputs: ", webhookEvent.payload[0].outputs);
    
    // Get tx metadata from blockfrost
    let txMetadata = await blockfrostService.getTxMetadata(webhookEvent.payload[0].tx.hash);

    console.log("Metadata: ", txMetadata.data);

    // Validate tx metadata
    switch(txMetadata.data[0].json_metadata) { // chain      
      case "pyrope":
        console.log(`Label ${txMetadata.data[0].label} = CHAIN = ${txMetadata.data[0].json_metadata}`);
        console.log(`Label ${txMetadata.data[1].label} = ADDRESS = ${txMetadata.data[1].json_metadata}`);
        console.log(`Label ${txMetadata.data[2].label} = AMOUNT = ${txMetadata.data[2].json_metadata}`);
        // Validate the address in label 88 and the amount in label 89 and mint tokens to that address on garnet chain
        if(address(txMetadata.data[1].json_metadata)) {
          
          let mint = await bridgeService.mintAldeaTo(txMetadata.data[1].json_metadata, txMetadata.data[2].json_metadata, webhookEvent.payload[0].tx.hash)
          
          if (mint === null) {
            errorService.internalError(res);
            return;
          } else {
            console.log("Mint is okay: ", mint);
            res.status(200).send();
          }
        } else {
          console.log(`Address ${txMetadata.data[1].json_metadata} is not valid`);
          errorService.internalError(res);
          return;
        }
        break;
      default:
        console.log(`Chain ${txMetadata.data[0].json_metadata} not supported or wrong/missing label 87 metadata`);
        errorService.internalError(res);
        return;
    }
  } else {
    errorService.internalError(res);
    return;
  }
});

module.exports = {
  aldeaBridgeEvent,
  aldeaLockEvent,
};
