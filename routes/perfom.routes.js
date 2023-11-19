var express = require("express");
const User = require("../models/User.model");
const Session = require('../models/Session.model')
const Perfom = require("../models/Perform.model")
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();
const { getIo } = require('../socket');

router.post('/add-perform', isAuthenticated, async (req, res) => {
    try {
        const { name, videoDuration, videoId, status, session: sessionId, thumbnail } = req.body;
        const userId = req.user._id;

        const existingPerfomsCount = await Perfom.countDocuments({
            user: userId,
            session: sessionId,
            isQueue: false
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
            isQueue: false
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

router.put('/queue-perform/:perfomId', isAuthenticated, async (req, res) => {
    const perfomId = req.params.perfomId;

    try {
        const perfom = await Perfom.findById(perfomId);
        if (!perfom) {
            return res.status(404).json({ success: false, message: "Perfom no encontrado." });
        }

        const session = await Session.findById(perfom.session);
        if (!session || !session.isActive) {
            return res.status(400).json({ success: false, message: "La sesión asociada no está activa." });
        }

        perfom.isQueue = true;
        await perfom.save();

        res.status(200).json({ success: true, message: "Perfom actualizado a la cola.", data: perfom });
    } catch (error) {
        console.error('Error al actualizar el estado de Perfom:', error);
        res.status(500).json({ success: false, message: "Error al actualizar el estado de Perfom.", error });
    }
});

router.get('/queue-songs', isAuthenticated, async (req, res) => {
    const io = getIo();

    try {
        const sessionId = req.query.sessionId;

        const perfoms = await Perfom.find({
            session: sessionId,
            isQueue: true,
            isPlayed: false
        }).populate('user', 'name');  

        io.emit('update_queue', perfoms);
        res.status(200).json({ success: true, data: perfoms });
    } catch (error) {
        console.error('Error al buscar perfoms en la cola:', error);
        res.status(500).json({ success: false, message: "Error al buscar perfoms en la cola", error });
    }
});

// Ruta para actualizar el estado de un Perfom
router.put('/update-perfom/:perfomId', isAuthenticated, async (req, res) => {
    const io = getIo();
    try {
        const { isPlaying, isPlayed } = req.body;
        const perfomId = req.params.perfomId;

        const updatedPerfom = await Perfom.findByIdAndUpdate(
            perfomId,
            { $set: { isPlaying, isPlayed } },
            { new: true }
        );

        if (!updatedPerfom) {
            return res.status(404).json({ success: false, message: "Perfom no encontrado." });
        }
        io.emit('update_perform', updatedPerfom);
        res.status(200).json({ success: true, data: updatedPerfom });
    } catch (error) {
        console.error('Error al actualizar el estado del Perfom:', error);
        res.status(500).json({ success: false, message: "Error al actualizar el estado del Perfom", error });
    }
});


module.exports = router;