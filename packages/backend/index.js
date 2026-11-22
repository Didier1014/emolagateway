/**
 * Ponto de entrada do backend Express para Render.
 * 
 * Este arquivo:
 * - Importa o aplicativo Express configurado nas rotas
 * - Escuta na porta definida pela variável de ambiente PORT (fornecida pelo Render)
 * - Conecta ao Supabase usando as credenciais das env vars
 */

// Importar o aplicativo Express configurado com as rotas
const express = require('express');
const app = express();

// Middleware para parsear JSON body
app.use(express.json());

// Importar as rotas
const leadsRoutes = require('./routes/leads');
const emolaRoutes = require('./routes/emola');

// Usar as rotas prefixadas
app.use('/api/leads', leadsRoutes);
app.use('/api/emola', emolaRoutes);

// Define a porta - Render fornece essa variável de ambiente
const PORT = process.env.PORT || 3000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend em execução na porta ${PORT}`);
  console.log(`📚 Rotas disponíveis: /api/leads, /api/emola`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️ Porta ${PORT} em uso, tentar reiniciar`);
  } else {
    console.log(`❌ Erro ao iniciar servidor: ${err.message}`);
  }
});

// Exportar o app para que o Render possa gerenciá-lo
module.exports = app;
EOF