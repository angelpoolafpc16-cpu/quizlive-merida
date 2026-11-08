import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../socket.js';
import Timer from '../components/Timer.jsx';
import Leaderboard from '../components/Leaderboard.jsx';
import Logo from '../components/Logo.jsx';

const OPTION_COLORS = ['var(--opt-0)', 'var(--opt-1)', 'var(--opt-2)', 'var(--opt-3)'];
const OPTION_TEXT = ['#ffffff', '#0f2f66', '#ffffff', '#0f2f66'];
const OPTION_SHAPES = ['shape-triangle', 'shape-diamond', 'shape-circle', 'shape-square'];
const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

export default function HostGame() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [phase, setPhase] = useState('lobby');
  const [question, setQuestion] = useState(null);
  const [progress, setProgress] = useState({ answered: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [finalBoard, setFinalBoard] = useState(null);

  useEffect(() => {
    function onPlayerList(list) {
      setPlayers(list);
      setProgress((p) => ({ ...p, total: list.length }));
    }
    function onAnswerProgress(p) {
      setProgress(p);
    }
    function onQuestion(q) {
      setQuestion(q);
      setResults(null);
      setPhase('question');
    }
    function onResults(r) {
      setResults(r);
      setPhase('reveal');
    }
    function onFinal(f) {
      setFinalBoard(f.leaderboard);
      setPhase('final');
    }
    function onHostLeft() {
      navigate('/');
    }

    socket.on('host:playerList', onPlayerList);
    socket.on('host:answerProgress', onAnswerProgress);
    socket.on('game:question', onQuestion);
    socket.on('host:questionResults', onResults);
    socket.on('game:final', onFinal);
    socket.on('game:hostLeft', onHostLeft);

    return () => {
      socket.off('host:playerList', onPlayerList);
      socket.off('host:answerProgress', onAnswerProgress);
      socket.off('game:question', onQuestion);
      socket.off('host:questionResults', onResults);
      socket.off('game:final', onFinal);
      socket.off('game:hostLeft', onHostLeft);
    };
  }, [navigate]);

  const joinUrl = `${window.location.origin}/join/${code}`;
  const isLast = question && results && question.index + 1 >= question.total;

  function start() {
    socket.emit('host:start');
  }
  function next() {
    socket.emit('host:next');
  }

  return (
    <div className="screen">
      <div className="topbar">
        <Link to="/" className="link-back">
          ← Salir
        </Link>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'lobby' && (
          <motion.div {...fade} key="lobby" className="card" style={{ textAlign: 'center', maxWidth: 640 }}>
            <Logo size={64} />
            <h2 style={{ marginTop: 12 }}>Únete desde tu teléfono</h2>
            <div className="row" style={{ justifyContent: 'center', gap: 32, margin: '20px 0' }}>
              <div>
                <div className="badge-code">{code}</div>
                <p className="subtitle">Código de sala</p>
              </div>
              <div style={{ background: '#fff', padding: 12, borderRadius: 16, boxShadow: 'var(--shadow)' }}>
                <QRCodeSVG value={joinUrl} size={150} fgColor="#0f2f66" />
              </div>
            </div>
            <div className="row" style={{ marginBottom: 12 }}>
              {players.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="player-chip"
                >
                  {p.name}
                </motion.span>
              ))}
              {players.length === 0 && <p className="subtitle">Esperando jugadores…</p>}
            </div>
            <p className="subtitle">{players.length}/10 jugadores conectados</p>
            <button className="btn btn-primary" disabled={players.length === 0} onClick={start}>
              Iniciar juego
            </button>
          </motion.div>
        )}

        {phase === 'question' && question && (
          <motion.div
            {...fade}
            key={`q-${question.index}`}
            style={{ width: '100%', maxWidth: 820, textAlign: 'center' }}
          >
            <p className="subtitle">
              Pregunta {question.index + 1} de {question.total}
            </p>
            <h2 style={{ fontSize: '1.8rem', marginTop: 0 }}>{question.text}</h2>
            <Timer duration={question.duration} questionIndex={question.index} />
            <p className="subtitle">
              {progress.answered}/{progress.total} respondieron
            </p>
            <div className="options-grid" style={{ margin: '16px auto 0' }}>
              {question.options.map((opt, i) => (
                <div
                  key={i}
                  className="option-btn"
                  style={{ background: OPTION_COLORS[i], color: OPTION_TEXT[i] }}
                >
                  <span
                    className={`option-shape ${OPTION_SHAPES[i]}`}
                    style={{ background: OPTION_TEXT[i], borderBottomColor: OPTION_TEXT[i] }}
                  />
                  {opt}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'reveal' && results && (
          <motion.div {...fade} key={`r-${results.index}`} style={{ width: '100%', maxWidth: 820, textAlign: 'center' }}>
            <h2 style={{ marginTop: 0 }}>Respuesta correcta</h2>
            <div className="options-grid" style={{ margin: '0 auto 28px' }}>
              {results.options.map((opt, i) => (
                <div
                  key={i}
                  className="option-btn"
                  style={{
                    background: OPTION_COLORS[i],
                    color: OPTION_TEXT[i],
                    opacity: i === results.correctIndex ? 1 : 0.4,
                  }}
                >
                  <span
                    className={`option-shape ${OPTION_SHAPES[i]}`}
                    style={{ background: OPTION_TEXT[i], borderBottomColor: OPTION_TEXT[i] }}
                  />
                  {opt} · {results.distribution[i]}
                </div>
              ))}
            </div>
            <h3>Marcador</h3>
            <Leaderboard entries={results.leaderboard} />
            <button className="btn btn-primary" onClick={next} style={{ marginTop: 24, maxWidth: 280 }}>
              {isLast ? 'Ver resultados finales' : 'Siguiente pregunta'}
            </button>
          </motion.div>
        )}

        {phase === 'final' && finalBoard && (
          <motion.div {...fade} key="final" style={{ textAlign: 'center' }}>
            <h1 className="title-xl">🏆 Resultados finales</h1>
            <Leaderboard entries={finalBoard} />
            <button className="btn btn-outline" onClick={() => navigate('/')} style={{ marginTop: 24, maxWidth: 280 }}>
              Volver al inicio
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
