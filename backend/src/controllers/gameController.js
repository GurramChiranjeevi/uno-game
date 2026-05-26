const gameService = require("../services/gameService");

async function createGame(req, res) {
  try {
    const game = await gameService.createGame();
    res.status(201).json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getGame(req, res) {
  try {
    const game = await gameService.getGame(req.params.id);
    res.json(game);
  } catch (error) {
    const statusCode = error.status || 500;
    res.status(statusCode).json({ message: error.message });
  }
}

async function applyAction(req, res) {
  try {
    const game = await gameService.applyAction(req.params.id, req.body);
    res.json(game);
  } catch (error) {
    const statusCode = error.status || 500;
    res.status(statusCode).json({ message: error.message });
  }
}

module.exports = {
  createGame,
  getGame,
  applyAction,
};
