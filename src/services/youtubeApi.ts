import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import { loadCache, saveCache, getCacheFilePath, scheduleDailyUpdate, getItemsFromCache, translateTexts } from '../utils/utils';

dotenv.config();

const youtubeApi: AxiosInstance = axios.create({
  baseURL: 'https://www.googleapis.com/youtube/v3/',
});

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

const updateVideosCache = async (language: string): Promise<void> => {
  try {
    const cacheFile = getCacheFilePath(language, 'videos');
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
          const translatedTexts = await translateTexts(textsToTranslate, 'en');

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

 // scheduleDailyUpdate(() => updateVideosCache('en'), '0 16 * * *');
 scheduleDailyUpdate(() => updateVideosCache('pt'), '0 17 * * *');

// updateVideosCache('en')
updateVideosCache('pt')

export const getYouTubeVideos = async (language: string): Promise<Video[]> => {
  return getItemsFromCache<Video>(language, 'videos');
};
