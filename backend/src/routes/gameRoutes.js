const express = require("express");
const gameController = require("../controllers/gameController");

const router = express.Router();

router.post("/", gameController.createGame);
router.get("/:id", gameController.getGame);
router.patch("/:id", gameController.applyAction);

module.exports = router;
