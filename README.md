# Protocol Explorer (Enhanced Edition)

An interactive, visual learning tool for computer networking protocols, packet lifecycles, and network architecture.

> [!IMPORTANT]
> ### 📜 Attribution & Original Project
> - **Original Website:** [https://protocol-explorer-alpha.vercel.app/](https://protocol-explorer-alpha.vercel.app/)
> - **Original Author & Creator:** [Dilum Sanjaya](https://github.com/dilums)
> 
> *Credit Notice: The original concept, interactive visual engine, and foundational architecture belong to Dilum Sanjaya. This repository is an **upgraded and extended edition** that builds upon the original work to include next-generation protocols, advanced failure scenarios, and expanded internationalization.*

---

## 🌐 Live Demo

Experience the full interactive simulation online:

👉 **[https://alishafiee2003.github.io/protocol-explorer/](https://alishafiee2003.github.io/protocol-explorer/)**

---

## ✨ Enhancements & Upgrades in this Edition

This fork significantly expands the scope and capabilities of the original explorer (from 14 to **21 comprehensive protocols**), adding modern internet protocols, realistic physics/timings, and diagnostic views:

### 1. 🚀 7 Modern Protocols & Techniques Added
- **HTTP/2:** Single-connection multiplexing, binary framing (`SETTINGS`, `HEADERS`, `DATA`), and HPACK header compression.
- **HTTP/3 (QUIC):** 1-RTT UDP-based handshake, zero Head-of-Line blocking, connection migration, and encrypted frame flows.
- **WebSocket:** Bidirectional real-time full-duplex communication via HTTP/1.1 upgrade (`101 Switching Protocols`), binary/text ping-pong heartbeats, and graceful closure codes.
- **MQTT:** IoT publish-subscribe architecture with MQTT Broker, `CONNECT`/`CONNACK`, and both **QoS 0** (fire-and-forget) and **QoS 1** (acknowledged delivery with `PUBACK`).
- **Server-Sent Events (SSE):** Lightweight server-to-client event streaming over `text/event-stream` with automatic reconnect capabilities.
- **HTTP Chunked Transfer Encoding:** Dynamic stream transmission with `Transfer-Encoding: chunked`, hex chunk headers, and terminating zero-chunks (`0\r\n\r\n`).
- **gRPC:** High-performance RPC over HTTP/2 with length-prefixed binary protobuf envelopes, streaming, and trailer metadata (`grpc-status`).

### 2. ⚡ Realistic Latency, Speed & Timing Differences
- Accurately demonstrates real-world transport speed differences (e.g., 1-RTT QUIC UDP vs. 3-RTT TCP+TLS 1.3 handshakes).
- Visualizes concurrent stream delivery without blocking versus serial transfer delays.

### 3. ⚠️ Advanced Failure Modes & Edge Cases
- **Packet Loss Simulation:** Packets dropping mid-transit (`lost: true`) with visual fades.
- **Retransmission & SACK:** Visual modeling of duplicate ACKs (`DUP=1`), selective acknowledgments, and TCP retransmission timers.
- **Head-of-Line (HoL) Blocking:** Demonstrates how TCP packet loss halts subsequent streams while QUIC continues unaffected.
- **Protocol Disconnects & Status Errors:** Real-world error flows including gRPC status codes (`NOT_FOUND`, `DEADLINE_EXCEEDED`) and TCP resets (`RST`).

### 4. 🔍 Byte-Level Packet Inspector
- Wire-level binary decoders for all new protocols.
- Deep inspection across all 4 OSI/TCP-IP layers (Ethernet, IPv4, TCP/UDP, Application).
- Formatted hex dumps and decoded header details for educational analysis.

### 5. 🌍 Multilingual Localization (16 Languages)
- Language options: **Mongolian (Монгол)**, **Persian (فارسی)**, **English**, **Arabic (العربية)**, **Spanish (Español)**, **French (Français)**, **German (Deutsch)**, **Turkish (Türkçe)**, **Portuguese (Português)**, **Indonesian (Bahasa Indonesia)**, **Japanese (日本語)**, **Simplified Chinese (简体中文)**, **Traditional Chinese (繁體中文)**, **Korean (한국어)**, **Hindi (हिन्दी)**, and **Hebrew (עברית)**.
- Select **Монгол** in the language menu for Mongolian Cyrillic. The selection persists after reloading. See [Mongolian localization maintenance](localization/MONGOLIAN.md) for translation sources and checks.

---

## 📚 All Protocols Covered (21 Total)

- **Application Layer:** HTTP/1.1, HTTPS, HTTP/2, HTTP/3 (QUIC), WebSocket, MQTT, Server-Sent Events (SSE), Chunked Transfer, gRPC, DNS, DHCP, SMTP, POP3, IMAP, FTP, SSH
- **Transport Layer:** TCP, UDP, TLS 1.3
- **Network Layer:** IPv4, ICMP, ARP

---

## 🚀 Running Locally (Offline)

### Windows
Double-click `start.bat` or run:
```bat
start.bat
```

### Any OS (Python / Node)
```bash
python serve.py
```
Or using Python's standard library:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your web browser.
