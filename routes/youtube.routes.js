var express = require("express");
var router = express.Router();
const { google } = require('googleapis')
const puppeteer = require("puppeteer");
const path = require('path')

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY 
  });
  
  const checkVideoExistence = async (videoId) => {
    let browser = null;

    const userDataDir = path.join(__dirname, 'puppeteer_user_data');
  
    try {
        // browser = await puppeteer.launch({
        //     headless: true,
        //     args: ['--no-sandbox', '--disable-setuid-sandbox'],
        //     userDataDir: userDataDir // Usa la ruta definida como userDataDir
        // });

        browser = await puppeteer.launch({ headless: true });

      const page = await browser.newPage();
      page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  
      // Usar URL de incrustación para la verificación
      await page.goto(`https://www.youtube.com/embed/${videoId}`);
  
      const isUnavailable = await page.evaluate(() => {
        const elem = document.body;
        if(elem) {
            console.log("INNER TEXT:", elem.innerText);
        }
        return elem && (elem.innerText.includes("Video unavailable") || elem.innerText.includes("Video no disponible")) ;
      });
  
      return !isUnavailable;
    } catch (error) {
      console.error("Web Scraping Error:", error);
      return false;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  };
  
  
  router.get('/search/videos', async (req, res) => {
    const query = req.query.q; 
  
    try {
      const response = await youtube.search.list({
        part: 'snippet',
        q: query,
        videoEmbeddable: 'any',
        maxResults: 10
      });
  
      const videos = response.data.items;
      const validVideos = [];
  
      for (const video of videos) {
        const videoId = video.id.videoId;
        const isAvailable = await checkVideoExistence(videoId);
        if (isAvailable) {
          validVideos.push(video);
        }
      }
  
      res.json({ items: validVideos });
    } catch (err) {
      console.error('Error en la búsqueda de videos de YouTube:', err);
      res.status(500).json({
        success: false,
        message: 'Error al realizar la búsqueda en YouTube',
        error: err.message 
      });
    }
  });


  router.get('/video/details', (req, res) => {
    const videoId = req.query.id; 

    if (!videoId) {
        return res.status(400).send({ message: 'Se requiere el ID del video' });
    }

    youtube.videos.list({
        part: 'snippet,contentDetails',
        id: videoId
    }, (err, response) => {
        if (err) {
            res.status(500).send(err);
            return;
        }

        if (response.data.items.length > 0) {
            res.json(response.data.items[0]);
        } else {
            res.status(404).send({ message: 'Video no encontrado' });
        }
    });
});

module.exports = router;