import type { Server } from "node:http";

import { createApp } from "./api/app.js";

export async function startApiServer(
  host: string,
  port: number,
): Promise<Server> {
  const app = createApp();

  return await new Promise<Server>((resolve, reject) => {
    const server = app.listen(port, host, () => resolve(server));
    server.on("error", reject);
  });
}

export async function stopApiServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
