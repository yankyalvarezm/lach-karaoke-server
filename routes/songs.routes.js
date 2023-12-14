var express = require("express");
const puppeteer = require("puppeteer");
const Fuse = require("fuse.js");
const Songs = require("../models/Songs.model");
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();
const path = require('path')

const checkVideoExistence = async (videoId) => {
  let browser = null;

  const userDataDir = path.join(__dirname, 'puppeteer_user_data');

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      userDataDir: userDataDir // Usa la ruta definida como userDataDir
  });
    
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
    const songs = await Songs.find({}, "videoId");

    const videoIds = songs.map((song) => song.videoId);
    return videoIds;
  } catch (error) {
    console.log("error:", error);
  }
};

// router.get("/cleanupVideos", isAuthenticated, async (req, res) => {
//   try {
//     const videoIds = await findVideoIds();
//     const results = { deleted: [], stillAvailable: [] };

//     for (const videoId of videoIds) {
//       const isAvailable = await checkVideoExistence(videoId);

//       if (!isAvailable) {
//         results.deleted.push(videoId);
//       } else {
//         results.stillAvailable.push(videoId);
//       }
//     }

//     console.log("Resultados de la limpieza:", results);
//     res.status(200).json(results);
//   } catch (error) {
//     console.error("Error durante la limpieza:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

router.get("/cleanupVideos", async (req, res) => {
  try {
    const videoIds = await findVideoIds();
    const results = { deleted: [], stillAvailable: [] };

    for (const videoId of videoIds) {
      const isAvailable = await checkVideoExistence(videoId);

      if (!isAvailable) {
        results.deleted.push(videoId);
      } else {
        results.stillAvailable.push(videoId);
      }
    }

    console.log("Resultados de la limpieza:", results);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error durante la limpieza:", error);
    res.status(500).json({ error: error.message });
  }
});

/* GET all songs. */
router.get("/", (req, res, next) => {
  Songs.find()
    .then((foundSongs) => {
      foundSongs.length
        ? res.status(200).json({ success: true, songs: foundSongs })
        : res.status(200).json({ success: true, message: "No Songs found." });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable to GET Songs.",
      });
    });
});

router.get("/search/:searchTerm", (req, res, next) => {
  const { searchTerm } = req.params;
  Songs.find({})
    .then((foundSongs) => {
      if (foundSongs.length) {
        const fuse = new Fuse(foundSongs, { keys: ["title"], threshold: 0.5 });
        const results = fuse.search(searchTerm);
        const items = results.map(song => song.item)
        results.length
          ? res.status(200).json({ success: true, songs: items })
          : res
              .status(200)
              .json({ success: false, message: "Songs not found." });
      } else {
        res.status(200).json({ success: false, message: "Songs not found." });
      }
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Error: Unable to GET Song" });
    });
});
// router.get("/search/:searchTerm", (req, res, next) => {
//   const { searchTerm } = req.params;
//   Songs.find({ title: { $regex: new RegExp(searchTerm, "i") } })
//     .then((foundSongs) => {
//       foundSongs.length
//         ? res.status(200).json({ success: true, songs: foundSongs })
//         : res.status(200).json({ success: false, message: "Songs not found." });
//     })
//     .catch((error) => {
//       res
//         .status(400)
//         .json({ success: false, error, message: "Error: Unable to GET Song" });
//     });
// });

/* GET a song by songId. */
router.get("/:videoId", (req, res, next) => {
  const { videoId } = req.params;
  Songs.findOne({ videoId })
    .then((foundSong) => {
      foundSong
        ? res.status(200).json({ success: true, song: foundSong })
        : res.status(200).json({ success: true, message: "Song not found." });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Error: Unable to GET Song" });
    });
});

/* POST given a title, artist and genre a new song will be created. */
router.post("/create", isAuthenticated, (req, res, next) => {
  const { title, description, videoId, videoDuration, thumbnail } = req.body;
  console.log("GUARDANDO CANCION");
  Songs.create({
    title,
    description,
    videoDuration,
    videoId,
    thumbnail,
  })
    .then((createdSong) => {
      createdSong
        ? res.status(201).json({ success: true, song: createdSong })
        : res
            .status(200)
            .json({ success: true, message: "Failed to create song." });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable create Song in POST.",
      });
    });
});

/* PUT given a title, artist, genre and given an songId, update selected song. */
router.put("/update/:songId", isAuthenticated, (req, res, next) => {
  const { songId } = req.params;
  const { title, description, videoId, videoDuration, thumbnail } = req.body;
  Songs.findByIdAndUpdate(
    songId,
    { title, description, videoId, videoDuration, thumbnail },
    { new: true }
  )
    .then((updatedSong) => {
      updatedSong
        ? res.status(200).json({ success: true, song: updatedSong })
        : res
            .status(200)
            .json({ success: true, message: "Failed to update song." });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable update Song in PUT.",
      });
    });
});
/* GET home page. */
router.delete("/delete/:songId", isAuthenticated, (req, res, next) => {
  const { songId } = req.params;
  Songs.findByIdAndDelete(songId)
    .then((deletedSong) => {
      deletedSong
        ? res.status(200).json({ success: true, song: deletedSong })
        : res.status(400).json({ success: true, message: "Song not found." });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Failed to DELETE song ",
      });
    });
});

// const checkVideoExistence = async (videoId) => {
//   let browser = null;

//   try {
//     browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto(`https://www.youtube.com/watch?v=${videoId}`);

//     // iff the video is not available

//     const isUnavailable = await page.evaluate(() => {
//       const elem = document.querySelector("#player-unavailable h1");
//       return elem && elem.innerTesst.trim() === "Video no disponible";
//     });

//     if (isUnavailable && onDelete) {
//       await onDelete(videoId);
//     }

//     return !isUnavailable;

//   } catch (error) {
//     console.log("Web Scrapping Error:", error);
//     return false;
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// };



module.exports = router;
