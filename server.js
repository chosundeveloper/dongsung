import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Proxy API requests to backend service
app.use('/api/', createProxyMiddleware({
  target: 'http://dongsung-backend:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/': '/api/'
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(503).json({ error: 'Backend service unavailable' });
  },
  logLevel: 'debug'
}));

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// SPA fallback - serve index.html for all non-file requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server is running on http://localhost:${PORT}`);
});
