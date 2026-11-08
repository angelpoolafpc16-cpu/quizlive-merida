import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { customAlphabet } from 'nanoid';
import { randomUUID } from 'crypto';
import { loadQuizzes, saveQuizzes } from './store.js';
import { createGameManager } from './gameManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

// ---- Quiz REST API ----
app.get('/api/quizzes', async (req, res) => {
  res.json(await loadQuizzes());
});

app.post('/api/quizzes', async (req, res) => {
  const quizzes = await loadQuizzes();
  const quiz = {
    id: randomUUID(),
    title: req.body.title || 'Sin título',
    questions: req.body.questions || [],
  };
  quizzes.push(quiz);
  await saveQuizzes(quizzes);
  res.json(quiz);
});

app.put('/api/quizzes/:id', async (req, res) => {
  const quizzes = await loadQuizzes();
  const idx = quizzes.findIndex((q) => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  quizzes[idx] = { ...quizzes[idx], ...req.body, id: quizzes[idx].id };
  await saveQuizzes(quizzes);
  res.json(quizzes[idx]);
});

app.delete('/api/quizzes/:id', async (req, res) => {
  let quizzes = await loadQuizzes();
  quizzes = quizzes.filter((q) => q.id !== req.params.id);
  await saveQuizzes(quizzes);
  res.json({ ok: true });
});

const gameManager = createGameManager(io, generateCode);
io.on('connection', (socket) => gameManager.registerSocket(socket));

// ---- Serve built client (production) ----
const clientDist = path.join(__dirname, '../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
