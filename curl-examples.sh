#!/bin/bash

# Curl command for initiating a WebSocket call (Voice)
curl -X POST http://localhost:5000/initiate-websocket-call \
  -H "Content-Type: application/json" \
  -d '{
    "contextForAi": "Conversation with Web AI",
    "languageCode": "el-GR",
    "agentId": "692856a776bb85eee1ee8767",
    "associateId": "",
    "codec": "PCM16",
    "serviceType": "websocket"
  }'

