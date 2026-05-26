const Game = require("../models/game");

async function createGame(gameData) {
  const game = new Game(gameData);
  return game.save();
}

async function findGameById(gameId) {
  return Game.findOne({ gameId });
}

async function saveGame(game) {
  return game.save();
}

module.exports = {
  createGame,
  findGameById,
  saveGame,
};
