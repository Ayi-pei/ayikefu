import express from 'express';
import * as keyService from '../services/memoryKeyService';
import { requireAdmin } from '../auth';
const router = express.Router();

router.post('/keys', requireAdmin, (req, res) => {
  const { agentId, days } = req.body as { agentId: string; days?: number };
  if (!agentId) return res.status(400).json({ error: 'agentId required' });
  
  // Validate agentId format
  if (!/^[a-zA-Z0-9_-]+$/.test(agentId)) {
    return res.status(400).json({ error: 'Invalid agentId format. Only alphanumeric, underscore and dash allowed.' });
  }
  
  const key = keyService.createKey(agentId, days ?? 7);
  res.json(key);
});

router.get('/keys', requireAdmin, (req, res) => {
  const list = keyService.listKeys();
  res.json(list);
});

router.post('/keys/:key/disable', requireAdmin, (req, res) => {
  const key = req.params.key;
  
  // Validate key format
  if (!/^[A-F0-9]{16}$/.test(key)) {
    return res.status(400).json({ error: 'Invalid key format' });
  }
  
  keyService.disableKey(key);
  res.json({ ok: true });
});

export default router;