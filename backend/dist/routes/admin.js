"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const keyService = __importStar(require("../services/keyService"));
const router = express_1.default.Router();
const ADMIN_SECRET = process.env.AGENT_DEFAULT_SECRET || 'SUPERSECRET1234';
function checkAdmin(req) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    return token === ADMIN_SECRET;
}
router.post('/keys', (req, res) => {
    if (!checkAdmin(req))
        return res.status(401).json({ error: 'unauthorized' });
    const { agentId, days } = req.body;
    if (!agentId)
        return res.status(400).json({ error: 'agentId required' });
    const key = keyService.createKey(agentId, days ?? 7);
    res.json(key);
});
router.get('/keys', (req, res) => {
    if (!checkAdmin(req))
        return res.status(401).json({ error: 'unauthorized' });
    const list = keyService.listKeys();
    res.json(list);
});
router.post('/keys/:key/disable', (req, res) => {
    if (!checkAdmin(req))
        return res.status(401).json({ error: 'unauthorized' });
    const key = req.params.key;
    keyService.disableKey(key);
    res.json({ ok: true });
});
exports.default = router;
