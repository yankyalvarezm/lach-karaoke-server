var express = require("express");
const Session = require("../models/Session.model");
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();

/* GET all Sessions */
router.get("/", (req, res, next) => {
  Session.find()
    .then((foundSessions) => {
      !foundSessions || !foundSessions.length
        ? res.status(200).json({ success: true, message: "No Sessions exist." })
        : res.status(200).json({ success: true, sessionsArr: foundSessions });
    })
    .catch((error) => {
      res
        .status(400)
        .json({
          success: false,
          error,
          message: "Error: Unable to GET any Sessions.",
        });
    });
});
/* GET selected Session */ //Old
// router.get("/:sessionId", (req, res, next) => {
//   const {sessionId} = req.params
//   Session.findById(sessionId)
//     .then((foundSession) => {
//       !foundSession
//         ? res.status(200).json({ success: true, message: "Session not found." })
//         : res.status(200).json({ success: true, session: foundSession });
//     })
//     .catch((error) => {
//       res
//         .status(400)
//         .json({
//           success: false,
//           error,
//           message: "Error trying to find Session.",
//         });
//     });
// });

/* GET selected Session and populate users if users exist */
router.get("/:sessionId", (req, res, next) => {
  const { sessionId } = req.params;
  Session.findById(sessionId)
    .then((foundSession) => {
      if (!foundSession) {
        res.status(200).json({ success: true, message: "Session not found." });
      } else {
        if (foundSession.users.length) {
          return foundSession.populate("users");
        } else {
          return foundSession;
        }
      }
    })
    .then(foundSession => {
      if (!foundSession) {
        res.status(200).json({ success: true, message: "Session not found." });
      } else{
        res.status(200).json({ success: true, session: foundSession })
      }
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error: Unable to GET Session.",
      });
    });
});

/* GET Active session and populate users if users exist */
router.get("/current/active", (req, res, next) => {
  // Busca una sesión que está activa
  Session.findOne({ isActive: true }) // Cambio aquí para buscar una sesión activa
    .populate("users") 
    .then((activeSession) => {
      if (!activeSession) {
        // Si no hay ninguna sesión activa
        res.status(404).json({ success: false, message: "No active session found." });
      } else {
        // Si hay una sesión activa
        res.status(200).json({ success: true, session: activeSession });
      }
    })
    .catch((error) => {
      res.status(500).json({
        success: false,
        error,
        message: "Error: Unable to GET active session.",
      });
      console.log('Active Session Error:', err)
    });
});


/* POST given a name, create a new Session */
router.post("/create", isAuthenticated, async (req, res, next) => { 
  const { name } = req.body;
  // Comprueba si el nombre está vacío o es solo espacios en blanco
  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Session name cannot be empty."
    });
  }
  try {
    // Buscar una sesión activa
    const activeSession = await Session.findOne({ isActive: true });
    // Si existe una sesión activa, devolvemos un error
    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: "No puedes crear una sesion, mientras tengas una sesion activa"
      });
    }
    // Si no hay ninguna sesión activa, crea la nueva sesión
    const createdSession = await Session.create({ name });
    return res.status(201).json({
      success: true,
      session: createdSession,
      message: 'Session created'
    });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, error, message: "Error: Unable to create Session in POST." });
    console.log("Error:", error);
  }
});


/* PUT given a new name, update an existing Session name */
router.put("/update/:sessionId", isAuthenticated, (req, res, next) => {
  const { name, isActive } = req.body;
  const { sessionId } = req.params;

  // Si la solicitud quiere activar una sesión
  if (isActive) {
    // Busca si ya hay una sesión activa
    Session.findOne({ isActive: true })
      .then((activeSession) => {
        // Si hay una sesión activa y su ID es diferente al que se está actualizando
        if (activeSession && activeSession._id.toString() !== sessionId) {
          res.status(400).json({ success: false, message: "There's already an active session." });
          return;
        }

        // Actualiza la sesión si no hay conflictos
        return Session.findByIdAndUpdate(
          sessionId,
          { name, isActive },
          { new: true }
        );
      })
      .then((updatedSession) => {
        if (updatedSession) {
          res.status(201).json({ success: true, session: updatedSession });
        }
      })
      .catch((error) => {
        res.status(400).json({ success: false, error, message: "Error: Unable to update Session in PUT." });
      });

  } else {
    // Si no se está activando una sesión, simplemente actualiza
    Session.findByIdAndUpdate(
      sessionId,
      { name, isActive },
      { new: true }
    )
      .then((updatedSession) => {
        res.status(201).json({ success: true, session: updatedSession });
      })
      .catch((error) => {
        res.status(400).json({ success: false, error, message: "Error: Unable to update Session in PUT." });
      });
  }
});

router.put("/end/:sessionId", isAuthenticated, (req, res, next) => {
  const { duration } = req.body; 
  const { sessionId } = req.params;

  Session.findById(sessionId)
    .then(session => {
      if (!session) {
        res.status(404).json({ success: false, message: "Session not found." });
        return;
      }

      const updatedDuration = session.duration + duration;

      return Session.findByIdAndUpdate(
        sessionId,
        { isActive: false, duration: updatedDuration },
        { new: true }
      );
    })
    .then(updatedSession => {
      if (updatedSession) {
        res.status(200).json({ success: true, session: updatedSession });
      }
    })
    .catch(error => {
      res.status(500).json({ success: false, error, message: "Error: Unable to end Session in PUT." });
    });
});



/* POST given a userId, add a user to the Session */
router.post("/add/:userId", isAuthenticated, (req, res, next) => {
  const { sessionId } = req.params;
  Session.findByIdAndUpdate(
    sessionId,
    { $addToSet: { users: userId } },
    { new: true }
  ) 
    .then((updatedSession) => {
      res.status(201).json({ success: true, session: updatedSession });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Error: Unable to add user to Session in POST." });
    });
});

/* POST given a userId, remove a user from the Session */
router.post("/remove/:userId", isAuthenticated, (req, res, next) => {
  const { sessionId } = req.params;
  Session.findByIdAndUpdate(
    sessionId,
    { $pull: { users: userId } },
    { new: true }
  )
    .then((updatedSession) => {
      res.status(201).json({ success: true, session: updatedSession });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Error: Unable to remove user from Session in POST." });
    });
});

/* Delete given a sessionId, delete the Session */
router.delete("/delete/:sessionId", (req, res, next) => {
  const { sessionId } = req.params;
  Session.findByIdAndDelete(sessionId)
    .then((deletedSession) => {
      res.status(200).json({ success: true, session: deletedSession });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Error: Unable to delete Session in DELETE." });
    });
});

module.exports = router;
