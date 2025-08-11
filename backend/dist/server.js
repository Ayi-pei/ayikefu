"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const admin_1 = __importDefault(require("./routes/admin"));
const keyService_1 = require("./services/keyService");
const wsHandler_1 = require("./wsHandler");
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const PORT = +(process.env.PORT || 3001);
const app = (0, express_1.default)();
app.use(express_1.default.json());
// 如果你希望后端也能直接做 embed 页面、demo 等，可以把 frontend 的构建输出放到 ../frontend/dist
const staticDir = path_1.default.join(process.cwd(), '..', 'frontend', 'dist');
if (fs_1.default.existsSync(staticDir)) {
    app.use(express_1.default.static(staticDir));
}
// admin routes
app.use('/admin', admin_1.default);
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ noServer: true });
server.on('upgrade', async (req, socket, head) => {
    try {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const role = url.searchParams.get('role');
        const id = url.searchParams.get('id') || undefined;
        const token = url.searchParams.get('token') || undefined;
        if (role === 'agent') {
            if (!token) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            const ADMIN_SECRET = process.env.AGENT_DEFAULT_SECRET || 'SUPERSECRET1234';
            if (token === ADMIN_SECRET) {
                wss.handleUpgrade(req, socket, head, (ws) => {
                    wss.emit('connection', ws, req, { role: 'agent', agentId: 'ADMIN' });
                    (0, wsHandler_1.handleAgentConnect)(ws, 'ADMIN');
                });
                return;
            }
            const v = await (0, keyService_1.validateKey)(token);
            if (!v.valid) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req, { role: 'agent', agentId: v.agentId });
                (0, wsHandler_1.handleAgentConnect)(ws, v.agentId);
            });
            return;
        }
        if (role === 'user') {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req, { role: 'user', id });
                (0, wsHandler_1.handleUserConnect)(ws, id || undefined);
            });
            return;
        }
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
    }
    catch (e) {
        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        socket.destroy();
    }
});
server.listen(PORT, () => {
    console.log(`Backend listening on ${PORT}`);
    console.log(`If you built the frontend, static dir: ${staticDir}`);
});
