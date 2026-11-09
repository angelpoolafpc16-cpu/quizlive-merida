import { createContext, useContext, useState } from 'react';

const GameContext = createContext(null);

const ADMIN_TOKEN_KEY = 'quizmid_admin_token';

function makeId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function GameProvider({ children }) {
  const [code, setCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId] = useState(makeId);
  const [hostToken, setHostToken] = useState('');
  const [quizMeta, setQuizMeta] = useState(null); // { quizTitle, totalQuestions }
  const [adminToken, setAdminTokenState] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) || '');

  function setAdminToken(token) {
    setAdminTokenState(token);
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  return (
    <GameContext.Provider
      value={{
        code,
        setCode,
        playerName,
        setPlayerName,
        playerId,
        hostToken,
        setHostToken,
        quizMeta,
        setQuizMeta,
        adminToken,
        setAdminToken,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame debe usarse dentro de GameProvider');
  return ctx;
}
