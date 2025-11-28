import { io } from 'socket.io-client';
import dotenv from 'dotenv';
dotenv.config();

export function connectThirdPartySocket() {
	const baseUrl = 'wss://api.voicelogica.ai';
	const apiKey = process.env.THIRD_PARTY_API_KEY;
	
	if (!apiKey) {
		console.error('⚠️ THIRD_PARTY_API_KEY is not set in environment variables!');
		console.error('   Connection will likely fail with authentication errors.');
	}
	
	const socket = io(baseUrl, {
		path: '/socket_connect/',
		extraHeaders: {
			'x-api-key': apiKey || '',
		},
		transports: ['websocket'],
		reconnection: true,
		reconnectionDelay: 30 * 60 * 1000, // 30 minutes
		timeout: 20000,
		forceNew: false,
	});

	socket.on('connect', () => {
		console.log('Connected to third-party Socket.IO server:', socket.id);
	});

	socket.on('connect_error', (err) => {
		console.error('Socket connect error:', err.message);
		console.error('Error details:', {
			message: err.message,
			description: err.description,
			context: err.context,
			type: err.type,
		});
	});

	socket.on('disconnect', (reason) => {
		console.warn('Disconnected from third-party server. Reason:', reason);
		if (reason === 'io server disconnect') {
			// Server disconnected the socket, need to reconnect manually
			socket.connect();
		}
	});

	socket.onAny((event, data) => {
		console.log(`Incoming event: ${event}`, data);
	});

	return socket;
}
