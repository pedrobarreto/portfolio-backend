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
exports.getDevPosts = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const utils_1 = require("../utils/utils");
dotenv_1.default.config();
const devApi = axios_1.default.create({
    baseURL: 'https://dev.to/api/',
});
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
const updatePostsCache = (language) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cacheFile = (0, utils_1.getCacheFilePath)(language, 'posts');
        const cache = (0, utils_1.loadCache)(cacheFile) || { posts: [] };
        const headers = { 'api-key': process.env.APIKEY };
        const { data } = yield devApi.get('articles?username=pedrobarreto', { headers });
        if (!Array.isArray(data)) {
            throw new Error('Unexpected response format');
        }
        const updatedPosts = data
            .filter((post) => post.id !== 1723351)
            .map((post) => filterPostFields(post));
        if (language === 'en') {
            const postsEn = yield Promise.all(updatedPosts.map((project) => __awaiter(void 0, void 0, void 0, function* () {
                if (project.description) {
                    project.description = yield (0, utils_1.translateText)(project.description, 'en');
                    project.title = yield (0, utils_1.translateText)(project.title, 'en');
                }
                return project;
            })));
            cache.posts = postsEn;
        }
        else {
            cache.posts = updatedPosts;
        }
        cache.lastUpdate = new Date().toLocaleDateString();
        (0, utils_1.saveCache)(cacheFile, cache);
    }
    catch (error) {
        console.error('Error updating cache:', error);
        throw error;
    }
});
(0, utils_1.scheduleDailyUpdate)(() => updatePostsCache('en'), '0 5 * * *');
(0, utils_1.scheduleDailyUpdate)(() => updatePostsCache('pt'), '0 6 * * *');
updatePostsCache('en');
updatePostsCache('pt');
const getDevPosts = ({ endpoint, pagination }, language) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheFile = (0, utils_1.getCacheFilePath)(language, 'posts');
    const cache = (0, utils_1.loadCache)(cacheFile) || { posts: [], lastUpdate: '' };
    const cacheKey = `${endpoint}-${language}-${pagination}`;
    const today = new Date().toLocaleDateString();
    if (!cache.lastUpdate || cache.lastUpdate !== today) {
        yield updatePostsCache(language);
        cache.lastUpdate = today;
        (0, utils_1.saveCache)(cacheFile, cache);
    }
    return cache[cacheKey] || [];
});
exports.getDevPosts = getDevPosts;
