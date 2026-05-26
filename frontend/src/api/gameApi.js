const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:4000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}

export async function createGame() {
  return request("/api/games", { method: "POST" });
}

export async function updateGame(gameId, action) {
  return request(`/api/games/${gameId}`, {
    method: "PATCH",
    body: JSON.stringify(action),
  });
}
