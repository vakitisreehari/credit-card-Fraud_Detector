const TransactionModel = require('../models/Transaction');

/**
 * Graph Fraud Ring Detection Engine
 * Builds dynamic node relations in-memory to trace connections:
 * Cardholders (Accounts) <--> Device Fingerprint Hashes <--> Masked Card Numbers
 * Identifies coordinated abuse and device-sharing fraud vectors.
 */
class GraphFraudService {
  /**
   * Scans historical transactions to map graph linkages for the current transaction
   * @param {string} cardholderName 
   * @param {string} deviceHash 
   * @param {string} cardNumber 
   * @returns {object} Telemetry including coordinated risk and alert indicators
   */
  static async evaluateGraphRelations(cardholderName, deviceHash, cardNumber) {
    if (!deviceHash || deviceHash === 'Unknown' || deviceHash === 'suspicious_fprint_8x3c') {
      // High device anomaly fallback
      return { riskScore: 0.15, sharedAccounts: 0, sharedCards: 0, coordinatedRing: false };
    }

    try {
      // Find all historical transactions that share the same hardware device fingerprint hash
      const sharedTransactions = await TransactionModel.find({
        'deviceFingerprint.hash': deviceHash
      }, { createdAt: -1 }, 100); // look at last 100 transactions on this device

      if (!sharedTransactions || sharedTransactions.length === 0) {
        return { riskScore: 0.0, sharedAccounts: 0, sharedCards: 0, coordinatedRing: false };
      }

      // Collect unique cardholders and unique credit card numbers on this device
      const uniqueCardholders = new Set();
      const uniqueCards = new Set();

      sharedTransactions.forEach(tx => {
        if (tx.cardholderName) {
          uniqueCardholders.add(tx.cardholderName.trim().toLowerCase());
        }
        if (tx.cardNumber) {
          uniqueCards.add(tx.cardNumber.trim());
        }
      });

      // Add current check features to graph sets
      uniqueCardholders.add(cardholderName.trim().toLowerCase());
      uniqueCards.add(cardNumber.trim());

      const sharedAccountsCount = uniqueCardholders.size;
      const sharedCardsCount = uniqueCards.size;

      let riskScore = 0.0;
      let coordinatedRing = false;

      // Rules:
      // 1. Sharing a device between > 2 distinct cardholder names is highly suspicious (Account Takeover / Emulator sharing)
      // 2. Sharing a device with > 2 distinct card numbers is typical of carding botnets
      if (sharedAccountsCount > 2 || sharedCardsCount > 2) {
        coordinatedRing = true;
        riskScore = Math.min(0.95, 0.40 + (sharedAccountsCount * 0.15) + (sharedCardsCount * 0.10));
      } else if (sharedAccountsCount === 2) {
        riskScore = 0.25; // moderate warning
      }

      return {
        riskScore: parseFloat(riskScore.toFixed(2)),
        sharedAccounts: sharedAccountsCount,
        sharedCards: sharedCardsCount,
        coordinatedRing
      };
    } catch (err) {
      console.error("Graph Fraud Engine Error:", err.message);
      return { riskScore: 0.0, sharedAccounts: 0, sharedCards: 0, coordinatedRing: false };
    }
  }
}

module.exports = GraphFraudService;
