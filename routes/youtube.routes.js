var express = require("express");
var router = express.Router();
const { google } = require('googleapis');
const puppeteer = require("puppeteer");

// Configuración de la API de YouTube
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY 
});

// Iniciar la instancia global del navegador
let globalBrowser;
(async () => {
    globalBrowser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
})();

// Función para verificar la existencia de un video
const checkVideoExistence = async (videoId) => {
    let page;

    try {
        page = await globalBrowser.newPage();

        // Interceptar y desactivar la carga de ciertos tipos de recursos
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
                request.abort();
            } else {
                request.continue();
            }
        });

        page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
        await page.goto(`https://www.youtube.com/embed/${videoId}`, { waitUntil: 'domcontentloaded' });

        const isUnavailable = await page.evaluate(() => {
            const elem = document.body;
            if (elem) {
                console.log("INNER TEXT:", elem.innerText);
            }
            return elem && (elem.innerText.includes("Video unavailable") || elem.innerText.includes("Video no disponible"));
        });

        return !isUnavailable;
    } catch (error) {
        console.error("Web Scraping Error:", error);
        return false;
    } finally {
        if (page) {
            await page.close();
        }
    }
};

// Rutas
router.get('/search/videos', async (req, res) => {
    const query = req.query.q;

    try {
        const response = await youtube.search.list({
            part: 'snippet',
            q: query,
            videoEmbeddable: 'any',
            maxResults: 15
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

// Cerrar el navegador al terminar el proceso
process.on('exit', () => {
    if (globalBrowser) {
        globalBrowser.close();
    }
});

module.exports = router;
