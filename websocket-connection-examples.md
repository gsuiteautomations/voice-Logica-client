# WebSocket Connection Examples

## ⚠️ Important: Socket.IO Protocol

**You cannot use a raw WebSocket client (like Postman/Insomnia) to connect to Socket.IO servers directly!**

Socket.IO uses the **Engine.IO protocol**, which requires:
1. A handshake sequence
2. Specific message packet formats
3. Heartbeat/ping-pong messages
4. Protocol version negotiation

**Use a Socket.IO client library instead** (see examples below).

## Server Configuration
- **URL**: `wss://api.voicelogica.ai`
- **Path**: `/socket_connect/`
- **Transport**: WebSocket only
- **Authentication**: `x-api-key` header required

## 🚀 Basic Socket.IO - Quick Start

**The absolute minimum you need:**

```javascript
import { io } from 'socket.io-client';

// 1. Connect
const socket = io('wss://api.voicelogica.ai', {
  path: '/socket_connect/',
  extraHeaders: { 'x-api-key': 'YOUR_API_KEY_HERE' },
  transports: ['websocket']
});

// 2. Wait for connection
socket.on('connect', () => {
  console.log('Connected!');
  // 3. Join room
  socket.emit('join-websocket', 'your-call-id');
});

// 4. Listen for messages
socket.on('websocket-your-call-id', (data) => {
  console.log('Message:', data);
});

// 5. Send message
socket.emit('call-data', { type: 'message', content: 'Hello' });
```

**That's it!** The 5 steps above are all you need to get started.

---

## Connection Examples

### 1. Node.js (using socket.io-client)

```javascript
import { io } from 'socket.io-client';

const socket = io('wss://api.voicelogica.ai', {
  path: '/socket_connect/',
  extraHeaders: {
    'x-api-key': 'YOUR_API_KEY_HERE'
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 30 * 60 * 1000, // 30 minutes
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});

socket.on('disconnect', () => {
  console.warn('Disconnected');
});

socket.onAny((event, data) => {
  console.log(`Event: ${event}`, data);
});

// Join a websocket room for a specific callId
socket.emit('join-websocket', 'your-call-id-here');

// Listen for messages from a specific call
socket.on('websocket-your-call-id-here', (data) => {
  console.log('Received data:', data);
});

// Send call-data
socket.emit('call-data', {
  type: 'message',
  role: 'Associate',
  content: 'Hello',
  callMongoId: 'your-mongo-call-id',
  // ... other fields
});
```

### 2. Python (using python-socketio)

```python
import socketio

sio = socketio.Client()

@sio.event
def connect():
    print('Connected:', sio.sid)

@sio.event
def connect_error(data):
    print('Connection error:', data)

@sio.event
def disconnect():
    print('Disconnected')

@sio.on('*')
def catch_all(event, data):
    print(f'Event: {event}', data)

# Connect with custom headers
sio.connect(
    'wss://api.voicelogica.ai',
    socketio_path='/socket_connect/',
    headers={'x-api-key': 'YOUR_API_KEY_HERE'},
    transports=['websocket']
)

# Join websocket room
sio.emit('join-websocket', 'your-call-id-here')

# Listen for messages
@sio.on('websocket-your-call-id-here')
def on_message(data):
    print('Received:', data)

# Send call-data
sio.emit('call-data', {
    'type': 'message',
    'role': 'Associate',
    'content': 'Hello',
    'callMongoId': 'your-mongo-call-id'
})
```

### 3. Android (Kotlin using socket.io-client)

**Add to `build.gradle.kts` (Module: app):**

```kotlin
dependencies {
    implementation("io.socket:socket.io-client:2.1.0")
    // ... other dependencies
}
```

**Add internet permission to `AndroidManifest.xml`:**

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

**Kotlin Code:**

