import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext.jsx';
import { cardVariants } from '../motion.js';
import Header from './Header.jsx';

export default function AdminGate({ children }) {
  const { adminToken, setAdminToken } = useGame();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo iniciar sesión');
        return;
      }
      setAdminToken(data.token);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  if (adminToken) return children;

  return (
    <div className="screen">
      <Header backTo="/" />
      <motion.form
        variants={cardVariants}
        initial="initial"
        animate="animate"
        onSubmit={submit}
        className="card stack"
      >
        <h1 className="title-xl" style={{ fontSize: '1.6rem' }}>
          Acceso de administrador
        </h1>
        <p className="subtitle">Esta sección es solo para el equipo organizador.</p>
        <input
          className="input"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading || !password}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </motion.form>
    </div>
  );
}
