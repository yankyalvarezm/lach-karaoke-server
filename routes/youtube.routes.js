var express = require("express");
var router = express.Router();
const { google } = require("googleapis");
const puppeteer = require("puppeteer");
const { exec } = require("child_process");

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

        // console.log('Curl command output:', stdout);

        if (Number(stdout) === 0) {
          videos.push(id);
        }

        resolve();
      });
    });
  };

  for (const id of ids) {
    try {
      await executeCurlCommand(id);
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  }

  return videos;
};

// Configuración de la API de YouTube
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

// Iniciar la instancia global del navegador
let globalBrowser;
(async () => {
  globalBrowser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
})();

// Función para verificar la existencia de un video
const checkVideoExistence = async (videoId) => {
  let page;

  try {
    page = await globalBrowser.newPage();

    // Interceptar y desactivar la carga de ciertos tipos de recursos
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (["image", "stylesheet", "font"].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    await page.goto(`https://www.youtube.com/embed/${videoId}`, {
      waitUntil: "domcontentloaded",
    });

    const isUnavailable = await page.evaluate(() => {
      const elem = document.body;
      if (elem) {
        console.log("INNER TEXT:", elem.innerText);
      }
      return (
        elem &&
        (elem.innerText.includes("Video unavailable") ||
          elem.innerText.includes("Video no disponible"))
      );
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
router.get("/search/videos", async (req, res) => {
  const query = req.query.q;

  try {
    const response = await youtube.search.list({
      part: "snippet",
      q: query,
      type: "video",
      videoEmbeddable: "true",
      videoSyndicated: "true",
      videoLicense: "youtube",
      maxResults: 20,
    });
    const ids = response.data.items.map((video) => video.id.videoId);
    // ids = [
    //     'wEN4XbLsHdA',
    //     'dWlg4a045t4',
    //     'tKE3KnsNoeM',
    //     '2RL-jEBvF3o',
    //     'Mb9MgllYjk4',
    //     'XBkGgsPij78',
    //     'dSMQx9ZT8mY',
    //     'xVlS5JOSM1A',
    //     'zhgC1Dmyep4',
    //     'l7TaEQ3A_8I'
    //   ]
    const usableIds = await fetchVideos(ids);
    const videos = response.data.items.filter(video => usableIds.includes(video.id.videoId));
    console.log();

    // exec(curlYoutubeCommand(videos[0].id.videoId, "UNPLAYABLE"), (error, stdout, stderr) => {
    //     if (error) {
    //       console.error(`Error executing curl command: ${error.message}`);
    //       return
    //     }
    //     console.log('Curl command output:', stdout);
    // });
    // const videos = [];
    // ids.forEach((id, index) => {
    //     exec(curlYoutubeCommand(id, "UNPLAYABLE"), (error, stdout, stderr) => {
    //         if (error) {
    //           console.error(`Error executing curl command: ${error.message}`);
    //           return
    //         }
    //         // console.log('Curl command output:', stdout);
    //         if(Number(stdout) === 0){
    //             videos.push(ids[index])
    //         }
    //         // console.log(videos);
    //         return
    //     });

    // })
    // for(id of ids){
    // }
    // .map(video => {
    //     let keep;
    //     let output = 0;
    //     exec(curlYoutubeCommand(video.id.videoId, "UNPLAYABLE"), (error, stdout, stderr) => {
    //         if (error) {
    //           console.error(`Error executing curl command: ${error.message}`);
    //           return
    //         }
    //         output = stdout;
    //         return
    //         // console.log('Curl command output:', stdout);
    //     });
    //     console.log('Curl command output:', output);
    //     return keep
    // })
    // videos = videos.filter( async video => {

    // })
    // const validVideos = [];

    // for (const video of videos) {
    //     const videoId = video.id.videoId;
    //     const isAvailable = await checkVideoExistence(videoId);
    //     if (isAvailable) {
    //         validVideos.push(video);
    //     }
    // }

    // res.json({ items: "ok" });
    res.json({ items: videos });
  } catch (err) {
    console.error("Error en la búsqueda de videos de YouTube:", err);
    res.status(500).json({
      success: false,
      message: "Error al realizar la búsqueda en YouTube",
      error: err.message,
    });
  }
});

router.get("/video/details", (req, res) => {
  const videoId = req.query.id;

  if (!videoId) {
    return res.status(400).send({ message: "Se requiere el ID del video" });
  }

  youtube.videos.list(
    {
      part: "snippet,contentDetails",
      id: videoId,
    },
    (err, response) => {
      if (err) {
        res.status(500).send(err);
        return;
      }

      if (response.data.items.length > 0) {
        res.json(response.data.items[0]);
      } else {
        res.status(404).send({ message: "Video no encontrado" });
      }
    }
  );
});

// Cerrar el navegador al terminar el proceso
process.on("exit", () => {
  if (globalBrowser) {
    globalBrowser.close();
  }
});

module.exports = router;
