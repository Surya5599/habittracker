export const isBenignAuthError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  if (!message) return false;
  return (
    message.includes('session not found') ||
    message.includes('auth session missing') ||
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found')
  );
};

