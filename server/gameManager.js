import { randomUUID } from 'crypto';
import { loadQuizzes } from './store.js';

const MAX_PLAYERS = 10;
const DEFAULT_DURATION = 20; // seconds
const MAX_POINTS = 1000;
const GRACE_MS = 25000; // time allowed to reconnect before treating a drop as final

function computePoints(correct, timeMs, durationMs) {
  if (!correct) return 0;
  const ratio = Math.max(0, 1 - timeMs / durationMs);
  return Math.round(MAX_POINTS * (0.5 + 0.5 * ratio)); // 500 - 1000
}

function serializePlayers(room) {
  return [...room.players.values()].map((p) => ({
    id: p.id,
    name: p.name,
    score: p.score,
    connected: !!p.socketId,
  }));
}

function shuffled(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createGameManager(io, generateCode, adminTokens) {
  const rooms = new Map();

  function uniqueCode() {
    let code;
    do {
      code = generateCode();
    } while (rooms.has(code));
    return code;
  }

  function questionSnapshot(room) {
    if (room.state !== 'question' || !room.lastQuestionPayload) return room.lastQuestionPayload;
    const question = room.quiz.questions[room.currentIndex];
    const totalMs = (question.duration || DEFAULT_DURATION) * 1000;
    const elapsed = Date.now() - room.questionStartedAt;
    const remainingSec = Math.max(1, Math.ceil((totalMs - elapsed) / 1000));
    return { ...room.lastQuestionPayload, duration: remainingSec };
  }

  function startQuestion(room, index) {
    clearTimeout(room.questionTimer);
    room.currentIndex = index;
    room.state = 'question';
    const question = room.quiz.questions[index];
    const duration = question.duration || DEFAULT_DURATION;
    room.questionStartedAt = Date.now();
    room.answers.set(index, new Map());

    const payload = {
      index,
      total: room.quiz.questions.length,
      text: question.text,
      options: question.options,
      duration,
    };
    room.lastQuestionPayload = payload;
    room.lastResultsPayload = null;

    io.to(room.code).emit('game:question', payload);
    room.questionTimer = setTimeout(() => endQuestion(room), duration * 1000);
  }

  function endQuestion(room) {
    if (room.state !== 'question') return;
    clearTimeout(room.questionTimer);
    room.state = 'reveal';
    const qIndex = room.currentIndex;
    const question = room.quiz.questions[qIndex];
    const answersForQ = room.answers.get(qIndex);

    const distribution = question.options.map(() => 0);
    for (const a of answersForQ.values()) distribution[a.optionIndex]++;

    for (const player of room.players.values()) {
      const a = answersForQ.get(player.id);
      const payload = {
        answered: !!a,
        correct: a ? a.correct : false,
        pointsAwarded: a ? a.points : 0,
        totalScore: player.score,
        correctIndex: question.correctIndex,
      };
      player.lastResult = payload;
      if (player.socketId) io.to(player.socketId).emit('player:result', payload);
    }

    const leaderboard = serializePlayers(room).sort((a, b) => b.score - a.score);
    const hostPayload = {
      index: qIndex,
      correctIndex: question.correctIndex,
      options: question.options,
      distribution,
      leaderboard,
    };
    room.lastResultsPayload = hostPayload;
    if (room.hostSocketId) io.to(room.hostSocketId).emit('host:questionResults', hostPayload);
  }

  function registerSocket(socket) {
    socket.on('host:createRoom', async ({ quizId, adminToken }, cb) => {
      if (!adminToken || !adminTokens.has(adminToken)) {
        return cb?.({ error: 'No autorizado' });
      }
      const quizzes = await loadQuizzes();
      const quiz = quizzes.find((q) => q.id === quizId);
      if (!quiz || !quiz.questions?.length) {
        return cb?.({ error: 'Quiz no encontrado o sin preguntas' });
      }
      const code = uniqueCode();
      const hostToken = randomUUID();
      const room = {
        code,
        quiz,
        hostSocketId: socket.id,
        hostToken,
        hostGraceTimer: null,
        players: new Map(),
        state: 'lobby',
        currentIndex: -1,
        questionTimer: null,
        questionStartedAt: 0,
        answers: new Map(),
        lastQuestionPayload: null,
        lastResultsPayload: null,
        finalPayload: null,
      };
      rooms.set(code, room);
      socket.data.role = 'host';
      socket.data.roomCode = code;
      socket.join(code);
      cb?.({ code, quizTitle: quiz.title, totalQuestions: quiz.questions.length, hostToken });
    });

    socket.on('host:rejoin', ({ code, hostToken }, cb) => {
      const room = rooms.get((code || '').toUpperCase());
      if (!room || room.hostToken !== hostToken) return cb?.({ error: 'No autorizado' });
      clearTimeout(room.hostGraceTimer);
      room.hostGraceTimer = null;
      room.hostSocketId = socket.id;
      socket.data.role = 'host';
      socket.data.roomCode = room.code;
      socket.join(room.code);
      cb?.({
        ok: true,
        phase: room.state,
        players: serializePlayers(room),
        question: questionSnapshot(room),
        results: room.lastResultsPayload,
        final: room.finalPayload,
      });
    });

    socket.on('player:join', ({ code, name, playerId }, cb) => {
      const room = rooms.get((code || '').toUpperCase());
      if (!room) return cb?.({ error: 'Código de sala inválido' });
      if (room.state !== 'lobby') return cb?.({ error: 'El juego ya comenzó' });
      if (room.players.size >= MAX_PLAYERS) return cb?.({ error: 'La sala está llena (máx. 10)' });
      const cleanName = (name || '').trim().slice(0, 20);
      if (!cleanName) return cb?.({ error: 'Ingresa un nombre' });
      const nameTaken = [...room.players.values()].some(
        (p) => p.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (nameTaken) return cb?.({ error: 'Ese nombre ya está en uso' });

      const id = playerId || randomUUID();
      room.players.set(id, {
        id,
        name: cleanName,
        score: 0,
        socketId: socket.id,
        graceTimer: null,
        lastResult: null,
      });
      socket.data.role = 'player';
      socket.data.roomCode = room.code;
      socket.data.playerId = id;
      socket.join(room.code);

      if (room.hostSocketId) io.to(room.hostSocketId).emit('host:playerList', serializePlayers(room));
      cb?.({ ok: true, code: room.code, playerId: id });
    });

    socket.on('player:rejoin', ({ code, playerId }, cb) => {
      const room = rooms.get((code || '').toUpperCase());
      if (!room) return cb?.({ error: 'Código de sala inválido' });
      const player = room.players.get(playerId);
      if (!player) return cb?.({ error: 'No se encontró tu sesión' });
      clearTimeout(player.graceTimer);
      player.graceTimer = null;
      player.socketId = socket.id;
      socket.data.role = 'player';
      socket.data.roomCode = room.code;
      socket.data.playerId = playerId;
      socket.join(room.code);

      if (room.hostSocketId) io.to(room.hostSocketId).emit('host:playerList', serializePlayers(room));
      cb?.({
        ok: true,
        name: player.name,
        phase: room.state,
        question: questionSnapshot(room),
        result: player.lastResult,
        final: room.finalPayload,
        totalScore: player.score,
        answered: room.state === 'question' ? !!room.answers.get(room.currentIndex)?.has(playerId) : false,
      });
    });

    socket.on('host:start', () => {
      const room = rooms.get(socket.data.roomCode);
      if (!room || socket.id !== room.hostSocketId) return;
      if (room.players.size === 0) return;
      room.quiz = { ...room.quiz, questions: shuffled(room.quiz.questions) };
      startQuestion(room, 0);
    });

    socket.on('player:answer', ({ optionIndex }) => {
      const room = rooms.get(socket.data.roomCode);
      if (!room || room.state !== 'question') return;
      const playerId = socket.data.playerId;
      const qIndex = room.currentIndex;
      const answersForQ = room.answers.get(qIndex);
      if (!answersForQ || answersForQ.has(playerId)) return;

      const question = room.quiz.questions[qIndex];
      const duration = (question.duration || DEFAULT_DURATION) * 1000;
      const timeMs = Date.now() - room.questionStartedAt;
      const correct = optionIndex === question.correctIndex;
      const points = computePoints(correct, timeMs, duration);

      answersForQ.set(playerId, { optionIndex, timeMs, correct, points });
      const player = room.players.get(playerId);
      if (player) player.score += points;

      if (room.hostSocketId) {
        io.to(room.hostSocketId).emit('host:answerProgress', {
          answered: answersForQ.size,
          total: room.players.size,
        });
      }

      if (answersForQ.size === room.players.size) {
        endQuestion(room);
      }
    });

    socket.on('host:next', () => {
      const room = rooms.get(socket.data.roomCode);
      if (!room || socket.id !== room.hostSocketId) return;
      const nextIndex = room.currentIndex + 1;
      if (nextIndex >= room.quiz.questions.length) {
        room.state = 'final';
        const finalBoard = serializePlayers(room).sort((a, b) => b.score - a.score);
        const payload = { leaderboard: finalBoard };
        room.finalPayload = payload;
        io.to(room.code).emit('game:final', payload);
        setTimeout(() => rooms.delete(room.code), 5 * 60 * 1000);
      } else {
        startQuestion(room, nextIndex);
      }
    });

    socket.on('disconnect', () => {
      const code = socket.data.roomCode;
      if (!code) return;
      const room = rooms.get(code);
      if (!room) return;

      if (socket.data.role === 'host' && socket.id === room.hostSocketId) {
        room.hostSocketId = null;
        room.hostGraceTimer = setTimeout(() => {
          io.to(code).emit('game:hostLeft');
          clearTimeout(room.questionTimer);
          rooms.delete(code);
        }, GRACE_MS);
      } else if (socket.data.role === 'player') {
        const player = room.players.get(socket.data.playerId);
        if (player && player.socketId === socket.id) {
          player.socketId = null;
          player.graceTimer = setTimeout(() => {
            room.players.delete(player.id);
            if (room.hostSocketId) io.to(room.hostSocketId).emit('host:playerList', serializePlayers(room));
          }, GRACE_MS);
          if (room.hostSocketId) io.to(room.hostSocketId).emit('host:playerList', serializePlayers(room));
        }
      }
    });
  }

  return { registerSocket };
}
