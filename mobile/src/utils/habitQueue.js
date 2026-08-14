// Offline queue helpers. Pure, so they're testable without pulling AsyncStorage and
// the Supabase client into the test environment.

// A habit created offline gets a local `tmp-…` id. When its insert reaches the server
// the real uuid comes back, and every queued op still pointing at the temp id has to be
// rewritten in place — otherwise Postgres rejects them with
//   invalid input syntax for type uuid: "tmp-1786650535717"
// which is what a completion recorded before the insert had synced would produce.
export const remapOpHabitId = (op, oldId, newId) => {
    const next = { ...op };
    if (next.habitId === oldId) next.habitId = newId;
    if (next.clientId === oldId) next.clientId = newId;
    if (Array.isArray(next.habitIds)) {
        next.habitIds = next.habitIds.map((id) => (id === oldId ? newId : id));
    }
    if (next.payload?.id === oldId) {
        next.payload = { ...next.payload, id: newId };
    }
    return next;
};

export const isTempHabitId = (id) => typeof id === 'string' && id.startsWith('tmp-');

const tempRefsOf = (op) => {
    const refs = [];
    if (isTempHabitId(op?.habitId)) refs.push(op.habitId);
    if (isTempHabitId(op?.clientId)) refs.push(op.clientId);
    if (isTempHabitId(op?.payload?.id)) refs.push(op.payload.id);
    if (Array.isArray(op?.habitIds)) refs.push(...op.habitIds.filter(isTempHabitId));
    return refs;
};

// Drop ops that point at a temp id no insert will ever resolve.
//
// A temp id only becomes a real uuid when its `habit_insert` replays and triggers the
// remap. If that insert is gone from the queue but ops referencing its id remain, those
// ops are unresolvable: the server rejects them with `invalid input syntax for type
// uuid`, replay rethrows, and because the bad op stays at the head *every* later change
// is stuck behind it. A queue that can never drain is worse than a lost checkbox, so
// they get pruned.
//
// This cleans up after the snapshot bug in replayQueue, which persisted a pre-remap
// copy over the remap and so removed the insert while leaving its dependents behind.
export const partitionOrphanedTempOps = (queue = []) => {
    const resolvable = new Set(
        queue
            .filter(op => op?.type === 'habit_insert' && isTempHabitId(op.clientId))
            .map(op => op.clientId),
    );
    const kept = [];
    const dropped = [];
    queue.forEach((op) => {
        const refs = tempRefsOf(op);
        const ok = refs.length === 0 || refs.every(id => resolvable.has(id));
        (ok ? kept : dropped).push(op);
    });
    return { kept, dropped };
};

export const pruneOrphanedTempOps = (queue = []) => partitionOrphanedTempOps(queue).kept;

// One-line description of an op for a log message: enough to identify which change was
// lost and which temp id stranded it, without dumping the whole payload.
export const describeOp = (op) => {
    const refs = tempRefsOf(op);
    const parts = [op?.type || 'unknown'];
    if (op?.habitId) parts.push(`habit=${op.habitId}`);
    if (op?.clientId) parts.push(`client=${op.clientId}`);
    if (op?.dateKey) parts.push(op.dateKey);
    if (Array.isArray(op?.habitIds)) parts.push(`ids=${op.habitIds.length}`);
    if (refs.length) parts.push(`tempRefs=[${Array.from(new Set(refs)).join(',')}]`);
    return parts.join(' ');
};
