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
exports.requestProjects = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const utils_1 = require("../utils/utils");
dotenv_1.default.config();
const githubApi = axios_1.default.create({
    baseURL: process.env.NEXT_PUBLIC_GITHUB_API_BASE_URL,
});
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
    tags: project.topics || [],
});
const updateProjectsCache = (language) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cacheFile = (0, utils_1.getCacheFilePath)(language, 'projects');
        const cache = (0, utils_1.loadCache)(cacheFile);
        const { data } = yield githubApi.get('/repos');
        if (!Array.isArray(data)) {
            throw new Error('Unexpected response format');
        }
        const projects = data
            .map((project) => filterProjectFields(project))
            .filter((project) => project.description);
        if (language === 'pt') {
            const projectsPt = yield Promise.all(projects.map((project) => __awaiter(void 0, void 0, void 0, function* () {
                if (project.description) {
                    project.description = yield (0, utils_1.translateText)(project.description, 'pt');
                }
                return project;
            })));
            cache.projects = projectsPt;
        }
        else {
            cache.projects = projects;
        }
        cache.lastUpdate = new Date().toLocaleDateString();
        (0, utils_1.saveCache)(cacheFile, cache);
    }
    catch (error) {
        console.error('Error updating cache:', error);
        throw error;
    }
});
// scheduleDailyUpdate(() => updateProjectsCache('en'), '0 9 * * *');
// scheduleDailyUpdate(() => updateProjectsCache('pt'), '0 10 * * *');
// updateProjectsCache('en')
updateProjectsCache('pt');
const requestProjects = (language) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, utils_1.getItemsFromCache)(language, 'projects');
});
exports.requestProjects = requestProjects;
