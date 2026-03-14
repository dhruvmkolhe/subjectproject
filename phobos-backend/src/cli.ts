import { access } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { Command } from "commander";

import { loadConfig } from "./config.js";
import { logger } from "./logging.js";
import { startApiServer } from "./server.js";
import { startWatcher, stopWatcher } from "./daemon/watcher.js";
import { backupFile, BackupError } from "./services/backupService.js";
import {
  CleanerError,
  getFileMetadata,
  REMOVABLE_GROUPS,
  sanitizeFile,
} from "./services/cleanerService.js";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function promptForConfirmation(): Promise<boolean> {
  const readline = createInterface({ input, output });
  try {
    const answer = await readline.question(
      "Proceed with metadata removal? [y/N] ",
    );
    return ["y", "yes"].includes(answer.trim().toLowerCase());
  } finally {
    readline.close();
  }
}

export function createCli(): Command {
  const program = new Command();
  program.name("phobos").description("CleanSlate CLI").version("0.1.0");

  program
    .command("health")
    .description("Sanity check; prints OK.")
    .action(() => {
      console.log("OK");
    });

  program
    .command("sanitize")
    .description("Remove metadata from a file.")
    .argument("<filepath>", "Path to file to sanitize")
    .option("--dry-run", "Show metadata and skip removal", false)
    .option("--confirm", "Skip confirmation prompt", false)
    .option(
      "--show-all-metadata",
      "Show all metadata (not only removable)",
      false,
    )
    .action(
      async (
        filePath: string,
        options: {
          dryRun: boolean;
          confirm: boolean;
          showAllMetadata: boolean;
        },
      ) => {
        if (!(await fileExists(filePath))) {
          console.error(`Error: File not found: ${filePath}`);
          process.exitCode = 1;
          return;
        }

        try {
          console.log(`Sanitizing: ${filePath}`);
          const metadataResult = await getFileMetadata(filePath, true);
          const metadata = metadataResult.metadata;

          if (options.showAllMetadata) {
            console.log("All metadata (including non-removable):");
            console.log(JSON.stringify(metadata, null, 2));
          } else {
            const removableEntries = Object.fromEntries(
              Object.entries(metadata).filter(([key]) => {
                const [group] = key.split(":", 1);
                return key.includes(":") && REMOVABLE_GROUPS.has(group);
              }),
            );

            console.log("Metadata that will be removed:");
            if (Object.keys(removableEntries).length > 0) {
              console.log(JSON.stringify(removableEntries, null, 2));
            } else {
              console.log("  (No removable metadata found)");
            }
          }

          if (options.dryRun) {
            console.log("Dry run: no changes made.");
            return;
          }

          if (!options.confirm) {
            const proceed = await promptForConfirmation();
            if (!proceed) {
              console.log("Aborted.");
              return;
            }
          }

          const result = await sanitizeFile(filePath);
          console.log("Sanitized successfully");
          console.log(`  File: ${result.file}`);
          console.log(`  Size: ${result.fileSize} bytes`);
        } catch (error) {
          if (error instanceof CleanerError) {
            console.error(`Error: ${error.message}`);
            process.exitCode = 1;
            return;
          }

          throw error;
        }
      },
    );

  program
    .command("backup")
    .description("Backup a file to cloud storage.")
    .argument("<filepath>", "Path to file to backup")
    .option("--remote <remote>", "Remote destination", "gdrive:backups")
    .action(async (filePath: string, options: { remote: string }) => {
      if (!(await fileExists(filePath))) {
        console.error(`Error: File not found: ${filePath}`);
        process.exitCode = 1;
        return;
      }

      try {
        console.log(`Backing up: ${filePath} -> ${options.remote}`);
        const result = await backupFile(filePath, options.remote);
        console.log("Backup successful");
        console.log(`  File: ${result.file}`);
        console.log(`  Remote: ${result.remote}`);
      } catch (error) {
        if (error instanceof BackupError) {
          console.error(`Error: ${error.message}`);
          process.exitCode = 1;
          return;
        }

        throw error;
      }
    });

  program
    .command("run-daemon")
    .description("Start the file watcher daemon.")
    .option("--watch-dir <watchDir>", "Directory to watch")
    .option("--output-dir <outputDir>", "Output directory")
    .option("--remote <remote>", "Rclone remote destination")
    .action(
      async (options: {
        watchDir?: string;
        outputDir?: string;
        remote?: string;
      }) => {
        const config = loadConfig();
        const watchDir = options.watchDir ?? config.watchDir;
        const outputDir = options.outputDir ?? config.outputDir;
        const remote =
          options.remote ??
          `${config.rcloneRemoteName}:${config.rcloneDestPath}`;

        console.log("Starting daemon...");
        console.log(`  Watch: ${watchDir}`);
        console.log(`  Output: ${outputDir}`);
        console.log(`  Remote: ${remote}`);

        const watcher = await startWatcher(watchDir, outputDir, remote);
        console.log("Daemon started. Press Ctrl+C to stop.");

        await new Promise<void>((resolve) => {
          const stop = async () => {
            console.log("Stopping daemon...");
            await stopWatcher(watcher);
            console.log("Daemon stopped");
            resolve();
          };

          process.once("SIGINT", () => {
            void stop();
          });
          process.once("SIGTERM", () => {
            void stop();
          });
        });
      },
    );

  program
    .command("run-api")
    .description("Start the API server.")
    .option("--host <host>", "Host to bind")
    .option("--port <port>", "Port to bind")
    .action(async (options: { host?: string; port?: string }) => {
      const config = loadConfig();
      const host = options.host ?? config.host;
      const port = options.port
        ? Number.parseInt(options.port, 10)
        : config.port;

      console.log(`Starting API server on ${host}:${port}`);
      await startApiServer(host, port);
      logger.info(`API server listening on ${host}:${port}`);
      await new Promise<void>(() => undefined);
    });

  return program;
}

export async function runCli(argv: string[]): Promise<void> {
  const program = createCli();
  await program.parseAsync(argv);
}
