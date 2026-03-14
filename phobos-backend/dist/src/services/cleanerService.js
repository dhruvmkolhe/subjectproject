import { stat } from "node:fs/promises";
import path from "node:path";
import { logger } from "../logging.js";
import { runCommand } from "../process.js";
export class CleanerError extends Error {
}
export const SUPPORTED_EXTENSIONS = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
    ".mp4",
    ".mov",
]);
export const REMOVABLE_GROUPS = new Set([
    "EXIF",
    "XMP",
    "IPTC",
    "JFIF",
    "ICC_Profile",
    "PNG",
    "PDF",
    "QuickTime",
]);
async function validateFilePath(filePath) {
    let fileStats;
    try {
        fileStats = await stat(filePath);
    }
    catch {
        throw new Error(`File not found: ${filePath}`);
    }
    if (!fileStats.isFile()) {
        throw new CleanerError(`Path is not a file: ${filePath}`);
    }
    const extension = path.extname(filePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
        throw new CleanerError(`Unsupported file extension '${extension}'. Supported: ${Array.from(SUPPORTED_EXTENSIONS).sort().join(", ")}`);
    }
    return { filePath, extension };
}
export async function sanitizeFile(filePath) {
    const validated = await validateFilePath(filePath);
    logger.debug(`Starting sanitization for ${filePath}`);
    let result;
    try {
        result = await runCommand("exiftool", [
            "-all=",
            "-overwrite_original",
            validated.filePath,
        ]);
    }
    catch (error) {
        throw new CleanerError(error.message);
    }
    if (result.exitCode !== 0) {
        const errorMessage = result.stderr.trim() || "exiftool command failed";
        throw new CleanerError(`Metadata removal failed for ${filePath}: ${errorMessage} (exit code: ${result.exitCode})`);
    }
    const fileStats = await stat(filePath);
    return {
        success: true,
        file: filePath,
        extension: validated.extension,
        fileSize: fileStats.size,
        exitCode: result.exitCode,
        output: result.stdout.trim(),
    };
}
export async function getFileMetadata(filePath, grouped = false) {
    const validated = await validateFilePath(filePath);
    const args = ["exiftool"];
    if (grouped) {
        args.push("-G1");
    }
    args.push("-json", validated.filePath);
    let result;
    try {
        result = await runCommand(args[0], args.slice(1));
    }
    catch (error) {
        throw new CleanerError(error.message);
    }
    if (result.exitCode !== 0) {
        const errorMessage = result.stderr.trim() || "exiftool command failed";
        throw new CleanerError(`Metadata read failed for ${filePath}: ${errorMessage} (exit code: ${result.exitCode})`);
    }
    let parsed;
    try {
        parsed = JSON.parse(result.stdout || "[]");
    }
    catch {
        throw new CleanerError(`Failed to parse metadata for ${filePath}`);
    }
    const metadata = parsed[0] ? { ...parsed[0] } : {};
    delete metadata.SourceFile;
    return {
        success: true,
        file: filePath,
        extension: validated.extension,
        metadata,
        exitCode: result.exitCode,
    };
}
