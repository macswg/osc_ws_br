# OSC WebSocket Bridge

A simple bridge server that receives OSC (Open Sound Control) messages via UDP and forwards them to connected browsers via WebSocket.

## Features

- Receives OSC messages on configurable UDP port
- Forwards OSC messages to all connected WebSocket clients
- Dynamic OSC port configuration from browser
- Real-time message broadcasting

## Running with Docker

### Build the Docker Image

```bash
docker build -t osc-websocket-bridge .
```

### Run the Container

#### Option 1: Using Host Networking (Recommended for UDP)

This allows the container to receive UDP packets on any port:

```bash
docker run -d \
  --name osc-bridge \
  --network host \
  osc-websocket-bridge
```

#### Option 2: Expose Specific Ports

If you know the OSC port you'll use, expose it explicitly:

```bash
docker run -d \
  --name osc-bridge \
  -p 8765:8765 \
  -p 5000:5000/udp \
  osc-websocket-bridge
```

#### Option 3: Expose Port Range

For a range of possible OSC ports:

```bash
docker run -d \
  --name osc-bridge \
  -p 8765:8765 \
  -p 5000-6000:5000-6000/udp \
  osc-websocket-bridge
```

### Custom WebSocket Port

To use a different WebSocket port, pass it as a command argument:

```bash
docker run -d \
  --name osc-bridge \
  --network host \
  osc-websocket-bridge \
  node osc-bridge.cjs 9000
```

## Usage

1. Start the Docker container
2. Connect to the WebSocket server at `ws://<host>:8765` (or your custom port)
3. Send a message to configure the OSC port:
   ```json
   {"type": "set_osc_port", "port": 5000}
   ```
4. The bridge will start listening for OSC messages on the specified UDP port
5. All received OSC messages will be forwarded to connected WebSocket clients

## Message Format

### OSC Messages Received
OSC messages are converted to JSON and sent to WebSocket clients:
```json
{
  "address": "/osc/address",
  "args": [1, 2.5, "string"],
  "timestamp": 1234567890
}
```

### Control Messages (WebSocket → Server)
```json
{
  "type": "set_osc_port",
  "port": 5000
}
```

### Status Messages (Server → WebSocket)
```json
{
  "type": "osc_ready",
  "port": 5000
}
```

```json
{
  "type": "osc_status",
  "port": 5000
}
```

```json
{
  "type": "osc_error",
  "error": "Error message"
}
```

## Local Development

### Prerequisites

- Node.js 20+ (or use Docker)

### Installation

```bash
npm install
```

### Run

```bash
npm start
```

Or with a custom WebSocket port:

```bash
node osc-bridge.cjs 9000
```

## License

GPL-3.0
