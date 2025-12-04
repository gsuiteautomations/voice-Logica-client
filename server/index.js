import express from 'express';
import { WebSocketServer } from 'ws';
import axios from 'axios';
import dotenv from 'dotenv';
import { connectThirdPartySocket } from './ws-client.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// HTTP server
const server = app.listen(PORT, () => {
	console.log(`Server running on ${PORT}`);
});

// Raw WebSocket server (for your own clients)
const wss = new WebSocketServer({ server });

let clients = [];
// Track active listeners for each callId to avoid duplicates
const activeCallListeners = new Map();
// Store callMongoId for each callId
const callIdToCallMongoId = new Map();
// Store mongoCallId for each client connection
const clientToCallMongoId = new Map();

// Accept WebSocket connections from your frontend/backend
wss.on('connection', (client) => {
	console.log('Client connected');
	clients.push(client);

		// Handle incoming messages from clients
		client.on('message', (message) => {
			try {
				const parsedData = JSON.parse(message.toString());
				console.log('Received message from client:', parsedData);

				// Get mongoCallId - prioritize from message payload, then client-specific storage, then from callId
				let callMongoId = parsedData.callMongoId; // First check if client sent it in the message
				if (!callMongoId) {
					callMongoId = clientToCallMongoId.get(client); // Then check client-specific storage
				}
				if (!callMongoId && parsedData.callId) {
					callMongoId = callIdToCallMongoId.get(parsedData.callId);
				}
				// If still no mongoCallId, try to get from any stored callId (use first available)
				if (!callMongoId && callIdToCallMongoId.size > 0) {
					callMongoId = Array.from(callIdToCallMongoId.values())[0];
				}

				// Update client mapping if we got callMongoId from the message
				if (parsedData.callMongoId && parsedData.callMongoId !== clientToCallMongoId.get(client)) {
					console.log(`[Client] Updating client mapping: old=${clientToCallMongoId.get(client)}, new=${parsedData.callMongoId}`);
					clientToCallMongoId.set(client, parsedData.callMongoId);
					callMongoId = parsedData.callMongoId;
				}

				if (!callMongoId) {
					console.warn('[Client] No callMongoId available for this message');
				}

			const data = {
				type: 'message',
				role: 'Associate',
				content: parsedData.text,
				htmlContent: parsedData.text,
				timestamp: new Date(),
				transcriptionIndex: 0,
				callId: callMongoId,
				associateId: parsedData.associateId || '',
				callMongoId: callMongoId,
				message: parsedData.text,
				isFinal: true,
			};

			// Handle call-data messages - forward to third-party socket
			if (thirdPartySocket && thirdPartySocket.connected) {
				console.log(`[Client] Sending call-data to third-party socket:`, data);
				thirdPartySocket.emit('calldata', data);
			} else {
				console.warn('[Client] Cannot send call-data: third-party socket not connected');
				// Send error back to client
				client.send(
					JSON.stringify({
						type: 'error',
						message: 'Third-party socket not connected',
					})
				);
			}
		} catch (error) {
			console.error('Error parsing client message:', error);
		}
	});

	client.on('close', () => {
		clients = clients.filter((c) => c !== client);
		clientToCallMongoId.delete(client);
		console.log('Client disconnected');
	});

	client.on('error', (error) => {
		console.error('Client error:', error);
	});
});

