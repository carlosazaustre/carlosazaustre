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
    console.log('Login to Instagram...');
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
}

const generateInstagramHTML = ({ shortcode, thumbnail_src }) => `
  <a href="https://www.instagram.com/p/${shortcode}/" target="_blank">
    <img width="20%" src="${thumbnail_src}" alt="Instagram Photo" />
  </a>
`;

; (async () => {
  console.log('Init...');
  const [template, photos] = await Promise.all([
    fs.readFile('./README.md.tpl', { encoding: 'utf-8' }),
    getPhotosFromInstagram(),
  ]);

  // Show latest photos from Instagram
  const latestInstagramPhotos = photos
    .map(({ node }) => generateInstagramHTML(node))
    .join('');

  // Replace placeholders with information
  const newMarkdown = template
    .replace(LATEST_PHOTO_PLACEHOLDER, latestInstagramPhotos);

  console.log('Writing markdown...');
  await fs.writeFile('./README.md', newMarkdown);
  console.log('🏁 Finish!')
})();
