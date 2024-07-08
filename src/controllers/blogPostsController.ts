import { getDevToPosts } from '../services/DevApi';

const getPosts = async (req: any, res: any) => {
  const { pagination, language } = req.body;

  const lang = language || 'pt';

  try {
    const posts = await getDevToPosts(lang);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export default getPosts;
