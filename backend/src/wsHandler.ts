import { WebSocket } from 'ws';
import { redis, keyPrefix } from './redisClient';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from './types';

type SocketPair = { userSocket?: WebSocket; agentSocket?: WebSocket };
const socketPairs = new Map<string, SocketPair>();

function safeSend(ws?: WebSocket, data?: any) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try { ws.send(JSON.stringify(data)); } catch (e) {}
}

export async function handleUserConnect(ws: WebSocket, userId?: string) {
  const sessionId = userId || uuidv4().slice(0, 8);
  const pair = socketPairs.get(sessionId) || {};
  pair.userSocket = ws;
  socketPairs.set(sessionId, pair);

  safeSend(ws, { type: 'welcome', id: sessionId } as ChatMessage);

  const historyKey = keyPrefix('session', sessionId, 'history');
  const hist = await redis.lrange(historyKey, 0, -1);
  // send in chronological order
  hist.forEach(h => safeSend(ws, JSON.parse(h)));

  ws.on('message', async (raw) => {
    let msg: any = null;
    try { msg = JSON.parse(raw.toString()); } catch (e) { return; }
    if (msg.type === 'chat') {
      const payload: ChatMessage = { type: 'chat', from: 'user', id: sessionId, text: msg.text, ts: Date.now() };
      await redis.rpush(historyKey, JSON.stringify(payload));
      await redis.ltrim(historyKey, -200, -1);
      const p = socketPairs.get(sessionId);
      if (p?.agentSocket) safeSend(p.agentSocket, payload);
    }
  });

  ws.on('close', () => {
    const p = socketPairs.get(sessionId);
    if (p) { p.userSocket = undefined; socketPairs.set(sessionId, p); }
  });
}

export async function handleAgentConnect(ws: WebSocket, agentId: string) {
  ws.on('message', async (raw) => {
    let msg: any = null;
    try { msg = JSON.parse(raw.toString()); } catch (e) { return; }
    if (msg.type === 'list') {
      const list = Array.from(socketPairs.keys()).map(k => ({ id: k, hasAgent: !!socketPairs.get(k)?.agentSocket }));
      safeSend(ws, { type: 'list', list } as ChatMessage);
    } else if (msg.type === 'join') {
      const sid = msg.id as string;
      const pair = socketPairs.get(sid) || {};
      pair.agentSocket = ws;
      socketPairs.set(sid, pair);
      const historyKey = keyPrefix('session', sid, 'history');
      const histJson = await redis.lrange(historyKey, 0, -1);
      const history = histJson.map(h => JSON.parse(h));
      safeSend(ws, { type: 'joined', id: sid, history } as ChatMessage);
      if (pair.userSocket) safeSend(pair.userSocket, { type: 'notice', text: '客服已接入', ts: Date.now() } as ChatMessage);
    } else if (msg.type === 'chat') {
      const sid = msg.id as string;
      const text = msg.text as string;
      const payload: ChatMessage = { type: 'chat', from: 'agent', id: sid, text, ts: Date.now() };
      const historyKey = keyPrefix('session', sid, 'history');
      await redis.rpush(historyKey, JSON.stringify(payload));
      await redis.ltrim(historyKey, -200, -1);
      const pair = socketPairs.get(sid);
      if (pair?.userSocket) safeSend(pair.userSocket, payload);
    } else if (msg.type === 'leave') {
      const sid = msg.id as string;
      const pair = socketPairs.get(sid);
      if (pair) { pair.agentSocket = undefined; socketPairs.set(sid, pair); if (pair.userSocket) safeSend(pair.userSocket, { type: 'notice', text: '客服已离开' }); }
    }
  });

  ws.on('close', () => {
    for (const [sid, p] of socketPairs.entries()) {
      if (p.agentSocket === ws) { p.agentSocket = undefined; socketPairs.set(sid, p); if (p.userSocket) safeSend(p.userSocket, { type: 'notice', text: '客服连接断开' }); }
    }
  });
}
