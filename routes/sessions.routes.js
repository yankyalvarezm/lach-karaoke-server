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
      res.status(400).json({
        success: false,
        error,
        message: "Unable to Find any Session.",
      });
    });
});
/* GET selected Session */
router.get("/:sessionId", (req, res, next) => {
  const { sessionId } = req.params;
  Session.findById(sessionId)
    .then((foundSession) => {
      !foundSession
        ? res.status(200).json({ success: true, message: "Session not found." })
        : res.status(200).json({ success: true, session: foundSession });
    })
    .catch((error) => {
      res.status(400).json({
        success: false,
        error,
        message: "Error trying to find Session.",
      });
    });
});
/* POST given a name, create a new Session */
router.post("/create", isAuthenticated, (req, res, next) => {
  const { name } = req.body;

  // Comprueba si el nombre está vacío o es solo espacios en blanco
  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Session name cannot be empty."
    });
  }

  Session.create({ name })
    .then((createdSession) => {
      res.status(201).json({ success: true, session: createdSession, message: 'Session created' });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Unable to create Session." });
      console.log("Error:", error);
    });
});


/* PUT given a new name, update an existing Session name */
router.put("/update/:sessionId", isAuthenticated, (req, res, next) => {
  const { name } = req.body;
  const { sessionId } = req.params;
  Session.findByIdAndUpdate(
    sessionId,
    {
      name,
    },
    { new: true }
  )
    .then((updatedSession) => {
      res.status(201).json({ success: true, session: updatedSession });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Unable to update Session." });
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
        .json({
          success: false,
          error,
          message: "Unable to add user to Session.",
        });
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
        .json({
          success: false,
          error,
          message: "Unable to remove user from Session.",
        });
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
        .json({ success: false, error, message: "Unable to delete Session." });
    });
});

module.exports = router;
