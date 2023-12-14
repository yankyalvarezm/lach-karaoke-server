var express = require("express");
const User = require("../models/User.model");
const Session = require("../models/Session.model");
const Perfom = require("../models/Perform.model");
const mongoose = require("mongoose");
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();
const { getIo } = require("../socket");
const puppeteer = require("puppeteer");
const Song = require("../models/Songs.model");

const checkVideoExistence = async (videoId) => {
  let browser = null;

  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Redirecciona los eventos de la consola del navegador a la consola de Node.js
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    await page.goto(`https://www.youtube.com/embed/${videoId}`);

    const isUnavailable = await page.evaluate(() => {
      const elem = document.body;
      if (elem) {
        // Aquí simplemente haces console.log del texto interno
        console.log("INNER TEXT:", elem.innerText);
        return elem && (elem.innerText.includes("Video unavailable") || elem.innerText.includes("Video no disponible")) ;
      } else {
        console.log(
          "No se encontró el elemento con el mensaje de video no disponible."
        );
        return false;
      }
    });

    if (isUnavailable) {
      const deletedSong = await Song.findOneAndDelete({ videoId: videoId });
      if (deletedSong) {
        console.log(`Canción eliminada: ${videoId}`);
      } else {
        console.log(`No se encontró la canción para eliminar: ${videoId}`);
      }
    } else {
      console.log(`Canción disponible: ${videoId}`);
    }

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

const findVideoIds = async () => {
  try {
    const songs = await Song.find({}, "videoId");

    const videoIds = songs.map((song) => song.videoId);
    return videoIds;
  } catch (error) {
    console.log("error:", error);
  }
};

router.get("/findVideoIds", async (req, res) => {
  try {
    const videoIds = await findVideoIds();
    console.log("videoIds", videoIds);
    res.status(200).json(videoIds);
  } catch (error) {
    console.log("error:", error);
  }
});



router.post("/add-perform", isAuthenticated, async (req, res) => {
  try {
    const {
      name,
      videoDuration,
      videoId,
      status,
      session: sessionId,
      thumbnail,
    } = req.body;
    const userId = req.user._id;
    // Determinar si usar User o TempUser
    const userToUse = req.user.userType;
    // Verifica que se haya proporcionado algún ID de usuario
    if (!userToUse) {
      return res.status(400).json({
        success: false,
        message: "No se ha proporcionado un identificador de usuario válido.",
      });
    }
    // Contar perfoms existentes
    const existingPerfomsCount = await Perfom.countDocuments({
      session: sessionId,
      isQueue: false,
    });
    if (existingPerfomsCount >= 2) {
      return res.status(400).json({
        success: false,
        message: "No se pueden agregar más canciones, límite alcanzado.",
      });
    }
    // Crear nuevo Perfom
    const newPerfom =
      userToUse === "User"
        ? new Perfom({
            name,
            videoDuration,
            videoId,
            status,
            session: sessionId,
            thumbnail,
            user: userId,
          })
        : new Perfom({
            name,
            videoDuration,
            videoId,
            status,
            session: sessionId,
            thumbnail,
            tempUser: userId,
          });
    console.log("Nuevo Perfom antes de guardar:", newPerfom);
    await newPerfom.save();
    res.status(201).json({ success: true, data: newPerfom });
  } catch (error) {
    console.error("Error al crear el registro:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al crear el registro", error });
  }
});

router.get("/my-songs", isAuthenticated, async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    const userId = req.user._id;
    const userToUse = req.user.userType;
    const performs =
      userToUse === "User"
        ? await Perfom.find({
            user: userId,
            session: sessionId,
            isQueue: false,
          }).populate("user", "name")
        : await Perfom.find({
            tempUser: userId,
            session: sessionId,
            isQueue: false,
          }).populate("tempUser", "name");

    res.status(200).json({ success: true, data: performs });
  } catch (error) {
    console.error("Error al buscar perfoms:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al buscar perfoms", error });
  }
});

