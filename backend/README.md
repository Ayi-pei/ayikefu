# Backend - no-register-chat-backend

������
1. ���� .env.example -> .env ���޸�
2. ��Ҫ Redis ���ã����ػ��ⲿ��

���ص��ԣ�
- ��װ������npm install
- ������npm run dev

���ɿ��ܣ�
curl -X POST http://localhost:3001/admin/keys -H "Authorization: Bearer SUPERSECRET1234" -H "Content-Type: application/json" -d '{"agentId":"AGENT001","days":7}'
