import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin';
import { validateKey } from './services/keyService';
import { handleUserConnect, handleAgentConnect } from './wsHandler';
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

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', async (req, socket, head) => {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const role = url.searchParams.get('role');
    const id = url.searchParams.get('id') || undefined;
    const token = url.searchParams.get('token') || undefined;

    if (role === 'agent') {
      if (!token) { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); socket.destroy(); return; }
      const ADMIN_SECRET = process.env.AGENT_DEFAULT_SECRET || 'SUPERSECRET1234';
      if (token === ADMIN_SECRET) {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req, { role: 'agent', agentId: 'ADMIN' });
          handleAgentConnect(ws, 'ADMIN');
        });
        return;
      }
      const v = await validateKey(token);
      if (!v.valid) { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); socket.destroy(); return; }
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req, { role: 'agent', agentId: v.agentId });
        handleAgentConnect(ws, v.agentId as string);
      });
      return;
    }

    if (role === 'user') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req, { role: 'user', id });
        handleUserConnect(ws, id || undefined);
      });
      return;
    }

    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n'); socket.destroy();
  } catch (e) {
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n'); socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`Backend listening on ${PORT}`);
  console.log(`If you built the frontend, static dir: ${staticDir}`);
});
