# CleanSlate (Phobos Backend)

This backend has been converted from Python to a Node.js + TypeScript service. It preserves the same responsibilities:

- strip metadata with exiftool
- back up files with rclone
- log processing events to MongoDB
- expose HTTP endpoints for health, status, sanitize, and backup
- run as a CLI, API server, or watcher daemon

## Runtime Surface

The Node implementation keeps the same public behavior the Python version exposed:

- `health`
- `sanitize <file>`
- `backup <file>`
- `run-api`
- `run-daemon`
- `GET /health`
- `GET /status`
- `POST /sanitize`
- `POST /backup`
- `GET /api/cleaned-files`

## Supported File Types

- Images: `.jpg`, `.jpeg`, `.png`
- Documents: `.pdf`
- Videos: `.mp4`, `.mov`

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and adjust the values for your environment.

3. Run the backend:

```bash
# Health check
npm run dev -- health

# Sanitize a file
npm run dev -- sanitize /path/to/photo.jpg --confirm

# Preview only
npm run dev -- sanitize /path/to/photo.jpg --dry-run

# Show all metadata
npm run dev -- sanitize /path/to/photo.jpg --dry-run --show-all-metadata

# Backup a file
npm run dev -- backup /path/to/file.pdf --remote gdrive:backups

# Start API server
npm run dev -- run-api

# Start watcher daemon only
npm run dev -- run-daemon
```

If you launch the entrypoint with no CLI arguments, it behaves like the Python version did:

- `DAEMON_MODE=true`: start watcher + API server
- `DAEMON_MODE=false`: start API server only

## API

### `GET /health`

Returns a simple health payload.

### `GET /status`

Returns runtime status, timestamp, and service availability.

### `POST /sanitize`

Upload a file with multipart form field `file`. The service:

1. stores the upload in a temp directory
2. reads grouped metadata with exiftool
3. sanitizes the file in place
4. reads metadata again
5. computes the removed/changed metadata diff
6. uploads the sanitized file to the configured rclone destination
7. returns a shareable link from `rclone link`

Example:

```bash
curl -X POST http://localhost:8000/sanitize \
  -F "file=@/path/to/photo.jpg"
```

### `POST /backup`

Backs up an existing local file using query parameters:

```bash
curl -X POST "http://localhost:8000/backup?file_path=/path/to/photo.jpg&remote=gdrive:backups"
```

## Configuration

| Variable             | Default                     | Description                                       |
| -------------------- | --------------------------- | ------------------------------------------------- |
| `DAEMON_MODE`        | `true`                      | Start watcher + API when no CLI args are provided |
| `WATCH_DIR`          | `/data/watch`               | Directory to monitor for new files                |
| `OUTPUT_DIR`         | `/data/clean`               | Directory for sanitized output                    |
| `RCLONE_REMOTE_NAME` | `gdrive`                    | Default rclone remote                             |
| `RCLONE_DEST_PATH`   | `backups`                   | Default folder on the rclone remote               |
| `MONGODB_ENABLED`    | `true`                      | Toggle MongoDB event logging                      |
| `MONGODB_URI`        | `mongodb://localhost:27017` | MongoDB connection URI                            |
| `MONGODB_DATABASE`   | `phobos`                    | MongoDB database name                             |
| `MONGODB_COLLECTION` | `file_events`               | MongoDB collection for event logs                 |
| `VERBOSE_LOGGING`    | `false`                     | Enable debug logging                              |
| `HOST`               | `0.0.0.0`                   | HTTP bind host                                    |
| `PORT`               | `8000`                      | HTTP bind port                                    |

Invalid boolean values are rejected during config loading, except `MONGODB_ENABLED`, which remains fail-safe false inside the database service if read directly there.

## Architecture

- `src/services/cleanerService.ts`: exiftool integration and metadata reads
- `src/services/backupService.ts`: rclone copy and link generation
- `src/services/dbService.ts`: lazy MongoDB client and event logging
- `src/daemon/watcher.ts`: chokidar-based watcher and processing pipeline
- `src/api/app.ts`: Express application and upload routes
- `src/cli.ts`: Commander-based CLI
- `src/main.ts`: entrypoint that dispatches CLI, daemon mode, or API mode

## Docker

Build and run with Docker as before:

```bash
docker build -t cleanslate .
docker compose up --build
```

The container installs `exiftool` and `rclone`, builds the TypeScript project, and runs `node dist/main.js`.

## Testing

```bash
npm test
```

The test suite is now Vitest-based and covers the Node services, API routes, watcher behavior, and entrypoint routing.
