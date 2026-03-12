export const safePercentage = (completed, possible) => {
  const done = Number.isFinite(completed) ? Math.max(0, completed) : 0;
  const total = Number.isFinite(possible) ? Math.max(0, possible) : 0;
  if (total <= 0) return 0;
  const ratio = (done / total) * 100;
  return Math.max(0, Math.min(100, Math.round(ratio)));
};
