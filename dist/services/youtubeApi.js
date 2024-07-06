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
const dotenv_1 = __importDefault(require("dotenv"));
const utils_1 = require("../utils/utils");
dotenv_1.default.config();
const youtubeApi = axios_1.default.create({
    baseURL: 'https://www.googleapis.com/youtube/v3/',
});
const updateVideosCache = (language) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cacheFile = (0, utils_1.getCacheFilePath)(language, 'videos');
        const cache = (0, utils_1.loadCache)(cacheFile);
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
                const translatedTexts = yield (0, utils_1.translateTexts)(textsToTranslate, 'en');
                filteredVideo.title = translatedTexts[0];
                filteredVideo.description = translatedTexts[1];
                filteredVideo.tags = translatedTexts.slice(2);
            }
            return filteredVideo;
        })).filter((video) => video !== null));
        cache.videos = updatedVideos;
        cache.lastUpdate = new Date().toLocaleDateString();
        (0, utils_1.saveCache)(cacheFile, cache);
    }
    catch (error) {
        console.error('Error updating cache:', error);
        throw error;
    }
});
// scheduleDailyUpdate(() => updateVideosCache('en'), '0 16 * * *');
// scheduleDailyUpdate(() => updateVideosCache('pt'), '0 17 * * *');
// updateVideosCache('en')
// updateVideosCache('pt')
const getYouTubeVideos = (language) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, utils_1.getItemsFromCache)(language, 'videos');
});
exports.getYouTubeVideos = getYouTubeVideos;
