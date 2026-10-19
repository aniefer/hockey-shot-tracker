import { describe, expect, it } from 'vitest';
import {
  appendZoneChange,
  formatZoneDuration,
  getCurrentZone,
  getGameZoneDurations,
  getPeriodZoneDurations,
  getZoneXRange,
} from '../src/utils/zoneTime';

const at = (seconds) => new Date(Date.UTC(2024, 0, 1, 0, 0, seconds)).toISOString();

describe('zone x-ranges', () => {
  it('puts the defensive zone on the left when the rink is not flipped', () => {
    expect(getZoneXRange('defensive', false)).toEqual([0, 0.375]);
    expect(getZoneXRange('neutral', false)).toEqual([0.375, 0.625]);
    expect(getZoneXRange('offensive', false)).toEqual([0.625, 1]);
  });

  it('mirrors defensive and offensive when the rink is flipped', () => {
    expect(getZoneXRange('defensive', true)).toEqual([0.625, 1]);
    expect(getZoneXRange('neutral', true)).toEqual([0.375, 0.625]);
    expect(getZoneXRange('offensive', true)).toEqual([0, 0.375]);
  });
});

describe('zone change log', () => {
  it('ignores repeated selection of the active zone', () => {
    const period = { number: 1, startTime: at(0), zoneChanges: [{ zone: 'neutral', timestamp: at(0) }] };
    expect(appendZoneChange(period, 'neutral', at(10))).toBe(period);
  });

  it('appends changes and reports the current zone', () => {
    const period = { number: 1, startTime: at(0), zoneChanges: [{ zone: 'neutral', timestamp: at(0) }] };
    const updated = appendZoneChange(period, 'offensive', at(30));
    expect(updated.zoneChanges).toHaveLength(2);
    expect(getCurrentZone(updated)).toBe('offensive');
    expect(getCurrentZone({ number: 1 })).toBeNull();
  });
});

describe('zone durations', () => {
  it('sums segments between changes and closes the last one at period end', () => {
    const period = {
      number: 1,
      startTime: at(0),
      endTime: at(100),
      zoneChanges: [
        { zone: 'neutral', timestamp: at(0) },
        { zone: 'offensive', timestamp: at(20) },
        { zone: 'defensive', timestamp: at(50) },
      ],
    };

    expect(getPeriodZoneDurations(period)).toEqual({ defensive: 50000, neutral: 20000, offensive: 30000 });
  });

  it('counts nothing for an open final segment with no end time', () => {
    const period = {
      number: 1,
      startTime: at(0),
      zoneChanges: [{ zone: 'neutral', timestamp: at(0) }],
    };

    expect(getPeriodZoneDurations(period)).toEqual({ defensive: 0, neutral: 0, offensive: 0 });
  });

  it('totals durations across periods and returns zeros for games without zone data', () => {
    const game = {
      periods: [
        {
          number: 1,
          startTime: at(0),
          endTime: at(60),
          zoneChanges: [{ zone: 'neutral', timestamp: at(0) }],
        },
        {
          number: 2,
          startTime: at(100),
          endTime: at(130),
          zoneChanges: [
            { zone: 'neutral', timestamp: at(100) },
            { zone: 'offensive', timestamp: at(110) },
          ],
        },
      ],
    };

    expect(getGameZoneDurations(game)).toEqual({ defensive: 0, neutral: 70000, offensive: 20000, total: 90000 });
    expect(getGameZoneDurations({ periods: [{ number: 1, startTime: at(0), endTime: at(60) }] }))
      .toEqual({ defensive: 0, neutral: 0, offensive: 0, total: 0 });
  });
});

describe('formatZoneDuration', () => {
  it('formats milliseconds as minutes and zero-padded seconds', () => {
    expect(formatZoneDuration(0)).toBe('0:00');
    expect(formatZoneDuration(65400)).toBe('1:05');
    expect(formatZoneDuration(-500)).toBe('0:00');
  });
});
