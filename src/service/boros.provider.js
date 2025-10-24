const axios = require("axios");
const config = require("../config/config");

/**
 * Boros Transaction Submitter
 * Implements the Mesh submitter interface for Boros
 */
class BorosProvider {
  constructor(borosUrl = config.cardano.boros.url) {
    this.borosUrl = borosUrl;
    this.queue = "default"; // Default queue name, can be configured
  }

  /**
   * Submit a signed transaction to Boros
   * @param {string} tx - CBOR-encoded signed transaction (hex string)
   * @returns {Promise<string>} Transaction hash
   */
  async submitTx(tx) {
    try {
      console.log(`Submitting transaction to Boros at ${this.borosUrl}`);
      
      // Boros accepts CBOR-encoded transactions
      // The exact endpoint format may vary based on Boros version
      // Common patterns:
      // - HTTP POST with CBOR body
      // - gRPC call (requires @grpc/grpc-js)
      
      // For HTTP submission (adjust endpoint as needed):
      const response = await axios.post(
        `${this.borosUrl}/api/v1/tx/submit`,
        {
          queue: this.queue,
          tx: tx, // CBOR hex string
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      if (response.data && response.data.txHash) {
        console.log(`Transaction submitted successfully: ${response.data.txHash}`);
        return response.data.txHash;
      } else if (response.data && response.data.tx_hash) {
        console.log(`Transaction submitted successfully: ${response.data.tx_hash}`);
        return response.data.tx_hash;
      } else {
        // If Boros doesn't return the hash, we need to compute it
        // This is a fallback - ideally Boros should return the hash
        console.warn("Boros did not return transaction hash, computing from transaction");
        const { Transaction } = require("@meshsdk/core");
        const transaction = Transaction.fromCbor(tx);
        const txHash = transaction.toHash();
        console.log(`Computed transaction hash: ${txHash}`);
        return txHash;
      }
    } catch (error) {
      console.error("Error submitting transaction to Boros:", error.message);
      if (error.response) {
        console.error("Boros response status:", error.response.status);
        console.error("Boros response data:", JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error("No response received from Boros. Request was made but no response.");
        console.error("Error details:", error.code, error.errno);
      } else {
        console.error("Error setting up request:", error.message);
      }
      
      // Include more details in the thrown error
      const errorDetail = error.response 
        ? `Status ${error.response.status}, ${JSON.stringify(error.response.data)}`
        : error.request
        ? `No response from Boros (${error.code})`
        : error.message;
      
      throw new Error(`Failed to submit transaction to Boros: ${errorDetail}`);
    }
  }

  /**
   * Monitor transaction status (optional)
   * @param {string} txHash - Transaction hash to monitor
   * @returns {Promise<object>} Transaction status
   */
  async getTxStatus(txHash) {
    try {
      const response = await axios.get(
        `${this.borosUrl}/api/v1/tx/${txHash}/status`,
        {
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting transaction status for ${txHash}:`, error.message);
      return null;
    }
  }

  /**
   * Set the queue name for transaction submission
   * @param {string} queueName - Queue name to use
   */
  setQueue(queueName) {
    this.queue = queueName;
  }
}

module.exports = BorosProvider;
