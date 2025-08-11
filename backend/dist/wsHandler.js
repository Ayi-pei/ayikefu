"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUserConnect = handleUserConnect;
exports.handleAgentConnect = handleAgentConnect;
const ws_1 = require("ws");
const redisClient_1 = require("./redisClient");
const uuid_1 = require("uuid");
const socketPairs = new Map();
function safeSend(ws, data) {
    if (!ws || ws.readyState !== ws_1.WebSocket.OPEN)
        return;
    try {
        ws.send(JSON.stringify(data));
    }
    catch (e) { }
}
async function handleUserConnect(ws, userId) {
    const sessionId = userId || (0, uuid_1.v4)().slice(0, 8);
    const pair = socketPairs.get(sessionId) || {};
    pair.userSocket = ws;
    socketPairs.set(sessionId, pair);
    safeSend(ws, { type: 'welcome', id: sessionId });
    const historyKey = (0, redisClient_1.keyPrefix)('session', sessionId, 'history');
    const hist = await redisClient_1.redis.lrange(historyKey, 0, -1);
    // send in chronological order
    hist.forEach(h => safeSend(ws, JSON.parse(h)));
    ws.on('message', async (raw) => {
        let msg = null;
        try {
            msg = JSON.parse(raw.toString());
        }
        catch (e) {
            return;
        }
        if (msg.type === 'chat') {
            const payload = { type: 'chat', from: 'user', id: sessionId, text: msg.text, ts: Date.now() };
            await redisClient_1.redis.rpush(historyKey, JSON.stringify(payload));
            await redisClient_1.redis.ltrim(historyKey, -200, -1);
            const p = socketPairs.get(sessionId);
            if (p?.agentSocket)
                safeSend(p.agentSocket, payload);
        }
    });
    ws.on('close', () => {
        const p = socketPairs.get(sessionId);
        if (p) {
            p.userSocket = undefined;
            socketPairs.set(sessionId, p);
        }
    });
}
async function handleAgentConnect(ws, agentId) {
    ws.on('message', async (raw) => {
        let msg = null;
        try {
            msg = JSON.parse(raw.toString());
        }
        catch (e) {
            return;
        }
        if (msg.type === 'list') {
            const list = Array.from(socketPairs.keys()).map(k => ({ id: k, hasAgent: !!socketPairs.get(k)?.agentSocket }));
            safeSend(ws, { type: 'list', list });
        }
        else if (msg.type === 'join') {
            const sid = msg.id;
            const pair = socketPairs.get(sid) || {};
            pair.agentSocket = ws;
            socketPairs.set(sid, pair);
            const historyKey = (0, redisClient_1.keyPrefix)('session', sid, 'history');
            const histJson = await redisClient_1.redis.lrange(historyKey, 0, -1);
            const history = histJson.map(h => JSON.parse(h));
            safeSend(ws, { type: 'joined', id: sid, history });
            if (pair.userSocket)
                safeSend(pair.userSocket, { type: 'notice', text: '客服已接入', ts: Date.now() });
        }
        else if (msg.type === 'chat') {
            const sid = msg.id;
            const text = msg.text;
            const payload = { type: 'chat', from: 'agent', id: sid, text, ts: Date.now() };
            const historyKey = (0, redisClient_1.keyPrefix)('session', sid, 'history');
            await redisClient_1.redis.rpush(historyKey, JSON.stringify(payload));
            await redisClient_1.redis.ltrim(historyKey, -200, -1);
            const pair = socketPairs.get(sid);
            if (pair?.userSocket)
                safeSend(pair.userSocket, payload);
        }
        else if (msg.type === 'leave') {
            const sid = msg.id;
            const pair = socketPairs.get(sid);
            if (pair) {
                pair.agentSocket = undefined;
                socketPairs.set(sid, pair);
                if (pair.userSocket)
                    safeSend(pair.userSocket, { type: 'notice', text: '客服已离开' });
            }
        }
    });
    ws.on('close', () => {
        for (const [sid, p] of socketPairs.entries()) {
            if (p.agentSocket === ws) {
                p.agentSocket = undefined;
                socketPairs.set(sid, p);
                if (p.userSocket)
                    safeSend(p.userSocket, { type: 'notice', text: '客服连接断开' });
            }
        }
    });
}
