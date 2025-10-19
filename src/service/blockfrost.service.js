const errorService = require("./error.service");
const axios = require("axios");
const config = require("../config/config");

/**
 * Retrieves the metadata of a cardano transaction
 */
async function getTxMetadata(txHash) {  
  try {

    // update metadata in opensea
    let headers = {
      'Content-Type': 'application/json',
      'project_id': `${config.cardano.blockfrost.projectId}`,
    };
    
    let resp = await axios.get(`${config.cardano.blockfrost.baseUrl}/txs/${txHash}/metadata`, { headers });
    return resp;

  } catch (e) {
    console.log(e);
    errorService.stashInternalErrorFromException(e, "Svc:Assets:updateAssetMetadata: ");
    return false;
  }
}

module.exports = {
  getTxMetadata,

};