import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/services/backupService.js", () => ({
  BackupError: class BackupError extends Error {},
  backupFile: vi.fn(),
}));

vi.mock("../../src/services/cleanerService.js", () => ({
  CleanerError: class CleanerError extends Error {},
  SUPPORTED_EXTENSIONS: new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
    ".mp4",
    ".mov",
  ]),
  sanitizeFile: vi.fn(),
}));

vi.mock("../../src/services/dbService.js", () => ({
  DatabaseError: class DatabaseError extends Error {},
  logFileEvent: vi.fn(),
}));

import { FileProcessingHandler } from "../../src/daemon/watcher.js";
import { backupFile } from "../../src/services/backupService.js";
import { sanitizeFile } from "../../src/services/cleanerService.js";
import { logFileEvent } from "../../src/services/dbService.js";

const backupFileMock = vi.mocked(backupFile);
const sanitizeFileMock = vi.mocked(sanitizeFile);
const logFileEventMock = vi.mocked(logFileEvent);

describe("watcher", () => {
  let tempDir: string;
  let watchDir: string;
  let outputDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "phobos-watcher-"));
    watchDir = path.join(tempDir, "watch");
    outputDir = path.join(tempDir, "output");
    await mkdir(watchDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
    backupFileMock.mockReset();
    sanitizeFileMock.mockReset();
    logFileEventMock.mockReset();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("processes a file and resolves name conflicts", async () => {
    const existingFile = path.join(outputDir, "test.jpg");
    const sourceFile = path.join(watchDir, "test.jpg");
    await writeFile(existingFile, "existing");
    await writeFile(sourceFile, "new-data");

    backupFileMock.mockResolvedValue({
      success: true,
      file: sourceFile,
      remote: "gdrive:backups",
      output: [],
      exitCode: 0,
      jsonOutput: null,
    });
    sanitizeFileMock.mockResolvedValue({
      success: true,
      file: sourceFile,
      extension: ".jpg",
      fileSize: 8,
      exitCode: 0,
      output: "updated",
    });
    logFileEventMock.mockResolvedValue("doc123");

    const handler = new FileProcessingHandler(
      watchDir,
      outputDir,
      "gdrive:backups",
    );
    await handler.initialize();
    await handler.processFile(sourceFile);

    expect(backupFileMock).toHaveBeenCalledOnce();
    expect(sanitizeFileMock).toHaveBeenCalledOnce();
    expect(logFileEventMock).toHaveBeenCalledOnce();
    expect(
      await import("node:fs/promises").then(({ access }) =>
        access(path.join(outputDir, "test_1.jpg")).then(
          () => true,
          () => false,
        ),
      ),
    ).toBe(true);
  });

  it("ignores unsupported files", async () => {
    const unsupportedFile = path.join(watchDir, "test.txt");
    await writeFile(unsupportedFile, "hello");

    const handler = new FileProcessingHandler(
      watchDir,
      outputDir,
      "gdrive:backups",
    );
    await handler.initialize();
    await handler.handleAdd(unsupportedFile);

    expect(backupFileMock).not.toHaveBeenCalled();
  });
});
