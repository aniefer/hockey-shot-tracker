import { useState, useCallback } from 'react';
import { generateId } from '../utils/generateId';
import { saveGame } from '../utils/storage';
import { getShotCounts } from '../utils/shotStats';
import { normalizeHomeStartSide } from '../utils/rinkOrientation';
import { NEUTRAL_ZONE, appendZoneChange, getCurrentZone } from '../utils/zoneTime';

function createNewGame(homeTeam, awayTeam, date, homeStartSide, trackZoneTime) {
  return {
    id: generateId(),
    date: date || new Date().toISOString(),
    homeTeam: homeTeam || 'Home',
    awayTeam: awayTeam || 'Away',
    homeStartSide: normalizeHomeStartSide(homeStartSide),
    trackZoneTime: Boolean(trackZoneTime),
    periods: [],
    status: 'in_progress',
  };
}

export function useGameState(initialGame = null) {
  const [game, setGame] = useState(initialGame);
  const [currentPeriod, setCurrentPeriod] = useState(null);

  const startGame = useCallback((homeTeam, awayTeam, date, homeStartSide, trackZoneTime = false) => {
    const g = createNewGame(homeTeam, awayTeam, date, homeStartSide, trackZoneTime);
    setGame(g);
    saveGame(g);
    return g;
  }, []);

  const loadGame = useCallback((existingGame) => {
    setGame(existingGame);
    if (existingGame.status === 'in_progress' && existingGame.periods.length > 0) {
      const last = existingGame.periods[existingGame.periods.length - 1];
      if (!last.endTime) {
        setCurrentPeriod(last.number);
      }
    }
  }, []);

  const startPeriod = useCallback((periodNumber) => {
    setGame((prev) => {
      const startTime = new Date().toISOString();
      const newPeriod = {
        number: periodNumber,
        shots: [],
        startTime,
        endTime: null,
        ...(prev.trackZoneTime
          ? { zoneChanges: [{ zone: NEUTRAL_ZONE, timestamp: startTime }] }
          : {}),
      };
      const updated = {
        ...prev,
        periods: [...prev.periods, newPeriod],
      };
      saveGame(updated);
      return updated;
    });
    setCurrentPeriod(periodNumber);
  }, []);

  const endPeriod = useCallback(() => {
    setGame((prev) => {
      const periods = prev.periods.map((p) =>
        p.number === currentPeriod && !p.endTime
          ? { ...p, endTime: new Date().toISOString() }
          : p
      );
      const updated = { ...prev, periods };
      saveGame(updated);
      return updated;
    });
    setCurrentPeriod(null);
  }, [currentPeriod]);

  const setZone = useCallback(
    (zone) => {
      setGame((prev) => {
        if (!prev?.trackZoneTime || currentPeriod === null) return prev;
        const timestamp = new Date().toISOString();
        const periods = prev.periods.map((p) =>
          p.number === currentPeriod && !p.endTime ? appendZoneChange(p, zone, timestamp) : p
        );
        const updated = { ...prev, periods };
        saveGame(updated);
        return updated;
      });
    },
    [currentPeriod]
  );

  const addShot = useCallback(
    (x, y, team, result, playerNumber) => {
      const shot = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        x,
        y,
        team: team || null,
        result: result || null,
        playerNumber: playerNumber || null,
      };
      setGame((prev) => {
        const periods = prev.periods.map((p) =>
          p.number === currentPeriod ? { ...p, shots: [...p.shots, shot] } : p
        );
        const updated = { ...prev, periods };
        saveGame(updated);
        return updated;
      });
      return shot;
    },
    [currentPeriod]
  );

  const undoLastShot = useCallback(() => {
    setGame((prev) => {
      const periods = prev.periods.map((p) => {
        if (p.number === currentPeriod && p.shots.length > 0) {
          return { ...p, shots: p.shots.slice(0, -1) };
        }
        return p;
      });
      const updated = { ...prev, periods };
      saveGame(updated);
      return updated;
    });
  }, [currentPeriod]);

  const endGame = useCallback(() => {
    setGame((prev) => {
      // End any open period
      const periods = prev.periods.map((p) =>
        !p.endTime ? { ...p, endTime: new Date().toISOString() } : p
      );
      const updated = { ...prev, periods, status: 'completed' };
      saveGame(updated);
      return updated;
    });
    setCurrentPeriod(null);
  }, []);

  const allShots = game
    ? game.periods.flatMap((p) => p.shots)
    : [];

  const currentPeriodShots = game && currentPeriod
    ? (game.periods.find((p) => p.number === currentPeriod)?.shots || [])
    : [];

  const currentZone = currentPeriod !== null && game
    ? getCurrentZone(game.periods.find((p) => p.number === currentPeriod))
    : null;

  const shotCounts = getShotCounts(allShots);

  return {
    game,
    currentPeriod,
    allShots,
    currentPeriodShots,
    currentZone,
    shotCounts,
    startGame,
    loadGame,
    startPeriod,
    endPeriod,
    setZone,
    addShot,
    undoLastShot,
    endGame,
  };
}