// API Routes
app.post('/initiate-websocket-call', async (req, res) => {
	const { contextForAi, languageCode, agentId, associateId, codec, serviceType } = req.body;

	// Validate required fields
	if (!contextForAi || !agentId || !codec || !serviceType) {
		return res.status(400).json({
			error: 'Missing required fields',
			required: ['contextForAi', 'agentId', 'associateId', 'codec', 'serviceType'],
		});
	}

	// Validate serviceType
	if (serviceType !== 'websocket' && serviceType !== 'message') {
		return res.status(400).json({
			error: 'Invalid serviceType. Must be "websocket" or "message"',
		});
	}

	try {
		// Prepare request payload
		const payload = {
			contextForAi,
			languageCode: languageCode || 'el-GR',
			agentId,
			associateId,
			codec,
			serviceType,
		};

		const headers = {
			'x-api-key': process.env.THIRD_PARTY_API_KEY,
		};

		// Make request to third-party API
		const baseUrl = 'https://api.voicelogica.ai';
		const response = await axios.post(`${baseUrl}/api/v1/phones/calls/initiate-websocket-call`, payload, { headers });

		console.log('Third-party API response:', response.data);

		// Extract callId and callMongoId from response
		const callId = response.data?.callId;
		const callMongoId = response.data?.callMongoId;

		// Store callMongoId for this callId (for backward reference)
		if (callId && callMongoId) {
			callIdToCallMongoId.set(callId, callMongoId);
			console.log(`[API] Stored callMongoId ${callMongoId} for callId ${callId}`);
		}

		// Join the WebSocket room if socket is connected and callMongoId exists
		if (callMongoId) {
			if (thirdPartySocket && thirdPartySocket.connected) {
				console.log(`[WebSocket] Emitting join-websocket for callMongoId: ${callMongoId}`);
				thirdPartySocket.emit('join-websocket', callMongoId);
				console.log(`[WebSocket] Joined WebSocket room for callMongoId: ${callMongoId}`);

				// Set up listener for this callMongoId if not already listening
				if (!activeCallListeners.has(callMongoId)) {
					const eventName = `websocket-${callMongoId}`;

					const messageHandler = (data) => {
						console.log(`[WebSocket] Received data for callMongoId ${callMongoId}:`, data);

						// Forward to all connected WebSocket clients
						const payload = JSON.stringify({
							event: eventName,
							callId: callId, // Keep callId in payload for reference
							callMongoId: callMongoId,
							data,
						});

						console.log(`[WebSocket] Forwarding message to clients. Total clients: ${clients.length}`);

						let forwardedCount = 0;
						clients.forEach((client, index) => {
							if (client.readyState === 1) {
								console.log(payload)
								client.send(payload);
								forwardedCount++;
								console.log(`[WebSocket] Message forwarded to client ${index + 1}`);
							} else {
								console.log(`[WebSocket] Client ${index + 1} not ready (state: ${client.readyState})`);
							}
						});

						console.log(`[WebSocket] Successfully forwarded to ${forwardedCount} out of ${clients.length} clients`);
					};

					thirdPartySocket.on(eventName, messageHandler);
					activeCallListeners.set(callMongoId, messageHandler);

					console.log(`Listening for messages on event: ${eventName}`);
				} else {
					console.log(`Already listening for callMongoId: ${callMongoId}`);
				}
			} else {
				console.warn('Socket is not connected, cannot join room for callMongoId:', callMongoId);
			}
		} else {
			console.warn('No callMongoId found in response, cannot join WebSocket room');
		}

		// Return the response from third-party API (including mongoCallId)
		const responseData = {
			...response.data,
			callMongoId: callMongoId || response.data?.callMongoId,
		};

		// Send mongoCallId to all connected clients
		if (callMongoId) {
			const callMongoIdMessage = JSON.stringify({
				type: 'callMongoId',
				callMongoId: callMongoId,
				callId: callId,
			});

			clients.forEach((client) => {
				if (client.readyState === 1) {
					client.send(callMongoIdMessage);
					clientToCallMongoId.set(client, callMongoId);
				}
			});
		}

		res.json(responseData);
	} catch (error) {
		console.error('Error calling third-party API:', error.message);

		if (error.response) {
			// Third-party API returned an error response
			return res.status(error.response.status).json(error.response.data);
		} else if (error.request) {
			// Request was made but no response received
			return res.status(502).json({
				error: 'No response from third-party API',
				message: error.message,
			});
		} else {
			// Error setting up the request
			return res.status(500).json({
				error: 'Failed to call third-party API',
				message: error.message,
			});
		}
	}
});

// Connect to 3rd-party Socket.IO server
const thirdPartySocket = connectThirdPartySocket();

// Notify when connected
thirdPartySocket.on('connect', () => {
	console.log('Connected to 3rd-party Socket.IO server:', thirdPartySocket.id);
});

// Log connection errors
thirdPartySocket.on('connect_error', (err) => {
	console.error('3rd-party connect error:', err.message);
});
