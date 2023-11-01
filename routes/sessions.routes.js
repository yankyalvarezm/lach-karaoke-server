var express = require("express");
const Session = require("../models/Session.model");
const isAuthenticated = require("../middleware/isAuthenticated");
var router = express.Router();

/* GET users listing. */
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
          message: "Unable to Find any Session.",
        });
    });
});

// Need to ask if changing the model from array was correct.
// router.post("/create", isAuthenticated, (req, res, next) => {
//   const { name } = req.body;
//   const userId = req.user._id;
//   Session.create({
//     name,
//   })
//     .then((createdSession) => {
//       return Session.findByIdAndUpdate(
//         createdSession._id,
//         { $addToSet: { user: userId } },
//         { new: true }
//       );
//     })
//     .then((newSession) => {

//       res.status(201).json({success: true, session: newSession});
//     })
//     .catch((error) => {
//       res.status(400).json({ success: false, error, message: "Unable to create Session." });
//     });
// });

router.post("/create", isAuthenticated, (req, res, next) => {
  const { name } = req.body;
  const userId = req.user._id;
  Session.create({
    name,
    user: userId,
  })
    .then((createdSession) => {
      res.status(201).json({ success: true, session: createdSession });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Unable to create Session." });
    });
});

router.put("/update/:sessionId", isAuthenticated, (req, res, next) => {
  const { name } = req.body;
  const { sessionId } = req.params;
  const { userId } = req.user._id;
  Session.findByIdAndUpdate(sessionId, {
    name,
    user: userId,
  }, {new: true})
    .then((updatedSession) => {
      res.status(201).json({ success: true, session: updatedSession });
    })
    .catch((error) => {
      res
        .status(400)
        .json({ success: false, error, message: "Unable to update Session." });
    });
});
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
