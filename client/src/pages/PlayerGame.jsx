import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../socket.js';
import { useGame } from '../context/GameContext.jsx';
import Timer from '../components/Timer.jsx';
import Header from '../components/Header.jsx';
import SocialFollow from '../components/SocialFollow.jsx';
import { cardVariants, optionContainerVariants, optionItemVariants } from '../motion.js';

const OPTION_COLORS = ['var(--opt-0)', 'var(--opt-1)', 'var(--opt-2)', 'var(--opt-3)'];
const OPTION_TEXT = ['#ffffff', '#0f2f66', '#ffffff', '#0f2f66'];
const OPTION_SHAPES = ['shape-triangle', 'shape-diamond', 'shape-circle', 'shape-square'];

export default function PlayerGame() {
  const navigate = useNavigate();
  const { playerName, code } = useGame();
  const [phase, setPhase] = useState('waiting');
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [finalBoard, setFinalBoard] = useState(null);

  useEffect(() => {
    if (!code) {
      navigate('/join');
      return;
    }
  }, [code, navigate]);

  useEffect(() => {
    function onQuestion(q) {
      setQuestion(q);
      setSelected(null);
      setResult(null);
      setPhase('question');
    }
    function onResult(r) {
      setResult(r);
      setPhase('result');
    }
    function onFinal(f) {
      setFinalBoard(f.leaderboard);
      setPhase('final');
    }
    function onHostLeft() {
      navigate('/');
    }

    socket.on('game:question', onQuestion);
    socket.on('player:result', onResult);
    socket.on('game:final', onFinal);
    socket.on('game:hostLeft', onHostLeft);

    return () => {
      socket.off('game:question', onQuestion);
      socket.off('player:result', onResult);
      socket.off('game:final', onFinal);
      socket.off('game:hostLeft', onHostLeft);
    };
  }, [navigate]);

  function answer(optionIndex) {
    if (selected !== null) return;
    setSelected(optionIndex);
    socket.emit('player:answer', { optionIndex });
  }

  const myRank = finalBoard?.findIndex((p) => p.name === playerName);

  return (
    <div className="screen">
      <Header />
      <AnimatePresence mode="wait">
        {phase === 'waiting' && (
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            key="waiting"
            className="card"
            style={{ textAlign: 'center' }}
          >
            <h2>¡Hola, {playerName}! 👋</h2>
            <p className="subtitle">Estás dentro. Espera a que el anfitrión inicie el juego…</p>
          </motion.div>
        )}

        {phase === 'question' && question && (
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            key={`q-${question.index}`}
            style={{ width: '100%', maxWidth: 420 }}
          >
            <p className="subtitle" style={{ textAlign: 'center' }}>
              Pregunta {question.index + 1} de {question.total}
            </p>
            <h2 style={{ textAlign: 'center' }}>{question.text}</h2>
            <Timer duration={question.duration} questionIndex={question.index} />
            <motion.div variants={optionContainerVariants} initial="initial" animate="animate" className="stack">
              {question.options.map((opt, i) => (
                <motion.button
                  key={i}
                  variants={optionItemVariants}
                  className="option-btn"
                  style={{
                    background: OPTION_COLORS[i],
                    color: OPTION_TEXT[i],
                    opacity: selected === null || selected === i ? 1 : 0.5,
                    outline: selected === i ? '3px solid var(--color-text)' : 'none',
                  }}
                  disabled={selected !== null}
                  onClick={() => answer(i)}
                  whileTap={{ scale: 0.95 }}
                >
                  <span
                    className={`option-shape ${OPTION_SHAPES[i]}`}
                    style={{ background: OPTION_TEXT[i], borderBottomColor: OPTION_TEXT[i] }}
                  />
                  {opt}
                </motion.button>
              ))}
            </motion.div>
            {selected !== null && (
              <p className="subtitle" style={{ textAlign: 'center', marginTop: 12 }}>
                Respuesta enviada. Esperando a los demás…
              </p>
            )}
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            key="result"
            className="card"
            style={{ textAlign: 'center' }}
          >
            {result.answered ? (
              <>
                <h1 className={result.correct ? 'feedback-correct' : 'feedback-wrong'} style={{ fontSize: '2.2rem' }}>
                  {result.correct ? '¡Correcto! ✅' : 'Incorrecto ❌'}
                </h1>
                <p className="subtitle">+{result.pointsAwarded} puntos</p>
              </>
            ) : (
              <h1 style={{ fontSize: '1.6rem' }}>⏱️ No respondiste a tiempo</h1>
            )}
            <p style={{ fontWeight: 700, fontSize: '1.3rem' }}>Puntaje total: {result.totalScore}</p>
          </motion.div>
        )}

        {phase === 'final' && finalBoard && (
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            key="final"
            className="card"
            style={{ textAlign: 'center' }}
          >
            <h1 className="title-xl">🏁 ¡Juego terminado!</h1>
            {myRank >= 0 && (
              <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                Quedaste #{myRank + 1} con {finalBoard[myRank].score} pts
              </p>
            )}
            <SocialFollow />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
