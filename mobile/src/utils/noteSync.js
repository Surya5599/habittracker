const normalizeJournal = (journal) => {
  if (Array.isArray(journal)) return journal;
  if (typeof journal === 'string' && journal.trim()) {
    return [{ id: 'legacy-0', text: journal, createdAt: Date.now() }];
  }
  return [];
};

export const normalizeNote = (note) => {
  const input = note || {};
  return {
    tasks: Array.isArray(input.tasks) ? input.tasks : [],
    mood: input.mood,
    journal: normalizeJournal(input.journal),
    inactiveHabits: Array.isArray(input.inactiveHabits) ? input.inactiveHabits : [],
    _updatedAt: Number(input._updatedAt) || Date.now()
  };
};

export const parseServerContent = (content) => {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return normalizeNote({ tasks: parsed, mood: undefined, journal: [] });
    }
    if (parsed && typeof parsed === 'object') {
      return normalizeNote(parsed);
    }
    return normalizeNote({ tasks: [{ id: Date.now().toString(), text: String(parsed || ''), completed: false }] });
  } catch {
    if (content) {
      return normalizeNote({ tasks: [{ id: Date.now().toString(), text: content, completed: false }] });
    }
    return normalizeNote({});
  }
};

export const mergeNotesByUpdatedAt = (baseNotes, incomingNotes) => {
  const merged = { ...baseNotes };
  Object.entries(incomingNotes || {}).forEach(([dateKey, incoming]) => {
    const current = merged[dateKey];
    const currentTs = Number(current?._updatedAt) || 0;
    const incomingTs = Number(incoming?._updatedAt) || 0;
    merged[dateKey] = incomingTs >= currentTs ? normalizeNote(incoming) : normalizeNote(current);
  });
  return merged;
};

export const isNoteEmpty = (note) => {
  const value = normalizeNote(note);
  return (
    value.tasks.length === 0 &&
    !value.mood &&
    !value.journal.some(e => (e.text || '').trim()) &&
    value.inactiveHabits.length === 0
  );
};
