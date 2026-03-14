import { afterEach, describe, expect, it } from "vitest";

import { ConfigError, loadConfig, parseBool } from "../src/config.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("config", () => {
  it("loads configuration with defaults and explicit values", () => {
    process.env.DAEMON_MODE = "false";
    process.env.WATCH_DIR = "/tmp/watch";
    process.env.OUTPUT_DIR = "/tmp/output";
    process.env.RCLONE_REMOTE_NAME = "gdrive";
    process.env.RCLONE_DEST_PATH = "backups";
    process.env.MONGODB_ENABLED = "false";
    process.env.MONGODB_COLLECTION = "events";
    process.env.VERBOSE_LOGGING = "true";
    process.env.HOST = "127.0.0.1";
    process.env.PORT = "9000";

    const config = loadConfig();

    expect(config.daemonMode).toBe(false);
    expect(config.watchDir).toBe("/tmp/watch");
    expect(config.outputDir).toBe("/tmp/output");
    expect(config.mongodbUri).toBeNull();
    expect(config.mongodbDatabase).toBeNull();
    expect(config.mongodbCollection).toBe("events");
    expect(config.verboseLogging).toBe(true);
    expect(config.host).toBe("127.0.0.1");
    expect(config.port).toBe(9000);
  });

  it("rejects invalid booleans", () => {
    expect(() => parseBool("maybe", "DAEMON_MODE")).toThrow(ConfigError);
  });
});
