import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
const app = express();
const port = process.env.PORT || 7067;
 
// Middleware para parse JSON
app.use(express.json());
 
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