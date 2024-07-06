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
Object.defineProperty(exports, "__esModule", { value: true });
const youtubeApi_1 = require("../services/youtubeApi");
const getVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { language } = req.body;
    const lang = language || 'pt';
    try {
        const videos = yield (0, youtubeApi_1.getYouTubeVideos)(lang);
        res.status(200).json(videos);
    }
    catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});
exports.default = getVideos;
