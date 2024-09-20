var express = require("express");
const puppeteer = require("puppeteer");
const Fuse = require("fuse.js");
const Songs = require("../models/Songs.model");
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();
const path = require('path')
const { exec } = require("child_process");


let globalBrowser;
(async () => {
    globalBrowser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
})();

const curlYoutubeCommand = (id, stringToFind) =>
  `curl -s https://www.youtube.com/embed/${id} | grep ${stringToFind} | wc -l`;

const fetchVideos = async (ids) => {
  const videos = [];

  const executeCurlCommand = (id) => {
    return new Promise((resolve, reject) => {
      const command = curlYoutubeCommand(id, "UNPLAYABLE");

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing curl command: ${error.message}`);
          reject(error);
          return;
        }

        if (Number(stdout) === 0) {
          videos.push(id);
        }

        resolve();
      });
    });
  };

  // Ejecutamos todos los comandos en paralelo
  await Promise.all(ids.map(executeCurlCommand));

  return videos;
};


// Función para verificar la existencia de un video y eliminar la canción si no está disponible
const checkVideoExistenceAndDelete = async (videoId) => {
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

        if (isUnavailable) {
            const deletedSong = await Songs.findOneAndDelete({ videoId: videoId });
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
        if (page) {
            await page.close();
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



router.get("/cleanupVideos", async (req, res) => {
  try {
    const videoIds = await findVideoIds();
    const usableIds = await fetchVideos(videoIds)
    const iDsToDelete = videoIds.filter(id => !usableIds.includes(id))
    if(iDsToDelete.length){
      const deleteResponse = await Songs.deleteMany({ videoId: { $in: iDsToDelete } })
      console.log("Resultados de la limpieza:", `deleted: ${iDsToDelete}`, `stillAvailable: ${usableIds}`);
    }
    const results = { deleted: iDsToDelete, stillAvailable: usableIds };
    
    // for (const videoId of videoIds) {
    //   const isAvailable = await checkVideoExistenceAndDelete(videoId);
   // }

    console.log("Resultados de la limpieza:", results);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error durante la limpieza:", error);
    res.status(500).json({ error: error.message });
  }
});


// router.get("/cleanupVideos", async (req, res) => {
//   try {
//     const videoIds = await findVideoIds();
//     const results = { deleted: [], stillAvailable: [] };

//     for (const videoId of videoIds) {
//       const isAvailable = await checkVideoExistenceAndDelete(videoId);

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
  console.log(searchTerm);
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
router.post("/create", (req, res, next) => {
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
