import { create } from "zustand";
import { createGame, updateGame } from "../api/gameApi";

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

  playCard: async (cardId) => {
    const { game } = get();

    if (!game) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const updatedGame = await updateGame(game.gameId, {
        type: "play",
        cardId,
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
