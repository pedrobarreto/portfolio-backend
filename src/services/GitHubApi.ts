import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { translate } from '@vitalets/google-translate-api';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

const githubApi: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GITHUB_API_BASE_URL,
});

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const CACHE_FILE_EN = path.join(CACHE_DIR, 'projects.json');
const CACHE_FILE_PT = path.join(CACHE_DIR, 'projects_pt.json');

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

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  const { text: translatedText } = await translate(text, { to: targetLanguage });
  return translatedText;
};

const updateProjectsCache = async (language: string): Promise<void> => {
  const cacheFile = language === 'en' ? CACHE_FILE_EN : CACHE_FILE_PT;
  const cache = loadCache(cacheFile);
  const { data }: AxiosResponse<any[]> = await githubApi.get('/repos');

  if (!Array.isArray(data)) {
    throw new Error('Unexpected response format');
  }

  const updatedProjects: Project[] = await Promise.all(
    data.map(async (project: any) => {
      const filteredProject = filterProjectFields(project);

      if (language === 'pt' && filteredProject.description) {
        filteredProject.description = await translateText(filteredProject.description, 'pt');
      }

      return filteredProject;
    })
  );

  cache.projects = updatedProjects;
  saveCache(cacheFile, cache);
};

export const requestProjects = async (endpoint: string, language: string, page: number): Promise<Project[]> => {
  const cacheFile = language === 'en' ? CACHE_FILE_EN : CACHE_FILE_PT;
  const cache = loadCache(cacheFile);
  const cacheKey = `${endpoint}-${language}-${page}`;
  const lastUpdateKey = 'lastUpdate';

  // Verificar se é a primeira requisição do dia
  const today = new Date().toLocaleDateString();
  const lastUpdate = cache[lastUpdateKey];

  if (!lastUpdate || lastUpdate !== today) {
    await updateProjectsCache(language);
    cache[lastUpdateKey] = today;
    saveCache(cacheFile, cache);
  }

  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  const { data }: AxiosResponse<any[]> = await githubApi.get(endpoint, { params: { page } });

  if (!Array.isArray(data)) {
    throw new Error('Unexpected response format');
  }

  const projects: Project[] = await Promise.all(
    data.map(async (project: any) => {
      const filteredProject = filterProjectFields(project);

      if (language === 'pt' && filteredProject.description) {
        filteredProject.description = await translateText(filteredProject.description, 'pt');
      }

      return filteredProject;
    })
  );

  cache[cacheKey] = projects;
  saveCache(cacheFile, cache);

  return projects;
};

const filterProjectFields = (project: any): Project => ({
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



cron.schedule('0 9 * * *', async () => {
  try {
    await updateProjectsCache('pt');
    await updateProjectsCache('en'); 
    console.log('Projects cache updated successfully at 9:00 AM');
  } catch (error) {
    console.error('Erro ao atualizar projetos:', error);
  }
});
