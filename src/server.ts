import express, { Request, Response, NextFunction } from 'express';
import getPosts from './controllers/blogPostsController';
import getProjects from './controllers/projectsController';
import getVideos from './controllers/videosController';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());
const port = 10000;


const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === process.env.APIKEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
  }
};


app.post('/posts', apiKeyMiddleware, getPosts);
app.post('/projects', apiKeyMiddleware, getProjects);
app.post('/videos', apiKeyMiddleware, getVideos);

app.listen(port, () => console.log(`funcionando na porta: ${port}!`));
