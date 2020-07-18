require('dotenv').config();

const fs = require('fs').promises;
const axios = require('axios');
const Parser = require('rss-parser');
const Instagram = require('instagram-web-api');
const {
  YOUTUBE_API_KEY,
  INSTAGRAM_USER,
  INSTAGRAM_TOKEN,
} = process.env;

const parser = new Parser();
const client = new Instagram({
  username: INSTAGRAM_USER,
  password: INSTAGRAM_TOKEN,
});

const NUM_POSTS = 5;
const NUM_PHOTOS = 4
const NUM_VIDEOS = 3;

const LATEST_POST_PLACEHOLDER = "%{{latest_posts}}%";
const LATEST_PHOTO_PLACEHOLDER = "%{{latest_instagram}}%";
const LATEST_VIDEO_PLACEHOLDER = "%{{latest_youtube}}%";

const getPhotosFromInstagram = async () => {
  try {
    console.log('📸 Get latest photos from Instagram...');
    await client.login();
    const { user } = await client.getPhotosByUsername({
      username: INSTAGRAM_USER,
      first: NUM_PHOTOS,
    });
    const { edge_owner_to_timeline_media: {
      page_info,
      edges
    } } = user;

    return edges;
  } catch (err) {
    console.log(error);
  }
};

const getLatestYoutubeVideos = async () => {
  try {
    console.log('📼 Get latest videos from YouTube...');
    const YOUTUBE_API_URI = 'https://www.googleapis.com/youtube/v3';
    const YOUTUBE_PLAYLIST_ID = 'UUJgGc8pQO1lv04VXrBxA_Hg';
    const response = await axios.get(`${YOUTUBE_API_URI}/playlistItems?part=snippet&playlistId=${YOUTUBE_PLAYLIST_ID}&maxResults=${NUM_VIDEOS}&key=${YOUTUBE_API_KEY}`);
    const { items } = response.data;
    console.log(items);
    return items;
  } catch (err) {
    console.log(err);
  }
}

const generateInstagramHTML = ({ shortcode, thumbnail_src }) => `
  <a href="https://www.instagram.com/p/${shortcode}/" target="_blank">
    <img width="20%" src="${thumbnail_src}" alt="Instagram Photo" />
  </a>
`;

const generateYoutubeThumbsHTML = ({ title, videoId }) => `
  <a href="https://youtu.be/${videoId}/" target="_blank">
    <img width="30%" src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="${title}" />
  </a>
`;

(async () => {
  console.log('Fetching data...');
  const [template, videos, photos] = await Promise.all([
    fs.readFile('./README.md.tpl', { encoding: 'utf-8' }),
    getLatestYoutubeVideos(),
    getPhotosFromInstagram(),
  ]);

  // Show latest photos from Instagram
  const latestInstagramPhotos = photos
    .map(({ node }) => generateInstagramHTML(node))
    .join('');

  // Show latest video tumbs from YouTube
  const latestYoutubeVideos = videos
    .map(({ snippet }) => {
      const { title, resourceId } = snippet;
      const { videoId } = resourceId;
      return generateYoutubeThumbsHTML({ videoId, title });
    })
    .join('');

  // Replace placeholders with information
  const newMarkdown = template
    .replace(LATEST_PHOTO_PLACEHOLDER, latestInstagramPhotos)
    .replace(LATEST_VIDEO_PLACEHOLDER, latestYoutubeVideos);

  console.log('Writing markdown...');
  await fs.writeFile('./README.md', newMarkdown);
  console.log('🏁 Finish!')
})();
