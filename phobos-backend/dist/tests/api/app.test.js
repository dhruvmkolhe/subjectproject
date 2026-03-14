import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
vi.mock("../../src/services/backupService.js", () => ({
    BackupError: class BackupError extends Error {
    },
    backupFile: vi.fn(),
    generateRemoteLink: vi.fn(),
}));
vi.mock("../../src/services/cleanerService.js", () => ({
    CleanerError: class CleanerError extends Error {
    },
    getFileMetadata: vi.fn(),
    sanitizeFile: vi.fn(),
}));
import { createApp } from "../../src/api/app.js";
import { backupFile, generateRemoteLink, } from "../../src/services/backupService.js";
import { getFileMetadata, sanitizeFile, } from "../../src/services/cleanerService.js";
const backupFileMock = vi.mocked(backupFile);
const generateRemoteLinkMock = vi.mocked(generateRemoteLink);
const getFileMetadataMock = vi.mocked(getFileMetadata);
const sanitizeFileMock = vi.mocked(sanitizeFile);
afterEach(() => {
    vi.clearAllMocks();
});
describe("api", () => {
    it("returns a health payload", async () => {
        const response = await request(createApp()).get("/health");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "ok", service: "cleanslate" });
    });
    it("sanitizes an uploaded file", async () => {
        getFileMetadataMock
            .mockResolvedValueOnce({
            success: true,
            file: "tmp",
            extension: ".jpg",
            metadata: { "EXIF:Make": "Canon" },
            exitCode: 0,
        })
            .mockResolvedValueOnce({
            success: true,
            file: "tmp",
            extension: ".jpg",
            metadata: {},
            exitCode: 0,
        });
        sanitizeFileMock.mockResolvedValue({
            success: true,
            file: "tmp",
            extension: ".jpg",
            fileSize: 100,
            exitCode: 0,
            output: "updated",
        });
        backupFileMock.mockResolvedValue({
            success: true,
            file: "tmp",
            remote: "gdrive:backups/test.jpg",
            output: [],
            exitCode: 0,
            jsonOutput: null,
        });
        generateRemoteLinkMock.mockResolvedValue("https://example.com/file");
        const response = await request(createApp())
            .post("/sanitize")
            .attach("file", Buffer.from("file-data"), "test.jpg");
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.remote_link).toBe("https://example.com/file");
        expect(response.body.removed_metadata).toEqual({
            "EXIF:Make": {
                before: "Canon",
                after: null,
            },
        });
        const cleanedFilesResponse = await request(createApp()).get("/api/cleaned-files");
        expect(cleanedFilesResponse.status).toBe(200);
        expect(cleanedFilesResponse.body).toHaveLength(1);
        expect(cleanedFilesResponse.body[0]).toMatchObject({
            name: "test.jpg",
            originalName: "test.jpg",
            type: "image/jpeg",
            metadataRemoved: ["EXIF:Make"],
            downloadUrl: "https://example.com/file",
        });
    });
    it("backs up a file path", async () => {
        backupFileMock.mockResolvedValue({
            success: true,
            file: __filename,
            remote: "gdrive:backups",
            output: [],
            exitCode: 0,
            jsonOutput: null,
        });
        const response = await request(createApp()).post(`/backup?file_path=${encodeURIComponent(__filename)}`);
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
