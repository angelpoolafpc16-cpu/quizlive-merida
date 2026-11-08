import { loadQuizzes } from './store.js';

const MAX_PLAYERS = 10;
const DEFAULT_DURATION = 20; // seconds
const MAX_POINTS = 1000;

function computePoints(correct, timeMs, durationMs) {
  if (!correct) return 0;
  const ratio = Math.max(0, 1 - timeMs / durationMs);
  return Math.round(MAX_POINTS * (0.5 + 0.5 * ratio)); // 500 - 1000
}

function serializePlayers(room) {
  return [...room.players.values()].map((p) => ({ id: p.id, name: p.name, score: p.score }));
}

function shuffled(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createGameManager(io, generateCode) {
  const rooms = new Map();

  function uniqueCode() {
    let code;
    do {
      code = generateCode();
    } while (rooms.has(code));
    return code;
  }

  function startQuestion(room, index) {
    clearTimeout(room.questionTimer);
    room.currentIndex = index;
    room.state = 'question';
    const question = room.quiz.questions[index];
    const duration = question.duration || DEFAULT_DURATION;
    room.questionStartedAt = Date.now();
    room.answers.set(index, new Map());

    io.to(room.code).emit('game:question', {
      index,
      total: room.quiz.questions.length,
      text: question.text,
      options: question.options,
      duration,
    });

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

    for (const [socketId, player] of room.players) {
      const a = answersForQ.get(socketId);
      io.to(socketId).emit('player:result', {
        answered: !!a,
        correct: a ? a.correct : false,
        pointsAwarded: a ? a.points : 0,
        totalScore: player.score,
        correctIndex: question.correctIndex,
      });
    }

    const leaderboard = serializePlayers(room).sort((a, b) => b.score - a.score);

    io.to(room.hostSocketId).emit('host:questionResults', {
      index: qIndex,
      correctIndex: question.correctIndex,
      options: question.options,
      distribution,
      leaderboard,
    });
  }

  function registerSocket(socket) {
    socket.on('host:createRoom', async ({ quizId }, cb) => {
      const quizzes = await loadQuizzes();
      const quiz = quizzes.find((q) => q.id === quizId);
      if (!quiz || !quiz.questions?.length) {
        return cb?.({ error: 'Quiz no encontrado o sin preguntas' });
      }
      const code = uniqueCode();
      const room = {
        code,
        quiz,
        hostSocketId: socket.id,
        players: new Map(),
        state: 'lobby',
        currentIndex: -1,
        questionTimer: null,
        questionStartedAt: 0,
        answers: new Map(),
      };
      rooms.set(code, room);
      socket.data.role = 'host';
      socket.data.roomCode = code;
      socket.join(code);
      cb?.({ code, quizTitle: quiz.title, totalQuestions: quiz.questions.length });
    });

    socket.on('player:join', ({ code, name }, cb) => {
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

      room.players.set(socket.id, { id: socket.id, name: cleanName, score: 0 });
      socket.data.role = 'player';
      socket.data.roomCode = room.code;
      socket.join(room.code);

      io.to(room.hostSocketId).emit('host:playerList', serializePlayers(room));
      cb?.({ ok: true, code: room.code });
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
      const qIndex = room.currentIndex;
      const answersForQ = room.answers.get(qIndex);
      if (!answersForQ || answersForQ.has(socket.id)) return;

      const question = room.quiz.questions[qIndex];
      const duration = (question.duration || DEFAULT_DURATION) * 1000;
      const timeMs = Date.now() - room.questionStartedAt;
      const correct = optionIndex === question.correctIndex;
      const points = computePoints(correct, timeMs, duration);

      answersForQ.set(socket.id, { optionIndex, timeMs, correct, points });
      const player = room.players.get(socket.id);
      if (player) player.score += points;

      io.to(room.hostSocketId).emit('host:answerProgress', {
        answered: answersForQ.size,
        total: room.players.size,
      });

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
        io.to(room.code).emit('game:final', { leaderboard: finalBoard });
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

      if (socket.data.role === 'host') {
        clearTimeout(room.questionTimer);
        io.to(code).emit('game:hostLeft');
        rooms.delete(code);
      } else if (socket.data.role === 'player') {
        room.players.delete(socket.id);
        io.to(room.hostSocketId).emit('host:playerList', serializePlayers(room));
      }
    });
  }

  return { registerSocket };
}
