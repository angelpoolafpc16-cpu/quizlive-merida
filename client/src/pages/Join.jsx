import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { socket } from '../socket.js';
import { useGame } from '../context/GameContext.jsx';

export default function Join() {
  const { code: codeFromUrl } = useParams();
  const navigate = useNavigate();
  const { setCode, setPlayerName } = useGame();
  const [code, setLocalCode] = useState(codeFromUrl || '');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setJoining(true);
    setError('');
    if (!socket.connected) socket.connect();
    socket.emit('player:join', { code: code.trim().toUpperCase(), name: name.trim() }, (res) => {
      setJoining(false);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setCode(res.code);
      setPlayerName(name.trim());
      navigate('/play');
    });
  }

  return (
    <div className="screen">
      <div className="topbar">
        <Link to="/" className="link-back">
          ← Inicio
        </Link>
      </div>
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="card stack"
      >
        <h1 className="title-xl" style={{ fontSize: '1.8rem' }}>
          Unirme al juego
        </h1>
        <input
          className="input"
          style={{ textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', fontWeight: 700 }}
          placeholder="CÓDIGO"
          maxLength={6}
          value={code}
          onChange={(e) => setLocalCode(e.target.value)}
        />
        <input
          className="input"
          placeholder="Tu nombre"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-secondary" type="submit" disabled={joining}>
          {joining ? 'Entrando…' : 'Entrar'}
        </button>
      </motion.form>
    </div>
  );
}
