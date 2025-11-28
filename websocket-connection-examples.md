# WebSocket Connection Examples

## Server Configuration
- **URL**: `wss://api.voicelogica.ai`
- **Path**: `/socket_connect/`
- **Transport**: WebSocket only
- **Authentication**: `x-api-key` header required

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

**Simplified Basic Example:**

```kotlin
import io.socket.client.IO
import io.socket.client.Socket
import java.net.URI

// Basic connection
val options = IO.Options().apply {
    path = "/socket_connect/"
    transports = arrayOf("websocket")
    extraHeaders = mapOf("x-api-key" to "YOUR_API_KEY_HERE")
}

val socket = IO.socket(URI("wss://api.voicelogica.ai"), options)

socket.on(Socket.EVENT_CONNECT) {
    println("Connected")
    socket.emit("join-websocket", "your-call-id")
}

socket.on("websocket-your-call-id") { args ->
    println("Message: ${args[0]}")
}

socket.connect()
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

### 5. Using wscat (for basic WebSocket testing)

Note: Socket.IO uses a specific protocol, so wscat may not work perfectly, but you can test the connection:

```bash
# Install wscat
npm install -g wscat

# Connect (basic WebSocket test)
wscat -c "wss://api.voicelogica.ai/socket_connect/?EIO=4&transport=websocket" \
  -H "x-api-key: YOUR_API_KEY_HERE"
```

### 6. cURL (for HTTP upgrade test only)

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

## Important Notes

1. **API Key**: Replace `YOUR_API_KEY_HERE` with your actual API key from `.env` file (`THIRD_PARTY_API_KEY`)
2. **Call ID**: You need to get a `callId` from the `/initiate-websocket-call` API endpoint first
3. **Mongo Call ID**: The `callMongoId` is also returned from the initiate endpoint
4. **Event Names**: Messages for a specific call come on events named `websocket-{callId}`
5. **Reconnection**: The client is configured to reconnect after 30 minutes if disconnected

