// OSC to WebSocket Bridge Server
// Receives OSC messages and forwards them to browser via WebSocket
// OSC port can be configured dynamically from the browser

const osc = require('osc');
const WebSocket = require('ws');

// WebSocket port - can be overridden via command line arg
const WS_PORT = process.argv[2] ? parseInt(process.argv[2]) : 8765;
// Default OSC port
const DEFAULT_OSC_PORT = 7400;

console.log(`Starting OSC Bridge...`);
console.log(`WebSocket server on port: ${WS_PORT} (listening on all interfaces)`);
console.log(`OSC receiver on port: ${DEFAULT_OSC_PORT} (listening on all interfaces)`);

// WebSocket server for browser connections - listen on all interfaces
const wss = new WebSocket.Server({ 
  port: WS_PORT,
  host: '0.0.0.0'
});
const clients = new Set();

// Current OSC port listener
let udpPort = null;
let currentOscPort = null;

function startOscListener(port) {
  // Close existing listener if any
  if (udpPort) {
    try {
      udpPort.close();
      console.log(`Closed OSC listener on port ${currentOscPort}`);
    } catch (e) {
      // Ignore close errors
    }
  }

  currentOscPort = port;
  console.log(`Starting OSC listener on port: ${port}`);

  udpPort = new osc.UDPPort({
    localAddress: '0.0.0.0',
    localPort: port,
    metadata: true
  });

  // Listen for incoming OSC messages
  udpPort.on('message', (oscMsg, timeTag, info) => {
    const data = {
      address: oscMsg.address,
      args: oscMsg.args ? oscMsg.args.map(a => a.value) : [],
      timestamp: Date.now()
    };
    
    // Broadcast to all connected browsers (OSC messages are not logged to reduce terminal spam)
    const json = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    });
  });

  udpPort.on('ready', () => {
    console.log(`OSC listening on UDP port ${port} (all interfaces)`);
    // Notify all clients that OSC is ready
    const msg = JSON.stringify({ type: 'osc_ready', port: port });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  udpPort.on('error', (err) => {
    console.error('OSC Error:', err.message);
    // Notify clients of error
    const msg = JSON.stringify({ type: 'osc_error', error: err.message });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  udpPort.open();
}

// Start OSC listener on default port
startOscListener(DEFAULT_OSC_PORT);

wss.on('connection', (ws) => {
  console.log('Browser connected');
  clients.add(ws);
  
  // Send current status
  if (currentOscPort) {
    ws.send(JSON.stringify({ type: 'osc_status', port: currentOscPort }));
  }
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle port configuration
      if (data.type === 'set_osc_port' && data.port) {
        const port = parseInt(data.port);
        if (port > 0 && port < 65536) {
          startOscListener(port);
        }
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });
  
  ws.on('close', () => {
    console.log('Browser disconnected');
    clients.delete(ws);
  });
});

console.log(`\nOSC Bridge running!`);
console.log(`WebSocket available at ws://0.0.0.0:${WS_PORT} (accessible from all networks)`);
console.log(`OSC receiver listening on UDP port ${DEFAULT_OSC_PORT} (accessible from all networks)`);
