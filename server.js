const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { MongoClient } = require('mongodb');
const next = require('next');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 80;
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'neon_pitch';

app.prepare().then(async () => {
  const server = express();
  const httpServer = createServer(server);
  const wss = new WebSocketServer({ server: httpServer, path: '/api/ws' });

  // MongoDB setup
  let db;
  try {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
  }

  server.use(express.json());

  // API Routes
  server.post('/api/status', async (req, res) => {
    try {
      const doc = {
        id: uuidv4(),
        client_name: req.body.client_name,
        timestamp: new Date().toISOString()
      };
      if (db) await db.collection('status_checks').insertOne(doc);
      res.json(doc);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  server.get('/api/status', async (req, res) => {
    try {
      const checks = db ? await db.collection('status_checks').find({}, { projection: { _id: 0 } }).toArray() : [];
      res.json(checks);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Matchmaking logic
  class Player {
    constructor(ws, name, teamId, stake) {
      this.id = uuidv4();
      this.ws = ws;
      this.name = (name || "PLAYER").substring(0, 20);
      this.teamId = teamId || "neon";
      this.stake = Number(stake) || 0;
      this.roomId = null;
      this.role = null;
      this.opponentId = null;
    }
    send(msg) {
      if (this.ws.readyState === 1) { // OPEN
        this.ws.send(JSON.stringify(msg));
      }
    }
  }

  class MatchmakingManager {
    constructor() {
      // Separate FIFO waiting queues per stake tier so only equal stakes match.
      this.waitingByStake = {};
      this.players = {};
      this.rooms = {};
    }

    _queue(stake) {
      const key = String(stake || 0);
      if (!this.waitingByStake[key]) this.waitingByStake[key] = [];
      return this.waitingByStake[key];
    }

    _removeFromQueues(playerId) {
      for (const key of Object.keys(this.waitingByStake)) {
        this.waitingByStake[key] = this.waitingByStake[key].filter(w => w.id !== playerId);
      }
    }

    register(ws, name, teamId, stake) {
      const p = new Player(ws, name, teamId, stake);
      this.players[p.id] = p;
      return p;
    }

    findMatch(player) {
      // Ensure the player is not queued anywhere, then look only within the same stake tier.
      this._removeFromQueues(player.id);
      const queue = this._queue(player.stake);
      let opponent = null;
      while (queue.length > 0) {
        const candidate = queue.shift();
        if (this.players[candidate.id] && candidate.ws.readyState === 1) {
          opponent = candidate;
          break;
        }
      }

      if (!opponent) {
        queue.push(player);
        player.send({ type: "searching" });
        return;
      }

      const roomId = uuidv4().substring(0, 8);
      this.rooms[roomId] = [opponent.id, player.id];
      opponent.roomId = roomId;
      player.roomId = roomId;
      opponent.role = "host";
      player.role = "guest";
      opponent.opponentId = player.id;
      player.opponentId = opponent.id;

      opponent.send({
        type: "match_start",
        role: "host",
        roomId: roomId,
        stake: player.stake,
        opponent: { name: player.name, teamId: player.teamId }
      });
      player.send({
        type: "match_start",
        role: "guest",
        roomId: roomId,
        stake: player.stake,
        opponent: { name: opponent.name, teamId: opponent.teamId }
      });
      console.log(`Match created ($${player.stake}): ${opponent.name} vs ${player.name}`);
    }

    cancel(player) {
      this._removeFromQueues(player.id);
    }

    relay(player, msg) {
      const oppId = player.opponentId;
      if (!oppId) return;
      const opponent = this.players[oppId];
      if (opponent) {
        opponent.send(msg);
      }
    }

    leave(player) {
      this._removeFromQueues(player.id);
      if (player.roomId) {
        const opp = this.players[player.opponentId];
        if (opp) {
          opp.send({ type: "opponent_left" });
          opp.roomId = null;
          opp.opponentId = null;
          opp.role = null;
        }
        delete this.rooms[player.roomId];
        player.roomId = null;
        player.opponentId = null;
        player.role = null;
      }
      delete this.players[player.id];
    }
  }

  const manager = new MatchmakingManager();

  wss.on('connection', (ws) => {
    let player = null;

    ws.on('message', (message) => {
      try {
        const msg = JSON.parse(message);
        const mtype = msg.type;

        if (mtype === "find_match") {
          if (!player) {
            player = manager.register(ws, msg.name, msg.teamId, msg.stake);
          } else {
            player.name = (msg.name || player.name).substring(0, 20);
            player.teamId = msg.teamId || player.teamId;
            player.stake = Number(msg.stake) || 0;
          }
          manager.findMatch(player);
        } else if (mtype === "cancel") {
          if (player) {
            manager.cancel(player);
            player.send({ type: "cancelled" });
          }
        } else if (["input", "state", "goal", "match_end", "chat"].includes(mtype)) {
          if (player && player.roomId) {
            const typeMap = {
              input: "opponent_input",
              state: "state",
              goal: "goal",
              match_end: "match_end",
              chat: "chat"
            };
            const relayed = { ...msg, type: typeMap[mtype] };
            manager.relay(player, relayed);
          }
        } else if (mtype === "leave") {
          if (player) {
            manager.leave(player);
            player = null;
          }
        } else if (mtype === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch (err) {
        console.error("WS parse error", err);
      }
    });

    ws.on('close', () => {
      if (player) {
        manager.leave(player);
      }
    });
  });

  // Next.js Catch-all
  server.use((req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});