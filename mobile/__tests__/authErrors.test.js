import { isBenignAuthError } from '../src/utils/authErrors';

describe('isBenignAuthError', () => {
  test('matches known session-missing errors', () => {
    expect(isBenignAuthError(new Error('Auth session missing'))).toBe(true);
    expect(isBenignAuthError(new Error('Session not found'))).toBe(true);
  });

  test('matches refresh token errors', () => {
    expect(isBenignAuthError(new Error('Invalid Refresh Token: Refresh Token Not Found'))).toBe(true);
  });

  test('does not swallow unrelated auth errors', () => {
    expect(isBenignAuthError(new Error('User not allowed'))).toBe(false);
  });
});

