import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import useGameStore from "./store/gameStore";
import "./App.css";

const COLOR_MAP = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#facc15",
};

function App() {
  const { game, loading, error, initGame, playCard, drawCard } = useGameStore();

  useEffect(() => {
    initGame();
  }, [initGame]);

  const currentPlayer = game ? game.players[game.currentTurn] : null;
  const discardTop = game?.discardPile?.[game.discardPile.length - 1];

  const playableCards = useMemo(() => {
    if (!currentPlayer || !discardTop) {
      return [];
    }

    return currentPlayer.cards.filter(
      (card) =>
        card.color === discardTop.color || card.number === discardTop.number,
    );
  }, [currentPlayer, discardTop]);

  const hasPlayableCard = playableCards.length > 0;

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
          <p className="eyebrow">UNO Version 1</p>
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
                    backgroundColor: COLOR_MAP[discardTop.color],
                    color: "#111827",
                  }}
                >
                  <strong>{discardTop.color}</strong>
                  <span>{discardTop.number}</span>
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
          <h2>{currentPlayer?.name}'s turn</h2>
          {hasPlayableCard
            ? <p className="hint">Playable cards are highlighted.</p>
            : <p className="hint">No playable card — draw one to continue.</p>}
        </div>

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
                onClick={() => isPlayable && playCard(card.id)}
                disabled={loading || !isPlayable}
                whileHover={isPlayable ? { y: -8 } : undefined}
                whileTap={isPlayable ? { scale: 0.98 } : undefined}
              >
                <span
                  className="card-color"
                  style={{ backgroundColor: COLOR_MAP[card.color] }}
                />
                <strong>{card.color}</strong>
                <span>{card.number}</span>
              </motion.button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default App;
