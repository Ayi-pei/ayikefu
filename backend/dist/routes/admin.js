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
const keyService = __importStar(require("../services/memoryKeyService"));
const auth_1 = require("../auth");
const router = express_1.default.Router();
router.post('/keys', auth_1.requireAdmin, (req, res) => {
    const { agentId, days } = req.body;
    if (!agentId)
        return res.status(400).json({ error: 'agentId required' });
    // Validate agentId format
    if (!/^[a-zA-Z0-9_-]+$/.test(agentId)) {
        return res.status(400).json({ error: 'Invalid agentId format. Only alphanumeric, underscore and dash allowed.' });
    }
    const key = keyService.createKey(agentId, days ?? 7);
    res.json(key);
});
router.get('/keys', auth_1.requireAdmin, (req, res) => {
    const list = keyService.listKeys();
    res.json(list);
});
router.post('/keys/:key/disable', auth_1.requireAdmin, (req, res) => {
    const key = req.params.key;
    // Validate key format
    if (!/^[A-F0-9]{16}$/.test(key)) {
        return res.status(400).json({ error: 'Invalid key format' });
    }
    keyService.disableKey(key);
    res.json({ ok: true });
});
exports.default = router;
