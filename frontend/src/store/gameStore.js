import { create } from "zustand";
import { createGame, getGame, updateGame } from "../api/gameApi";

const useGameStore = create((set, get) => ({
  game: null,
  loading: false,
  error: null,

  initGame: async () => {
    set({ loading: true, error: null });

    try {
      const game = await createGame();
      set({ game, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createRoom: async (creatorName) => {
    set({ loading: true, error: null });

    try {
      const game = await createGame({
        creatorName,
      });
      set({ game, loading: false });
      return game;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  joinRoom: async (gameId, playerName) => {
    set({ loading: true, error: null });

    try {
      const updatedGame = await updateGame(gameId, {
        type: "join",
        playerName,
      });
      set({ game: updatedGame, loading: false });
      return updatedGame;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  loadGame: async (gameId) => {
    set({ loading: true, error: null });

    try {
      const game = await getGame(gameId);
      set({ game, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  refreshGame: async (gameId) => {
    try {
      const game = await getGame(gameId);
      set({ game });
    } catch (error) {
      set({ error: error.message });
    }
  },

  playCard: async (cardId, chosenColor = null) => {
    const { game } = get();

    if (!game) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const updatedGame = await updateGame(game.gameId, {
        type: "play",
        cardId,
        chosenColor,
      });
      set({ game: updatedGame, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  drawCard: async () => {
    const { game } = get();

    if (!game) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const updatedGame = await updateGame(game.gameId, { type: "draw" });
      set({ game: updatedGame, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));

export default useGameStore;
