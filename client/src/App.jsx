import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Home from './pages/Home.jsx';
import Admin from './pages/Admin.jsx';
import HostSetup from './pages/HostSetup.jsx';
import HostGame from './pages/HostGame.jsx';
import Join from './pages/Join.jsx';
import PlayerGame from './pages/PlayerGame.jsx';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div className="splash" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <motion.img
              src="/logo-merida.svg"
              alt="Mérida"
              className="splash-logo"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/host" element={<HostSetup />} />
        <Route path="/host/:code" element={<HostGame />} />
        <Route path="/join" element={<Join />} />
        <Route path="/join/:code" element={<Join />} />
        <Route path="/play" element={<PlayerGame />} />
      </Routes>
    </>
  );
}
