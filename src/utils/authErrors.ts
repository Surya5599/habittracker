export const isBenignAuthError = (error: unknown) => {
  const message = String((error as { message?: string } | null | undefined)?.message || '').toLowerCase();
  if (!message) return false;

  return (
    message.includes('session not found') ||
    message.includes('auth session missing') ||
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('jwt expired') ||
    message.includes('forbidden')
  );
};
