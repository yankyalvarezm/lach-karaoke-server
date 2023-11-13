var express = require("express");
var router = express.Router();
const { spotifyApi, refreshTokenIfNeeded } = require('../config/spotifyApi');


router.get('/search', (req, res) => {
    const { query } = req.query;

    refreshTokenIfNeeded().then(() => {
        return spotifyApi.searchTracks(query)
    }).then(data => {
        res.status(200).json(data.body);
    }).catch(err => {
        console.error('Error al buscar pistas:', err);
        res.status(500).json({ error: 'Error al buscar pistas' });
    });
});

module.exports = router;