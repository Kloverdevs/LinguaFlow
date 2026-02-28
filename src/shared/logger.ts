const PREFIX = '[LinguaFlow]';

export const logger = {
  info: (...args: unknown[]) => console.log(PREFIX, ...args),
  warn: (...args: unknown[]) => console.warn(PREFIX, ...args),
  error: (...args: unknown[]) => console.error(PREFIX, ...args),
  debug: (...args: unknown[]) => {
    if (import.meta.env?.DEV) {
      console.debug(PREFIX, ...args);
    }
  },
};
