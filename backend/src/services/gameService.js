const crypto = require("crypto");
const gameRepository = require("../repositories/gameRepository");

const COLORS = ["red", "blue", "green", "yellow"];

function shuffle(array) {
  const copy = [...array];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function buildDeck() {
  const deck = [];

  COLORS.forEach((color) => {
    for (let number = 0; number <= 9; number += 1) {
      deck.push({
        id: `${color}-${number}-${crypto.randomUUID()}`,
        color,
        number,
      });
    }
  });

  return shuffle(deck);
}

function isPlayable(card, discardTop) {
  if (!discardTop) {
    return true;
  }

  return card.color === discardTop.color || card.number === discardTop.number;
}

function getNextTurn(currentTurn) {
  return currentTurn === 0 ? 1 : 0;
}

function resetDrawPile(drawPile, discardPile) {
  if (drawPile.length > 0) {
    return drawPile;
  }

  const [topDiscard, ...rest] = discardPile.slice().reverse();
  return shuffle(rest);
}

async function createGame() {
  const deck = buildDeck();
  const playerOneCards = deck.splice(0, 7);
  const playerTwoCards = deck.splice(0, 7);
  const discardPile = [deck.shift()];

  const game = await gameRepository.createGame({
    gameId: crypto.randomUUID(),
    players: [
      { name: "Player One", cards: playerOneCards },
      { name: "Player Two", cards: playerTwoCards },
    ],
    drawPile: deck,
    discardPile,
    currentTurn: 0,
    roundNumber: 0,
    status: "active",
    lastAction: "game_created",
  });

  return game.toObject();
}

async function getGame(gameId) {
  const game = await gameRepository.findGameById(gameId);
  if (!game) {
    const error = new Error("Game not found");
    error.status = 404;
    throw error;
  }

  return game.toObject();
}

async function applyAction(gameId, action) {
  const game = await gameRepository.findGameById(gameId);

  if (!game) {
    const error = new Error("Game not found");
    error.status = 404;
    throw error;
  }

  if (game.status !== "active") {
    const error = new Error("Game is not active");
    error.status = 400;
    throw error;
  }

  const currentPlayer = game.players[game.currentTurn];
  const discardTop = game.discardPile[game.discardPile.length - 1];

  if (action.type === "play") {
    const card = currentPlayer.cards.find((item) => item.id === action.cardId);

    if (!card) {
      const error = new Error("Card not found in current player hand");
      error.status = 400;
      throw error;
    }

    if (!isPlayable(card, discardTop)) {
      const error = new Error("Selected card is not playable");
      error.status = 400;
      throw error;
    }

    currentPlayer.cards = currentPlayer.cards.filter((item) =>
      item.id !== action.cardId
    );
    game.discardPile.push(card);
    game.currentTurn = getNextTurn(game.currentTurn);
    game.roundNumber += 1;
    game.lastAction = `played_${card.color}_${card.number}`;
    await gameRepository.saveGame(game);
    return game.toObject();
  }

  if (action.type === "draw") {
    const nextDrawPile = resetDrawPile(game.drawPile, game.discardPile);
    const [drawnCard] = nextDrawPile;

    if (!drawnCard) {
      const error = new Error("No cards available to draw");
      error.status = 400;
      throw error;
    }

    game.drawPile = nextDrawPile.slice(1);
    currentPlayer.cards.push(drawnCard);
    game.currentTurn = getNextTurn(game.currentTurn);
    game.roundNumber += 1;
    game.lastAction = `drew_${drawnCard.color}_${drawnCard.number}`;
    await gameRepository.saveGame(game);
    return game.toObject();
  }

  const error = new Error("Unsupported action type");
  error.status = 400;
  throw error;
}

module.exports = {
  createGame,
  getGame,
  applyAction,
};
