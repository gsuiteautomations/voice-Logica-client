import { io } from 'socket.io-client';
import dotenv from 'dotenv';
dotenv.config();

export function connectThirdPartySocket() {
	const socket = io(process.env.THIRD_PARTY_WS_URL, {
		path: process.env.THIRD_PARTY_WS_PATH || '/socket_connect/',
		extraHeaders: {
			'x-api-key': process.env.THIRD_PARTY_API_KEY,
			address: process.env.THIRD_PARTY_ADDRESS,
			'x-company-id': process.env.THIRD_PARTY_COMPANY_ID,
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
