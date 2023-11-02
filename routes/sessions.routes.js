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

/* POST given a name, create a new Session */
router.post("/create", isAuthenticated, (req, res, next) => {
  const { name } = req.body;
  Session.create({
    name
  })
    .then((createdSession) => {
      res.status(201).json({ success: true, session: createdSession });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Error: Unable to create Session in POST." });
    });
});

/* PUT given a new name, update an existing Session name */
router.put("/update/:sessionId", isAuthenticated, (req, res, next) => {
  const { name } = req.body;
  const { sessionId } = req.params;
  Session.findByIdAndUpdate(sessionId, {
    name,
  }, {new: true})
    .then((updatedSession) => {
      res.status(201).json({ success: true, session: updatedSession });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Error: Unable to update Session in PUT." });
    });
});

/* POST given a userId, add a user to the Session */
router.post('/add/:userId', isAuthenticated, (req,res,next) =>{
  const { sessionId } = req.params;
  Session.findByIdAndUpdate(sessionId, {$addToSet: {users:userId}}, {new: true})
    .then((updatedSession) => {
      res.status(201).json({ success: true, session: updatedSession });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Error: Unable to add user to Session in POST." });
    });
})

/* POST given a userId, remove a user from the Session */
router.post('/remove/:userId', isAuthenticated, (req,res,next) =>{
  const { sessionId } = req.params;
  Session.findByIdAndUpdate(sessionId, {$pull: {users:userId}}, {new: true})
    .then((updatedSession) => {
      res.status(201).json({ success: true, session: updatedSession });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Error: Unable to remove user from Session in POST." });
    });
})

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
