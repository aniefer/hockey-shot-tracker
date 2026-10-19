import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_CONFIG,
  loadConfig,
  normalizeConfig,
  saveConfig,
} from '../src/utils/storage';

describe('configuration storage', () => {
  let values;

  beforeEach(() => {
    values = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses defaults that preserve existing behavior', () => {
    expect(loadConfig()).toEqual({
      trackBlockedShots: false,
      trackScoringChances: true,
      reportShotsByZone: false,
      reportShotOutcomeBreakdown: true,
      reportShotMapsByPeriod: 'full',
      teams: [],
      defaultTeam: '',
    });
  });

  it('persists configuration independently from saved games', () => {
    const config = {
      ...DEFAULT_CONFIG,
      trackBlockedShots: false,
      reportShotMapsByPeriod: 'full',
      teams: ['Hawks', 'Wolves'],
      defaultTeam: 'Wolves',
    };

    saveConfig(config);

    expect(loadConfig()).toEqual(config);
    expect(values.has('hockey-shot-tracker-games')).toBe(false);
  });

  it('fills invalid or missing settings from defaults', () => {
    expect(normalizeConfig({
      trackScoringChances: false,
      reportShotMapsByPeriod: 'large',
    })).toEqual({
      ...DEFAULT_CONFIG,
      trackScoringChances: false,
    });
  });

  it('normalizes team names and falls back to the first team as default', () => {
    expect(normalizeConfig({
      teams: [' Hawks ', '', 'hawks', 'Wolves'],
      defaultTeam: 'Missing',
    })).toMatchObject({
      teams: ['Hawks', 'Wolves'],
      defaultTeam: 'Hawks',
    });
  });

  it('preserves a configured default team', () => {
    expect(normalizeConfig({
      teams: ['Hawks', 'Wolves'],
      defaultTeam: 'Wolves',
    })).toMatchObject({
      teams: ['Hawks', 'Wolves'],
      defaultTeam: 'Wolves',
    });
  });
});
