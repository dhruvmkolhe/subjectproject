import {
  CheckCircle2,
  Terminal,
  FileText,
  Video,
  Image as ImageIcon,
  Shield,
  Cloud,
  Database,
  Eye,
  Server,
  Code,
  BookOpen,
} from "lucide-react";
import Header from "@/components/Header";
import CodeBlock from "@/components/CodeBlock";

interface DocumentationProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
  user?: any;
}

const Documentation = ({
  isAuthenticated = false,
  onLogout,
  user,
}: DocumentationProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header
        isAuthenticated={isAuthenticated}
        onLogout={onLogout}
        user={user}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <main className="prose prose-slate dark:prose-invert max-w-none">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Phobos</h1>
            <p className="text-lg text-muted-foreground">
              A privacy-first metadata sanitizer powered by a Node.js +
              TypeScript backend. Phobos removes sensitive metadata with
              <code> exiftool</code>, stores cleaned outputs in cloud remotes
              through <code>rclone</code>, and logs processing events into
              MongoDB.
            </p>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-primary" />
              Features
            </h2>
            <div className="grid gap-4">
              <div className="flex gap-3 p-4 rounded-lg bg-card border">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>Metadata Removal:</strong> Strip EXIF and related
                  metadata from supported files with exiftool.
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-lg bg-card border">
                <Cloud className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>Cloud Backup:</strong> Back up processed artifacts
                  with rclone to Google Drive or any configured remote.
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-lg bg-card border">
                <Database className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>MongoDB Logging:</strong> Persist file processing
                  events to a configurable MongoDB collection.
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-lg bg-card border">
                <Eye className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>Watcher Mode:</strong> Monitor a folder and
                  auto-process newly added files.
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-lg bg-card border">
                <Server className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>Express API:</strong> Health, status, sanitize,
                  backup, and cleaned-files endpoints for app integrations.
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-lg bg-card border">
                <Terminal className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>CLI:</strong> Run sanitize, backup, and runtime
                  commands directly from the terminal.
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Supported File Types</h2>
            <div className="grid gap-3">
              <div className="flex gap-3 items-center p-3 rounded-lg bg-muted/50">
                <ImageIcon className="w-5 h-5 text-primary" />
                <div>
                  <strong>Images:</strong> <code>.jpg</code>, <code>.jpeg</code>
                  , <code>.png</code>
                </div>
              </div>
              <div className="flex gap-3 items-center p-3 rounded-lg bg-muted/50">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <strong>Documents:</strong> <code>.pdf</code>
                </div>
              </div>
              <div className="flex gap-3 items-center p-3 rounded-lg bg-muted/50">
                <Video className="w-5 h-5 text-primary" />
                <div>
                  <strong>Videos:</strong> <code>.mp4</code>, <code>.mov</code>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Quick Start</h2>

            <h3 className="text-xl font-semibold mb-4">Local Development</h3>
            <div className="mb-6">
              <h4 className="font-semibold mb-3">1. Install dependencies</h4>
              <CodeBlock
                code={`git clone https://github.com/puffious/phobos
cd phobos/phobos-backend
npm install`}
                language="bash"
              />
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-3">2. Configure environment</h4>
              <CodeBlock
                code={`DAEMON_MODE=false
WATCH_DIR=/data/watch
OUTPUT_DIR=/data/clean
RCLONE_REMOTE_NAME=gdrive
RCLONE_DEST_PATH=backups
MONGODB_ENABLED=true
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=phobos
MONGODB_COLLECTION=file_events
HOST=0.0.0.0
PORT=8000`}
                language="bash"
              />
            </div>

            <div className="mb-8">
              <h4 className="font-semibold mb-3">3. Run commands</h4>
              <CodeBlock
                code={`# Health check
npm run dev -- health

# Sanitize a file
npm run dev -- sanitize /path/to/photo.jpg --confirm

# Preview without writing changes
npm run dev -- sanitize /path/to/photo.jpg --dry-run

# Backup a file
npm run dev -- backup /path/to/file.pdf --remote gdrive:backups

# Start API server only
npm run dev -- run-api

# Start watcher daemon only
npm run dev -- run-daemon`}
                language="bash"
              />
            </div>

            <h3 className="text-xl font-semibold mb-4">Docker Deployment</h3>
            <div className="mb-6">
              <h4 className="font-semibold mb-3">1. Build image</h4>
              <CodeBlock
                code={`docker build -t cleanslate .`}
                language="bash"
              />
            </div>
            <div className="mb-6">
              <h4 className="font-semibold mb-3">2. Run stack</h4>
              <CodeBlock code={`docker compose up --build`} language="bash" />
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Code className="w-6 h-6 text-primary" />
              Architecture
            </h2>

            <h3 className="text-xl font-semibold mb-4">Services</h3>
            <ul className="space-y-2 mb-6">
              <li>
                <code>src/services/backupService.ts</code>: rclone copy and
                share-link generation.
              </li>
              <li>
                <code>src/services/cleanerService.ts</code>: exiftool metadata
                extraction and sanitization.
              </li>
              <li>
                <code>src/services/dbService.ts</code>: MongoDB client and event
                logger.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">Daemon Mode</h3>
            <p className="mb-3">
              <code>src/daemon/watcher.ts</code> monitors <code>WATCH_DIR</code>
              and, for every supported file:
            </p>
            <ol className="list-decimal list-inside space-y-2 mb-6 ml-4">
              <li>Backs up the original file to cloud storage via rclone</li>
              <li>Sanitizes metadata in place</li>
              <li>
                Moves the sanitized file to <code>OUTPUT_DIR</code>
              </li>
              <li>Logs processing details to MongoDB</li>
            </ol>

            <h3 className="text-xl font-semibold mb-4">API Endpoints</h3>
            <ul className="space-y-2 mb-6">
              <li>
                <code>GET /health</code> - Basic health check
              </li>
              <li>
                <code>GET /status</code> - Runtime status and service summary
              </li>
              <li>
                <code>POST /sanitize</code> - Upload and sanitize a file
              </li>
              <li>
                <code>POST /backup</code> - Backup an existing local file
              </li>
              <li>
                <code>GET /api/cleaned-files</code> - List cleaned-file records
                for the frontend
              </li>
            </ul>

            <div className="mb-6">
              <p className="mb-3">Example sanitize request:</p>
              <CodeBlock
                code={`curl -X POST http://localhost:8000/sanitize \\
  -F "file=@/path/to/photo.jpg"`}
                language="bash"
              />
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Configuration</h2>
            <h3 className="text-xl font-semibold mb-4">
              Environment Variables
            </h3>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Variable</th>
                    <th className="text-left p-3 font-semibold">Default</th>
                    <th className="text-left p-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">
                      <code>DAEMON_MODE</code>
                    </td>
                    <td className="p-3">
                      <code>true</code>
                    </td>
                    <td className="p-3">
                      Run watcher + API if no CLI args are passed
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code>WATCH_DIR</code>
                    </td>
                    <td className="p-3">
                      <code>/data/watch</code>
                    </td>
                    <td className="p-3">Directory watched by daemon mode</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code>OUTPUT_DIR</code>
                    </td>
                    <td className="p-3">
                      <code>/data/clean</code>
                    </td>
                    <td className="p-3">Output path for sanitized files</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code>RCLONE_REMOTE_NAME</code>
                    </td>
                    <td className="p-3">
                      <code>gdrive</code>
                    </td>
                    <td className="p-3">Configured rclone remote name</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code>RCLONE_DEST_PATH</code>
                    </td>
                    <td className="p-3">
                      <code>backups</code>
                    </td>
                    <td className="p-3">
                      Remote folder path on the rclone target
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code>MONGODB_ENABLED</code>
                    </td>
                    <td className="p-3">
                      <code>true</code>
                    </td>
                    <td className="p-3">
                      Enable/disable MongoDB event logging
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code>MONGODB_URI</code>
                    </td>
                    <td className="p-3">
                      <code>mongodb://localhost:27017</code>
                    </td>
                    <td className="p-3">MongoDB connection string</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code>MONGODB_DATABASE</code>
                    </td>
                    <td className="p-3">
                      <code>phobos</code>
                    </td>
                    <td className="p-3">MongoDB database name</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code>MONGODB_COLLECTION</code>
                    </td>
                    <td className="p-3">
                      <code>file_events</code>
                    </td>
                    <td className="p-3">
                      Collection for processing event logs
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code>HOST</code>
                    </td>
                    <td className="p-3">
                      <code>0.0.0.0</code>
                    </td>
                    <td className="p-3">API bind host</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">
                      <code>PORT</code>
                    </td>
                    <td className="p-3">
                      <code>8000</code>
                    </td>
                    <td className="p-3">API bind port</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mb-4">Setup MongoDB</h3>
            <ol className="list-decimal list-inside space-y-2 mb-6 ml-4">
              <li>Run MongoDB locally or use a managed cluster.</li>
              <li>
                Set <code>MONGODB_URI</code> and <code>MONGODB_DATABASE</code>.
              </li>
              <li>
                Optional: change <code>MONGODB_COLLECTION</code> if you want a
                custom event collection name.
              </li>
            </ol>
            <div className="mb-6">
              <CodeBlock
                code={`# Local MongoDB with Docker
docker run -d --name phobos-mongo -p 27017:27017 mongo:7`}
                language="bash"
              />
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Development
            </h2>

            <h3 className="text-xl font-semibold mb-4">Run Tests</h3>
            <div className="mb-8">
              <CodeBlock code={`npm test`} language="bash" />
            </div>

            <h3 className="text-xl font-semibold mb-4">Project Layout</h3>
            <ul className="space-y-2 mb-6">
              <li>
                <code>src/main.ts</code> - runtime entrypoint
              </li>
              <li>
                <code>src/cli.ts</code> - command-line interface
              </li>
              <li>
                <code>src/api/app.ts</code> - Express routes
              </li>
              <li>
                <code>src/daemon/watcher.ts</code> - watcher pipeline
              </li>
              <li>
                <code>src/services/</code> - cleaner, backup, database services
              </li>
              <li>
                <code>tests/</code> - Vitest test suite
              </li>
              <li>
                <code>.env.example</code> - environment template
              </li>
              <li>
                <code>Dockerfile</code> and <code>docker-compose.yml</code> -
                container runtime
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">License</h2>
            <p>MIT</p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Documentation;
