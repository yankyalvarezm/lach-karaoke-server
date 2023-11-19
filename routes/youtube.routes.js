var express = require("express");
var router = express.Router();
const { google } = require('googleapis')

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY 
  });

  router.get('/search/videos', (req, res) => {
    const query = req.query.q; 

    youtube.search.list({
        part: 'snippet',
        q: query,
        videoEmbeddable: 'any',
        maxResults: 20
    }, async (err, response) => {
        if (err) {
            console.error('Error en la búsqueda de videos de YouTube:', err); 
            res.status(500).json({
                success: false,
                message: 'Error al realizar la búsqueda en YouTube',
                error: err.message 
            });
            return;
        }

        // Filtrar los resultados para obtener solo videos incrustables
        const videos = response.data.items;
        const embeddableVideos = [];

        for (const video of videos) {
            try {
                const videoDetails = await youtube.videos.list({
                    part: 'status',
                    id: video.id.videoId
                });

                if (videoDetails.data.items[0].status.embeddable) {
                    embeddableVideos.push(video);
                }
            } catch (error) {
                console.error('Error al obtener detalles del video:', error);
                console.log('error:', error)
                // Manejar el error según sea necesario
            }
        }

        res.json({ items: embeddableVideos });
    });
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