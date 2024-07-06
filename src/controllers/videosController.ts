import { getYouTubeVideos } from "../services/youtubeApi";

const getVideos = async (req: any, res: any) => {
  const { language } = req.body;

  const lang = language || 'pt';

  try {
    const videos = await getYouTubeVideos(lang);
    res.status(200).json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
};

export default getVideos;
