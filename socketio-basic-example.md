# Socket.IO Basic Example

## Quick Start - Minimal Example

### 1. Install Socket.IO Client

**Node.js:**
```bash
npm install socket.io-client
```

**Browser:**
```html
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
```

### 2. Basic Connection

```javascript
// Import (Node.js) or use global io (Browser)
import { io } from 'socket.io-client';

// Connect to server
const socket = io('wss://api.voicelogica.ai', {
  path: '/socket_connect/',
  extraHeaders: {
    'x-api-key': 'YOUR_API_KEY_HERE'
  },
  transports: ['websocket']
});

// Listen for connection
socket.on('connect', () => {
  console.log('Connected!', socket.id);
});

// Listen for disconnect
socket.on('disconnect', () => {
  console.log('Disconnected');
});

// Listen for errors
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### 3. Send Events (Emit)

```javascript
// Send an event with data
socket.emit('join-websocket', 'your-call-id-here');

// Send an event with object data
socket.emit('call-data', {
  type: 'message',
  content: 'Hello',
  callMongoId: 'your-mongo-id'
});
```

### 4. Receive Events (Listen)

```javascript
// Listen for a specific event
socket.on('websocket-your-call-id', (data) => {
  console.log('Received:', data);
});

// Listen for ANY event
socket.onAny((eventName, data) => {
  console.log('Event:', eventName, 'Data:', data);
});
```

### 5. Complete Basic Example

```javascript
import { io } from 'socket.io-client';

// Step 1: Connect
const socket = io('wss://api.voicelogica.ai', {
  path: '/socket_connect/',
  extraHeaders: {
    'x-api-key': 'YOUR_API_KEY_HERE'
  },
  transports: ['websocket']
});

// Step 2: Wait for connection
socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
  
  // Step 3: Join a room
  socket.emit('join-websocket', 'your-call-id');
});

// Step 4: Listen for messages
socket.on('websocket-your-call-id', (data) => {
  console.log('📥 Message:', data);
});

// Step 5: Send messages
socket.emit('call-data', {
  type: 'message',
  content: 'Hello World',
  callMongoId: 'your-mongo-id'
});

// Step 6: Clean up when done
socket.disconnect();
```

## Key Concepts

1. **Connect**: `io(url, options)` - Creates connection
2. **Emit**: `socket.emit(event, data)` - Send event to server
3. **On**: `socket.on(event, callback)` - Listen for event from server
4. **Disconnect**: `socket.disconnect()` - Close connection

## Common Events

- `connect` - Fired when connected
- `disconnect` - Fired when disconnected
- `connect_error` - Fired on connection error
- `reconnect` - Fired when reconnected
- `error` - Fired on error

## Your Server Events

- `join-websocket` - Join a call room (send callId)
- `call-data` - Send message data (send object)
- `websocket-{callId}` - Receive messages for a call (listen)

