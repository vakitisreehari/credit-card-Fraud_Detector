const TransactionModel = require('../models/Transaction');
const DeviceProfileModel = require('../models/DeviceProfile');

// Mock database coordinates for cardholders to measure distance from home
const CARDHOLDER_HOMES = {
  'John Doe': { lat: 40.7128, lon: -74.0060, city: 'New York', country: 'US' }, // New York
  'Jane Smith': { lat: 34.0522, lon: -118.2437, city: 'Los Angeles', country: 'US' }, // Los Angeles
  'Alice Johnson': { lat: 51.5074, lon: -0.1278, city: 'London', country: 'UK' }, // London
  'Bob Miller': { lat: 48.8566, lon: 2.3522, city: 'Paris', country: 'FR' }, // Paris
  'Charlie Brown': { lat: 35.6762, lon: 139.6503, city: 'Tokyo', country: 'JP' } // Tokyo
};

class BehaviorService {
  // Calculates distance between two coordinates in km using Haversine formula
  static haversineDistance(coords1, coords2) {
    if (!coords1 || !coords2) return 0;
    
    const lat1 = coords1.lat;
    const lon1 = coords1.lon;
    const lat2 = coords2.lat;
    const lon2 = coords2.lon;

    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Returns home coordinate or random home if name is new
  static getHomeCoordinates(cardholderName) {
    if (CARDHOLDER_HOMES[cardholderName]) {
      return CARDHOLDER_HOMES[cardholderName];
    }
    
    // Generate a default coordinate (New York baseline)
    return { lat: 40.7128, lon: -74.0060, city: 'New York', country: 'US' };
  }

  // Calculates distance from home for current transaction
  static getDistanceFromHome(cardholderName, location) {
    if (!location || typeof location.latitude === 'undefined' || typeof location.longitude === 'undefined') {
      return 0.0;
    }
    
    const home = this.getHomeCoordinates(cardholderName);
    const distance = this.haversineDistance(
      { lat: home.lat, lon: home.lon },
      { lat: location.latitude, lon: location.longitude }
    );
    
    return parseFloat(distance.toFixed(2));
  }

  // Count transactions for this card number (via hash or number) in the past hour
  static async getVelocity1h(cardHash, cardNumber) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    try {
      // Find transactions for this card in the last hour
      const query = {
        createdAt: { $gte: oneHourAgo }
      };
      if (cardHash) {
        query.cardHash = cardHash;
      } else {
        query.cardNumber = cardNumber;
      }
      
      const count = await TransactionModel.countDocuments(query);
      return count;
    } catch (err) {
      console.error('Error fetching velocity:', err.message);
      return 0;
    }
  }

  // Determine if a card has had prior declines (blocked/flagged) in last 24h
  static async hasRecentDeclines(cardHash, cardNumber) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const query = {
        status: 'BLOCKED',
        createdAt: { $gte: oneDayAgo }
      };
      if (cardHash) {
        query.cardHash = cardHash;
      } else {
        query.cardNumber = cardNumber;
      }
      
