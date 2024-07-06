import axios, { AxiosInstance } from 'axios';
import { translate } from '@vitalets/google-translate-api';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import cron from 'node-cron'; 

dotenv.config();

const youtubeApi: AxiosInstance = axios.create({
  baseURL: 'https://www.googleapis.com/youtube/v3/',
});

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const CACHE_FILE_EN = path.join(CACHE_DIR, 'videos_en.json');
const CACHE_FILE_PT = path.join(CACHE_DIR, 'videos_pt.json');

interface Video {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  tags: string[];
}

const loadCache = (filePath: string): Record<string, any> => {
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

const saveCache = (filePath: string, cache: any): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
    console.log(`Cache saved to ${filePath}`);
  } catch (error) {
    console.error(`Error saving cache to ${filePath}:`, error);
  }
};

const translateText = async (texts: string[], targetLanguage: string): Promise<string[]> => {
  try {
    const translationPromises = texts.map(text => translate(text, { to: targetLanguage }));
    const translations = await Promise.all(translationPromises);
    return translations.map(result => result.text);
  } catch (error) {
    console.error('Translation error:', error);
    return texts;
  }
};

const updateVideosCache = async (language: string): Promise<void> => {
  try {
    const cacheFile = language === 'en' ? CACHE_FILE_EN : CACHE_FILE_PT;
    const cache = loadCache(cacheFile);

    const { data } = await youtubeApi.get('search', {
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

    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');

    const videosResponse = await youtubeApi.get('videos', {
      params: {
        key: process.env.YOUTUBE_API_KEY,
        id: videoIds,
        part: 'snippet,contentDetails', 
      },
    });

    if (!Array.isArray(videosResponse.data.items)) {
      throw new Error('Unexpected response format for video details');
    }

    const updatedVideos: Video[] = await Promise.all(
      videosResponse.data.items.map(async (item: any) => {
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

        const filteredVideo: Video = {
          id: item.id,
          title: snippet.title,
          description: snippet.description,
          publishedAt: snippet.publishedAt,
          thumbnail: snippet.thumbnails.high,
          tags: snippet.tags || [],
        };

        if (language === 'en') {
          const textsToTranslate = [filteredVideo.title, filteredVideo.description, ...filteredVideo.tags];
          const translatedTexts = await translateText(textsToTranslate, 'en');
          
          filteredVideo.title = translatedTexts[0];
          filteredVideo.description = translatedTexts[1];
          filteredVideo.tags = translatedTexts.slice(2);
        }

        return filteredVideo;
      }).filter((video: any) => video !== null)
    );

    cache.videos = updatedVideos;
    cache.lastUpdate = new Date().toLocaleDateString();
    saveCache(cacheFile, cache);

  } catch (error) {
    console.error('Error updating cache:', error);
    throw error;
  }
};

const scheduleDailyUpdate = () => {

  cron.schedule('0 16 * * *', async () => {
    try {
      await updateVideosCache('en');
      await updateVideosCache('pt'); 
      console.log('Video cache updated successfully at 16:00 PM');
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  }, {
    timezone: 'America/Sao_Paulo' 
  });
};


scheduleDailyUpdate();

export const getYouTubeVideos = async (language: string): Promise<Video[]> => {
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
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return [];
  }
};
