"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeCache = exports.readCache = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CACHE_FILE = path_1.default.join(__dirname, '..', 'cache', 'projects.json');
const readCache = () => {
    if (!fs_1.default.existsSync(CACHE_FILE)) {
        return {};
    }
    const cacheData = fs_1.default.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(cacheData);
};
exports.readCache = readCache;
const writeCache = (cache) => {
    fs_1.default.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
};
exports.writeCache = writeCache;
