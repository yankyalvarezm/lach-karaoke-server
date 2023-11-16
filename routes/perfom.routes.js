var express = require("express");
const User = require("../models/User.model");
const Session = require('../models/Session.model')
const Perfom = require("../models/Perform.model")
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();


router.post('/add-perform', isAuthenticated, async (req, res) => {
    try {
        const { name, videoDuration, videoId, status, session: sessionId, thumbnail } = req.body;
        const userId = req.user._id;

        const existingPerfomsCount = await Perfom.countDocuments({
            user: userId,
            session: sessionId
        });

        if (existingPerfomsCount >= 2) {
            return res.status(400).json({
                success: false,
                message: "No se pueden agregar más canciones, límite alcanzado."
            });
        }

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
        const userId = req.user._id;

        const perfoms = await Perfom.find({
            user: userId,
            session: sessionId,
            status: 'hold'
        }).populate('user', 'name'); 

        res.status(200).json({ success: true, data: perfoms });
    } catch (error) {
        console.error('Error al buscar perfoms:', error);
        res.status(500).json({ success: false, message: "Error al buscar perfoms", error });
    }
});

router.delete('/deletesong/:perfomId', isAuthenticated, async (req, res) => {
    try {
        const perfomId = req.params.perfomId;
        const userId = req.user._id;
        const sessionId = req.query.sessionId;

        const result = await Perfom.deleteOne({
            _id: perfomId,
            user: userId,
            session: sessionId,
            status: 'hold'
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "Perfom no encontrado o no cumple los criterios para eliminación." });
        }

        res.status(200).json({ success: true, message: "Perfom eliminado con éxito." });
    } catch (error) {
        console.error('Error al eliminar perfom:', error);
        res.status(500).json({ success: false, message: "Error al eliminar perfom", error });
    }
});


module.exports = router;