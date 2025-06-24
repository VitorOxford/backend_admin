require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Use variáveis de ambiente para proteger sua service key 
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rota de login (autenticação segura) com debug
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    console.log('Tentativa de login:', email, senha);
    console.log('Esperado:', process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
    if (
        email === process.env.ADMIN_EMAIL &&
        senha === process.env.ADMIN_PASSWORD
    ) {
        // Gera token JWT válido por 2h
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '2h' });
        return res.json({ token });
    }
    res.status(401).json({ error: 'Credenciais inválidas' });
});

// Middleware JWT para proteger rotas
function jwtAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Token ausente' });
    const token = auth.split(' ')[1];
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
}

// Listar usuários (rota protegida)
app.get('/api/users', jwtAuth, async (req, res) => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Deletar usuário (rota protegida)
app.delete('/api/users/:id', jwtAuth, async (req, res) => {
    const userId = req.params.id;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// Health check
app.get('/', (req, res) => res.send('Admin backend running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Admin backend running on port ${PORT}`));
