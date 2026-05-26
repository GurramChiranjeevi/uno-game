const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const gameService = require("../src/services/gameService");
const gameRepository = require("../src/repositories/gameRepository");

async function resetDatabase() {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
}

async function beforeSuite() {
  await connectDB();
}

async function afterSuite() {
  await mongoose.disconnect();
}

test("creates a generated game and persists the initial state", async () => {
  await beforeSuite();
  await resetDatabase();

  const game = await gameService.createGame();

  assert.ok(game.gameId);
  assert.equal(game.players.length, 2);
  assert.equal(game.players[0].name, "Player One");
  assert.equal(game.players[1].name, "Player Two");
  assert.ok(game.drawPile.length >= 6);
  assert.equal(game.discardPile.length, 1);
  assert.equal(game.currentTurn, 0);
  assert.equal(game.roundNumber, 0);
  assert.equal(game.lastAction, "game_created");

  await afterSuite();
});

test("persists a draw action after the round changes", async () => {
  await beforeSuite();
  await resetDatabase();

  const game = await gameService.createGame();
  const updated = await gameService.applyAction(game.gameId, {
    type: "draw",
  });

  assert.equal(updated.roundNumber, 1);
  assert.equal(updated.currentTurn, 1);
  assert.match(updated.lastAction, /^drew_/);
  assert.ok(updated.players[1].cards.length >= 7);

  await afterSuite();
});

test("persists a valid play action when the current player has a matching card", async () => {
  await beforeSuite();
  await resetDatabase();

  const created = await gameRepository.createGame({
    gameId: "play-test-game",
    players: [
      {
        name: "Player One",
        cards: [{ id: "red-1", color: "red", number: 1 }],
      },
      {
        name: "Player Two",
        cards: [{ id: "blue-2", color: "blue", number: 2 }],
      },
    ],
    drawPile: [{ id: "green-3", color: "green", number: 3 }],
    discardPile: [{ id: "red-5", color: "red", number: 5 }],
    currentTurn: 0,
    roundNumber: 0,
    status: "active",
    lastAction: "seeded_play_state",
  });

  const updated = await gameService.applyAction(created.gameId, {
    type: "play",
    cardId: "red-1",
  });

  assert.equal(updated.roundNumber, 1);
  assert.equal(updated.currentTurn, 1);
  assert.equal(updated.discardPile.length, 2);
  assert.equal(updated.lastAction, "played_red_1");
  assert.deepEqual(updated.players[0].cards, []);

  await afterSuite();
});
