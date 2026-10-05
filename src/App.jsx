import { useState } from 'react';
import './index.css';
import HomeScreen from './components/HomeScreen';
import NewGameSetup from './components/NewGameSetup';
import GamePlay from './components/GamePlay';
import GameSummary from './components/GameSummary';
import ConfigScreen from './components/ConfigScreen';
import { useGameState } from './hooks/useGameState';
import { getGame, loadConfig, normalizeConfig, saveConfig } from './utils/storage';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [config, setConfig] = useState(loadConfig);
  const gameState = useGameState();

  const handleNewGame = () => setScreen('setup');

  const handleStartGame = (homeTeam, awayTeam, date) => {
    gameState.startGame(homeTeam, awayTeam, date);
    setScreen('play');
  };

  const handleViewGame = (gameId) => {
    const g = getGame(gameId);
    if (g) {
      if (g.status === 'in_progress') {
        gameState.loadGame(g);
        setScreen('play');
      } else {
        gameState.loadGame(g);
        setScreen('summary');
      }
    }
  };

  const handleGameEnd = () => {
    gameState.endGame();
    setScreen('summary');
  };

  const handleBackHome = () => {
    setScreen('home');
  };

  const handleConfigChange = (key, value) => {
    const updatedConfig = normalizeConfig({ ...config, [key]: value });
    saveConfig(updatedConfig);
    setConfig(updatedConfig);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {screen === 'home' && (
        <HomeScreen
          onNewGame={handleNewGame}
          onViewGame={handleViewGame}
          onOpenConfig={() => setScreen('config')}
          config={config}
        />
      )}
      {screen === 'config' && (
        <ConfigScreen
          config={config}
          onChange={handleConfigChange}
          onBack={handleBackHome}
        />
      )}
      {screen === 'setup' && (
        <NewGameSetup
          onStart={handleStartGame}
          onBack={handleBackHome}
        />
      )}
      {screen === 'play' && gameState.game && (
        <GamePlay
          gameState={gameState}
          onEndGame={handleGameEnd}
          config={config}
        />
      )}
      {screen === 'summary' && gameState.game && (
        <GameSummary
          game={gameState.game}
          onBack={handleBackHome}
          config={config}
        />
      )}
    </div>
  );
}
