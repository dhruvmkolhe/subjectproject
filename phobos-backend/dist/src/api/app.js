import { mkdir, stat, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import multer from "multer";
import { loadConfig } from "../config.js";
import { logger } from "../logging.js";
import { backupFile, BackupError, generateRemoteLink, } from "../services/backupService.js";
import { CleanerError, getFileMetadata, sanitizeFile, } from "../services/cleanerService.js";
const uploadDirectory = path.join(os.tmpdir(), "cleanslate_uploads");
const storage = multer.diskStorage({
    destination: (_request, _file, callback) => {
        void mkdir(uploadDirectory, { recursive: true })
            .then(() => {
            callback(null, uploadDirectory);
        })
            .catch((error) => {
            callback(error, uploadDirectory);
        });
    },
    filename: (_request, file, callback) => {
        callback(null, `${randomUUID()}${path.extname(file.originalname)}`);
    },
});
const upload = multer({ storage });
function sendError(response, statusCode, detail) {
    response.status(statusCode).json({ detail });
}
const cleanedFiles = [];
export function createApp() {
    const app = express();
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());
    app.get("/health", (_request, response) => {
        response.json({ status: "ok", service: "cleanslate" });
    });
    app.get("/status", (_request, response) => {
        response.json({
            status: "running",
            timestamp: new Date().toISOString(),
            services: {
                backup: "available",
                sanitize: "available",
                database: "available",
            },
        });
    });
    app.get("/api/cleaned-files", (_request, response) => {
        response.json(cleanedFiles);
    });
    app.post("/sanitize", upload.single("file"), async (request, response) => {
        const uploadedFile = request.file;
        if (!uploadedFile) {
            sendError(response, 400, "File upload is required");
            return;
        }
        const config = loadConfig();
        const remoteBase = `${config.rcloneRemoteName}:${config.rcloneDestPath}`.replace(/\/+$/, "");
        const temporaryFilePath = uploadedFile.path;
        try {
            const before = (await getFileMetadata(temporaryFilePath, true))
                .metadata;
            const sanitizeResult = await sanitizeFile(temporaryFilePath);
            const after = (await getFileMetadata(temporaryFilePath, true)).metadata;
            const removedMetadata = {};
            for (const [key, value] of Object.entries(before)) {
                const afterValue = after[key];
                if (!(key in after) || afterValue !== value) {
                    removedMetadata[key] = {
                        before: value,
                        after: key in after ? (afterValue ?? null) : null,
                    };
                }
            }
            const safeName = path.basename(uploadedFile.originalname || path.basename(temporaryFilePath));
            const remotePath = `${remoteBase}/${safeName}`;
            await backupFile(temporaryFilePath, remotePath);
            const remoteLink = await generateRemoteLink(remotePath);
            const metadataRemovedKeys = Object.keys(removedMetadata);
            cleanedFiles.unshift({
                id: randomUUID(),
                name: safeName,
                originalName: uploadedFile.originalname || safeName,
                type: uploadedFile.mimetype || "application/octet-stream",
                size: sanitizeResult.fileSize,
                cleanedDate: new Date().toISOString(),
                metadataRemoved: metadataRemovedKeys,
                backupLocation: remotePath,
                downloadUrl: remoteLink,
            });
            response.json({
                success: true,
                message: "File sanitized successfully",
                file_path: sanitizeResult.file,
                file_size: sanitizeResult.fileSize,
                metadata_before: before,
                metadata_after: after,
                removed_metadata: removedMetadata,
                remote_link: remoteLink,
            });
        }
        catch (error) {
            if (error instanceof CleanerError || error instanceof BackupError) {
                sendError(response, 400, error.message);
                return;
            }
            logger.error(`Unexpected error during sanitization: ${error.message}`);
            sendError(response, 500, "Internal server error");
        }
        finally {
            try {
                await unlink(temporaryFilePath);
            }
            catch {
                logger.warn(`Failed to remove temp file ${temporaryFilePath}`);
            }
        }
    });
    app.post("/backup", async (request, response) => {
        const filePath = request.query.file_path;
        const remote = typeof request.query.remote === "string"
            ? request.query.remote
            : "gdrive:backups";
        if (typeof filePath !== "string" || filePath.trim() === "") {
            sendError(response, 400, "file_path query parameter is required");
            return;
        }
        try {
            await stat(filePath);
        }
        catch {
            sendError(response, 404, `File not found: ${filePath}`);
            return;
        }
        try {
            const result = await backupFile(filePath, remote);
            response.json({
                success: true,
                message: "File backed up successfully",
                file: result.file,
                remote: result.remote,
            });
        }
        catch (error) {
            if (error instanceof BackupError) {
                sendError(response, 400, error.message);
                return;
            }
            logger.error(`Unexpected error during backup: ${error.message}`);
            sendError(response, 500, "Internal server error");
        }
    });
    return app;
}
