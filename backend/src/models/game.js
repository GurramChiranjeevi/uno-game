const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    color: { type: String, required: true },
    type: { type: String, required: false },
    number: { type: mongoose.Schema.Types.Mixed, required: true },
    chosenColor: { type: String, default: null },
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
    direction: { type: Number, default: 1 },
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
