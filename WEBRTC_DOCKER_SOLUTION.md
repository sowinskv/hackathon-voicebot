# WebRTC + Docker Connectivity Issue

## 🔍 Problem

When running LiveKit in Docker, WebRTC peer connections fail because:
1. LiveKit advertises its Docker internal IP (172.19.0.x)
2. Browser clients cannot reach Docker's internal network
3. UDP port mapping alone isn't sufficient for WebRTC NAT traversal

**Error**: `ConnectionError: could not establish pc connection`

---

## ✅ Solution Options

### Option 1: Run LiveKit Natively (Recommended for Development)

Instead of Docker, run LiveKit server directly on your host machine:

```bash
# 1. Download LiveKit server
wget https://github.com/livekit/livekit/releases/download/v1.9.12/livekit_1.9.12_linux_amd64.tar.gz
tar -xzf livekit_1.9.12_linux_amd64.tar.gz

# 2. Run LiveKit natively
./livekit-server --config livekit/livekit.yaml
```

Keep all other services in Docker:
```bash
# Stop only LiveKit container
docker-compose stop livekit

# Start other services
docker-compose up -d postgres api-gateway voicebot-engine voice-app bot-builder agent-console
```

---

### Option 2: Use LiveKit Cloud (Recommended for Production)

LiveKit Cloud handles all WebRTC/NAT complexity automatically:

1. **Sign up**: https://livekit.io/ (Free tier available)
2. **Get credentials**: API Key, Secret, and URL
3. **Update `.env`**:
```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

4. **Restart services**:
```bash
docker-compose restart api-gateway voicebot-engine
```

---

### Option 3: Use Host Network Mode (Linux Only)

On Linux (not WSL), you can use host networking:

**docker-compose.yml**:
```yaml
  livekit:
    image: livekit/livekit-server:latest
    network_mode: host
    volumes:
      - ./livekit/livekit.yaml:/etc/livekit.yaml
```

**Note**: This breaks on Windows/Mac Docker Desktop and WSL2.

---

### Option 4: Configure Public IP (For Public Deployment)

If deploying to a server with a public IP:

**livekit.yaml**:
```yaml
rtc:
  use_external_ip: true
  # Your server's public IP
  node_ip: "YOUR_PUBLIC_IP"
  port_range_start: 50000
  port_range_end: 50100
  tcp_port: 7881
```

---

## 🔧 Quick Fix for Local Development

For immediate testing, the fastest solution is **Option 1** (run LiveKit natively):

```bash
# Terminal 1: Run LiveKit natively
cd /home/marcinlojek/hackathon/hackathon-voicebot
docker-compose stop livekit
wget https://github.com/livekit/livekit/releases/download/v1.9.12/livekit_1.9.12_linux_amd64.tar.gz
tar -xzf livekit_1.9.12_linux_amd64.tar.gz
./livekit-server --config livekit/livekit.yaml

# Terminal 2: Run other services
docker-compose up -d postgres api-gateway voicebot-engine voice-app bot-builder agent-console
```

---

## 📊 Why Docker + WebRTC is Complex

WebRTC requires:
- Direct UDP connectivity between peers
- Proper ICE candidate advertisement
- STUN/TURN servers for NAT traversal

Docker networking adds layers that interfere with this:
- Container gets internal IP (172.x.x.x)
- Port mapping works for TCP but WebRTC needs proper UDP routing
- ICE candidates include unreachable internal IPs

---

## 🎯 Recommended Setup by Environment

| Environment | Solution |
|-------------|----------|
| **Local Development** | Run LiveKit natively (Option 1) |
| **Testing/Staging** | LiveKit Cloud (Option 2) |
| **Production** | LiveKit Cloud or self-hosted with public IP (Option 4) |
| **CI/CD** | Mock LiveKit or use Cloud |

---

## 🚀 Next Steps

1. Choose your solution above
2. Update your configuration
3. Restart services
4. Test the voice app at http://localhost:5173

The voice system is fully functional - just needs proper WebRTC networking!
