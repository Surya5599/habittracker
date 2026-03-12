import { getHabitMonthStats, isCompleted } from '../src/utils/stats';
import { safePercentage } from '../src/utils/progressMath';

describe('stats utility', () => {
  test('getHabitMonthStats respects habit createdAt date', () => {
    const completions = {
      h1: {
        '2026-03-10': true,
        '2026-03-11': true
      }
    };

    const result = getHabitMonthStats(
      'h1',
      completions,
      2,
      2026,
      null,
      '2026-03-10T08:00:00.000Z'
    );

    expect(result.completed).toBe(2);
    expect(result.totalDays).toBeGreaterThan(0);
    expect(result.totalDays).toBe(22); // Mar 10-31 inclusive
  });

  test('isCompleted returns true only for exact date key', () => {
    const completions = {
      h1: {
        '2026-03-08': true
      }
    };

    expect(isCompleted('h1', 8, completions, 2, 2026)).toBe(true);
    expect(isCompleted('h1', 9, completions, 2, 2026)).toBe(false);
  });
});

describe('progressMath safePercentage', () => {
  test('never exceeds 100%', () => {
    expect(safePercentage(13, 10)).toBe(100);
  });

  test('handles zero denominator safely', () => {
    expect(safePercentage(5, 0)).toBe(0);
  });

  test('calculates rounded percentage', () => {
    expect(safePercentage(3, 8)).toBe(38);
  });
});
