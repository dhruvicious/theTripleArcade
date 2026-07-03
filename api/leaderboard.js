const { Redis } = require("@upstash/redis");

const LEADERBOARD_SIZE = 10;
const VALID_GAMES = ["snake", "tetris", "breakout"];

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

async function getBoard(redis, game) {
  const data = await redis.get(`leaderboard:${game}`);
  if (Array.isArray(data)) return data;
  return [];
}

async function saveBoard(redis, game, board) {
  await redis.set(`leaderboard:${game}`, JSON.stringify(board));
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const redis = getRedis();

    if (req.method === "GET") {
      const { game } = req.query;
      if (!VALID_GAMES.includes(game)) {
        return res.status(400).json({ error: "Invalid game" });
      }
      const board = await getBoard(redis, game);
      return res.status(200).json(board);
    }

    if (req.method === "POST") {
      const { game, name, score } = req.body;

      if (!VALID_GAMES.includes(game)) {
        return res.status(400).json({ error: "Invalid game" });
      }
      if (typeof name !== "string" || name.length < 1 || name.length > 3) {
        return res.status(400).json({ error: "Name must be 1-3 characters" });
      }
      if (typeof score !== "number" || score <= 0) {
        return res.status(400).json({ error: "Score must be a positive number" });
      }

      const board = await getBoard(redis, game);
      board.push({ name: name.toUpperCase().replace(/[^A-Z]/g, "A"), score });
      board.sort((a, b) => b.score - a.score);
      if (board.length > LEADERBOARD_SIZE) {
        board.length = LEADERBOARD_SIZE;
      }
      await saveBoard(redis, game, board);
      return res.status(200).json(board);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Leaderboard API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
