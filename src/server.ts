import express from 'express';
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

app.post('/posts', getPosts);
app.post('/projects', getProjects);
app.post('/videos', getVideos);

app.listen(port, () => console.log(`funcionando na porta: ${port}!`));
