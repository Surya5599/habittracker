import AsyncStorage from '@react-native-async-storage/async-storage';

const ERROR_LOG_KEY = 'habit_error_log_v1';
const MAX_ERRORS = 50;

const normalizeError = (error, context = {}) => ({
  message: String(error?.message || 'Unknown error'),
  stack: String(error?.stack || ''),
  context,
  timestamp: new Date().toISOString()
});

export const reportError = async (error, context = {}) => {
  const payload = normalizeError(error, context);
  try {
    const raw = await AsyncStorage.getItem(ERROR_LOG_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const next = [payload, ...current].slice(0, MAX_ERRORS);
    await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(next));
  } catch (storageError) {
    console.error('Failed to persist error report:', storageError);
  }
  console.error('[ErrorReporting]', payload.message, payload.context);
};

export const initializeErrorReporting = () => {
  // React Native global handler support varies by runtime; guard accordingly.
  if (global?.ErrorUtils?.getGlobalHandler && global?.ErrorUtils?.setGlobalHandler) {
    const previousHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      reportError(error, { scope: 'global', isFatal: Boolean(isFatal) });
      if (typeof previousHandler === 'function') {
        previousHandler(error, isFatal);
      }
    });
  }
};

