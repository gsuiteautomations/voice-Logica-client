import { io } from 'socket.io-client';
import dotenv from 'dotenv';
dotenv.config();

export function connectThirdPartySocket() {
	const baseUrl = process.env.NODE_ENV === 'development' ? process.env.THIRD_PARTY_DEV_BASE_URL : process.env.THIRD_PARTY_BASE_URL;
	const socket = io(baseUrl, {
		path: '/socket_connect/',
		extraHeaders: {
			'x-api-key': process.env.THIRD_PARTY_API_KEY,
		},
		transports: ['websocket'],
		reconnection: true,
		reconnectionDelay: 1000,
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

	return socket;
}
