import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN } from '@env';

export const initializeErrorReporting = () => {
  Sentry.init({
    dsn: SENTRY_DSN || '',
    enabled: !!SENTRY_DSN,
  });
};

export const reportError = (error, context = {}) => {
  Sentry.withScope((scope) => {
    scope.setExtras(context);
    Sentry.captureException(error);
  });
};
