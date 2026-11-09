import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header.jsx';
import { popVariants } from '../motion.js';
import { useGame } from '../context/GameContext.jsx';

const emptyQuestion = () => ({
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  duration: 20,
});

export default function Admin() {
  const { adminToken, setAdminToken } = useGame();
  const [quizzes, setQuizzes] = useState([]);
  const [editing, setEditing] = useState(null); // quiz being edited, or null
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function authFetch(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${adminToken}` },
    });
    if (res.status === 401) {
      setAdminToken('');
      throw new Error('Sesión expirada');
    }
    return res;
  }

  const refresh = () =>
    authFetch('/api/quizzes')
      .then((r) => r.json())
      .then(setQuizzes)
      .catch(() => {});

  useEffect(() => {
    refresh();
  }, []);

  function newQuiz() {
    setEditing({ title: '', questions: [emptyQuestion()] });
    setError('');
  }

  function editQuiz(q) {
    setEditing(JSON.parse(JSON.stringify(q)));
    setError('');
  }

  async function deleteQuiz(id) {
    if (!confirm('¿Eliminar este quiz?')) return;
    await authFetch(`/api/quizzes/${id}`, { method: 'DELETE' }).catch(() => {});
    refresh();
  }

  function updateQuestion(idx, patch) {
    setEditing((prev) => {
      const questions = [...prev.questions];
      questions[idx] = { ...questions[idx], ...patch };
      return { ...prev, questions };
    });
  }

  function updateOption(qIdx, optIdx, value) {
    setEditing((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[qIdx].options];
      options[optIdx] = value;
      questions[qIdx] = { ...questions[qIdx], options };
      return { ...prev, questions };
    });
  }

  function addQuestion() {
    setEditing((prev) => ({ ...prev, questions: [...prev.questions, emptyQuestion()] }));
  }

  function removeQuestion(idx) {
    setEditing((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  }

  function validate(quiz) {
    if (!quiz.title.trim()) return 'Ponle un título al quiz';
    if (!quiz.questions.length) return 'Agrega al menos una pregunta';
    for (const q of quiz.questions) {
      if (!q.text.trim()) return 'Hay una pregunta sin texto';
      if (q.options.some((o) => !o.trim())) return 'Todas las preguntas necesitan 4 opciones';
      if (!q.duration || q.duration < 5) return 'El tiempo mínimo por pregunta es 5s';
    }
    return '';
  }

  async function save() {
    const err = validate(editing);
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError('');
    const method = editing.id ? 'PUT' : 'POST';
    const url = editing.id ? `/api/quizzes/${editing.id}` : '/api/quizzes';
    try {
      await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      setEditing(null);
      refresh();
    } catch {
      setError('Sesión expirada, vuelve a iniciar sesión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen" style={{ alignItems: 'stretch', justifyContent: 'flex-start' }}>
      <Header backTo="/" />

      <div style={{ maxWidth: 760, width: '100%', margin: '0 auto 40px' }}>
        <h1 className="title-xl" style={{ fontSize: '2rem' }}>
          Preguntas
        </h1>

        {!editing && (
          <>
            <button className="btn btn-primary" style={{ maxWidth: 220, marginBottom: 24 }} onClick={newQuiz}>
              + Nuevo quiz
            </button>
            <div className="stack">
              {quizzes.length === 0 && <p className="subtitle">Aún no tienes quizzes creados.</p>}
              {quizzes.map((q, i) => (
                <motion.div
                  key={q.id}
                  variants={popVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: i * 0.05 }}
                  className="card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 'none' }}
                >
                  <div>
                    <strong>{q.title}</strong>
                    <div className="subtitle" style={{ margin: 0 }}>
                      {q.questions.length} pregunta{q.questions.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => editQuiz(q)}>
                      Editar
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ width: 'auto', color: 'var(--color-danger)' }}
                      onClick={() => deleteQuiz(q.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="stack"
            >
              <input
                className="input"
                placeholder="Título del quiz"
                value={editing.title}
                onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))}
              />

              {editing.questions.map((q, qIdx) => (
                <div key={qIdx} className="card" style={{ maxWidth: 'none' }}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                    <strong>Pregunta {qIdx + 1}</strong>
                    {editing.questions.length > 1 && (
                      <button
                        className="btn btn-ghost"
                        style={{ width: 'auto', color: 'var(--color-danger)' }}
                        onClick={() => removeQuestion(qIdx)}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <textarea
                    className="input"
                    placeholder="Texto de la pregunta"
                    value={q.text}
                    onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
                  />
                  <div className="stack" style={{ marginTop: 12 }}>
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="row" style={{ gap: 8 }}>
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={q.correctIndex === optIdx}
                          onChange={() => updateQuestion(qIdx, { correctIndex: optIdx })}
                          title="Marcar como respuesta correcta"
                        />
                        <input
                          className="input"
                          placeholder={`Opción ${optIdx + 1}`}
                          value={opt}
                          onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label className="subtitle" style={{ display: 'block', marginBottom: 4 }}>
                      Tiempo (segundos)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      className="input"
                      value={q.duration}
                      onChange={(e) => updateQuestion(qIdx, { duration: Number(e.target.value) })}
                    />
                  </div>
                </div>
              ))}

              <button className="btn btn-outline" onClick={addQuestion}>
                + Agregar pregunta
              </button>

              {error && <p className="error-text">{error}</p>}

              <div className="row">
                <button className="btn btn-outline" onClick={() => setEditing(null)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" disabled={saving} onClick={save}>
                  {saving ? 'Guardando…' : 'Guardar quiz'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
