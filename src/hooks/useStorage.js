import { useState } from 'react';
import { loadGames, deleteGame as removeGame } from '../utils/storage';

export function useStorage() {
  const [games, setGames] = useState(loadGames);

  const refresh = () => {
    setGames(loadGames());
  };

  const deleteGame = (id) => {
    removeGame(id);
    refresh();
  };

  return { games, refresh, deleteGame };
}
