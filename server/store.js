import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, 'data', 'quizzes.json');

export async function loadQuizzes() {
  try {
    const raw = await fs.readFile(FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveQuizzes(quizzes) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(quizzes, null, 2));
}
