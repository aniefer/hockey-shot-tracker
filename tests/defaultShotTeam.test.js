import { describe, expect, it } from 'vitest';
import {
  getDefaultShotTeam,
  normalizeRinkCoordinates,
} from '../src/utils/defaultShotTeam';

describe('getDefaultShotTeam', () => {
  it('defaults to home when a shot is in the away end', () => {
    expect(getDefaultShotTeam(0.8, false)).toBe('home');
  });

  it('defaults to away when a shot is in the home end', () => {
    expect(getDefaultShotTeam(0.2, false)).toBe('away');
  });

  it('reverses team defaults when the rink is flipped', () => {
    expect(getDefaultShotTeam(0.2, true)).toBe('home');
    expect(getDefaultShotTeam(0.8, true)).toBe('away');
  });

  it('leaves the team unselected for neutral-zone shots', () => {
    expect(getDefaultShotTeam(0.5, false)).toBeNull();
    expect(getDefaultShotTeam(0.5, true)).toBeNull();
  });

  it('maps portrait taps at both ends to the correct team', () => {
    const topEnd = normalizeRinkCoordinates(0.5, 0.1, 'portrait');
    const bottomEnd = normalizeRinkCoordinates(0.5, 0.9, 'portrait');

    expect(getDefaultShotTeam(topEnd.x, false)).toBe('away');
    expect(getDefaultShotTeam(bottomEnd.x, false)).toBe('home');
    expect(getDefaultShotTeam(topEnd.x, true)).toBe('home');
    expect(getDefaultShotTeam(bottomEnd.x, true)).toBe('away');
  });
});
