import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/process.js", () => ({
  runCommand: vi.fn(),
}));

import {
  BackupError,
  backupFile,
  generateRemoteLink,
} from "../../src/services/backupService.js";
import { runCommand } from "../../src/process.js";

const runCommandMock = vi.mocked(runCommand);

describe("backupService", () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "phobos-backup-"));
    tempFile = path.join(tempDir, "test.txt");
    await writeFile(tempFile, "hello");
    runCommandMock.mockReset();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("backs up a file and parses JSON output", async () => {
    runCommandMock.mockResolvedValue({
      stdout: '{"status":"ok"}\n{"transferred":1}',
      stderr: "",
      exitCode: 0,
    });

    const result = await backupFile(tempFile, "gdrive:backups");

    expect(result.success).toBe(true);
    expect(result.remote).toBe("gdrive:backups");
    expect(result.jsonOutput).toEqual([{ status: "ok" }, { transferred: 1 }]);
    expect(runCommandMock).toHaveBeenCalledWith("rclone", [
      "copy",
      tempFile,
      "gdrive:backups",
    ]);
  });

  it("fails when rclone returns a non-zero exit code", async () => {
    runCommandMock.mockResolvedValue({
      stdout: "",
      stderr: "boom",
      exitCode: 2,
    });

    await expect(backupFile(tempFile, "gdrive:backups")).rejects.toThrow(
      BackupError,
    );
  });

  it("returns a generated remote link", async () => {
    runCommandMock.mockResolvedValue({
      stdout: "https://example.com/file\n",
      stderr: "",
      exitCode: 0,
    });

    await expect(generateRemoteLink("gdrive:backups/file.jpg")).resolves.toBe(
      "https://example.com/file",
    );
  });
});
