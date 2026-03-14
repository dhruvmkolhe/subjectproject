import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/process.js", () => ({
  runCommand: vi.fn(),
}));

import {
  CleanerError,
  getFileMetadata,
  sanitizeFile,
} from "../../src/services/cleanerService.js";
import { runCommand } from "../../src/process.js";

const runCommandMock = vi.mocked(runCommand);

describe("cleanerService", () => {
  let tempDir: string;
  let imageFile: string;
  let textFile: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "phobos-cleaner-"));
    imageFile = path.join(tempDir, "test.jpg");
    textFile = path.join(tempDir, "test.txt");
    await writeFile(imageFile, "image");
    await writeFile(textFile, "text");
    runCommandMock.mockReset();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("sanitizes a supported file", async () => {
    runCommandMock.mockResolvedValue({
      stdout: "1 image files updated",
      stderr: "",
      exitCode: 0,
    });

    const result = await sanitizeFile(imageFile);

    expect(result.success).toBe(true);
    expect(result.extension).toBe(".jpg");
    expect(result.fileSize).toBeGreaterThan(0);
    expect(runCommandMock).toHaveBeenCalledWith("exiftool", [
      "-all=",
      "-overwrite_original",
      imageFile,
    ]);
  });

  it("reads grouped metadata", async () => {
    runCommandMock.mockResolvedValue({
      stdout: '[{"SourceFile":"file.jpg","EXIF:Make":"Canon"}]',
      stderr: "",
      exitCode: 0,
    });

    const result = await getFileMetadata(imageFile, true);

    expect(result.metadata).toEqual({ "EXIF:Make": "Canon" });
    expect(runCommandMock).toHaveBeenCalledWith("exiftool", [
      "-G1",
      "-json",
      imageFile,
    ]);
  });

  it("rejects unsupported extensions", async () => {
    await expect(sanitizeFile(textFile)).rejects.toThrow(CleanerError);
  });
});
