let verboseLogging = false;

export function setupLogging(verbose: boolean): void {
  verboseLogging = verbose;
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (verboseLogging) {
      console.debug(...args);
    }
  },
  info: (...args: unknown[]) => {
    console.info(...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