```kotlin
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URI

class SocketManager {
    private var socket: Socket? = null
    private val apiKey = "YOUR_API_KEY_HERE"
    
    fun connect() {
        try {
            val options = IO.Options().apply {
                path = "/socket_connect/"
                transports = arrayOf("websocket")
                reconnection = true
                reconnectionDelay = 30 * 60 * 1000 // 30 minutes
                extraHeaders = mapOf("x-api-key" to apiKey)
            }
            
            socket = IO.socket(URI("wss://api.voicelogica.ai"), options)
            
            socket?.on(Socket.EVENT_CONNECT) {
                println("Connected: ${socket?.id()}")
            }
            
            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                println("Connection error: ${args[0]}")
            }
            
            socket?.on(Socket.EVENT_DISCONNECT) {
                println("Disconnected")
            }
            
            // Listen for any event
            socket?.onAny { event, args ->
                println("Event: $event, Data: ${args.contentToString()}")
            }
            
            socket?.connect()
            
        } catch (e: Exception) {
            println("Error connecting: ${e.message}")
        }
    }
    
    fun joinWebSocketRoom(callId: String) {
        socket?.emit("join-websocket", callId)
    }
    
    fun listenForCallMessages(callId: String, callback: (JSONObject) -> Unit) {
        socket?.on("websocket-$callId") { args ->
            if (args.isNotEmpty() && args[0] is JSONObject) {
                callback(args[0] as JSONObject)
            }
        }
    }
    
    fun sendCallData(callMongoId: String, message: String) {
        val data = JSONObject().apply {
            put("type", "message")
            put("role", "Associate")
            put("content", message)
            put("htmlContent", message)
            put("timestamp", System.currentTimeMillis())
            put("transcriptionIndex", 0)
            put("callId", callMongoId)
            put("callMongoId", callMongoId)
            put("message", message)
            put("isFinal", true)
        }
        socket?.emit("call-data", data)
    }
    
    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}

// Usage in Activity/Fragment
class MainActivity : AppCompatActivity() {
    private lateinit var socketManager: SocketManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        socketManager = SocketManager()
        socketManager.connect()
        
        // After getting callId from API
        val callId = "your-call-id-here"
        socketManager.joinWebSocketRoom(callId)
        
        // Listen for messages
        socketManager.listenForCallMessages(callId) { data ->
            runOnUiThread {
                // Handle received data
                println("Received: $data")
            }
        }
        
        // Send a message
        val callMongoId = "your-mongo-call-id"
        socketManager.sendCallData(callMongoId, "Hello from Android")
    }
    
    override fun onDestroy() {
        super.onDestroy()
        socketManager.disconnect()
    }
}
```

**Basic Example - How to Join a Room:**

```kotlin
import io.socket.client.IO
import io.socket.client.Socket
import java.net.URI

// Step 1: Create socket connection options
val options = IO.Options().apply {
    path = "/socket_connect/"
    transports = arrayOf("websocket")
    extraHeaders = mapOf("x-api-key" to "YOUR_API_KEY_HERE")
}

// Step 2: Create socket instance
val socket = IO.socket(URI("wss://api.voicelogica.ai"), options)

// Step 3: Listen for connection event
socket.on(Socket.EVENT_CONNECT) {
    println("✅ Connected to server")
    
    // Step 4: Join the websocket room with your callId
    // Get callId from /initiate-websocket-call API response
    val callId = "your-call-id-from-api-response"
    socket.emit("join-websocket", callId)
    println("📤 Sent join-websocket with callId: $callId")
}

// Step 5: Listen for messages from your specific call
// Messages come on event: "websocket-{callId}"
socket.on("websocket-your-call-id-from-api-response") { args ->
    println("📥 Received message: ${args[0]}")
    // Handle your message here
}

// Step 6: Connect to server
socket.connect()
```

**Complete Basic Example with Error Handling:**