router.delete("/deletesong/:perfomId", isAuthenticated, async (req, res) => {
  try {
    const perfomId = req.params.perfomId;
    const userId = req.user._id;
    const userType = req.user.userType;
    const isAdmin = req.user.admin; // Asume que 'admin' es un campo booleano en tu modelo de usuario
    const sessionId = req.query.sessionId;

    let query = {
      _id: perfomId,
      session: sessionId,
      status: "hold",
    };

    // Si el usuario no es admin, agrega la verificación del usuario o tempUser
    if (!isAdmin) {
      if (userType === "TempUser") {
        query.tempUser = userId;
      } else {
        query.user = userId;
      }
    }

    const result = await Perfom.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Perfom no encontrado o no cumple los criterios para eliminación.",
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Perfom eliminado con éxito." });
  } catch (error) {
    console.error("Error al eliminar perfom:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al eliminar perfom", error });
  }
});

router.put("/queue-perform/:perfomId", isAuthenticated, async (req, res) => {
  const perfomId = req.params.perfomId;

  try {
    const perfom = await Perfom.findById(perfomId);
    if (!perfom) {
      return res
        .status(404)
        .json({ success: false, message: "Perfom no encontrado." });
    }

    const session = await Session.findById(perfom.session);
    if (!session || !session.isActive) {
      return res.status(400).json({
        success: false,
        message: "La sesión asociada no está activa.",
      });
    }

    // Ajusta la consulta para incluir tanto user como tempUser.
    const userPerfomsCount = await Perfom.countDocuments({
      $or: [{ user: req.user._id }, { tempUser: req.user._id }],
      session: perfom.session,
      isQueue: true,
      isPlayed: false,
    });

    if (userPerfomsCount >= session.maxQueueLimit) {
      return res.status(400).json({
        success: false,
        message: "No puedes agregar más canciones a la cola.",
      });
    }

    perfom.isQueue = true;
    await perfom.save();

    res.status(200).json({
      success: true,
      message: "Perfom actualizado a la cola.",
      data: perfom,
    });
  } catch (error) {
    console.error("Error al actualizar el estado de Perfom:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el estado de Perfom.",
      error,
    });
  }
});

router.get("/queue-songs", isAuthenticated, async (req, res) => {
  const io = getIo();
  try {
    const sessionId = req.query.sessionId;
    let performs = await Perfom.find({
      session: sessionId,
      isQueue: true,
      isPlayed: false,
    });

    // Realiza un 'populate' manual dependiendo de si 'user' está presente o no
    performs = await Promise.all(
      performs.map(async (perfom) => {
        if (perfom.user) {
          await perfom.populate("user");
        } else if (perfom.tempUser) {
          await perfom.populate("tempUser");
        }
        return perfom;
      })
    );

    // console.log("Emitiendo evento 'update_queue' con:", performs);
    io.emit("update_queue", performs);
    res.status(200).json({ success: true, data: performs });
  } catch (error) {
    console.error("Error al buscar performs en la cola:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar performs en la cola",
      error,
    });
  }
});

// Ruta para actualizar el estado de un Perfom
router.put("/update-perfom/:perfomId", isAuthenticated, async (req, res) => {
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
      return res
        .status(404)
        .json({ success: false, message: "Perfom no encontrado." });
    }
    io.emit("update_perform", updatedPerfom);
    res.status(200).json({ success: true, data: updatedPerfom });
  } catch (error) {
    console.error("Error al actualizar el estado del Perfom:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el estado del Perfom",
      error,
    });
  }
});

router.put(
  "/session/:sessionId/updateMaxQueueLimit",
  isAuthenticated,
  async (req, res) => {
    const { sessionId } = req.params;
    const { maxQueueLimit } = req.body;

    try {
      const session = await Session.findById(sessionId);
      if (!session) {
        return res
          .status(404)
          .json({ success: false, message: "Sesión no encontrada." });
      }

      session.maxQueueLimit = maxQueueLimit;
      await session.save();

      res.status(200).json({
        success: true,
        message: "Límite de cola actualizado.",
        data: session,
      });
    } catch (error) {
      console.error("Error al actualizar el límite de cola:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar el límite de cola.",
        error,
      });
    }
  }
);

module.exports = router;
