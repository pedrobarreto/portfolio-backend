import axios, { AxiosInstance, AxiosResponse, AxiosRequestHeaders } from 'axios';
import dotenv from 'dotenv';
import { loadCache, saveCache, translateTexts, getCacheFilePath, scheduleDailyUpdate, translateText } from '../utils/utils';

dotenv.config();

const devApi: AxiosInstance = axios.create({
  baseURL: 'https://dev.to/api/',
});

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

const updatePostsCache = async (language: string): Promise<void> => {
  try {
    const cacheFile = getCacheFilePath(language, 'posts');
    const cache = loadCache(cacheFile) || { posts: [] };
    const headers: AxiosRequestHeaders = { 'api-key': process.env.APIKEY as string };

    const { data }: AxiosResponse<any[]> = await devApi.get('articles?username=pedrobarreto', { headers });

    if (!Array.isArray(data)) {
      throw new Error('Unexpected response format');
    }

    const updatedPosts: Post[] = data
    .filter((post: any) => post.id !== 1723351)
    .map((post: any) => filterPostFields(post));

    if (language === 'en') {
      const postsEn: Post[] = await Promise.all(
        updatedPosts.map(async (project) => {
          if (project.description) {
            project.description = await translateText(project.description, 'en');
            project.title = await translateText(project.title, 'en');
          }
          return project;
        })
      );
      cache.posts = postsEn;
    } else {
      cache.posts = updatedPosts;
    }

    cache.lastUpdate = new Date().toLocaleDateString();
    saveCache(cacheFile, cache);

  } catch (error) {
    console.error('Error updating cache:', error);
    throw error;
  }
};

// scheduleDailyUpdate(() => updatePostsCache('en'), '0 5 * * *');
// scheduleDailyUpdate(() => updatePostsCache('pt'), '0 6 * * *');

// updatePostsCache('en');
// updatePostsCache('pt');


export const getDevPosts = async ({ endpoint, pagination }: any, language: string): Promise<Post[]> => {
  const cacheFile = getCacheFilePath(language, 'posts');
  const cache = loadCache(cacheFile) || { posts: [], lastUpdate: '' };
  const cacheKey = `${endpoint}-${language}-${pagination}`;
  const today = new Date().toLocaleDateString();
  
  if (!cache.lastUpdate || cache.lastUpdate !== today) {
    await updatePostsCache(language);
    cache.lastUpdate = today;
    saveCache(cacheFile, cache);
  }

  return cache[cacheKey] || [];
};
