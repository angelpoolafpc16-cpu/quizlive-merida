import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header.jsx';
import { cardVariants } from '../motion.js';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <Header />
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        className="card"
        style={{ textAlign: 'center' }}
      >
        <h1 className="title-xl">QUIZ-MID</h1>
        <p className="subtitle">Crea quizzes en vivo y juega desde cualquier teléfono.</p>
        <div className="stack">
          <button className="btn btn-primary" onClick={() => navigate('/host')}>
            Soy anfitrión (proyectar)
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/join')}>
            Unirme a un juego
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/admin')}>
            Crear / editar preguntas
          </button>
        </div>
      </motion.div>
    </div>
  );
}
