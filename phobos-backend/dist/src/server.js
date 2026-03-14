import { createApp } from "./api/app.js";
export async function startApiServer(host, port) {
    const app = createApp();
    return await new Promise((resolve, reject) => {
        const server = app.listen(port, host, () => resolve(server));
        server.on("error", reject);
    });
}
export async function stopApiServer(server) {
    await new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
