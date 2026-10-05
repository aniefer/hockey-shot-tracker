import { useState } from 'react';
import './index.css';
import HomeScreen from './components/HomeScreen';
import NewGameSetup from './components/NewGameSetup';
import GamePlay from './components/GamePlay';
import GameSummary from './components/GameSummary';
import ConfigScreen from './components/ConfigScreen';
import CreateReportSetup from './components/CreateReportSetup';
import { useGameState } from './hooks/useGameState';
import { createHeadToHeadReport } from './utils/headToHeadReport';
import { createBackup, downloadGzipJson, readGzipJsonBackup } from './utils/dataTransfer';
import { alignGameTeams, findImportConflicts, mergeImportedGames } from './utils/gameImport';
import {
  getGame,
  loadConfig,
  loadGames,
  normalizeConfig,
  saveConfig,
  saveGames,
} from './utils/storage';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [config, setConfig] = useState(loadConfig);
  const [headToHeadReport, setHeadToHeadReport] = useState(null);
  const gameState = useGameState();

  const handleNewGame = () => {
    setHeadToHeadReport(null);
    setScreen('setup');
  };

  const handleStartGame = (homeTeam, awayTeam, date) => {
    setHeadToHeadReport(null);
    gameState.startGame(homeTeam, awayTeam, date);
    setScreen('play');
  };

  const handleCreateReport = (homeTeam, awayTeam) => {
    const report = createHeadToHeadReport(loadGames(), homeTeam, awayTeam);
    if (report.includedGames === 0) return false;

    setHeadToHeadReport(report);
    setScreen('summary');
    return true;
  };

  const handleViewGame = (gameId) => {
    const g = getGame(gameId);
    if (g) {
      setHeadToHeadReport(null);
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
    setHeadToHeadReport(null);
    setScreen('home');
  };

  const handleConfigChange = (key, value) => {
    const updatedConfig = normalizeConfig({ ...config, [key]: value });
    saveConfig(updatedConfig);
    setConfig(updatedConfig);
  };

  const handleAddTeam = (name) => {
    const teamName = name.trim();
    if (!teamName) return null;

    const existingTeam = config.teams.find(
      (team) => team.toLowerCase() === teamName.toLowerCase()
    );
    if (existingTeam) return existingTeam;

    const updatedConfig = normalizeConfig({
      ...config,
      teams: [...config.teams, teamName],
      defaultTeam: config.defaultTeam || teamName,
    });
    saveConfig(updatedConfig);
    setConfig(updatedConfig);
    return teamName;
  };

  const handleDeleteTeam = (teamName) => {
    handleConfigChange('teams', config.teams.filter((team) => team !== teamName));
  };

  const handleExportAll = async () => {
    const backup = createBackup(loadGames(), config.teams);
    await downloadGzipJson(backup, 'hockey-shot-tracker-all-games.json.gz');
  };

  const handleExportGame = async (game) => {
    const backup = createBackup([game], [game.homeTeam, game.awayTeam]);
    const safeName = `${game.homeTeam}-vs-${game.awayTeam}-${game.date.slice(0, 10)}`
      .replace(/[^a-z0-9-]+/gi, '-')
      .replace(/^-|-$/g, '');
    await downloadGzipJson(backup, `${safeName || 'hockey-game'}.json.gz`);
  };

  const handleImportFile = async (file, resolveConflicts) => {
    const incoming = await readGzipJsonBackup(file);
    const incomingGames = alignGameTeams(incoming.games, [...config.teams, ...incoming.teams]);
    const existingGames = loadGames();
    const conflicts = findImportConflicts(existingGames, incomingGames);
    const keepImportedIds = conflicts.length > 0
      ? await resolveConflicts(conflicts)
      : new Set();
    if (!keepImportedIds) return null;

    const mergeResult = mergeImportedGames(
      existingGames,
      incomingGames,
      (existing) => keepImportedIds.has(existing.id)
    );
    const updatedConfig = normalizeConfig({
      ...config,
      teams: [...config.teams, ...incoming.teams],
    });
    saveGames(mergeResult.games);
    saveConfig(updatedConfig);
    setConfig(updatedConfig);

    return {
      ...mergeResult,
      teamsAdded: updatedConfig.teams.length - config.teams.length,
    };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {screen === 'home' && (
        <HomeScreen
          onNewGame={handleNewGame}
          onViewGame={handleViewGame}
          onOpenConfig={() => setScreen('config')}
          onCreateReport={() => setScreen('reportSetup')}
          onExportAll={handleExportAll}
          onImportFile={handleImportFile}
          config={config}
          onAddTeam={handleAddTeam}
        />
      )}
      {screen === 'config' && (
        <ConfigScreen
          config={config}
          onChange={handleConfigChange}
          onAddTeam={handleAddTeam}
          onDeleteTeam={handleDeleteTeam}
          onBack={handleBackHome}
        />
      )}
      {screen === 'setup' && (
        <NewGameSetup
          teams={config.teams}
          defaultTeam={config.defaultTeam}
          onCreateTeam={handleAddTeam}
          onStart={handleStartGame}
          onBack={handleBackHome}
        />
      )}
      {screen === 'reportSetup' && (
        <CreateReportSetup
          teams={config.teams}
          games={loadGames()}
          defaultTeam={config.defaultTeam}
          onCreateReport={handleCreateReport}
          onBack={handleBackHome}
        />
      )}
      {screen === 'play' && gameState.game && (
        <GamePlay
          gameState={gameState}
          onEndGame={handleGameEnd}
          onExportGameData={handleExportGame}
          config={config}
        />
      )}
      {screen === 'summary' && (headToHeadReport || gameState.game) && (
        <GameSummary
          game={headToHeadReport?.game || gameState.game}
          headToHead={headToHeadReport}
          onBack={handleBackHome}
          onExportGameData={handleExportGame}
          config={config}
        />
      )}
    </div>
  );
}
