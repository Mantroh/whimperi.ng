# Architecture Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Browser 1 (Alice)              Browser 2 (Bob)                │
│  ┌──────────────┐                ┌──────────────┐              │
│  │ React App    │                │ React App    │              │
│  │ - Login      │                │ - Login      │              │
│  │ - ChatRoom   │                │ - ChatRoom   │              │
│  │ - VideoCall  │                │ - VideoCall  │              │
│  └──────┬───────┘                └───────┬──────┘              │
│         │                                │                      │
│         │ Socket.IO (WebSocket)          │                      │
│         │                                │                      │
└─────────┼────────────────────────────────┼──────────────────────┘
          │                                │
          │                                │
┌─────────▼────────────────────────────────▼──────────────────────┐
│                       SERVER LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Node.js + Express + Socket.IO                                 │
│  ┌─────────────────────────────────────┐                       │
│  │ server.js                           │                       │
│  │ - Room Management                   │                       │
│  │ - Message Broadcasting              │                       │
│  │ - User Status Tracking              │                       │
│  │ - Read Receipts                     │                       │
│  └─────────────────────────────────────┘                       │
│  ┌─────────────────────────────────────┐                       │
│  │ webrtc-signaling.js                 │                       │
│  │ - Call Signaling                    │                       │
│  │ - Offer/Answer Relay                │                       │
│  │ - ICE Candidate Relay               │                       │
│  └─────────────────────────────────────┘                       │
│  ┌─────────────────────────────────────┐                       │
│  │ In-Memory Data                      │                       │
│  │ - rooms Map                         │                       │
│  │ - socketToRoom Map                  │                       │
│  └─────────────────────────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │                                │
          │ WebRTC Signaling               │ WebRTC Signaling
          │ (via Socket.IO)                │ (via Socket.IO)
          │                                │
┌─────────▼────────────────────────────────▼──────────────────────┐
│                     MEDIA LAYER (P2P)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Browser 1 ◄═══════════ Direct P2P ════════════► Browser 2     │
│  (WebRTC)                Media Stream               (WebRTC)    │
│                                                                 │
│  - Audio Stream                                                │
│  - Video Stream                                                │
│  - STUN for NAT Traversal                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Chat Message Flow

```
Alice                    Server                    Bob
  │                        │                        │
  ├─── send-message ──────►│                        │
  │    { text: "Hi!" }     │                        │
  │                        │                        │
  │◄── message-sent ───────┤                        │
  │    { id, text, ... }   │                        │
  │                        │                        │
  │                        ├─── new-message ───────►│
  │                        │    { id, text, ... }   │
  │                        │                        │
  │                        │◄── messages-read ──────┤
  │                        │    { messageIds: [] }  │
  │                        │                        │
  │◄─ messages-marked-read ┤                        │
  │    { messageIds: [] }  │                        │
  │                        │                        │
  │   [Blue ticks ✓✓]     │       [Message read]   │
  │                        │                        │
```

## WebRTC Call Setup Flow

```
Caller (Alice)           Server              Callee (Bob)
     │                      │                      │
     ├──── call-user ───────►│                     │
     │  { isVideo: true }    │                     │
     │                       ├── incoming-call ───►│
     │                       │  { from: "Alice" }  │
     │                       │                     │
     │                       │◄── call-accepted ───┤
     │◄─── call-accepted ────┤                     │
     │                       │                     │
     │                       │                     │
     │ [Create RTCPeerConnection]                  │
     │                       │                     │
     ├──── webrtc-offer ────►│                     │
     │  { offer: SDP }       │                     │
     │                       ├─── webrtc-offer ───►│
     │                       │                     │
     │                       │  [Set remote desc]  │
     │                       │  [Create answer]    │
     │                       │                     │
     │                       │◄── webrtc-answer ───┤
     │◄─── webrtc-answer ────┤  { answer: SDP }    │
     │                       │                     │
     │ [Set remote desc]     │                     │
     │                       │                     │
     │ [ICE Gathering...]    │  [ICE Gathering...] │
     │                       │                     │
     ├─── ice-candidate ────►│                     │
     │                       ├── ice-candidate ───►│
     │                       │                     │
     │                       │◄── ice-candidate ───┤
     │◄── ice-candidate ─────┤                     │
     │                       │                     │
     │ [Multiple ICE candidate exchanges...]       │
     │                       │                     │
     │◄════════════════════════════════════════════►│
     │          Direct P2P Media Stream            │
     │              (Audio/Video)                   │
     │                       │                     │
```

## Component Hierarchy

