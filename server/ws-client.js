import { io } from 'socket.io-client';
import dotenv from 'dotenv';
dotenv.config();

export function connectThirdPartySocket() {
	const baseUrl = 'wss://api.voicelogica.ai';
	const socket = io(baseUrl, {
		path: '/socket_connect/',
		extraHeaders: {
			'x-api-key': process.env.THIRD_PARTY_API_KEY,
		},
		transports: ['websocket'],
		reconnection: true,
		reconnectionDelay: 30 * 60 * 1000, // 30 minutes
	});

	socket.on('connect', () => {
		console.log('Connected to third-party Socket.IO server:', socket.id);
	});

	socket.on('connect_error', (err) => {
		console.error('Socket connect error:', err.message);
	});

	socket.on('disconnect', () => {
		console.warn('Disconnected from third-party server');
	});

	socket.onAny((event, data) => {
		console.log(`Incoming event: ${event}`, data);
	});

	return socket;
}
