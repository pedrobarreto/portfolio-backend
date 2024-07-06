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
exports.getDevApi = exports.translateText = void 0;
const axios_1 = __importDefault(require("axios"));
const google_translate_api_1 = require("@vitalets/google-translate-api");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const node_cron_1 = __importDefault(require("node-cron"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const devApi = axios_1.default.create({
    baseURL: 'https://dev.to/api/',
});
const CACHE_DIR = path_1.default.join(__dirname, '..', 'cache');
const CACHE_FILE_EN = path_1.default.join(CACHE_DIR, 'posts.json');
const CACHE_FILE_PT = path_1.default.join(CACHE_DIR, 'posts_pt.json');
const loadCache = (filePath) => {
    if (fs_1.default.existsSync(filePath)) {
        const cacheData = fs_1.default.readFileSync(filePath, 'utf-8');
        return JSON.parse(cacheData);
    }
    return {};
};
const saveCache = (filePath, cache) => {
    fs_1.default.writeFileSync(filePath, JSON.stringify(cache, null, 2));
};
const filterPostFields = (post) => ({
    type_of: post.type_of,
    id: post.id,
    title: post.title,
    description: post.description,
    readable_publish_date: post.readable_publish_date,
    slug: post.slug,
    path: post.path,
    url: post.url,
    comments_count: post.comments_count,
    public_reactions_count: post.public_reactions_count,
    collection_id: post.collection_id,
    published_timestamp: post.published_timestamp,
    positive_reactions_count: post.positive_reactions_count,
    cover_image: post.cover_image,
    social_image: post.social_image,
    canonical_url: post.canonical_url,
    created_at: post.created_at,
    edited_at: post.edited_at,
    crossposted_at: post.crossposted_at,
    published_at: post.published_at,
    last_comment_at: post.last_comment_at,
    reading_time_minutes: post.reading_time_minutes,
    tag_list: post.tag_list,
    tags: post.tags,
    user: post.user,
});
const translateText = (text, targetLanguage) => __awaiter(void 0, void 0, void 0, function* () {
    const { text: translatedText } = yield (0, google_translate_api_1.translate)(text, { to: targetLanguage });
    return translatedText;
});
exports.translateText = translateText;
const updatePostsCache = (language) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheFile = language === 'en' ? CACHE_FILE_EN : CACHE_FILE_PT;
    const cache = loadCache(cacheFile);
    const headers = { 'api-key': process.env.APIKEY };
    const { data } = yield devApi.get('articles?username=pedrobarreto', { headers });
    if (!Array.isArray(data)) {
        throw new Error('Unexpected response format');
    }
    const textsToTranslate = [];
    const updatedPosts = data.filter((post) => post.id !== 1723351).map((post) => {
        const filteredPost = filterPostFields(post);
        if (language === 'en' && filteredPost.description) {
            textsToTranslate.push(filteredPost.title);
            textsToTranslate.push(filteredPost.description);
            filteredPost.title = '';
            filteredPost.description = '';
        }
        return filteredPost;
    });
    if (textsToTranslate.length > 0) {
        const translatedTexts = yield (0, exports.translateText)(textsToTranslate.join('\n'), 'en');
        const translatedLines = translatedTexts.split('\n');
        let index = 0;
        updatedPosts.forEach((post) => {
            if (post.title === '') {
                post.title = translatedLines[index];
                index++;
            }
            if (post.description === '') {
                post.description = translatedLines[index];
                index++;
            }
        });
    }
    cache.posts = updatedPosts;
    saveCache(cacheFile, cache);
});
const scheduleDailyUpdate = () => {
    node_cron_1.default.schedule('0 5 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield updatePostsCache('en');
            yield updatePostsCache('pt');
            console.log('Post cache updated successfully at 5:00 AM');
        }
        catch (error) {
            console.error('Error updating cache:', error);
        }
    }), {
        timezone: 'America/Sao_Paulo'
    });
};
scheduleDailyUpdate();
const getDevApi = ({ endpoint, pagination }, language) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheFile = language === 'en' ? CACHE_FILE_EN : CACHE_FILE_PT;
    const cache = loadCache(cacheFile);
    const cacheKey = `${endpoint}-${language}-${pagination}`;
    const lastUpdateKey = 'lastUpdate';
    const today = new Date().toLocaleDateString();
    const lastUpdate = cache[lastUpdateKey];
    if (!lastUpdate || lastUpdate !== today) {
        yield updatePostsCache(language);
        cache[lastUpdateKey] = today;
        saveCache(cacheFile, cache);
    }
    if (cache[cacheKey]) {
        return cache[cacheKey];
    }
    const params = { per_page: 6, page: pagination };
    const headers = { 'api-key': process.env.APIKEY };
    const { data } = yield devApi.get(`articles?username=pedrobarreto`, { params, headers });
    if (!Array.isArray(data)) {
        throw new Error('Unexpected response format');
    }
    const posts = yield Promise.all(data.filter((post) => post.id !== 1723351).map((post) => __awaiter(void 0, void 0, void 0, function* () {
        const filteredPost = filterPostFields(post);
        if (language === 'en' && filteredPost.description) {
            filteredPost.description = yield (0, exports.translateText)(filteredPost.description, 'en');
            filteredPost.title = yield (0, exports.translateText)(filteredPost.title, 'en');
        }
        return filteredPost;
    })));
    cache[cacheKey] = posts;
    saveCache(cacheFile, cache);
    return posts;
});
exports.getDevApi = getDevApi;
