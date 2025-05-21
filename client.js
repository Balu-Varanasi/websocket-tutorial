#!/usr/bin/env node
const WebSocketClient = require('websocket').client;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const WS_URL = process.env.WS_URL || 'ws://localhost:8080/';
const RECONNECT_INTERVAL = process.env.RECONNECT_INTERVAL || 5000;
const MESSAGE_INTERVAL = process.env.MESSAGE_INTERVAL || 1000;

class WebSocketManager {
    constructor() {
        this.client = new WebSocketClient();
        this.connection = null;
        this.reconnectTimeout = null;
        this.messageTimeout = null;
        this.isConnecting = false;
        this.setupClientEvents();
    }

    setupClientEvents() {
        this.client.on('connectFailed', this.handleConnectFailed.bind(this));
        this.client.on('connect', this.handleConnect.bind(this));
    }

    handleConnectFailed(error) {
        console.log('Connect Error:', error.toString());
        this.scheduleReconnect();
    }

    handleConnect(connection) {
        this.connection = connection;
        this.isConnecting = false;
        console.log('WebSocket Client Connected');

        connection.on('error', this.handleConnectionError.bind(this));
        connection.on('close', this.handleConnectionClose.bind(this));
        connection.on('message', this.handleMessage.bind(this));

        // Start sending messages
        this.startSendingMessages();
    }

    handleConnectionError(error) {
        console.log("Connection Error:", error.toString());
    }

    handleConnectionClose() {
        console.log('Connection Closed');
        this.cleanup();
        this.scheduleReconnect();
    }

    handleMessage(message) {
        if (message.type === 'utf8') {
            console.log("Received:", message.utf8Data);
        }
    }

    cleanup() {
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
        }
        this.connection = null;
    }

    scheduleReconnect() {
        if (!this.isConnecting) {
            this.isConnecting = true;
            console.log(`Scheduling reconnect in ${RECONNECT_INTERVAL}ms`);
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
            }
            this.reconnectTimeout = setTimeout(() => {
                this.connect();
            }, RECONNECT_INTERVAL);
        }
    }

    startSendingMessages() {
        const sendNumber = () => {
            try {
                if (this.connection && this.connection.connected) {
                    const number = Math.round(Math.random() * 0xFFFFFF);
                    this.connection.sendUTF(number.toString());
                    this.messageTimeout = setTimeout(sendNumber, MESSAGE_INTERVAL);
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        };
        sendNumber();
    }

    connect() {
        try {
            console.log(`Connecting to ${WS_URL}`);
            this.client.connect(WS_URL, 'echo-protocol', 'http://localhost:3000', {
                origin: 'http://localhost:3000'
            });
        } catch (error) {
            console.error('Error initiating connection:', error);
            this.scheduleReconnect();
        }
    }
}

// Create and start the WebSocket manager
const wsManager = new WebSocketManager();
wsManager.connect();

// Handle process termination
process.on('SIGINT', () => {
    console.log('Received SIGINT. Cleaning up...');
    if (wsManager.connection) {
        wsManager.connection.close();
    }
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});