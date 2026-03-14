import { stat } from "node:fs/promises";

import { logger } from "../logging.js";
import { runCommand } from "../process.js";

export class BackupError extends Error {}

export interface BackupResult {
  success: true;
  file: string;
  remote: string;
  output: string[];
  exitCode: number;
  jsonOutput: unknown[] | null;
}

async function validateLocalFile(localPath: string): Promise<void> {
  let fileStats;
  try {
    fileStats = await stat(localPath);
  } catch {
    throw new Error(`Local file not found: ${localPath}`);
  }

  if (!fileStats.isFile()) {
    throw new BackupError(`Path is not a file: ${localPath}`);
  }
}

export async function backupFile(
  localPath: string,
  remoteDest: string,
): Promise<BackupResult> {
  await validateLocalFile(localPath);
  logger.debug(`Starting backup for ${localPath} to ${remoteDest}`);

  let result;
  try {
    result = await runCommand("rclone", ["copy", localPath, remoteDest]);
  } catch (error) {
    throw new BackupError((error as Error).message);
  }

  const outputLines = result.stdout.trim()
    ? result.stdout.trim().split(/\r?\n/)
    : [];
  const errors = result.stderr.trim()
    ? result.stderr.trim().split(/\r?\n/)
    : [];

  if (result.exitCode !== 0) {
    const errorMessage = errors.join(" ") || "rclone command failed";
    throw new BackupError(
      `Backup failed: ${errorMessage} (exit code: ${result.exitCode})`,
    );
  }

  let jsonOutput: unknown[] | null = null;
  if (outputLines.length > 0) {
    try {
      jsonOutput = outputLines.filter(Boolean).map((line) => JSON.parse(line));
    } catch {
      jsonOutput = null;
    }
  }

  return {
    success: true,
    file: localPath,
    remote: remoteDest,
    output: outputLines,
    exitCode: result.exitCode,
    jsonOutput,
  };
}

export async function generateRemoteLink(remotePath: string): Promise<string> {
  let result;
  try {
    result = await runCommand("rclone", ["link", remotePath]);
  } catch (error) {
    throw new BackupError((error as Error).message);
  }

  if (result.exitCode !== 0) {
    const errorMessage = result.stderr.trim() || "rclone link failed";
    throw new BackupError(
      `Failed to generate link: ${errorMessage} (exit code: ${result.exitCode})`,
    );
  }

  const link = result.stdout.trim();
  if (!link) {
    throw new BackupError("rclone link returned empty output");
  }

  return link;
}
