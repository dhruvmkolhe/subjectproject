import type { Server } from "node:http";

import { loadConfig } from "./config.js";
import { runCli } from "./cli.js";
import { startWatcher, stopWatcher } from "./daemon/watcher.js";
import { logger, setupLogging } from "./logging.js";
import { startApiServer, stopApiServer } from "./server.js";

async function waitForShutdown(onShutdown: () => Promise<void>): Promise<void> {
  await new Promise<void>((resolve) => {
    let shuttingDown = false;

    const handler = async () => {
      if (shuttingDown) {
        return;
      }

      shuttingDown = true;
      await onShutdown();
      resolve();
    };

    process.once("SIGINT", () => {
      void handler();
    });
    process.once("SIGTERM", () => {
      void handler();
    });
  });
}

export async function runDaemonMode(): Promise<void> {
  const config = loadConfig();
  setupLogging(config.verboseLogging);

  const rcloneDestination = `${config.rcloneRemoteName}:${config.rcloneDestPath}`;
  logger.info("Starting daemon mode...");
  logger.info(`Watch directory: ${config.watchDir}`);
  logger.info(`Output directory: ${config.outputDir}`);
  logger.info(`Rclone destination: ${rcloneDestination}`);

  const watcher = await startWatcher(
    config.watchDir,
    config.outputDir,
    rcloneDestination,
  );
  const server = await startApiServer(config.host, config.port);

  await waitForShutdown(async () => {
    await stopApiServer(server);
    await stopWatcher(watcher);
  });
}

export async function runApiOnly(): Promise<void> {
  const config = loadConfig();
  setupLogging(config.verboseLogging);

  let server: Server | null = null;
  server = await startApiServer(config.host, config.port);
  logger.info(`Starting API-only mode on ${config.host}:${config.port}`);

  await waitForShutdown(async () => {
    if (server) {
      await stopApiServer(server);
    }
  });
}

export async function main(): Promise<void> {
  const config = loadConfig();
  setupLogging(config.verboseLogging);

  if (process.argv.length > 2) {
    await runCli(process.argv);
    return;
  }

  if (config.daemonMode) {
    await runDaemonMode();
    return;
  }

  await runApiOnly();
}

const entryFile = process.argv[1];
if (entryFile && import.meta.url.endsWith(entryFile.replace(/\\/g, "/"))) {
  void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
