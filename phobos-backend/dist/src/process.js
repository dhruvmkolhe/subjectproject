import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
export async function runCommand(command, args) {
    try {
        const result = await execFileAsync(command, args, {
            maxBuffer: 10 * 1024 * 1024,
            windowsHide: true,
        });
        return {
            stdout: result.stdout ?? "",
            stderr: result.stderr ?? "",
            exitCode: 0,
        };
    }
    catch (error) {
        const commandError = error;
        if (commandError.code === "ENOENT") {
            throw new Error(`${command} not found in PATH: ${commandError.message}`);
        }
        return {
            stdout: commandError.stdout ?? "",
            stderr: commandError.stderr ?? "",
            exitCode: typeof commandError.code === "number" ? commandError.code : 1,
        };
    }
}