```
App
 │
 ├── Login (if not joined)
 │    └── Form
 │         ├── Room ID Input
 │         └── Username Input
 │
 └── ChatRoom (if joined)
      │
      ├── Header
      │    ├── Back Button
      │    ├── User Info (name, status)
      │    └── Call Buttons (📞 📹)
      │
      ├── Incoming Call Modal (conditional)
      │    ├── Call Info
      │    └── Accept/Reject Buttons
      │
      ├── VideoCall Component (conditional)
      │    ├── Video Container
      │    │    ├── Remote Video (full screen)
      │    │    └── Local Video (PiP)
      │    └── Call Controls
      │         ├── Mute Button
      │         ├── Video Toggle
      │         └── End Call Button
      │
      └── Chat Interface (when not in call)
           ├── MessageList
           │    ├── Message Bubbles
           │    │    ├── Sender Name
           │    │    ├── Message Text
           │    │    └── Timestamp + Read Status
           │    └── Typing Indicator
           │
           └── MessageInput
                ├── Text Input
                └── Send Button
```

## Data Structure

```
Server Memory:

rooms: Map {
  "room123": {
    users: [
      { 
        socketId: "abc123",
        username: "Alice"
      },
      { 
        socketId: "def456",
        username: "Bob"
      }
    ],
    messages: [
      {
        id: "1704196800000-xyz",
        sender: "Alice",
        text: "Hello Bob!",
        timestamp: "2026-01-02T12:00:00.000Z",
        read: false
      },
      {
        id: "1704196805000-abc",
        sender: "Bob",
        text: "Hi Alice!",
        timestamp: "2026-01-02T12:00:05.000Z",
        read: true
      }
    ]
  }
}

socketToRoom: Map {
  "abc123": {
    roomId: "room123",
    username: "Alice"
  },
  "def456": {
    roomId: "room123",
    username: "Bob"
  }
}
```

## State Transitions

### Room States
```
Empty Room
    ↓
User 1 Joins → [1 User Waiting]
    ↓
User 2 Joins → [2 Users Active]
    ↓
User Leaves → [1 User Waiting]
    ↓
User Leaves → [Empty Room] → Room Deleted
```

### Call States
```
Idle
  ↓
Calling (outgoing) → Ringing
  ↓
Answered → Connecting (WebRTC handshake)
  ↓
Connected (media flowing)
  ↓
Ended → Idle

OR

Idle
  ↓
Ringing (incoming)
  ↓
Accepted → Connecting
  ↓
Connected
  ↓
Ended → Idle

OR

Ringing → Rejected → Idle
```

### Message States
```
Composed
  ↓
Sent (single tick ✓)
  ↓
Delivered (double tick ✓✓)
  ↓
Read (blue double tick ✓✓)
```

## Network Topology

```
┌──────────────────────────────────────────────────────────┐
│                    Internet / LAN                        │
└──────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
    ┌────▼────┐         ┌─────▼─────┐       ┌─────▼────┐
    │ Client  │         │  Server   │       │ Client   │
    │ Alice   │         │   Node.js │       │   Bob    │
    │         │         │  Port 3000│       │          │
    └────┬────┘         └─────┬─────┘       └─────┬────┘
         │                    │                    │
         │  WebSocket (WSS)   │  WebSocket (WSS)   │
         │◄──────────────────►│◄──────────────────►│
         │                    │                    │
         │  Signaling         │   Signaling        │
         │                    │                    │
         │                                         │
         │  WebRTC P2P (UDP - via STUN)           │
         │◄────────────────────────────────────────►│
         │         Direct Media Stream              │
         │         (Audio/Video)                    │
         │                                         │
```

## Security Flow

```
┌────────────────────────────────────────────────────────┐
│              Current (Demo) Security                   │
├────────────────────────────────────────────────────────┤
│ • No authentication                                    │
│ • Username is self-declared                            │
│ • Room IDs are unprotected                            │
│ • WebSocket over HTTP                                  │
│ • No message encryption (server can see)              │
│ • WebRTC media IS encrypted (P2P default)             │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│          Recommended (Production) Security             │
├────────────────────────────────────────────────────────┤
│ • JWT or OAuth authentication                          │
│ • Username verification                                │
│ • Room passwords or access control                     │
│ • WSS over HTTPS (TLS/SSL)                            │
│ • End-to-end encryption for messages                   │
│ • Rate limiting on all endpoints                       │
│ • Input validation and sanitization                    │
│ • CORS restricted to known origins                     │
│ • WebRTC still encrypted (P2P)                        │
└────────────────────────────────────────────────────────┘
```

---

## Technology Stack Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  React Components + CSS                 │
│  - Login, ChatRoom, VideoCall           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Application Layer               │
│  React Hooks + State Management         │
│  - useSocket, useState, useEffect       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Communication Layer             │
│  Socket.IO Client + WebRTC              │
│  - Event emitters/listeners             │
│  - RTCPeerConnection API                │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼──────┐   ┌────────▼──────┐
│  WebSocket   │   │   WebRTC      │
│  (Signaling) │   │   (Media)     │
└───────┬──────┘   └────────┬──────┘
        │                   │
┌───────▼───────────────────▼────────┐
│         Network Layer              │
│  TCP/IP, UDP, STUN/TURN            │
└────────────────────────────────────┘
```
