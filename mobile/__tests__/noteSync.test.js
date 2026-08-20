import { normalizeNote, mergeNotesByUpdatedAt, isNoteEmpty } from '../src/utils/noteSync';

describe('noteSync utils', () => {
  test('normalizeNote keeps expected defaults', () => {
    const note = normalizeNote({});
    expect(Array.isArray(note.tasks)).toBe(true);
    expect(note.journal).toEqual([]);
    expect(Array.isArray(note.inactiveHabits)).toBe(true);
    expect(typeof note._updatedAt).toBe('number');
  });

  // A journal used to be one string; it's now a list of timestamped entries with moods.
  // Notes written before that change still arrive from the server as strings.
  test('normalizeNote migrates a legacy string journal into a single entry', () => {
    const note = normalizeNote({ journal: 'yesterday went well' });
    expect(note.journal).toHaveLength(1);
    expect(note.journal[0].text).toBe('yesterday went well');
    expect(typeof note.journal[0].createdAt).toBe('number');
  });

  test('normalizeNote treats a blank legacy journal as no entries', () => {
    expect(normalizeNote({ journal: '   ' }).journal).toEqual([]);
  });

  test('mergeNotesByUpdatedAt keeps newer incoming note', () => {
    const entry = (text) => [{ id: 'e1', text, mood: 'ok', createdAt: 1 }];
    const merged = mergeNotesByUpdatedAt(
      { '2026-03-10': { journal: entry('old'), tasks: [], inactiveHabits: [], _updatedAt: 10 } },
      { '2026-03-10': { journal: entry('new'), tasks: [], inactiveHabits: [], _updatedAt: 20 } }
    );

    expect(merged['2026-03-10'].journal[0].text).toBe('new');
  });

  test('mergeNotesByUpdatedAt keeps the base note when the incoming one is older', () => {
    const merged = mergeNotesByUpdatedAt(
      { '2026-03-10': { mood: 'good', tasks: [], inactiveHabits: [], _updatedAt: 30 } },
      { '2026-03-10': { mood: 'bad', tasks: [], inactiveHabits: [], _updatedAt: 20 } }
    );

    expect(merged['2026-03-10'].mood).toBe('good');
  });

  test('isNoteEmpty is false when journal has text', () => {
    expect(isNoteEmpty({ journal: 'entry', tasks: [] })).toBe(false);
    expect(isNoteEmpty({ journal: [{ id: 'e1', text: 'entry' }], tasks: [] })).toBe(false);
    expect(isNoteEmpty({ journal: '', tasks: [] })).toBe(true);
  });

  test('isNoteEmpty ignores journal entries that are only whitespace', () => {
    expect(isNoteEmpty({ journal: [{ id: 'e1', text: '   ' }], tasks: [] })).toBe(true);
  });
});
