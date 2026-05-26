const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    color: { type: String, required: true },
    number: { type: Number, required: true },
  },
  { _id: false },
);

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    cards: { type: [cardSchema], default: [] },
  },
  { _id: false },
);

const gameSchema = new mongoose.Schema(
  {
    gameId: { type: String, required: true, unique: true },
    players: { type: [playerSchema], required: true },
    drawPile: { type: [cardSchema], default: [] },
    discardPile: { type: [cardSchema], default: [] },
    currentTurn: { type: Number, default: 0 },
    roundNumber: { type: Number, default: 0 },
    status: { type: String, default: "active" },
    lastAction: { type: String, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

gameSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Game", gameSchema);
