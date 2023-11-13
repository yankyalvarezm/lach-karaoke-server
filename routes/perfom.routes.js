var express = require("express");
const User = require("../models/User.model");
const Session = require('../models/Session.model')
const Perfom = require("../models/Perform.model")
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();


router.post('/add-perform', isAuthenticated, async (req, res) => {
    try {

        const { name, videoDuration, videoId, status, session: sessionId, thumbnail } = req.body;
        console.log('Session ID recibido:', sessionId);
        const userId = req.user._id;

        console.log('req.user', req.user)

        const newPerfom = new Perfom({
            name,
            videoDuration,
            videoId,
            status,
            user: userId,
            session: sessionId,
            thumbnail
        });

        console.log('Nuevo Perfom antes de guardar:', newPerfom);
        await newPerfom.save();


        res.status(201).json({ success: true, data: newPerfom });
    } catch (error) {

        console.error('Error al crear el registro:', error);
        res.status(500).json({ success: false, message: "Error al crear el registro", error });
    }
});

router.get('/my-songs', isAuthenticated, async (req, res) => {
    try {
        const sessionId = req.query.sessionId;
        const userId = req.user._id; // Asumiendo que el usuario está autenticado

        const perfoms = await Perfom.find({
            user: userId,
            session: sessionId,
            status: 'hold'
        }).populate('user', 'name'); // Omitir o ajustar el 'populate' según lo que necesites

        res.status(200).json({ success: true, data: perfoms });
    } catch (error) {
        console.error('Error al buscar perfoms:', error);
        res.status(500).json({ success: false, message: "Error al buscar perfoms", error });
    }
});


module.exports = router;