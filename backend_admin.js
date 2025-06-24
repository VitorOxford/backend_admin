require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Use variáveis de ambiente para proteger sua service key 
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware simples de autenticação (troque por algo mais seguro em produção)
function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// Listar usuários
app.get('/api/users', authMiddleware, async (req, res) => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Deletar usuário
app.delete('/api/users/:id', authMiddleware, async (req, res) => {
    const userId = req.params.id;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// Health check
app.get('/', (req, res) => res.send('Admin backend running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Admin backend running on port ${PORT}`));
