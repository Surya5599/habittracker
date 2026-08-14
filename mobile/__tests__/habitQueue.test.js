import { remapOpHabitId, pruneOrphanedTempOps, partitionOrphanedTempOps, describeOp } from '../src/utils/habitQueue';

// A habit created offline gets a local `tmp-…` id. When the insert reaches the server
// the real uuid comes back, and every queued op still pointing at the temp id has to be
// rewritten — otherwise Postgres rejects them with
//   invalid input syntax for type uuid: "tmp-1786650535717"
const TMP = 'tmp-1786650535717';
const REAL = '9f1c2c8e-6a1b-4d2f-9f77-2b0e1a4c7c31';

describe('remapOpHabitId', () => {
    it('rewrites the habit a completion points at', () => {
        expect(remapOpHabitId(
            { type: 'completion_set', habitId: TMP, dateKey: '2026-08-13', value: true },
            TMP, REAL,
        )).toMatchObject({ habitId: REAL, dateKey: '2026-08-13', value: true });
    });

    it('rewrites the clientId on the insert that produced the real id', () => {
        expect(remapOpHabitId({ type: 'habit_insert', clientId: TMP }, TMP, REAL).clientId).toBe(REAL);
    });

    it('rewrites the id inside an insert payload', () => {
        const op = remapOpHabitId(
            { type: 'habit_insert', clientId: TMP, payload: { id: TMP, name: 'Read' } },
            TMP, REAL,
        );
        expect(op.payload).toEqual({ id: REAL, name: 'Read' });
    });

    it('rewrites only the matching entry in a reorder list', () => {
        expect(remapOpHabitId(
            { type: 'habit_reorder', habitIds: ['a', TMP, 'b'] },
            TMP, REAL,
        ).habitIds).toEqual(['a', REAL, 'b']);
    });

    it('leaves ops for other habits alone', () => {
        const other = { type: 'completion_set', habitId: 'someone-else', dateKey: '2026-08-13' };
        expect(remapOpHabitId(other, TMP, REAL)).toEqual(other);
    });

    it('does not mutate the op it was given', () => {
        const op = { type: 'habit_insert', clientId: TMP, payload: { id: TMP }, habitIds: [TMP] };
        const copy = JSON.parse(JSON.stringify(op));
        remapOpHabitId(op, TMP, REAL);
        expect(op).toEqual(copy);
    });

    it('is a no-op when nothing carries the old id', () => {
        const op = { type: 'habit_update', habitId: REAL, updates: { name: 'x' } };
        expect(remapOpHabitId(op, TMP, REAL)).toEqual(op);
    });
});

// The regression itself: the replay loop must take each op from the live queue, not
// from a copy made before the loop, or the remap above is written straight back over.
describe('replay loop reads the live queue', () => {
    const drain = ({ snapshotBug }) => {
        let stored = [
            { type: 'habit_insert', clientId: TMP, payload: { id: TMP } },
            { type: 'completion_set', habitId: TMP, dateKey: '2026-08-13', value: true },
        ];
        const persist = (next) => { stored = next; };
        const executed = [];

        const execute = (op) => {
            executed.push(op);
            if (op.type === 'habit_insert') {
                // What remapLocalIds does: rewrite the whole live queue.
                persist(stored.map(o => remapOpHabitId(o, TMP, REAL)));
            }
        };

        if (snapshotBug) {
            let queue = [...stored];
            while (queue.length > 0) {
                execute(queue[0]);
                queue = queue.slice(1);
                persist(queue);           // clobbers the remap
            }
        } else {
            let guard = stored.length + 8;
            while (stored.length > 0 && guard-- > 0) {
                execute(stored[0]);
                persist(stored.slice(1)); // keeps whatever the remap wrote
            }
        }
        return executed;
    };

    it('sends the completion with the real uuid', () => {
        const completion = drain({ snapshotBug: false })
            .find(op => op.type === 'completion_set');
        expect(completion.habitId).toBe(REAL);
    });

    it('reproduces the old failure when looping over a stale snapshot', () => {
        const completion = drain({ snapshotBug: true })
            .find(op => op.type === 'completion_set');
        expect(completion.habitId).toBe(TMP);
    });
});

