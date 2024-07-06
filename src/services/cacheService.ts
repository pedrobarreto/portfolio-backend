import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(__dirname, '..', 'cache', 'projects.json');

export const readCache = (): Record<string, any> => {
  if (!fs.existsSync(CACHE_FILE)) {
    return {};
  }
  const cacheData = fs.readFileSync(CACHE_FILE, 'utf-8');
  return JSON.parse(cacheData);
};

export const writeCache = (cache: Record<string, any>): void => {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
};
