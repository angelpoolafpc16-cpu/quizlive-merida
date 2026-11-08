import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { socket } from '../socket.js';
import { useGame } from '../context/GameContext.jsx';

export default function HostSetup() {
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { setQuizMeta } = useGame();

  useEffect(() => {
    fetch('/api/quizzes')
      .then((r) => r.json())
      .then(setQuizzes);
  }, []);

  function createRoom(quizId) {
    setCreating(true);
    setError('');
    if (!socket.connected) socket.connect();
    socket.emit('host:createRoom', { quizId }, (res) => {
      setCreating(false);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setQuizMeta({ quizTitle: res.quizTitle, totalQuestions: res.totalQuestions });
      navigate(`/host/${res.code}`);
    });
  }

  return (
    <div className="screen">
      <div className="topbar">
        <Link to="/" className="link-back">
          ← Inicio
        </Link>
      </div>
      <div className="card">
        <h1 className="title-xl" style={{ fontSize: '1.8rem' }}>
          Elige un quiz
        </h1>
        {quizzes.length === 0 && (
          <p className="subtitle">
            No hay quizzes todavía. <Link to="/admin">Crea uno aquí</Link>.
          </p>
        )}
        <div className="stack">
          {quizzes.map((q) => (
            <button
              key={q.id}
              className="btn btn-outline"
              disabled={creating}
              onClick={() => createRoom(q.id)}
              style={{ justifyContent: 'space-between' }}
            >
              <span>{q.title}</span>
              <span className="subtitle" style={{ margin: 0 }}>
                {q.questions.length} preg.
              </span>
            </button>
          ))}
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
