import { randomUUID } from 'crypto';
import { db } from './db.js';
import { seedQuiz } from './seedData.js';

export async function loadQuizzes() {
  const quizzes = db.prepare('SELECT id, title FROM quizzes').all();
  const questionsStmt = db.prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY position ASC');

  return quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    questions: questionsStmt.all(quiz.id).map((row) => ({
      text: row.text,
      options: [row.option_0, row.option_1, row.option_2, row.option_3],
      correctIndex: row.correct_index,
      duration: row.duration,
    })),
  }));
}

export async function saveQuizzes(quizzes) {
  const insertQuiz = db.prepare('INSERT INTO quizzes (id, title) VALUES (?, ?)');
  const insertQuestion = db.prepare(`
    INSERT INTO questions (quiz_id, position, text, option_0, option_1, option_2, option_3, correct_index, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const replaceAll = db.transaction((quizzes) => {
    db.exec('DELETE FROM questions; DELETE FROM quizzes;');
    for (const quiz of quizzes) {
      insertQuiz.run(quiz.id, quiz.title);
      quiz.questions.forEach((q, i) => {
        insertQuestion.run(
          quiz.id,
          i,
          q.text,
          q.options[0],
          q.options[1],
          q.options[2],
          q.options[3],
          q.correctIndex,
          q.duration || 20
        );
      });
    }
  });

  replaceAll(quizzes);
}

export async function seedIfEmpty() {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM quizzes').get();
  if (count > 0) return;
  const insertQuiz = db.prepare('INSERT INTO quizzes (id, title) VALUES (?, ?)');
  const insertQuestion = db.prepare(`
    INSERT INTO questions (quiz_id, position, text, option_0, option_1, option_2, option_3, correct_index, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const id = randomUUID();
  insertQuiz.run(id, seedQuiz.title);
  seedQuiz.questions.forEach((q, i) => {
    insertQuestion.run(id, i, q.text, q.options[0], q.options[1], q.options[2], q.options[3], q.correctIndex, q.duration || 20);
  });
}
