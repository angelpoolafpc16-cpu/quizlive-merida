import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Admin from './pages/Admin.jsx';
import HostSetup from './pages/HostSetup.jsx';
import HostGame from './pages/HostGame.jsx';
import Join from './pages/Join.jsx';
import PlayerGame from './pages/PlayerGame.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/host" element={<HostSetup />} />
      <Route path="/host/:code" element={<HostGame />} />
      <Route path="/join" element={<Join />} />
      <Route path="/join/:code" element={<Join />} />
      <Route path="/play" element={<PlayerGame />} />
    </Routes>
  );
}
