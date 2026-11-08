import { createContext, useContext, useState } from 'react';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [code, setCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [quizMeta, setQuizMeta] = useState(null); // { quizTitle, totalQuestions }

  return (
    <GameContext.Provider
      value={{ code, setCode, playerName, setPlayerName, quizMeta, setQuizMeta }}
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