describe('pruneOrphanedTempOps', () => {
    const { pruneOrphanedTempOps } = require('../src/utils/habitQueue');

    it('keeps a completion whose insert is still queued to resolve it', () => {
        const queue = [
            { type: 'habit_insert', clientId: TMP, payload: { id: TMP } },
            { type: 'completion_set', habitId: TMP, dateKey: '2026-08-13' },
        ];
        expect(pruneOrphanedTempOps(queue)).toEqual(queue);
    });

    it('drops a completion left behind after its insert was removed', () => {
        // Exactly the wedged state the snapshot bug produced.
        expect(pruneOrphanedTempOps([
            { type: 'completion_set', habitId: TMP, dateKey: '2026-08-13' },
        ])).toEqual([]);
    });

    it('never touches ops that already carry real uuids', () => {
        const queue = [
            { type: 'completion_set', habitId: REAL, dateKey: '2026-08-13' },
            { type: 'habit_update', habitId: REAL, updates: { name: 'x' } },
            { type: 'habit_reorder', habitIds: [REAL] },
        ];
        expect(pruneOrphanedTempOps(queue)).toEqual(queue);
    });

    it('drops a reorder that names an unresolvable temp id', () => {
        expect(pruneOrphanedTempOps([
            { type: 'habit_reorder', habitIds: [REAL, TMP] },
        ])).toEqual([]);
    });

    it('resolves each temp id independently', () => {
        const other = 'tmp-999';
        const queue = [
            { type: 'habit_insert', clientId: TMP, payload: { id: TMP } },
            { type: 'completion_set', habitId: TMP, dateKey: '2026-08-13' },
            { type: 'completion_set', habitId: other, dateKey: '2026-08-13' },
        ];
        expect(pruneOrphanedTempOps(queue).map(o => o.habitId ?? o.clientId))
            .toEqual([TMP, TMP]);
    });

    it('handles an empty or missing queue', () => {
        expect(pruneOrphanedTempOps([])).toEqual([]);
        expect(pruneOrphanedTempOps()).toEqual([]);
    });
});

describe('partitionOrphanedTempOps / describeOp', () => {
    const TMP = 'tmp-1786650535717';

    // The queue right after adding a habit holds exactly one op. Nothing about it is
    // orphaned, so a prune firing on every add means stale data was already in storage.
    it('keeps a lone habit_insert, including after a storage round-trip', () => {
        const insert = {
            type: 'habit_insert',
            clientId: TMP,
            payload: { id: TMP, name: 'Read', frequency: undefined, weeklyTarget: null },
        };
        expect(partitionOrphanedTempOps([insert]).dropped).toEqual([]);
        expect(partitionOrphanedTempOps(JSON.parse(JSON.stringify([insert]))).dropped).toEqual([]);
    });

    it('reports the ops it drops so the log names the lost change', () => {
        const orphan = { type: 'habit_update', habitId: TMP, updates: { name: 'x' } };
        const { kept, dropped } = partitionOrphanedTempOps([orphan]);
        expect(kept).toEqual([]);
        expect(describeOp(dropped[0])).toContain('habit_update');
        expect(describeOp(dropped[0])).toContain(TMP);
    });

    it('is idempotent — a second pass drops nothing more', () => {
        const queue = [
            { type: 'habit_insert', clientId: TMP, payload: { id: TMP } },
            { type: 'completion_set', habitId: 'tmp-gone', dateKey: '2026-08-13' },
        ];
        const once = partitionOrphanedTempOps(queue).kept;
        expect(partitionOrphanedTempOps(once).dropped).toEqual([]);
    });
});
