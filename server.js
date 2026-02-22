import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
const app = express();
const port = process.env.PORT || 7067;
 
// Middleware para parse JSON
app.use(express.json());
 

const cteDataPath = path.join(__dirname, 'src', 'data', 'cte_data.json');

app.get('/api/cte-data-metadata', (_req, res) => {
  fs.stat(cteDataPath, (err, stats) => {
    if (err) {
      res.status(500).json({ error: 'Não foi possível obter metadados do arquivo cte_data.json.' });
      return;
    }

    res.json({
      arquivo: 'cte_data.json',
      criadoEm: stats.birthtime?.toISOString?.() || null,
      atualizadoEm: stats.mtime?.toISOString?.() || null
    });
  });
});

// Servir arquivos estáticos do build do Vite
app.use(express.static(path.join(__dirname, 'dist')));
 
// Rota catch-all para SPA (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
 
// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
