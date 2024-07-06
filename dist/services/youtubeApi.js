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
exports.getYouTubeVideos = void 0;
const axios_1 = __importDefault(require("axios"));
const google_translate_api_1 = require("@vitalets/google-translate-api");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
dotenv_1.default.config();
const youtubeApi = axios_1.default.create({
    baseURL: 'https://www.googleapis.com/youtube/v3/',
});
const CACHE_DIR = path_1.default.join(__dirname, '..', 'cache');
const CACHE_FILE_EN = path_1.default.join(CACHE_DIR, 'videos_en.json');
const CACHE_FILE_PT = path_1.default.join(CACHE_DIR, 'videos_pt.json');
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
const saveCache = (filePath, cache) => {
    try {
        fs_1.default.writeFileSync(filePath, JSON.stringify(cache, null, 2));
        console.log(`Cache saved to ${filePath}`);
    }
    catch (error) {
        console.error(`Error saving cache to ${filePath}:`, error);
    }
};
const translateText = (texts, targetLanguage) => __awaiter(void 0, void 0, void 0, function* () {
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
const updateVideosCache = (language) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cacheFile = language === 'en' ? CACHE_FILE_EN : CACHE_FILE_PT;
        const cache = loadCache(cacheFile);
        const { data } = yield youtubeApi.get('search', {
            params: {
                key: process.env.YOUTUBE_API_KEY,
                channelId: 'UCi_xmz8Ax4BoNcTNLTnJ4Dw',
                part: 'snippet',
                order: 'date',
                maxResults: 10,
                type: 'video',
            },
        });
        if (!Array.isArray(data.items)) {
            throw new Error('Unexpected response format');
        }
        const videoIds = data.items.map((item) => item.id.videoId).join(',');
        const videosResponse = yield youtubeApi.get('videos', {
            params: {
                key: process.env.YOUTUBE_API_KEY,
                id: videoIds,
                part: 'snippet,contentDetails',
            },
        });
        if (!Array.isArray(videosResponse.data.items)) {
            throw new Error('Unexpected response format for video details');
        }
        const updatedVideos = yield Promise.all(videosResponse.data.items.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            const snippet = item.snippet;
            const contentDetails = item.contentDetails;
            if (contentDetails && contentDetails.duration) {
                const durationMatch = contentDetails.duration.match(/PT(\d+)M(\d+)S/);
                if (durationMatch) {
                    const minutes = parseInt(durationMatch[1]);
                    const seconds = parseInt(durationMatch[2]);
                    if (minutes === 1 && seconds <= 10) {
                        return null;
                    }
                }
            }
            const filteredVideo = {
                id: item.id,
                title: snippet.title,
                description: snippet.description,
                publishedAt: snippet.publishedAt,
                thumbnail: snippet.thumbnails.high,
                tags: snippet.tags || [],
            };
            if (language === 'en') {
                const textsToTranslate = [filteredVideo.title, filteredVideo.description, ...filteredVideo.tags];
                const translatedTexts = yield translateText(textsToTranslate, 'en');
                filteredVideo.title = translatedTexts[0];
                filteredVideo.description = translatedTexts[1];
                filteredVideo.tags = translatedTexts.slice(2);
            }
            return filteredVideo;
        })).filter((video) => video !== null));
        cache.videos = updatedVideos;
        cache.lastUpdate = new Date().toLocaleDateString();
        saveCache(cacheFile, cache);
    }
    catch (error) {
        console.error('Error updating cache:', error);
        throw error;
    }
});
const scheduleDailyUpdate = () => {
    node_cron_1.default.schedule('0 16 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield updateVideosCache('en');
            yield updateVideosCache('pt');
            console.log('Video cache updated successfully at 16:00 PM');
        }
        catch (error) {
            console.error('Error updating cache:', error);
        }
    }), {
        timezone: 'America/Sao_Paulo'
    });
};
scheduleDailyUpdate();
const getYouTubeVideos = (language) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cacheFile = language === 'en' ? CACHE_FILE_EN : CACHE_FILE_PT;
        const cache = loadCache(cacheFile);
        const lastUpdateKey = 'lastUpdate';
        const today = new Date().toLocaleDateString();
        const lastUpdate = cache[lastUpdateKey];
        if (!lastUpdate || lastUpdate !== today) {
            console.log('Cache not updated today. It will be updated at 10:00 AM.');
        }
        return cache.videos || [];
    }
    catch (error) {
        console.error('Error fetching YouTube videos:', error);
        return [];
    }
});
exports.getYouTubeVideos = getYouTubeVideos;
