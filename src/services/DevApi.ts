import axios, { AxiosInstance, AxiosResponse, AxiosRequestHeaders } from 'axios';
import { translate } from '@vitalets/google-translate-api';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const devApi: AxiosInstance = axios.create({
  baseURL: 'https://dev.to/api/',
});

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const CACHE_FILE_EN = path.join(CACHE_DIR, 'posts.json');
const CACHE_FILE_PT = path.join(CACHE_DIR, 'posts_pt.json');

interface Post {
  type_of: string;
  id: number;
  title: string;
  description: string;
  readable_publish_date: string;
  slug: string;
  path: string;
  url: string;
  comments_count: number;
  public_reactions_count: number;
  collection_id: number | null;
  published_timestamp: string;
  positive_reactions_count: number;
  cover_image: string | null;
  social_image: string;
  canonical_url: string;
  created_at: string;
  edited_at: string | null;
  crossposted_at: string | null;
  published_at: string;
  last_comment_at: string;
  reading_time_minutes: number;
  tag_list: string[];
  tags: string;
  user: {
    name: string;
    username: string;
    twitter_username: string | null;
    github_username: string | null;
    user_id: number;
    website_url: string | null;
    profile_image: string;
    profile_image_90: string;
  };
}

const loadCache = (filePath: string): Record<string, any> => {
  if (fs.existsSync(filePath)) {
    const cacheData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(cacheData);
  }
  return {};
};

const saveCache = (filePath: string, cache: any): void => {
  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
};

const filterPostFields = (post: any): Post => ({
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

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  const { text: translatedText } = await translate(text, { to: targetLanguage });
  return translatedText;
};

const updatePostsCache = async (language: string): Promise<void> => {
  const cacheFile = language === 'en' ? CACHE_FILE_EN : CACHE_FILE_PT;
  const cache = loadCache(cacheFile);
  const headers: AxiosRequestHeaders = { 'api-key': process.env.APIKEY as string };

  const { data }: AxiosResponse<any[]> = await devApi.get('articles?username=pedrobarreto', { headers });

  if (!Array.isArray(data)) {
    throw new Error('Unexpected response format');
  }

  const textsToTranslate: string[] = [];
  const updatedPosts: Post[] = data.filter((post: any) => post.id !== 1723351).map((post: any) => {
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
    const translatedTexts = await translateText(textsToTranslate.join('\n'), 'en');
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
};


const scheduleDailyUpdate = () => {
  cron.schedule('0 5 * * *', async () => {
    try {
      await updatePostsCache('en'); 
      await updatePostsCache('pt'); 
      console.log('Post cache updated successfully at 5:00 AM');
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  }, {
    timezone: 'America/Sao_Paulo' 
  });
};


scheduleDailyUpdate();

export const getDevApi = async ({ endpoint, pagination }: any, language: string): Promise<Post[]> => {
  const cacheFile = language === 'en' ? CACHE_FILE_EN : CACHE_FILE_PT;
  const cache = loadCache(cacheFile);
  const cacheKey = `${endpoint}-${language}-${pagination}`;
  const lastUpdateKey = 'lastUpdate';


  const today = new Date().toLocaleDateString();
  const lastUpdate = cache[lastUpdateKey];

  if (!lastUpdate || lastUpdate !== today) {
    await updatePostsCache(language);
    cache[lastUpdateKey] = today;
    saveCache(cacheFile, cache);
  }

  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  const params = { per_page: 6, page: pagination };
  const headers: AxiosRequestHeaders = { 'api-key': process.env.APIKEY as string };
  const { data }: AxiosResponse<any[]> = await devApi.get(`articles?username=pedrobarreto`, { params, headers });

  if (!Array.isArray(data)) {
    throw new Error('Unexpected response format');
  }

  const posts: Post[] = await Promise.all(
    data.filter((post: any) => post.id !== 1723351).map(async (post: any) => {
      const filteredPost = filterPostFields(post);

      if (language === 'en' && filteredPost.description) {
        filteredPost.description = await translateText(filteredPost.description, 'en');
        filteredPost.title = await translateText(filteredPost.title, 'en');
      }

      return filteredPost;
    })
  );

  cache[cacheKey] = posts;
  saveCache(cacheFile, cache);

  return posts;
};
