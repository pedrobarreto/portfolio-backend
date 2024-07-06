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
exports.requestProjects = exports.translateText = void 0;
const axios_1 = __importDefault(require("axios"));
const google_translate_api_1 = require("@vitalets/google-translate-api");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
dotenv_1.default.config();
const githubApi = axios_1.default.create({
    baseURL: process.env.NEXT_PUBLIC_GITHUB_API_BASE_URL,
});
const CACHE_DIR = path_1.default.join(__dirname, '..', 'cache');
const CACHE_FILE_EN = path_1.default.join(CACHE_DIR, 'projects.json');
const CACHE_FILE_PT = path_1.default.join(CACHE_DIR, 'projects_pt.json');
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
const translateText = (text, targetLanguage) => __awaiter(void 0, void 0, void 0, function* () {
    const { text: translatedText } = yield (0, google_translate_api_1.translate)(text, { to: targetLanguage });
    return translatedText;
});
exports.translateText = translateText;
const updateProjectsCache = (language) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheFile = language === 'en' ? CACHE_FILE_EN : CACHE_FILE_PT;
    const cache = loadCache(cacheFile);
    const { data } = yield githubApi.get('/repos');
    if (!Array.isArray(data)) {
        throw new Error('Unexpected response format');
    }
    const updatedProjects = yield Promise.all(data.map((project) => __awaiter(void 0, void 0, void 0, function* () {
        const filteredProject = filterProjectFields(project);
        if (language === 'pt' && filteredProject.description) {
            filteredProject.description = yield (0, exports.translateText)(filteredProject.description, 'pt');
        }
        return filteredProject;
    })));
    cache.projects = updatedProjects;
    saveCache(cacheFile, cache);
});
const requestProjects = (endpoint, language, page) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheFile = language === 'en' ? CACHE_FILE_EN : CACHE_FILE_PT;
    const cache = loadCache(cacheFile);
    const cacheKey = `${endpoint}-${language}-${page}`;
    const lastUpdateKey = 'lastUpdate';
    // Verificar se é a primeira requisição do dia
    const today = new Date().toLocaleDateString();
    const lastUpdate = cache[lastUpdateKey];
    if (!lastUpdate || lastUpdate !== today) {
        yield updateProjectsCache(language);
        cache[lastUpdateKey] = today;
        saveCache(cacheFile, cache);
    }
    if (cache[cacheKey]) {
        return cache[cacheKey];
    }
    const { data } = yield githubApi.get(endpoint, { params: { page } });
    if (!Array.isArray(data)) {
        throw new Error('Unexpected response format');
    }
    const projects = yield Promise.all(data.map((project) => __awaiter(void 0, void 0, void 0, function* () {
        const filteredProject = filterProjectFields(project);
        if (language === 'pt' && filteredProject.description) {
            filteredProject.description = yield (0, exports.translateText)(filteredProject.description, 'pt');
        }
        return filteredProject;
    })));
    cache[cacheKey] = projects;
    saveCache(cacheFile, cache);
    return projects;
});
exports.requestProjects = requestProjects;
const filterProjectFields = (project) => ({
    name: project.name,
    full_name: project.full_name,
    html_url: project.html_url,
    url: project.url,
    fork: project.fork,
    description: project.description,
    created_at: project.created_at,
    updated_at: project.updated_at,
    id: project.id,
    private: project.private,
});
node_cron_1.default.schedule('0 9 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield updateProjectsCache('pt');
        yield updateProjectsCache('en');
        console.log('Projects cache updated successfully at 9:00 AM');
    }
    catch (error) {
        console.error('Erro ao atualizar projetos:', error);
    }
}));
