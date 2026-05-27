import { useEffect, useMemo, useState } from "react";
import useGameStore from "./store/gameStore";
import "./App.css";

const COLOR_OPTIONS = ["red", "blue", "green", "yellow"];
const DEFAULT_NAMES = ["Player 1", "Player 2", "Player 3", "Player 4"];
const LOCAL_STORAGE_KEY = "uno-player-name";

function getCardLabel(card) {
  if (!card) return "";
  if (card.type === "number") return String(card.number);
  if (card.type === "reverse") return "⟲";
  if (card.type === "skip") return "⦸";
  if (card.type === "drawTwo") return "+2";
  if (card.type === "wild") return "WILD";
  return "+4";
}

function getCardValue(card) {
  if (!card) return "";
  if (card.type === "number") return String(card.number);
  if (card.type === "reverse") return "⟲";
  if (card.type === "skip") return "⦸";
  if (card.type === "drawTwo") return "+2";
  if (card.type === "wild") return "UNO";
  return "+4";
}

function getDiscardColor(discardTop) {
  return discardTop?.chosenColor || discardTop?.color || "red";
}

function hasMatchingColor(cards, discardColor) {
  return cards?.some((c) => c.color === discardColor);
}

function isPlayable(card, discardTop, playerCards) {
  if (!card) return false;
  if (!discardTop) return true;

  const discardColor = getDiscardColor(discardTop);
  if (card.type === "wild") return true;
  if (card.type === "wildDrawFour") {
    return !hasMatchingColor(playerCards, discardColor);
  }
  if (card.type === "number" && discardTop.type === "number") {
    return card.number === discardTop.number || card.color === discardColor;
  }
  if (card.type === discardTop.type) return true;
  return card.color === discardColor;
}

function CardFace({ card }) {
  if (!card) return null;
  const colorClass = card.color === "wild" ? "wild" : card.color;
  return (
    <div className={`card-face ${colorClass}`}>
      <div className="card-spot top-left">
        <span className={`color-chip ${colorClass}`} />
        <span className="card-rank">{getCardLabel(card)}</span>
      </div>
      <div className="card-center">
        <span>{getCardValue(card)}</span>
      </div>
      <div className="card-spot bottom-right">
        <span className={`color-chip ${colorClass}`} />
        <span className="card-rank">{getCardLabel(card)}</span>
      </div>
    </div>
  );
}

function OpponentFan({ count = 0 }) {
  const visible = Math.min(count, 7);
  const center = (visible - 1) / 2;

  return (
    <div className="opponent-fan">
      {Array.from({ length: visible }).map((_, i) => {
        const offset = i - center;
        const rot = offset * 12;
        const tx = offset * 24;
        const ty = Math.abs(offset) * -10;
        return (
          <span
            key={i}
            className="player-back-card"
            style={{
              transform: `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg)`,
              zIndex: i,
            }}
          />
        );
      })}
      {count > visible ? (
        <span className="opponent-count">+{count - visible}</span>
      ) : null}
    </div>
  );
}

function CardBack() {
  return (
    <div className="card-back-face">
      <span className="uno-label">UNO</span>
      <div className="uno-ring" />
      <div className="uno-ring uno-ring--inner" />
    </div>
  );
}

function DrawPile({ count = 0, onDraw, loading, animating, disabled }) {
  return (
    <button
      className={`draw-pile ${animating ? "animating" : ""}`}
      type="button"
      onClick={onDraw}
      disabled={disabled || loading}
    >
      <div className="pile">
        <CardBack />
        <CardBack />
        <div className="draw-count">{count}</div>
      </div>
      <span className="pile-label">Draw</span>
    </button>
  );
}

function DiscardPile({ discardTop, animating }) {
  return (
    <div className={`discard-pile ${animating ? "animating" : ""}`}>
      <div className="pile">
        <CardBack />
        <CardBack />
        {discardTop ? (
          <CardFace card={discardTop} />
        ) : (
          <div className="discard-empty">?</div>
        )}
      </div>
      <span className="pile-label">Discard</span>
    </div>
  );
}

