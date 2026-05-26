import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import useGameStore from "./store/gameStore";
import "./App.css";

const COLOR_MAP = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#facc15",
  wild: "#94a3b8",
};

const COLOR_OPTIONS = ["red", "blue", "green", "yellow"];

function getCardLabel(card) {
  if (card.type === "number") {
    return String(card.number);
  }

  if (card.type === "reverse") {
    return "Reverse";
  }

  if (card.type === "skip") {
    return "Skip";
  }

  if (card.type === "drawTwo") {
    return "+2";
  }

  if (card.type === "wild") {
    return "Wild";
  }

  return "+4";
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

function App() {
  const { game, loading, error, initGame, playCard, drawCard } = useGameStore();
  const [selectedWildCardId, setSelectedWildCardId] = useState(null);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    setSelectedWildCardId(null);
  }, [game?.gameId]);

  const currentPlayer = game ? game.players[game.currentTurn] : null;
  const discardTop = game?.discardPile?.[game.discardPile.length - 1];

  const playableCards = useMemo(() => {
    if (!currentPlayer || !discardTop) {
      return [];
    }

    return currentPlayer.cards.filter((card) =>
      isPlayable(card, discardTop, currentPlayer.cards)
    );
  }, [currentPlayer, discardTop]);

  const hasPlayableCard = playableCards.length > 0;

  function handleCardClick(card) {
    if (card.type === "wild" || card.type === "wildDrawFour") {
      setSelectedWildCardId(card.id);
      return;
    }

    playCard(card.id);
  }

  function handleColorPick(color) {
    if (!selectedWildCardId) {
      return;
    }

    playCard(selectedWildCardId, color);
    setSelectedWildCardId(null);
  }

  if (!game) {
    return (
      <main className="app-shell">
        <div className="loading-box">
          <h1>Generating your UNO game...</h1>
          <p>Please wait while the backend creates the current round.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="topbar">
        <div>
          <p className="eyebrow">UNO Version 2</p>
          <h1>Two-player generated game</h1>
        </div>
        <div className="status-pill">Round {game.roundNumber}</div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="board-grid">
        <article
          className={`player-panel ${game.currentTurn === 0 ? "active" : ""}`}
        >
          <p className="player-label">Player One</p>
          <p className="player-meta">Cards: {game.players[0].cards.length}</p>
        </article>

        <section className="center-piles">
          <motion.button
            type="button"
            className="pile-button draw-pile"
            onClick={() => drawCard()}
            disabled={loading}
            animate={{ scale: loading ? 1.02 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <span>Draw pile</span>
            <strong>{game.drawPile.length}</strong>
          </motion.button>

          <motion.article
            className="pile-button discard-pile"
            key={discardTop?.id || "discard"}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 0.35 }}
          >
            <span>Discard pile</span>
            {discardTop
              ? (
                <div
                  className="card-box"
                  style={{
                    backgroundColor: COLOR_MAP[getDiscardColor(discardTop)],
                    color: "#111827",
                  }}
                >
                  <strong>{getDiscardColor(discardTop)}</strong>
                  <span>{getCardLabel(discardTop)}</span>
                </div>
              )
              : <div className="card-box placeholder">Empty</div>}
          </motion.article>
        </section>

        <article
          className={`player-panel ${game.currentTurn === 1 ? "active" : ""}`}
        >
          <p className="player-label">Player Two</p>
          <p className="player-meta">Cards: {game.players[1].cards.length}</p>
        </article>
      </section>

      <section className="hand-section">
        <div className="hand-header">
          <div>
            <h2>{currentPlayer?.name}'s turn</h2>
            {hasPlayableCard
              ? <p className="hint">Playable cards are highlighted.</p>
              : <p className="hint">No playable card — draw one to continue.
              </p>}
          </div>
          <p className="hint">
            Last action: {game.lastAction || "game_created"}
          </p>
        </div>

        {selectedWildCardId
          ? (
            <div className="wild-picker">
              <p className="hint">Choose the next color for the wild card.</p>
              <div className="color-options">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="color-option"
                    style={{ backgroundColor: COLOR_MAP[color] }}
                    onClick={() => handleColorPick(color)}
                    disabled={loading}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )
          : null}

        <div className="hand-grid">
          {currentPlayer?.cards.map((card) => {
            const isPlayable = playableCards.some((item) =>
              item.id === card.id
            );

            return (
              <motion.button
                key={card.id}
                type="button"
                className={`card-button ${isPlayable ? "playable" : ""}`}
                onClick={() => handleCardClick(card)}
                disabled={loading || !isPlayable}
                whileHover={isPlayable ? { y: -8 } : undefined}
                whileTap={isPlayable ? { scale: 0.98 } : undefined}
              >
                <span
                  className="card-color"
                  style={{
                    backgroundColor: COLOR_MAP[card.color] || COLOR_MAP.wild,
                  }}
                />
                <strong>{card.color === "wild" ? "wild" : card.color}</strong>
                <span>{getCardLabel(card)}</span>
              </motion.button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default App;
