# WebSocket Echo Application

A secure WebSocket server and client implementation in Node.js that demonstrates real-time bidirectional communication. The application includes features like automatic reconnection, proper error handling, and connection management.

## Features

- **Secure WebSocket Server**
  - Origin validation for connection security
  - Connection limit management to prevent DoS attacks
  - Proper error handling and logging
  - Support for both UTF-8 and binary messages
  - Automatic ping/pong for connection health monitoring

- **Robust WebSocket Client**
  - Automatic reconnection on connection loss
  - Graceful error handling
  - Resource cleanup on disconnection
  - Configurable message intervals

## Prerequisites

- Node.js (v14 or higher)
- pnpm (or npm)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

## Configuration

The application can be configured using environment variables. Create a `.env` file in the root directory with the following options:

### Server Configuration
```env
PORT=8080
ALLOWED_ORIGINS=http://localhost:3000,ws://localhost:8080
MAX_CONNECTIONS=100
```

### Client Configuration
```env
WS_URL=ws://localhost:8080/
RECONNECT_INTERVAL=5000
MESSAGE_INTERVAL=1000
```

## Usage

1. Start the WebSocket server:
   ```bash
   pnpm start
   # or for development mode with auto-reload:
   pnpm run dev
   ```

2. In another terminal, start the client:
   ```bash
   pnpm run start:client
   # or for development mode with auto-reload:
   pnpm run dev:client
   ```

## How It Works

1. The server listens for WebSocket connections on the configured port
2. When a client connects, the server validates the connection origin
3. Upon successful connection:
   - The client starts sending random numbers to the server every second
   - The server echoes back each received message
   - The server maintains a ping/pong mechanism to keep connections alive
   - If the connection drops, the client automatically attempts to reconnect

## Error Handling

The application implements comprehensive error handling:
- Connection validation errors
- Message processing errors
- Connection cleanup errors
- Automatic reconnection on failures
- Resource cleanup on termination

## Development

The project uses nodemon for development, which automatically restarts the application when files change. Use the `dev` scripts for development:

```bash
pnpm run dev        # For server
pnpm run dev:client # For client
```

## License

ISC License 