const { WebSocketServer } = require('ws');

/**
 * Event-Streaming WebSockets Server
 * Broadcasts asynchronous transaction scoring events and human-in-the-loop updates 
 * to active front-end checkout simulator consoles in real-time.
 */
class WebSocketServerManager {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  // Initialize and attach to Node HTTP server
  initialize(server) {
    this.wss = new WebSocketServer({ noServer: true });
    
    server.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
      
      if (pathname === '/api/ws') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      }
    });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`WebSocket Store: Client connected. Total active streams: ${this.clients.size}`);

      ws.on('message', (message) => {
        try {
          const parsed = JSON.parse(message);
          // Ping/pong check
          if (parsed.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (e) {}
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`WebSocket Store: Client disconnected. Total active streams: ${this.clients.size}`);
      });
      
      // Send initial connection handshake
      ws.send(JSON.stringify({ type: 'connected', message: 'FraudShield Event Broker Connected' }));
    });
  }

  // Broadcasts transaction updates asynchronously to all connected React clients
  broadcastTransactionUpdate(transactionId, data) {
    if (!this.wss) return;
    
    const payload = JSON.stringify({
      type: 'TRANSACTION_UPDATE',
      transactionId,
      data
    });

    this.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(payload);
      }
    });
  }
}

module.exports = new WebSocketServerManager();
