const BorosProvider = require("./boros.provider");

/**
 * Hybrid Transaction Submitter
 * Tries Boros first, falls back to Blockfrost if Boros is unavailable
 */
class HybridSubmitter {
  constructor(borosProvider, blockfrostProvider) {
    this.borosProvider = borosProvider;
    this.blockfrostProvider = blockfrostProvider;
    this.useBlockfrostFallback = true;
  }

  /**
   * Submit a transaction, trying Boros first, then Blockfrost
   * @param {string} tx - CBOR-encoded signed transaction
   * @returns {Promise<string>} Transaction hash
   */
  async submitTx(tx) {
    // Try Boros first
    try {
      console.log("Attempting to submit transaction via Boros...");
      const txHash = await this.borosProvider.submitTx(tx);
      console.log("✓ Transaction submitted successfully via Boros");
      return txHash;
    } catch (borosError) {
      console.warn("Boros submission failed:", borosError.message);
      
      // If fallback is enabled, try Blockfrost
      if (this.useBlockfrostFallback) {
        try {
          console.log("Attempting fallback to Blockfrost...");
          const txHash = await this.blockfrostProvider.submitTx(tx);
          console.log("✓ Transaction submitted successfully via Blockfrost (fallback)");
          return txHash;
        } catch (blockfrostError) {
          console.error("Blockfrost submission also failed:", blockfrostError.message);
          throw new Error(
            `Both Boros and Blockfrost submission failed. ` +
            `Boros: ${borosError.message}. Blockfrost: ${blockfrostError.message}`
          );
        }
      } else {
        // Re-throw Boros error if fallback is disabled
        throw borosError;
      }
    }
  }

  /**
   * Enable or disable Blockfrost fallback
   * @param {boolean} enabled
   */
  setFallbackEnabled(enabled) {
    this.useBlockfrostFallback = enabled;
  }
}

module.exports = HybridSubmitter;
