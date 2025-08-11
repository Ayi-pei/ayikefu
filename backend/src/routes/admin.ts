import express from 'express';
import * as keyService from '../services/keyService';
const router = express.Router();

const ADMIN_SECRET = process.env.AGENT_DEFAULT_SECRET || 'SUPERSECRET1234';
function checkAdmin(req: express.Request) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  return token === ADMIN_SECRET;
}

router.post('/keys', (req, res) => {
  if (!checkAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
  const { agentId, days } = req.body as { agentId: string; days?: number };
  if (!agentId) return res.status(400).json({ error: 'agentId required' });
  const key = keyService.createKey(agentId, days ?? 7);
  res.json(key);
});

router.get('/keys', (req, res) => {
  if (!checkAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
  const list = keyService.listKeys();
  res.json(list);
});

router.post('/keys/:key/disable', (req, res) => {
  if (!checkAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
  const key = req.params.key;
  keyService.disableKey(key);
  res.json({ ok: true });
});

export default router;
