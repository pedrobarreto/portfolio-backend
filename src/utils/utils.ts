import fs from 'fs';
import path from 'path';
import { translate } from '@vitalets/google-translate-api';
import cron from 'node-cron';


export const loadCache = (filePath: string): Record<string, any> => {
  try {
    if (fs.existsSync(filePath)) {
      const cacheData = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(cacheData);
    }
    return {};
  } catch (error) {
    console.error(`Error loading cache from ${filePath}:`, error);
    return {};
  }
};

export const saveCache = (filePath: string, cache: any): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
    console.log(`Cache saved to ${filePath}`);
  } catch (error) {
    console.error(`Error saving cache to ${filePath}:`, error);
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const { text: translatedText } = await translate(text, { to: targetLanguage });
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

export const translateTexts = async (texts: string[], targetLanguage: string): Promise<string[]> => {
  try {
    const translationPromises = texts.map(text => translate(text, { to: targetLanguage }));
    const translations = await Promise.all(translationPromises);
    return translations.map(result => result.text);
  } catch (error) {
    console.error('Translation error:', error);
    return texts;
  }
};

export const getCacheFilePath = (language: string, type: string): string => {
  const CACHE_DIR = path.join(__dirname, '..', 'cache');
  return path.join(CACHE_DIR, `${type}_${language}.json`);
};

export const scheduleDailyUpdate = (updateFunction: () => Promise<void>, cronTime: string, timeZone: string = 'America/Sao_Paulo') => {
  cron.schedule(cronTime, async () => {
    try {
      await updateFunction();
      console.log(`Cache updated successfully at ${cronTime}`);
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  }, {
    timezone: timeZone
  });
};

export const getItemsFromCache = async <T>(language: string, type: string): Promise<T[]> => {
  try {
    const cacheFile = getCacheFilePath(language, type);
    const cache = loadCache(cacheFile);
    const lastUpdateKey = 'lastUpdate';

    const today = new Date().toLocaleDateString();
    const lastUpdate = cache[lastUpdateKey];

    if (!lastUpdate || lastUpdate !== today) {
      console.log('Cache not updated today. It will be updated at the scheduled time.');
    }

    return cache[type] || [];
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    return [];
  }
};