      const count = await TransactionModel.countDocuments(query);
      return count > 0 ? 1 : 0;
    } catch (err) {
      return 0;
    }
  }

  // Evaluates device fingerprint parameters and checks for multi-account abuse
  static async evaluateDeviceIntelligence(deviceFingerprint, cardholderName, ipAddress) {
    if (!deviceFingerprint || !deviceFingerprint.hash) {
      return 0.15; // baseline medium risk if no fingerprint provided
    }

    const deviceHash = deviceFingerprint.hash;

    try {
      // Find device profile
      let profile = await DeviceProfileModel.findOne({ deviceHash });

      if (!profile) {
        // Create new device profile
        await DeviceProfileModel.create({
          cardholderName,
          deviceHash,
          ipAddresses: [ipAddress],
          userAgents: [deviceFingerprint.browser + ' on ' + deviceFingerprint.os],
          trustScore: 1.0,
          transactionCount: 1
        });
        return 0.05; // Brand new, clean device profile
      }

      // If device belongs to someone else, flag high risk (device sharing/emu fraud)
      if (profile.cardholderName !== cardholderName) {
        console.log(`DEVICE ALERT: Shared device detected between ${profile.cardholderName} and ${cardholderName}`);
        
        // Mark down trust score
        const newTrust = Math.max(0.1, profile.trustScore - 0.4);
        await DeviceProfileModel.findOneAndUpdate(
          { deviceHash },
          { 
            $set: { trustScore: newTrust },
            $push: { ipAddresses: ipAddress },
            $inc: { transactionCount: 1 }
          }
        );
        return parseFloat((1.0 - newTrust).toFixed(2));
      }

      // Device exists and matches cardholder
      // Increment count and add IP if new
      await DeviceProfileModel.findOneAndUpdate(
        { deviceHash },
        { 
          $push: { ipAddresses: ipAddress },
          $inc: { transactionCount: 1 }
        }
      );

      // Return inverse of trust score
      return parseFloat((1.0 - profile.trustScore).toFixed(2));

    } catch (err) {
      console.error('Error evaluating device intelligence:', err.message);
      return 0.1;
    }
  }

  // Speed of Light Check (consecutive transaction geographic velocity)
  static async checkSpeedOfLightViolation(cardHash, cardNumber, location) {
    if (!location || typeof location.latitude === 'undefined' || typeof location.longitude === 'undefined') {
      return null;
    }
    try {
      const query = {};
      if (cardHash) {
        query.cardHash = cardHash;
      } else {
        query.cardNumber = cardNumber;
      }
      
      // Get the most recent transaction
      const transactions = await TransactionModel.find(query, { createdAt: -1 }, 1);
      if (!transactions || transactions.length === 0) {
        return null;
      }
      
      const prevTx = transactions[0];
      if (!prevTx.location || typeof prevTx.location.latitude === 'undefined' || typeof prevTx.location.longitude === 'undefined') {
        return null;
      }
      
      // If same coordinates, no violation
      if (prevTx.location.latitude === location.latitude && prevTx.location.longitude === location.longitude) {
        return null;
      }

      const distance = this.haversineDistance(
        { lat: prevTx.location.latitude, lon: prevTx.location.longitude },
        { lat: location.latitude, lon: location.longitude }
      );

      const timeDiffMs = Date.now() - new Date(prevTx.createdAt).getTime();
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

      // Avoid division by very small numbers
      if (timeDiffHours <= 0.005) {
        // Less than 18 seconds apart, but different coordinates = impossible speed
        return {
          speed: parseFloat((distance / 0.005).toFixed(2)),
          distance: parseFloat(distance.toFixed(2)),
          hours: 0.005,
          impossible: true
        };
      }

      const speed = distance / timeDiffHours;
      
      // Speed of light or commercial jet speed is roughly 900 km/h
      // If speed > 900 km/h and distance > 50km, it's impossible
      if (speed > 900 && distance > 50) {
        return {
          speed: parseFloat(speed.toFixed(2)),
          distance: parseFloat(distance.toFixed(2)),
          hours: parseFloat(timeDiffHours.toFixed(3)),
          impossible: true
        };
      }
      
      return {
        speed: parseFloat(speed.toFixed(2)),
        distance: parseFloat(distance.toFixed(2)),
        hours: parseFloat(timeDiffHours.toFixed(3)),
        impossible: false
      };
    } catch (err) {
      console.error('Error checking speed of light velocity:', err.message);
      return null;
    }
  }

  // VPN, proxy, or Tor exit node analysis
  static checkVpnOrProxy(ipAddress) {
    if (!ipAddress || ipAddress === 'Unknown') return false;
    
    // Standard mock list of commercial proxy / Tor exit nodes / hosting ranges for simulation
    const commercialVpnRanges = [
      '185.120.', // Tor exit / VPN
      '82.165.',  // Commercial Hosting Proxy
      '185.220.', // Tor exit node subnet
      '45.223.',  // Commercial proxy
      '103.88.'   // VPN tunnel subnet
    ];
    
    return commercialVpnRanges.some(range => ipAddress.startsWith(range));
  }
}

module.exports = BehaviorService;
