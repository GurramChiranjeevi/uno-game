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

function createCard(color, type, number) {
  return {
    id: `${type}-${color}-${crypto.randomUUID()}`,
    color,
    type,
    number,
    chosenColor: null,
  };
}

function getLegacyCardType(card) {
  if (typeof card.number === "number") {
    return "number";
  }

  if (card.number === "Skip") {
    return "skip";
  }

  if (card.number === "Reverse") {
    return "reverse";
  }

  if (card.number === "+2") {
    return "drawTwo";
  }

  if (card.number === "+4") {
    return "wildDrawFour";
  }

  if (card.number === "Wild") {
    return "wild";
  }

  return "number";
}

function normalizeCard(card) {
  if (!card) {
    return card;
  }

  if (!card.type) {
    card.type = getLegacyCardType(card);
  }

  return card;
}

function normalizeGame(game) {
  game.players.forEach((player) => {
    player.cards = player.cards.map((card) => normalizeCard(card));
  });

  game.drawPile = game.drawPile.map((card) => normalizeCard(card));
  game.discardPile = game.discardPile.map((card) => normalizeCard(card));
}

function getCardActionValue(card) {
  if (card.type === "number") {
    return String(card.number);
  }

  if (card.type === "skip") {
    return "skip";
  }

  if (card.type === "reverse") {
    return "reverse";
  }

  if (card.type === "drawTwo") {
    return "+2";
  }

  if (card.type === "wild") {
    return "wild";
  }

  if (card.type === "wildDrawFour") {
    return "+4";
  }

  return String(card.number ?? card.type ?? "unknown");
}

function buildDeck() {
  const deck = [];

  COLORS.forEach((color) => {
    deck.push(createCard(color, "number", 0));

    for (let number = 1; number <= 9; number += 1) {
      deck.push(createCard(color, "number", number));
    }

    deck.push(createCard(color, "skip", "Skip"));
    deck.push(createCard(color, "reverse", "Reverse"));
    deck.push(createCard(color, "drawTwo", "+2"));
  });

  for (let index = 0; index < 2; index += 1) {
    deck.push(createCard("wild", "wild", "Wild"));
    deck.push(createCard("wild", "wildDrawFour", "+4"));
  }

  return shuffle(deck);
}

function getDiscardColor(discardTop) {
  return discardTop.chosenColor || discardTop.color;
}

function hasMatchingColor(cards, discardColor) {
  return cards.some((card) => card.color === discardColor);
}

function isPlayable(card, discardTop, playerCards) {
  if (!discardTop) {
    return true;
  }

  const discardColor = getDiscardColor(discardTop);

  if (card.type === "wild") {
    return true;
  }

  if (card.type === "wildDrawFour") {
    return !hasMatchingColor(playerCards, discardColor);
  }

  if (card.type === discardTop.type) {
    return true;
  }

  if (card.type === "number" && discardTop.type === "number") {
    return card.number === discardTop.number;
  }

  return card.color === discardColor;
}

function getNextPlayerIndex(game, steps = 1) {
  let nextIndex = game.currentTurn;

  for (let index = 0; index < steps; index += 1) {
    nextIndex = game.direction === 1
      ? (nextIndex + 1 + game.players.length) % game.players.length
      : (nextIndex - 1 + game.players.length) % game.players.length;
  }

  return nextIndex;
}

function ensureDrawPile(game) {
  if (game.drawPile.length > 0) {
    return;
  }

  const topDiscard = game.discardPile.pop();
  const remainingCards = shuffle(game.discardPile);
  game.discardPile = [topDiscard];
  game.drawPile = remainingCards;
}

function drawCards(game, count) {
  ensureDrawPile(game);

  const drawnCards = [];

  for (let index = 0; index < count; index += 1) {
    const nextCard = game.drawPile.pop();

    if (!nextCard) {
      const error = new Error("No cards available to draw");
      error.status = 400;
      throw error;
    }

    drawnCards.push(nextCard);
  }

  return drawnCards;
}

function applyTurnEffects(game, card) {
  if (card.type === "skip") {
    game.currentTurn = getNextPlayerIndex(game, 2);
    return;
  }

  if (card.type === "reverse") {
    if (game.players.length === 2) {
      game.currentTurn = getNextPlayerIndex(game, 2);
      return;
    }

    game.direction *= -1;
    game.currentTurn = getNextPlayerIndex(game, 1);
    return;
  }

  if (card.type === "drawTwo") {
    const targetIndex = getNextPlayerIndex(game, 1);
    const drawnCards = drawCards(game, 2);
    game.players[targetIndex].cards.push(...drawnCards);
    game.currentTurn = getNextPlayerIndex(game, 2);
    return;
  }

  if (card.type === "wildDrawFour") {
    const targetIndex = getNextPlayerIndex(game, 1);
    const drawnCards = drawCards(game, 4);
    game.players[targetIndex].cards.push(...drawnCards);
    game.currentTurn = getNextPlayerIndex(game, 2);
    return;
  }

  game.currentTurn = getNextPlayerIndex(game, 1);
}

async function createGame() {
  const deck = buildDeck();
  const playerOneCards = deck.splice(0, 7);
  const playerTwoCards = deck.splice(0, 7);
  const discardCard = deck.find((card) => card.color !== "wild");

  if (!discardCard) {
    throw new Error("Unable to create initial discard pile");
  }

  const discardPile = [discardCard];
  const remainingDeck = deck.filter((card) => card.id !== discardCard.id);

  const game = await gameRepository.createGame({
    gameId: crypto.randomUUID(),
    players: [
      { name: "Player One", cards: playerOneCards },
      { name: "Player Two", cards: playerTwoCards },
    ],
    drawPile: remainingDeck,
    discardPile,
    currentTurn: 0,
    direction: 1,
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

  normalizeGame(game);

  const currentPlayer = game.players[game.currentTurn];
  const discardTop = game.discardPile[game.discardPile.length - 1];

  if (action.type === "play") {
    const card = currentPlayer.cards.find((item) => item.id === action.cardId);

    if (!card) {
      const error = new Error("Card not found in current player hand");
      error.status = 400;
      throw error;
    }

    if (card.type === "wild" || card.type === "wildDrawFour") {
      if (!action.chosenColor) {
        const error = new Error("A color choice is required for wild cards");
        error.status = 400;
        throw error;
      }
    }

    if (!isPlayable(card, discardTop, currentPlayer.cards)) {
      const error = new Error("Selected card is not playable");
      error.status = 400;
      throw error;
    }

    currentPlayer.cards = currentPlayer.cards.filter((item) =>
      item.id !== action.cardId
    );
    card.chosenColor = null;

    if (card.type === "wild" || card.type === "wildDrawFour") {
      card.color = action.chosenColor;
      card.chosenColor = action.chosenColor;
    }

    game.discardPile.push(card);
    applyTurnEffects(game, card);
    game.roundNumber += 1;
    game.lastAction = `played_${card.color}_${getCardActionValue(card)}`;
    await gameRepository.saveGame(game);
    return game.toObject();
  }

  if (action.type === "draw") {
    const drawnCards = drawCards(game, 1);
    const drawnCard = drawnCards[0];

    currentPlayer.cards.push(drawnCard);
    game.currentTurn = getNextPlayerIndex(game, 1);
    game.roundNumber += 1;
    game.lastAction = `drew_${drawnCard.color}_${
      getCardActionValue(drawnCard)
    }`;
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
