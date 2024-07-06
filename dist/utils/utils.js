"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getItemsFromCache = exports.scheduleDailyUpdate = exports.getCacheFilePath = exports.translateTexts = exports.translateText = exports.saveCache = exports.loadCache = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const google_translate_api_1 = require("@vitalets/google-translate-api");
const node_cron_1 = __importDefault(require("node-cron"));
const loadCache = (filePath) => {
    try {
        if (fs_1.default.existsSync(filePath)) {
            const cacheData = fs_1.default.readFileSync(filePath, 'utf-8');
            return JSON.parse(cacheData);
        }
        return {};
    }
    catch (error) {
        console.error(`Error loading cache from ${filePath}:`, error);
        return {};
    }
};
exports.loadCache = loadCache;
const saveCache = (filePath, cache) => {
    try {
        fs_1.default.writeFileSync(filePath, JSON.stringify(cache, null, 2));
        console.log(`Cache saved to ${filePath}`);
    }
    catch (error) {
        console.error(`Error saving cache to ${filePath}:`, error);
    }
};
exports.saveCache = saveCache;
const translateText = (text, targetLanguage) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text: translatedText } = yield (0, google_translate_api_1.translate)(text, { to: targetLanguage });
        return translatedText;
    }
    catch (error) {
        console.error('Translation error:', error);
        return text;
    }
});
exports.translateText = translateText;
const translateTexts = (texts, targetLanguage) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const translationPromises = texts.map(text => (0, google_translate_api_1.translate)(text, { to: targetLanguage }));
        const translations = yield Promise.all(translationPromises);
        return translations.map(result => result.text);
    }
    catch (error) {
        console.error('Translation error:', error);
        return texts;
    }
});
exports.translateTexts = translateTexts;
const getCacheFilePath = (language, type) => {
    const CACHE_DIR = path_1.default.join(__dirname, '..', 'cache');
    return path_1.default.join(CACHE_DIR, `${type}_${language}.json`);
};
exports.getCacheFilePath = getCacheFilePath;
const scheduleDailyUpdate = (updateFunction, cronTime, timeZone = 'America/Sao_Paulo') => {
    node_cron_1.default.schedule(cronTime, () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield updateFunction();
            console.log(`Cache updated successfully at ${cronTime}`);
        }
        catch (error) {
            console.error('Error updating cache:', error);
        }
    }), {
        timezone: timeZone
    });
};
exports.scheduleDailyUpdate = scheduleDailyUpdate;
const getItemsFromCache = (language, type) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cacheFile = (0, exports.getCacheFilePath)(language, type);
        const cache = (0, exports.loadCache)(cacheFile);
        const lastUpdateKey = 'lastUpdate';
        const today = new Date().toLocaleDateString();
        const lastUpdate = cache[lastUpdateKey];
        if (!lastUpdate || lastUpdate !== today) {
            console.log('Cache not updated today. It will be updated at the scheduled time.');
        }
        return cache[type] || [];
    }
    catch (error) {
        console.error(`Error fetching ${type}:`, error);
        return [];
    }
});
exports.getItemsFromCache = getItemsFromCache;
