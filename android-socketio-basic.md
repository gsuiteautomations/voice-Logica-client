# Android Socket.IO - Simple Guide

## What You Need to Know

Socket.IO lets your Android app talk to a server in real-time. Think of it like a phone call - you connect, you talk, you listen.

## Step 1: Add the Library

**In your `build.gradle.kts` file (Module: app), add this:**

```kotlin
dependencies {
    implementation("io.socket:socket.io-client:2.1.0")
}
```

**In your `AndroidManifest.xml`, add internet permission:**

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## Step 2: The 5 Basic Things You Need

### 1. Connect to Server
```kotlin
val socket = IO.socket(URI("wss://api.voicelogica.ai"), options)
socket.connect()
```

### 2. Wait for Connection
```kotlin
socket.on(Socket.EVENT_CONNECT) {
    // You're connected! Do something here
}
```

### 3. Join a Room
```kotlin
socket.emit("join-websocket", "your-call-id")
```

### 4. Listen for Messages
```kotlin
socket.on("websocket-your-call-id") { args ->
    // You got a message! Do something with it
}
```

### 5. Send Messages
```kotlin
socket.emit("call-data", yourDataObject)
```

## Complete Simple Example

```kotlin
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URI

class SimpleSocketExample {
    private var socket: Socket? = null
    
    // Step 1: Connect
    fun connect(apiKey: String) {
        // Set up connection options
        val options = IO.Options().apply {
            path = "/socket_connect/"                    // The path on server
            transports = arrayOf("websocket")            // Use WebSocket only
            extraHeaders = mapOf("x-api-key" to apiKey) // Your API key
        }
        
        // Create the connection
        socket = IO.socket(URI("wss://api.voicelogica.ai"), options)
        
        // Step 2: When connected, do something
        socket?.on(Socket.EVENT_CONNECT) {
            println("✅ Connected!")
        }
        
        // When there's an error
        socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
            println("❌ Error: ${args[0]}")
        }
        
        // When disconnected
        socket?.on(Socket.EVENT_DISCONNECT) {
            println("⚠️ Disconnected")
        }
        
        // Actually connect
        socket?.connect()
    }
    
    // Step 3: Join a room (you need a callId from the API first)
    fun joinRoom(callId: String) {
        socket?.emit("join-websocket", callId)
        println("📤 Joined room: $callId")
    }
    
    // Step 4: Listen for messages from your call
    fun listenForMessages(callId: String, onMessage: (JSONObject) -> Unit) {
        socket?.on("websocket-$callId") { args ->
            if (args.isNotEmpty() && args[0] is JSONObject) {
                onMessage(args[0] as JSONObject)
            }
        }
    }
    
    // Step 5: Send a message
    fun sendMessage(callMongoId: String, text: String) {
        val data = JSONObject().apply {
            put("type", "message")
            put("role", "Associate")
            put("content", text)
            put("callMongoId", callMongoId)
        }
        socket?.emit("call-data", data)
        println("📤 Sent: $text")
    }
    
    // Clean up when done
    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}
```

## How to Use It in Your Activity

```kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var socket: SimpleSocketExample
    private val apiKey = "YOUR_API_KEY_HERE"
    private val callId = "your-call-id-from-api"
    private val callMongoId = "your-mongo-id-from-api"
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Create socket
        socket = SimpleSocketExample()
        
        // Connect
        socket.connect(apiKey)
        
        // Wait a bit for connection, then join room
        Handler(Looper.getMainLooper()).postDelayed({
            socket.joinRoom(callId)
            
            // Listen for messages
            socket.listenForMessages(callId) { message ->
                runOnUiThread {
                    // Update your UI with the message
                    println("📥 Got message: $message")
                }
            }
        }, 1000) // Wait 1 second for connection
    }
    
    fun sendButtonClicked() {
        // When user clicks send button
        socket.sendMessage(callMongoId, "Hello from Android!")
    }
    
    override fun onDestroy() {
        super.onDestroy()
        socket.disconnect()
    }
}
```

## What Each Part Does

| Code | What It Does |
|------|--------------|
| `IO.socket()` | Creates a connection to the server |
| `socket.connect()` | Actually connects to the server |
| `socket.on()` | Listen for something (like waiting for a phone call) |
| `socket.emit()` | Send something (like making a phone call) |
| `socket.disconnect()` | Close the connection |

## The Flow (Step by Step)

1. **Get callId** - First, call your API to get a `callId` and `callMongoId`
2. **Connect** - Connect to the Socket.IO server
3. **Wait** - Wait for connection to succeed
4. **Join** - Join the room using `join-websocket` with your `callId`
5. **Listen** - Listen for messages on `websocket-{callId}`
6. **Send** - Send messages using `call-data` with your data

## Common Mistakes

❌ **Don't join before connecting** - Wait for `EVENT_CONNECT` first
❌ **Don't forget the API key** - You need it in `extraHeaders`
❌ **Don't use wrong callId** - The event name is `websocket-{callId}`, not just `callId`
❌ **Don't forget to disconnect** - Clean up in `onDestroy()`

## Quick Reference

```kotlin
// Connect
socket.connect()

// Join room
socket.emit("join-websocket", callId)

// Listen
socket.on("websocket-$callId") { args -> /* handle message */ }

// Send
socket.emit("call-data", dataObject)

// Disconnect
socket.disconnect()
```

That's it! You now know the basics of Socket.IO on Android.