```kotlin
import io.socket.client.IO
import io.socket.client.Socket
import java.net.URI

class BasicSocketExample {
    private var socket: Socket? = null
    private val apiKey = "YOUR_API_KEY_HERE"
    
    fun connectAndJoin(callId: String) {
        val options = IO.Options().apply {
            path = "/socket_connect/"
            transports = arrayOf("websocket")
            extraHeaders = mapOf("x-api-key" to apiKey)
        }
        
        socket = IO.socket(URI("wss://api.voicelogica.ai"), options)
        
        // Connection successful
        socket?.on(Socket.EVENT_CONNECT) {
            println("✅ Connected!")
            
            // JOIN THE ROOM - This is the key step!
            socket?.emit("join-websocket", callId)
            println("📤 Joined room for callId: $callId")
        }
        
        // Connection error - Handle 1005 and other errors
        socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
            val error = args[0]
            println("❌ Connection error: $error")
            
            // Check for specific error types
            when {
                error.toString().contains("1005") -> {
                    println("⚠️ Error 1005: No Status Received")
                    println("   - Check if API key is correct")
                    println("   - Verify network connection")
                    println("   - Check SSL certificate validity")
                }
                error.toString().contains("401") || error.toString().contains("Unauthorized") -> {
                    println("⚠️ Authentication failed - Check API key")
                }
                error.toString().contains("404") -> {
                    println("⚠️ Path not found - Check socket path: /socket_connect/")
                }
            }
        }
        
        // Disconnected - Handle different disconnect reasons
        socket?.on(Socket.EVENT_DISCONNECT) { reason ->
            println("⚠️ Disconnected. Reason: $reason")
            
            // Handle specific disconnect reasons
            when (reason) {
                Socket.EVENT_DISCONNECT -> {
                    println("   - Server closed connection")
                }
                "io server disconnect" -> {
                    println("   - Server forcefully disconnected")
                    // Attempt to reconnect
                    socket?.connect()
                }
                "io client disconnect" -> {
                    println("   - Client disconnected")
                }
                "ping timeout" -> {
                    println("   - Ping timeout - network issue")
                }
                "transport close" -> {
                    println("   - Transport closed")
                }
                "transport error" -> {
                    println("   - Transport error - attempting reconnect")
                    socket?.connect()
                }
            }
        }
        
        // Listen for messages from your call
        socket?.on("websocket-$callId") { args ->
            println("📥 Message received: ${args[0]}")
        }
        
        // Connect
        socket?.connect()
    }
    
    fun disconnect() {
        socket?.disconnect()
    }
}

// Usage:
// 1. First call /initiate-websocket-call API to get callId
// 2. Then use that callId to join:
val example = BasicSocketExample()
example.connectAndJoin("your-call-id-here")
```

### 4. Browser JavaScript

```javascript
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
<script>
  const socket = io('wss://api.voicelogica.ai', {
    path: '/socket_connect/',
    extraHeaders: {
      'x-api-key': 'YOUR_API_KEY_HERE'
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 30 * 60 * 1000
  });

  socket.on('connect', () => {
    console.log('Connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
  });

  socket.on('disconnect', () => {
    console.warn('Disconnected');
  });

  socket.onAny((event, data) => {
    console.log(`Event: ${event}`, data);
  });

  // Join websocket room
  socket.emit('join-websocket', 'your-call-id-here');

  // Listen for messages
  socket.on('websocket-your-call-id-here', (data) => {
    console.log('Received:', data);
  });

  // Send call-data
  socket.emit('call-data', {
    type: 'message',
    role: 'Associate',
    content: 'Hello',
    callMongoId: 'your-mongo-call-id'
  });
</script>
```

### 5. Raw WebSocket Client (Postman/Insomnia) - ⚠️ NOT RECOMMENDED

**Important**: Socket.IO uses Engine.IO protocol which requires specific packet formats. Raw WebSocket clients won't work properly because:

1. **Handshake Required**: Socket.IO needs an initial handshake with Engine.IO
2. **Packet Format**: Messages must be formatted as Engine.IO packets
3. **Heartbeats**: Socket.IO requires ping/pong messages to maintain connection

**If you must try (will likely fail):**

The message format for Socket.IO events is:
```
42["event-name", data]
```

Where:
- `4` = MESSAGE packet type
- `2` = EVENT message type  
- `["event-name", data]` = JSON array with event name and data

**Example for join-websocket:**
```
42["join-websocket","692986db183b29b7e6c1b8e6"]
```

**However, this still won't work** because:
- You need to complete the Engine.IO handshake first
- You need to handle ping/pong messages
- The connection will likely timeout or be rejected

**✅ RECOMMENDED**: Use a Socket.IO client library (see examples above) instead of raw WebSocket clients.

### 6. Using wscat (for basic WebSocket testing)

Note: Socket.IO uses a specific protocol, so wscat may not work perfectly, but you can test the connection:

```bash
# Install wscat
npm install -g wscat

# Connect (basic WebSocket test)
wscat -c "wss://api.voicelogica.ai/socket_connect/?EIO=4&transport=websocket" \
  -H "x-api-key: YOUR_API_KEY_HERE"
```

### 7. cURL (for HTTP upgrade test only)

Note: cURL cannot maintain a WebSocket connection, but you can test the HTTP upgrade:

```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  "https://api.voicelogica.ai/socket_connect/?EIO=4&transport=websocket"
```

## Troubleshooting Error 1005: No Status Received

This error typically means the WebSocket connection was closed without receiving a proper close frame. Common causes and solutions:

### 1. **Check API Key**
```kotlin
// Make sure your API key is correct and not empty
val apiKey = "YOUR_API_KEY_HERE" // Must match THIRD_PARTY_API_KEY from server .env
```

### 2. **Verify Network Connection**
- Check internet connectivity
- Ensure device can reach `wss://api.voicelogica.ai`
- Check firewall/proxy settings

### 3. **SSL/TLS Certificate Issues**
- Android may reject self-signed certificates
- Add network security config if needed

### 4. **Add Network Security Config (if needed)**

**Create `res/xml/network_security_config.xml`:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.voicelogica.ai</domain>
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </domain-config>
</network-security-config>
```

**Add to `AndroidManifest.xml`:**
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

### 5. **Enhanced Error Handling Example**

```kotlin
socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
    val error = args[0]
    Log.e("SocketIO", "Connection error: $error")
    
    // Try to extract more details
    if (error is Exception) {
        Log.e("SocketIO", "Exception: ${error.message}", error)
    }
    
    // Check if it's a 1005 error
    if (error.toString().contains("1005")) {
        // Verify API key is set
        if (apiKey.isEmpty() || apiKey == "YOUR_API_KEY_HERE") {
            Log.e("SocketIO", "⚠️ API key not configured!")
        }
    }
}
```

### 6. **Verify Connection Settings**
```kotlin
val options = IO.Options().apply {
    path = "/socket_connect/"  // Must match server path exactly
    transports = arrayOf("websocket")  // WebSocket only
    reconnection = true
    reconnectionAttempts = 5
    reconnectionDelay = 1000
    timeout = 20000
    extraHeaders = mapOf("x-api-key" to apiKey)  // Required header
}
```

## Important Notes

1. **API Key**: Replace `YOUR_API_KEY_HERE` with your actual API key from `.env` file (`THIRD_PARTY_API_KEY`)
2. **Call ID**: You need to get a `callId` from the `/initiate-websocket-call` API endpoint first
3. **Mongo Call ID**: The `callMongoId` is also returned from the initiate endpoint
4. **Event Names**: Messages for a specific call come on events named `websocket-{callId}`
5. **Reconnection**: The client is configured to reconnect after 30 minutes if disconnected
6. **Error 1005**: Usually indicates authentication failure, network issues, or SSL problems - check API key first

