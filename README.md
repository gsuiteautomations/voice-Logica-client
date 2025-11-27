# WebSocket Message Client - Backend

A Node.js backend server that acts as a bridge between a web client and a third-party WebSocket service. It handles WebSocket connections, message routing, and API proxying for real-time chat/voice communication.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [WebSocket Events](#websocket-events)
- [Project Structure](#project-structure)
- [Code Flow](#code-flow)

## 🎯 Overview

This backend server provides:

- **WebSocket Server**: Accepts connections from web clients
- **Third-Party Socket.IO Client**: Connects to external Socket.IO service
- **API Proxy**: Forwards requests to third-party REST API
- **Message Routing**: Routes messages between clients and third-party service
- **Static File Serving**: Serves the HTML client interface

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Browser   │◄───────►│  This Server │◄───────►│ Third-Party API │
│  (Client)   │ WebSocket│  (Express)  │  HTTP   │   (Socket.IO)   │
└─────────────┘         └──────────────┘         └─────────────────┘
                              │
                              │ WebSocket
                              ▼
                        ┌──────────────┐
                        │ Web Clients  │
                        └──────────────┘
```

## ✨ Features

- **Dual WebSocket Support**:
  - Raw WebSocket server for web clients
  - Socket.IO client for third-party service
- **Message Deduplication**: Prevents duplicate messages from being displayed
- **Call Management**: Tracks call IDs and MongoDB IDs for message routing
- **Error Handling**: Comprehensive error handling for API and WebSocket failures
- **Real-time Communication**: Bidirectional message forwarding

## 📦 Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory (see Configuration section)

4. **Start the server**:

   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000

# Third-Party Socket.IO Configuration
THIRD_PARTY_WS_URL=wss://your-third-party-url.com
THIRD_PARTY_WS_PATH=/socket_connect/
THIRD_PARTY_API_KEY=your-api-key
THIRD_PARTY_ADDRESS=your-address
THIRD_PARTY_COMPANY_ID=your-company-id
```

### Environment Variables

| Variable                 | Description                           | Required                         |
| ------------------------ | ------------------------------------- | -------------------------------- |
| `PORT`                   | Port for the Express server           | No (default: 5000)               |
| `THIRD_PARTY_WS_URL`     | WebSocket URL for third-party service | Yes                              |
| `THIRD_PARTY_WS_PATH`    | Socket.IO path                        | No (default: `/socket_connect/`) |
| `THIRD_PARTY_API_KEY`    | API key for authentication            | Yes                              |
| `THIRD_PARTY_ADDRESS`    | Address header value                  | Yes                              |
| `THIRD_PARTY_COMPANY_ID` | Company ID for authentication         | Yes                              |

## 🚀 Usage

1. **Start the server**:

   ```bash
   npm start
   ```

2. **Open your browser** and navigate to:

   ```
   http://localhost:5000
   ```

3. **Select a service type**:

   - Click "Voice" for WebSocket-based voice communication
   - Click "Chat" for message-based text communication

4. **Start chatting**: Type messages and send them through the interface

## 📡 API Endpoints

### POST `/initiate-websocket-call`

Initiates a WebSocket call with the third-party service.

**Request Body**:

```json
{
  "contextForAi": "Conversation with Web AI",
  "languageCode": "el-GR",
  "agentId": "68dd4b06704760ace0a74a3e",
  "associateId": "9x9kv7pyrup2h3fouf8vrh",
  "codec": "PCM16",
  "serviceType": "websocket" | "message"
}
```

**Response**:

```json
{
	"callId": "string",
	"callMongoId": "string"
	// ... other response fields from third-party API
}
```

**Validation**:

- `contextForAi`, `agentId`, `codec`, `serviceType` are required
- `serviceType` must be either `"websocket"` or `"message"`
- `languageCode` defaults to `"el-GR"` if not provided

## 🔌 WebSocket Events

### Client → Server

**Message Format**:

```json
{
	"text": "Hello, how are you?",
	"timestamp": "2025-11-27T20:41:24.124Z"
}
```

The server automatically:

1. Extracts the `callMongoId` from stored mappings
2. Formats the message with required fields
3. Forwards it to the third-party Socket.IO service via `call-data` event

### Server → Client

**1. Connection Status**:

```json
{
	"type": "callMongoId",
	"callMongoId": "string",
	"callId": "string"
}
```

**2. Error Messages**:

```json
{
	"type": "error",
	"message": "Error description"
}
```

**3. Message Arrays**:

```json
{
	"messages": [
		{
			"content": "Hello, how can I help you?",
			"role": "Agent",
			"timestamp": "2025-11-27T20:28:45.143Z",
			"agentId": "68dd4b06704760ace0a74a3e",
			"seconds": 0,
			"completionTurnMs": 0,
			"voiceTurnMs": 0,
			"totalTurnMs": 0
		}
	]
}
```

**4. WebSocket Events**:

```json
{
	"event": "websocket-{callId}",
	"callId": "string",
	"data": {
		/* event data */
	}
}
```

## 📁 Project Structure

```
custom_be/
├── server/
│   ├── index.js          # Main Express server and WebSocket handling
│   └── ws-client.js      # Third-party Socket.IO client connection
├── public/
│   └── index.html        # Web client interface
├── package.json          # Dependencies and scripts
├── .env                 # Environment variables (create this)
└── README.md            # This file
```

## 🔄 Code Flow

### 1. Server Startup

1. Express server starts on configured port
2. WebSocket server (`ws`) is created
3. Socket.IO client connects to third-party service
4. Static files are served from `public/` directory

### 2. Client Connection Flow

1. User opens browser → connects to WebSocket server
2. User selects Voice/Chat → calls `/initiate-websocket-call` API
3. Server forwards request to third-party API
4. Server receives `callId` and `callMongoId` from response
5. Server joins WebSocket room: `join-websocket` event with `callId`
6. Server sets up listener for `websocket-{callId}` events
7. Server sends `callMongoId` to client via WebSocket

### 3. Message Sending Flow

1. User types message → clicks Send
2. Client sends JSON: `{ text: "...", timestamp: "..." }`
3. Server receives message → extracts `callMongoId` from client mapping
4. Server formats message with required fields (role: "Associate", etc.)
5. Server emits `call-data` event to third-party Socket.IO service

### 4. Message Receiving Flow

1. Third-party service emits `websocket-{callId}` event
2. Server's message handler receives the data
3. Server forwards to all connected WebSocket clients
4. Client receives message array → displays messages with deduplication

### 5. Message Deduplication

- Messages are deduplicated using: `role::content`
- Each unique message is only displayed once
- Prevents duplicate messages from multiple sources

## 🔧 Key Functions

### Server (`server/index.js`)

- **WebSocket Connection Handler**: Manages client connections and message routing
- **API Route Handler**: `/initiate-websocket-call` - Proxies requests to third-party API
- **Message Forwarding**: Routes messages between clients and third-party service
- **Call Management**: Tracks `callId` and `callMongoId` mappings

### Client (`server/ws-client.js`)

- **`connectThirdPartySocket()`**: Establishes Socket.IO connection to third-party service
- Handles connection events, errors, and reconnection logic

### Frontend (`public/index.html`)

- **`initiateCall()`**: Calls API to start a conversation
- **`sendMessage()`**: Sends user messages to server
- **`displayMessagesArray()`**: Displays messages with role-based styling
- **`getMessageId()`**: Generates unique ID for message deduplication
- **`addMessageWithRole()`**: Renders messages with appropriate styling based on role

## 🐛 Troubleshooting

### WebSocket Connection Issues

- Check that `THIRD_PARTY_WS_URL` is correct
- Verify API keys and authentication headers
- Check server logs for connection errors

### Messages Not Appearing

- Check browser console for errors
- Verify WebSocket connection status (green indicator)
- Check server logs for message forwarding issues

### Duplicate Messages

- Message deduplication uses `role::content` as unique ID
- If messages have same role and content, only one will display
- Check console logs for deduplication activity

## 📝 Notes

- The server uses both raw WebSocket (`ws`) for clients and Socket.IO for third-party service
- Message deduplication prevents the same message from appearing multiple times
- `callMongoId` is used to associate messages with specific calls
- The frontend automatically handles message arrays and displays them chronologically

## 🔐 Security Considerations

- Store sensitive credentials in `.env` file (never commit to version control)
- Use HTTPS/WSS in production
- Validate and sanitize all user inputs
- Implement rate limiting for API endpoints

## 📄 License

[Add your license information here]

## 👥 Contributors

[Add contributor information here]
