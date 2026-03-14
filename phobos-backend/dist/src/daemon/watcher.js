import { copyFile, mkdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import chokidar from "chokidar";
import { logger } from "../logging.js";
import { backupFile, BackupError } from "../services/backupService.js";
import { sanitizeFile, CleanerError, SUPPORTED_EXTENSIONS, } from "../services/cleanerService.js";
import { DatabaseError, logFileEvent } from "../services/dbService.js";
async function sleep(milliseconds) {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
}
async function moveFile(sourcePath, destinationPath) {
    try {
        await rename(sourcePath, destinationPath);
    }
    catch {
        await copyFile(sourcePath, destinationPath);
        await unlink(sourcePath);
    }
}
async function resolveDestinationPath(outputDir, fileName) {
    let candidate = path.join(outputDir, fileName);
    let counter = 1;
    while (await exists(candidate)) {
        const parsed = path.parse(fileName);
        candidate = path.join(outputDir, `${parsed.name}_${counter}${parsed.ext}`);
        counter += 1;
    }
    return candidate;
}
async function exists(filePath) {
    try {
        await import("node:fs/promises").then(({ access }) => access(filePath));
        return true;
    }
    catch {
        return false;
    }
}
export class FileProcessingHandler {
    watchDir;
    outputDir;
    rcloneRemote;
    constructor(watchDir, outputDir, rcloneRemote) {
        this.watchDir = watchDir;
        this.outputDir = outputDir;
        this.rcloneRemote = rcloneRemote;
    }
    async initialize() {
        await mkdir(this.watchDir, { recursive: true });
        await mkdir(this.outputDir, { recursive: true });
    }
    async handleAdd(filePath) {
        const fileName = path.basename(filePath);
        if (fileName.startsWith(".") || fileName.startsWith("~")) {
            logger.debug(`Ignoring temporary file: ${fileName}`);
            return;
        }
        const extension = path.extname(filePath).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.has(extension)) {
            logger.warn(`Skipping unsupported file type: ${fileName}`);
            return;
        }
        await sleep(500);
        logger.info(`Processing new file: ${fileName}`);
        await this.processFile(filePath);
    }
    async processFile(filePath) {
        const fileName = path.basename(filePath);
        const fileType = path.extname(filePath).replace(/^\./, "").toLowerCase();
        let backedUp = false;
        let sanitized = false;
        let errorMessage = null;
        try {
            const backupResult = await backupFile(filePath, this.rcloneRemote);
            backedUp = backupResult.success;
        }
        catch (error) {
            if (error instanceof BackupError || error instanceof Error) {
                errorMessage = `Backup failed: ${error.message}`;
                logger.error(errorMessage);
            }
        }
        try {
            const sanitizeResult = await sanitizeFile(filePath);
            sanitized = sanitizeResult.success;
        }
        catch (error) {
            if (error instanceof CleanerError || error instanceof Error) {
                errorMessage = `Sanitization failed: ${error.message}`;
                logger.error(errorMessage);
            }
        }
        try {
            if (sanitized) {
                const destinationPath = await resolveDestinationPath(this.outputDir, fileName);
                await moveFile(filePath, destinationPath);
                logger.info(`Moved to ${destinationPath}`);
            }
        }
        catch (error) {
            errorMessage = `Failed to move file: ${error.message}`;
            logger.error(errorMessage);
        }
        try {
            await logFileEvent(fileName, backedUp, new Date(), fileType, {
                sanitized,
                error: errorMessage,
            });
        }
        catch (error) {
            if (error instanceof DatabaseError || error instanceof Error) {
                logger.error(`Failed to log event: ${error.message}`);
            }
        }
    }
}
export async function startWatcher(watchDir, outputDir, rcloneRemote) {
    const handler = new FileProcessingHandler(watchDir, outputDir, rcloneRemote);
    await handler.initialize();
    const watcher = chokidar.watch(watchDir, {
        ignoreInitial: true,
        depth: 0,
        awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100,
        },
    });
    watcher.on("add", (filePath) => {
        void handler.handleAdd(filePath);
    });
    logger.info(`Watcher started on ${watchDir}`);
    return watcher;
}
export async function stopWatcher(watcher) {
    await watcher.close();
    logger.info("Watcher stopped");
}
