import { createServer as createViteServer } from 'vite';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './api/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false, // HMR WebSocket is disabled in AI Studio environment
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoxArabic AI Studio Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server start error:', err);
  process.exit(1);
});
