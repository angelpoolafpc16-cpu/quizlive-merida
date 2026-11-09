import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../socket.js';
import Timer from '../components/Timer.jsx';
import Leaderboard from '../components/Leaderboard.jsx';
import Logo from '../components/Logo.jsx';
import Header from '../components/Header.jsx';
import SocialFollow from '../components/SocialFollow.jsx';
import { cardVariants, optionContainerVariants, optionItemVariants } from '../motion.js';
import { useGame } from '../context/GameContext.jsx';

const OPTION_COLORS = ['var(--opt-0)', 'var(--opt-1)', 'var(--opt-2)', 'var(--opt-3)'];
const OPTION_TEXT = ['#ffffff', '#0f2f66', '#ffffff', '#0f2f66'];
const OPTION_SHAPES = ['shape-triangle', 'shape-diamond', 'shape-circle', 'shape-square'];

export default function HostGame() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { hostToken } = useGame();
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
      setProgress((p) => ({ answered: 0, total: p.total }));
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
    function onConnect() {
      if (!code || !hostToken) return;
      socket.emit('host:rejoin', { code, hostToken }, (res) => {
        if (!res?.ok) return;
        setPlayers(res.players);
        setProgress((p) => ({ ...p, total: res.players.length }));
        setPhase(res.phase);
        if (res.question) setQuestion(res.question);
        if (res.results) setResults(res.results);
        if (res.final) setFinalBoard(res.final.leaderboard);
      });
    }

    socket.on('host:playerList', onPlayerList);
    socket.on('host:answerProgress', onAnswerProgress);
    socket.on('game:question', onQuestion);
    socket.on('host:questionResults', onResults);
    socket.on('game:final', onFinal);
    socket.on('game:hostLeft', onHostLeft);
    socket.on('connect', onConnect);

    return () => {
      socket.off('host:playerList', onPlayerList);
      socket.off('host:answerProgress', onAnswerProgress);
      socket.off('game:question', onQuestion);
      socket.off('host:questionResults', onResults);
      socket.off('game:final', onFinal);
      socket.off('game:hostLeft', onHostLeft);
      socket.off('connect', onConnect);
    };
  }, [navigate, code, hostToken]);

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
      <Header backTo="/" backLabel="← Salir" />

      <AnimatePresence>
        {phase === 'lobby' && (
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            key="lobby"
            className="card"
            style={{ textAlign: 'center', maxWidth: 640 }}
          >
            <div className="logo-badge">
              <Logo size={48} />
            </div>
            <h2 style={{ marginTop: 12 }}>Únete desde tu teléfono</h2>
            <div className="row" style={{ justifyContent: 'center', gap: 32, margin: '20px 0' }}>
              <div>
                <div className="badge-code">{code}</div>
                <p className="subtitle">Código de sala</p>
              </div>
              <div style={{ background: '#fff', padding: 12, borderRadius: 16, boxShadow: 'var(--shadow)' }}>
                <QRCodeSVG
                  value={joinUrl}
                  size={150}
                  fgColor="#0f2f66"
                  level="H"
                  imageSettings={{ src: '/logo-merida.svg', height: 30, width: 30, excavate: true }}
                />
                <p className="subtitle" style={{ margin: '8px 0 0', fontSize: '0.8rem' }}>
                  Escanea para unirte
                </p>
              </div>
            </div>
            <p className="subtitle" style={{ marginTop: -8, marginBottom: 20, fontSize: '0.85rem' }}>
              Entra en <strong>{window.location.host}</strong> y escribe el código
            </p>
            <div className="row" style={{ marginBottom: 12 }}>
              {players.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14 }}
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
            variants={cardVariants}
            initial="initial"
            animate="animate"
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
            <motion.div
              variants={optionContainerVariants}
              initial="initial"
              animate="animate"
              className="options-grid"
              style={{ margin: '16px auto 0' }}
            >
              {question.options.map((opt, i) => (
                <motion.div
                  key={i}
                  variants={optionItemVariants}
                  className="option-btn"
                  style={{ background: OPTION_COLORS[i], color: OPTION_TEXT[i] }}
                >
                  <span
                    className={`option-shape ${OPTION_SHAPES[i]}`}
                    style={{ background: OPTION_TEXT[i], borderBottomColor: OPTION_TEXT[i] }}
                  />
                  {opt}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {phase === 'reveal' && results && (
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            key={`r-${results.index}`}
            style={{ width: '100%', maxWidth: 820, textAlign: 'center' }}
          >
            <h2 style={{ marginTop: 0 }}>Respuesta correcta</h2>
            <motion.div
              variants={optionContainerVariants}
              initial="initial"
              animate="animate"
              className="options-grid"
              style={{ margin: '0 auto 28px' }}
            >
              {results.options.map((opt, i) => (
                <motion.div
                  key={i}
                  variants={optionItemVariants}
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
                </motion.div>
              ))}
            </motion.div>
            <h3>Marcador</h3>
            <Leaderboard entries={results.leaderboard} />
            <button className="btn btn-primary" onClick={next} style={{ marginTop: 24, maxWidth: 280 }}>
              {isLast ? 'Ver resultados finales' : 'Siguiente pregunta'}
            </button>
          </motion.div>
        )}

        {phase === 'final' && finalBoard && (
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            key="final"
            style={{ textAlign: 'center' }}
          >
            <h1 className="title-xl">🏆 Resultados finales</h1>
            <Leaderboard entries={finalBoard} />
            <SocialFollow />
            <button className="btn btn-outline" onClick={() => navigate('/')} style={{ marginTop: 12, maxWidth: 280 }}>
              Volver al inicio
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