function UserHand({ cards = [], playableIds = [], onCardClick, loading }) {
  const total = cards.length;
  const center = (total - 1) / 2;
  const step = Math.max(20, 180 / Math.max(1, total));

  return (
    <div className="fan-container">
      {cards.map((card, idx) => {
        const offset = idx - center;
        const rot = offset * 14;
        const tx = offset * step;
        const ty = Math.abs(offset) * -14;
        const playable = playableIds.includes(card.id);
        return (
          <button
            key={card.id}
            type="button"
            className={`hand-card ${playable ? "playable" : "locked"}`}
            onClick={() => onCardClick(card)}
            disabled={loading || !playable}
            style={{
              transform: `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg)`,
              zIndex: idx + 10,
            }}
          >
            <CardFace card={card} />
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const {
    game,
    loading,
    error,
    createRoom,
    joinRoom,
    loadGame,
    refreshGame,
    playCard,
    drawCard,
  } = useGameStore();

  const currentQueryGameId = new URLSearchParams(window.location.search).get(
    "gameId",
  );
  const [view, setView] = useState(currentQueryGameId ? "join" : "entry");
  const [nameInput, setNameInput] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [localPlayerName, setLocalPlayerName] = useState("");
  const [localGameId, setLocalGameId] = useState("");
  const [selectedWild, setSelectedWild] = useState(null);
  const [drawAnimating, setDrawAnimating] = useState(false);
  const [discardAnimating, setDiscardAnimating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (currentQueryGameId) {
      setLocalGameId(currentQueryGameId);
      loadGame(currentQueryGameId);
      return;
    }

    setView("entry");
  }, [currentQueryGameId, loadGame]);

  useEffect(() => {
    if (!game?.gameId) return;

    const storedName = localStorage.getItem(
      `${LOCAL_STORAGE_KEY}-${game.gameId}`,
    );
    if (storedName) {
      setLocalPlayerName(storedName);
    }

    const url = new URL(window.location.href);
    if (url.searchParams.get("gameId") !== game.gameId) {
      url.searchParams.set("gameId", game.gameId);
      window.history.replaceState({}, "", url.toString());
    }
  }, [game?.gameId]);

  useEffect(() => {
    if (!game?.gameId) return undefined;

    const interval = window.setInterval(() => {
      refreshGame(game.gameId);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [game?.gameId, refreshGame]);

  useEffect(() => {
    if (!game) {
      if (currentQueryGameId && view !== "lobby" && view !== "game") {
        setView("join");
      }
      return;
    }

    if (game.status === "active") {
      setView("game");
      setCountdown(null);
      return;
    }

    if (game.status === "waiting") {
      setView("lobby");
      return;
    }
  }, [game, currentQueryGameId, view]);

  useEffect(() => {
    if (view !== "lobby" || !game || game.status !== "waiting") {
      setCountdown(null);
      return undefined;
    }

    if (!game.startAt || game.players.length < game.playerLimit) {
      setCountdown(null);
      return undefined;
    }

    let refreshed = false;

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(game.startAt).getTime() - Date.now()) / 1000),
      );
      setCountdown(remaining);

      if (remaining <= 0 && !refreshed) {
        refreshed = true;
        refreshGame(game.gameId);
      }
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 500);
    return () => window.clearInterval(timer);
  }, [view, game, refreshGame]);

  useEffect(() => {
    if (game?.gameId) {
      localStorage.setItem(
        `${LOCAL_STORAGE_KEY}-${game.gameId}`,
        localPlayerName,
      );
    }
  }, [game?.gameId, localPlayerName]);

  useEffect(() => {
    setSelectedWild(null);
  }, [game?.currentTurn]);

  const currentPlayer = game?.players?.[game?.currentTurn] ?? null;
  const localPlayer = game?.players?.find(
    (player) => player.name === localPlayerName,
  );
  const otherPlayers = game?.players?.filter(
    (_, index) => index !== game?.currentTurn,
  ) ?? [];
  const discardTop = game?.discardPile?.[game.discardPile.length - 1] ?? null;
  const isLocalTurn = Boolean(
    localPlayer && currentPlayer && localPlayer.name === currentPlayer.name,
  );

  const playable = useMemo(() => {
    if (!localPlayer || !discardTop) return [];
    return localPlayer.cards.filter((card) =>
      isPlayable(card, discardTop, localPlayer.cards),
    );
  }, [localPlayer, discardTop]);

  const playableIds = playable.map((card) => card.id);

  async function handleCreateRoom() {
    const playerName = nameInput.trim();
    if (!playerName) {
      alert("Please enter your name before creating a room.");
      return;
    }

    try {
      const created = await createRoom(playerName);
      if (created?.gameId) {
        const gameId = created.gameId;
        setLocalPlayerName(playerName);
        setLocalGameId(gameId);
        localStorage.setItem(
          `${LOCAL_STORAGE_KEY}-${gameId}`,
          playerName,
        );
        const url = new URL(window.location.href);
        url.searchParams.set("gameId", gameId);
        window.history.replaceState({}, "", url.toString());
        setView("lobby");
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleJoinRoom() {
    const playerName = nameInput.trim();
    const rawRoomId = roomIdInput.trim();
    if (!playerName) {
      alert("Please enter your name before joining a room.");
      return;
    }

    if (!rawRoomId) {
      alert("Please enter the 4-digit room code.");
      return;
    }

    const roomId = rawRoomId.includes("/")
      ? rawRoomId.split("/").pop().trim()
      : rawRoomId;

    try {
      const updated = await joinRoom(roomId, playerName);
      if (updated?.gameId) {
        const gameId = updated.gameId;
        setLocalPlayerName(playerName);
        setLocalGameId(gameId);
        localStorage.setItem(
          `${LOCAL_STORAGE_KEY}-${gameId}`,
          playerName,
        );
        const url = new URL(window.location.href);
        url.searchParams.set("gameId", gameId);
        window.history.replaceState({}, "", url.toString());
        setView("lobby");
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleCopyRoom() {
    if (!game?.gameId) return;
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    window.setTimeout(() => setCopySuccess(false), 1400);
  }

  function handlePlay(card) {
    if (!isLocalTurn || !card || loading) return;
    if (card.type === "wild" || card.type === "wildDrawFour") {
      setSelectedWild(card.id);
      return;
    }
    setDiscardAnimating(true);
    window.setTimeout(() => setDiscardAnimating(false), 500);
    playCard(card.id);
  }

  function handleDraw() {
    if (!isLocalTurn || loading) return;
    setDrawAnimating(true);
    window.setTimeout(() => setDrawAnimating(false), 500);
    drawCard();
  }

  function pickColor(color) {
    if (!selectedWild) return;
    setDiscardAnimating(true);
    window.setTimeout(() => setDiscardAnimating(false), 500);
    playCard(selectedWild, color);
    setSelectedWild(null);
  }

  const showEntry = view === "entry";
  const showJoin = view === "join";
  const showLobby = view === "lobby";
  const showGame = view === "game";

  return (
    <main className="game-shell">
      <div className="top-action-row">
        <button type="button" className="top-btn pause">❚❚</button>
        <button type="button" className="top-btn settings">⚙</button>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {showEntry ? (
        <section className="entry-screen">
          <div className="entry-panel">
            <h1>UNO Room</h1>
            <p>Enter your name, then create or join a room.</p>

            <label className="field-label">
              Your name
              <input
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Player name"
              />
            </label>

            <button className="action-btn" type="button" onClick={handleCreateRoom}>
              Create Room
            </button>

            <div className="divider">or</div>

            <button className="action-btn secondary" type="button" onClick={() => setView("join")}>
              Join Room
            </button>
          </div>
        </section>
      ) : null}

      {showJoin ? (
        <section className="entry-screen">
          <div className="entry-panel">
            <h1>Join Room</h1>
            <p>Paste the 4-digit room code then submit.</p>

            <label className="field-label">
              Room ID or URL
              <input
                value={roomIdInput}
                onChange={(event) => setRoomIdInput(event.target.value)}
                placeholder="1234 or room URL"
              />
            </label>

            <button className="action-btn" type="button" onClick={handleJoinRoom}>
              Join Room
            </button>
          </div>
        </section>
      ) : null}

      {showLobby ? (
        <section className="lobby-screen">
          <div className="lobby-panel">
            <div className="lobby-header-row">
              <div>
                <h1>Room Lobby</h1>
                <p>Share this room code with another player.</p>
              </div>
              <div className="room-header-id">
                <span>Room ID</span>
                <strong>{game.gameId}</strong>
              </div>
            </div>

            <div className="player-list">
              {game.players.map((player, index) => (
                <div
                  key={`${player.name}-${index}`}
                  className={`player-list-item ${player.name === localPlayerName ? "self" : ""}`}
                >
                  <span>
                    {player.name}
                    {player.name === localPlayerName ? " (YOU)" : ""}
                  </span>
                </div>
              ))}
            </div>

            <div className="lobby-status">
              {game.players.length < game.playerLimit
                ? `Waiting for ${game.playerLimit - game.players.length} more player(s)...`
                : countdown !== null
                ? `Starting in ${countdown}...`
                : "Preparing game..."}
            </div>
          </div>
        </section>
      ) : null}

      {showGame ? (
        <div className="arena">
          <section className="opponent-area">
            {otherPlayers.map((player, index) => (
              <div key={`${player.name}-${index}`} className="opponent-card">
                <div className="player-badge">
                  <span className="player-name">{player.name}</span>
                  <span className="player-count">{player.cards.length} cards</span>
                </div>
                <OpponentFan count={player.cards.length} />
              </div>
            ))}
          </section>

          <section className="center-area">
            <div className="board-piles">
              <DrawPile
                count={game.drawPile?.length ?? 0}
                onDraw={handleDraw}
                loading={loading}
                animating={drawAnimating}
                disabled={!isLocalTurn}
              />
              <DiscardPile discardTop={discardTop} animating={discardAnimating} />
            </div>
            <div className="center-info">
              Current turn: <strong>{currentPlayer?.name || "Waiting..."}</strong>
            </div>
          </section>

          <section className="player-area">
            <div className={`player-badge current-player ${isLocalTurn ? "active" : ""}`}>
              <span className="player-name">
                {localPlayerName || "Your player"}
              </span>
              <span className="player-count">
                {localPlayer?.cards?.length ?? 0} cards
              </span>
            </div>

            {!localPlayer ? (
              <div className="spectator-notice">
                You are viewing the game as a guest. Use the room link to join before play.
              </div>
            ) : null}

            {selectedWild ? (
              <div className="wild-picker-panel">
                <p className="picker-title">Choose a color</p>
                <div className="picker-options">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      className={`picker-option ${color}`}
                      type="button"
                      onClick={() => pickColor(color)}
                      disabled={loading}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="hand">
              <UserHand
                cards={localPlayer?.cards ?? []}
                playableIds={playableIds}
                onCardClick={handlePlay}
                loading={loading}
              />
            </div>
          </section>
        </div>
      ) : null}

      {showGame ? <button type="button" className="uno-btn">UNO!</button> : null}
    </main>
  );
}
