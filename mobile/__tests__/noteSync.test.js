import { normalizeNote, mergeNotesByUpdatedAt, isNoteEmpty } from '../src/utils/noteSync';

describe('noteSync utils', () => {
  test('normalizeNote keeps expected defaults', () => {
    const note = normalizeNote({});
    expect(Array.isArray(note.tasks)).toBe(true);
    expect(note.journal).toBe('');
    expect(Array.isArray(note.inactiveHabits)).toBe(true);
    expect(typeof note._updatedAt).toBe('number');
  });

  test('mergeNotesByUpdatedAt keeps newer incoming note', () => {
    const merged = mergeNotesByUpdatedAt(
      { '2026-03-10': { journal: 'old', tasks: [], inactiveHabits: [], _updatedAt: 10 } },
      { '2026-03-10': { journal: 'new', tasks: [], inactiveHabits: [], _updatedAt: 20 } }
    );

    expect(merged['2026-03-10'].journal).toBe('new');
  });

  test('isNoteEmpty is false when journal has text', () => {
    expect(isNoteEmpty({ journal: 'entry', tasks: [] })).toBe(false);
    expect(isNoteEmpty({ journal: '', tasks: [] })).toBe(true);
  });
});

