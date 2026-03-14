let verboseLogging = false;
export function setupLogging(verbose) {
    verboseLogging = verbose;
}
export const logger = {
    debug: (...args) => {
        if (verboseLogging) {
            console.debug(...args);
        }
    },
    info: (...args) => {
        console.info(...args);
    },
    warn: (...args) => {
        console.warn(...args);
    },
    error: (...args) => {
        console.error(...args);
    },
};
