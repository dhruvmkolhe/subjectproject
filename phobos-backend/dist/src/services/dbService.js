import { MongoClient } from "mongodb";
export class DatabaseError extends Error {
}
let client = null;
let dbClient = null;
const TRUTHY = new Set(["1", "true", "yes", "on", "y", "t"]);
const FALSY = new Set(["0", "false", "no", "off", "n", "f"]);
function mongodbEnabled() {
    const raw = (process.env.MONGODB_ENABLED ?? "true").trim().toLowerCase();
    if (TRUTHY.has(raw)) {
        return true;
    }
    if (FALSY.has(raw)) {
        return false;
    }
    return false;
}
function getMongoSettings() {
    const uri = (process.env.MONGODB_URI ?? "mongodb://localhost:27017").trim();
    if (!uri) {
        throw new DatabaseError("MONGODB_URI environment variable is not set");
    }
    const database = (process.env.MONGODB_DATABASE ?? "phobos").trim();
    if (!database) {
        throw new DatabaseError("MONGODB_DATABASE environment variable is not set");
    }
    const collection = (process.env.MONGODB_COLLECTION ?? "file_events").trim();
    if (!collection) {
        throw new DatabaseError("MONGODB_COLLECTION environment variable is not set");
    }
    return { uri, database, collection };
}
export async function getDbClient() {
    if (!mongodbEnabled()) {
        throw new DatabaseError("MongoDB disabled via MONGODB_ENABLED=false");
    }
    if (dbClient) {
        return dbClient;
    }
    const { uri, database } = getMongoSettings();
    try {
        client = new MongoClient(uri);
        await client.connect();
        dbClient = client.db(database);
    }
    catch (error) {
        throw new DatabaseError(`Failed to connect to MongoDB: ${error.message}`);
    }
    return dbClient;
}
export async function logFileEvent(filename, originalBackedUp, timestamp = new Date(), fileType, additionalData) {
    if (!mongodbEnabled()) {
        return "mongodb_disabled";
    }
    let db;
    try {
        db = await getDbClient();
    }
    catch (error) {
        throw new DatabaseError(`Cannot log file event: ${error.message}`);
    }
    const documentData = {
        filename,
        original_backed_up: originalBackedUp,
        timestamp,
        file_type: fileType ?? null,
    };
    if (additionalData) {
        Object.assign(documentData, additionalData);
    }
    const { collection } = getMongoSettings();
    try {
        const insertResult = await db.collection(collection).insertOne(documentData);
        return insertResult.insertedId.toString();
    }
    catch (error) {
        throw new DatabaseError(`Failed to log file event: ${error.message}`);
    }
}
export function resetDbClient() {
    if (client) {
        void client.close();
    }
    client = null;
    dbClient = null;
}
