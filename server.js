#!/usr/bin/env node
const WebSocketServer = require('websocket').server;
const http = require('http');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
const MAX_CONNECTIONS = process.env.MAX_CONNECTIONS || 100;
let currentConnections = 0;

// Create HTTP server
const server = http.createServer(function(request, response) {
    console.log(`${new Date().toISOString()} Received request for ${request.url}`);
    response.writeHead(404);
    response.end();
});

server.listen(PORT, function() {
    console.log(`${new Date().toISOString()} Server is listening on port ${PORT}`);
});

// Error handling for HTTP server
server.on('error', (error) => {
    console.error('HTTP Server error:', error);
});

// Create WebSocket server
const wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false,
    maxReceivedFrameSize: 1024 * 1024, // 1MB
    maxReceivedMessageSize: 1024 * 1024, // 1MB
});

// Origin validation
function originIsAllowed(origin) {
    console.log(`Checking origin: ${origin}`);
    return ALLOWED_ORIGINS.includes(origin);
}

// Rate limiting and connection management
function canAcceptConnection() {
    return currentConnections < MAX_CONNECTIONS;
}

// WebSocket server error handling
wsServer.on('error', (error) => {
    console.error('WebSocket Server error:', error);
});

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
        request.reject();
        console.log(`${new Date().toISOString()} Connection from origin ${request.origin} rejected.`);
        return;
    }

    if (!canAcceptConnection()) {
        request.reject();
        console.log(`${new Date().toISOString()} Connection rejected due to server capacity.`);
        return;
    }

    try {
        const connection = request.accept('echo-protocol', request.origin);
        currentConnections++;
        console.log(`${new Date().toISOString()} Connection accepted. Current connections: ${currentConnections}`);

        // Set up ping interval to keep connection alive
        const pingInterval = setInterval(() => {
            if (connection.connected) {
                connection.ping();
            }
        }, 30000);

        connection.on('message', function(message) {
            try {
                if (message.type === 'utf8') {
                    console.log('Received Message:', message.utf8Data);
                    connection.sendUTF(message.utf8Data);
                } else if (message.type === 'binary') {
                    console.log(`Received Binary Message of ${message.binaryData.length} bytes`);
                    connection.sendBytes(message.binaryData);
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });

        connection.on('close', function(reasonCode, description) {
            clearInterval(pingInterval);
            currentConnections--;
            console.log(`${new Date().toISOString()} Peer ${connection.remoteAddress} disconnected. Reason: ${reasonCode} - ${description}`);
            console.log(`Current connections: ${currentConnections}`);
        });

        connection.on('error', function(error) {
            console.error('Connection error:', error);
        });

    } catch (error) {
        console.error('Error while handling connection:', error);
    }
});