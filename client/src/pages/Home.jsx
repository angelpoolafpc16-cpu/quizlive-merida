import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card"
        style={{ textAlign: 'center' }}
      >
        <h1 className="title-xl">QuizLive</h1>
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
