import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin';
import { validateKey } from './services/memoryKeyService';
import { handleUserConnect, handleAgentConnect } from './wsHandler';
import { authenticateWebSocket } from './authUtils';
import fs from 'fs';
dotenv.config();

const PORT = +(process.env.PORT || 3001);
const app = express();
app.use(express.json());

// 如果你希望后端也能直接做 embed 页面、demo 等，可以把 frontend 的构建输出放到 ../frontend/dist
const staticDir = path.join(process.cwd(), '..', 'frontend', 'dist');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
}

// admin routes
app.use('/admin', adminRoutes);

// embed page route
app.get('/', (req, res) => {
  const embed = req.query.embed;
  const agent = req.query.agent;
  
  if (embed === '1') {
    // Return a simple chat interface HTML
    res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>客服聊天</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; height: 100vh; display: flex; flex-direction: column; }
        .chat-header { background: #007bff; color: white; padding: 15px; text-align: center; }
        .chat-messages { flex: 1; padding: 10px; overflow-y: auto; background: #f8f9fa; }
        .message { margin: 10px 0; padding: 8px 12px; border-radius: 8px; max-width: 80%; }
        .message.user { background: #007bff; color: white; margin-left: auto; }
        .message.agent { background: white; border: 1px solid #ddd; }
        .message.system { background: #28a745; color: white; text-align: center; margin: 5px auto; max-width: 60%; font-size: 12px; }
        .chat-input { display: flex; padding: 10px; background: white; border-top: 1px solid #ddd; }
        .chat-input input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px; }
        .chat-input button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .chat-input button:hover { background: #0056b3; }
        .status { padding: 5px 10px; background: #fff3cd; border-bottom: 1px solid #ffeaa7; font-size: 12px; text-align: center; }
    </style>
</head>
<body>
    <div class="chat-header">
        <h3>在线客服</h3>
    </div>
    <div class="status" id="status">正在连接...</div>
    <div class="chat-messages" id="messages"></div>
    <div class="chat-input">
        <input type="text" id="messageInput" placeholder="请输入消息..." disabled>
        <button id="sendButton" disabled>发送</button>
    </div>

    <script>
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const statusDiv = document.getElementById('status');
        
        let ws = null;
        let userId = 'user_' + Math.random().toString(36).substr(2, 9);
        
        function addMessage(text, type = 'system') {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + type;
            messageDiv.textContent = text;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        function updateStatus(text, color = '#fff3cd') {
            statusDiv.textContent = text;
            statusDiv.style.backgroundColor = color;
        }
        
        function connect() {
            const wsUrl = \`ws://\${window.location.host}/?role=user&id=\${userId}\`;
            ws = new WebSocket(wsUrl);
            
            ws.onopen = function() {
                updateStatus('已连接，等待客服...', '#d4edda');
                messageInput.disabled = false;
                sendButton.disabled = false;
                addMessage('欢迎使用在线客服，请稍等客服接入...', 'system');
            };
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                if (data.type === 'welcome') {
                    // Welcome message handled in onopen
                } else if (data.type === 'notice') {
                    addMessage(data.text, 'system');
                    if (data.text.includes('已接入')) {
                        updateStatus('客服已接入', '#d4edda');
                    }
                } else if (data.type === 'chat' && data.from === 'agent') {
                    addMessage(data.text, 'agent');
                }
            };
            
            ws.onclose = function() {
                updateStatus('连接已断开', '#f8d7da');
                messageInput.disabled = true;
                sendButton.disabled = true;
                addMessage('连接已断开，正在重连...', 'system');
                setTimeout(connect, 3000);
            };
            
            ws.onerror = function() {
                updateStatus('连接错误', '#f8d7da');
                addMessage('连接出现错误', 'system');
            };
        }
        
        function sendMessage() {
            const text = messageInput.value.trim();
            if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;
            
            ws.send(JSON.stringify({ type: 'chat', text: text }));
            addMessage(text, 'user');
            messageInput.value = '';
        }
        
        sendButton.onclick = sendMessage;
        messageInput.onkeypress = function(e) {
            if (e.key === 'Enter') sendMessage();
        };
        
        // Start connection
        connect();
    </script>
</body>
</html>
    `);
  } else {
    res.send('<h1>Backend Server</h1><p>WebSocket chat backend is running.</p>');
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', async (req, socket, head) => {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const role = url.searchParams.get('role');
    const id = url.searchParams.get('id') || undefined;
    const token = url.searchParams.get('token') || undefined;

    // Use the new authentication utility
    const authResult = await authenticateWebSocket(role, token, id);
    
    if (!authResult.valid) {
      const errorResponse = `HTTP/1.1 401 Unauthorized\r\nContent-Type: application/json\r\n\r\n{"error":"${authResult.error || 'Authentication failed'}"}`;
      socket.write(errorResponse);
      socket.destroy();
      return;
    }

    if (authResult.role === 'agent') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req, { role: 'agent', agentId: authResult.agentId });
        handleAgentConnect(ws, authResult.agentId as string);
      });
      return;
    }

    if (authResult.role === 'user') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req, { role: 'user', id: authResult.userId });
        handleUserConnect(ws, authResult.userId);
      });
      return;
    }

    socket.write('HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\n\r\n{"error":"Invalid role"}');
    socket.destroy();
  } catch (e) {
    console.error('WebSocket upgrade error:', e);
    socket.write('HTTP/1.1 500 Internal Server Error\r\nContent-Type: application/json\r\n\r\n{"error":"Internal server error"}');
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`Backend listening on ${PORT}`);
  console.log(`If you built the frontend, static dir: ${staticDir}`);
});
