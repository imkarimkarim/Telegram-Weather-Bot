import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'user_preferences.json');

interface UserPreferences {
  [chatId: string]: {
    defaultCity?: string;
  };
}

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Initialize DB file if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

function readDB(): UserPreferences {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

function writeDB(data: UserPreferences) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function setDefaultCity(chatId: string, city: string) {
  const db = readDB();
  db[chatId] = { ...db[chatId], defaultCity: city };
  writeDB(db);
}

export function getDefaultCity(chatId: string): string {
  const db = readDB();
  return db[chatId]?.defaultCity || 'Astaneh-ye Ashrafiyeh';
}

export function resetDefaultCity(chatId: string) {
  const db = readDB();
  if (db[chatId]) {
    delete db[chatId].defaultCity;
    writeDB(db);
  }
}
