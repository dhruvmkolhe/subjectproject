import { config as loadDotEnv } from "dotenv";
loadDotEnv();
export class ConfigError extends Error {
}
const DEFAULTS = {
    DAEMON_MODE: "true",
    WATCH_DIR: "/data/watch",
    OUTPUT_DIR: "/data/clean",
    RCLONE_REMOTE_NAME: "gdrive",
    RCLONE_DEST_PATH: "backups",
    MONGODB_ENABLED: "true",
    MONGODB_URI: "mongodb://localhost:27017",
    MONGODB_DATABASE: "phobos",
    MONGODB_COLLECTION: "file_events",
    VERBOSE_LOGGING: "false",
    HOST: "0.0.0.0",
    PORT: "8000",
};
export function parseBool(rawValue, key) {
    const normalized = String(rawValue).trim().toLowerCase();
    const truthy = new Set(["1", "true", "yes", "on", "y", "t"]);
    const falsy = new Set(["0", "false", "no", "off", "n", "f"]);
    if (truthy.has(normalized)) {
        return true;
    }
    if (falsy.has(normalized)) {
        return false;
    }
    throw new ConfigError(`Invalid boolean for ${key}: ${rawValue}`);
}
export function getEnv(key, defaultValue, required = false) {
    const value = process.env[key];
    if (value === undefined || value.trim() === "") {
        if (required && defaultValue === undefined) {
            throw new ConfigError(`Environment variable ${key} is required`);
        }
        if (defaultValue === undefined) {
            throw new ConfigError(`Environment variable ${key} is empty`);
        }
        return defaultValue;
    }
    return value.trim();
}
export function loadConfig() {
    const daemonModeRaw = getEnv("DAEMON_MODE", DEFAULTS.DAEMON_MODE, true);
    const watchDir = getEnv("WATCH_DIR", DEFAULTS.WATCH_DIR, true);
    const outputDir = getEnv("OUTPUT_DIR", DEFAULTS.OUTPUT_DIR, true);
    const rcloneRemoteName = getEnv("RCLONE_REMOTE_NAME", DEFAULTS.RCLONE_REMOTE_NAME, true);
    const rcloneDestPath = getEnv("RCLONE_DEST_PATH", DEFAULTS.RCLONE_DEST_PATH, true);
    const mongodbEnabledRaw = getEnv("MONGODB_ENABLED", DEFAULTS.MONGODB_ENABLED);
    const verboseLoggingRaw = getEnv("VERBOSE_LOGGING", DEFAULTS.VERBOSE_LOGGING);
    const host = getEnv("HOST", DEFAULTS.HOST);
    const portRaw = getEnv("PORT", DEFAULTS.PORT);
    const mongodbEnabled = parseBool(mongodbEnabledRaw, "MONGODB_ENABLED");
    const verboseLogging = parseBool(verboseLoggingRaw, "VERBOSE_LOGGING");
    const port = Number.parseInt(portRaw, 10);
    if (Number.isNaN(port) || port <= 0) {
        throw new ConfigError(`Invalid integer for PORT: ${portRaw}`);
    }
    let mongodbUri = null;
    let mongodbDatabase = null;
    if (mongodbEnabled) {
        mongodbUri = getEnv("MONGODB_URI", DEFAULTS.MONGODB_URI, true);
        mongodbDatabase = getEnv("MONGODB_DATABASE", DEFAULTS.MONGODB_DATABASE, true);
    }
    const mongodbCollection = getEnv("MONGODB_COLLECTION", DEFAULTS.MONGODB_COLLECTION, true);
    return {
        daemonMode: parseBool(daemonModeRaw, "DAEMON_MODE"),
        watchDir,
        outputDir,
        rcloneRemoteName,
        rcloneDestPath,
        mongodbEnabled,
        mongodbUri,
        mongodbDatabase,
        mongodbCollection,
        verboseLogging,
        host,
        port,
    };
}
