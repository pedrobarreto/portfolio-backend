import axios, { AxiosInstance, AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import { loadCache, saveCache, translateText, getCacheFilePath, scheduleDailyUpdate, getItemsFromCache } from '../utils/utils'
dotenv.config();

const githubApi: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GITHUB_API_BASE_URL,
});

interface Project {
  name: string;
  full_name: string;
  html_url: string;
  url: string;
  fork: boolean;
  description: string;
  created_at: string;
  updated_at: string;
  id: number;
  private: boolean;
}

const filterProjectFields = (project: any): Project => ({
  name: project.name,
  full_name: project.full_name,
  html_url: project.html_url,
  url: project.url,
  fork: project.fork,
  description: project.description, // Assuming project.description is a string
  created_at: project.created_at,
  updated_at: project.updated_at,
  id: project.id,
  private: project.private,
});

const updateProjectsCache = async (language: string): Promise<void> => {
  try {
    const cacheFile = getCacheFilePath(language, 'projects');
    const cache = loadCache(cacheFile);

    const { data }: AxiosResponse<any[]> = await githubApi.get('/repos');

    if (!Array.isArray(data)) {
      throw new Error('Unexpected response format');
    }

    const projects: Project[] = data.map((project: any) => filterProjectFields(project));

    if (language === 'pt') {
      const projectsPt: Project[] = await Promise.all(
        projects.map(async (project) => {
          if (project.description) {
            project.description = await translateText(project.description, 'pt');
          }
          return project;
        })
      );
      cache.projects = projectsPt;
    } else {
      cache.projects = projects;
    }

    cache.lastUpdate = new Date().toLocaleDateString();
    saveCache(cacheFile, cache);

  } catch (error) {
    console.error('Error updating cache:', error);
    throw error;
  }
};

scheduleDailyUpdate(() => updateProjectsCache('en'), '0 9 * * *');
scheduleDailyUpdate(() => updateProjectsCache('pt'), '0 10 * * *');

// updateProjectsCache('en')
// updateProjectsCache('pt')


export const requestProjects = async (language: string): Promise<Project[]> => {
  return getItemsFromCache<Project>(language, 'projects');
};
