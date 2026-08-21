# KICKHOOD (Neon Pitch Striker) - PRD

## Problem Statement
GitHub reposundan (https://github.com/Dostarki/hood) proje çekildi ve Emergent ortamında çalışır hale getirildi. Kullanıcı önce projeyi çalıştırmak, sonra düzenlemelere karar vermek istiyor.

## Architecture
- **Frontend/Server**: Next.js 14 (pages router) + custom `server.js` (Express + WebSocket + MongoDB). Runs on port 3000 via supervisor `frontend` (`yarn start` -> `cd /app && node server.js`).
- **Backend proxy**: FastAPI (`backend/server.py`) on port 8001. Reverse-proxies `/api/*` HTTP and `/api/ws` WebSocket to the Node server on 3000 (Emergent ingress routes `/api` -> 8001).
- **Database**: MongoDB Atlas (configured in root `/app/.env`, DB: `basetobacco`). Collections: `users`, `status_checks`.
- **Web3**: wagmi + RainbowKit + viem, custom "Robinhood Chain" (id 4663). WalletConnect project id in `.env`.

## Game Overview
Arcade side-view football game "KICKHOOD". 90-second matches.
- **AI-PLAY**: single-player vs CPU (requires wallet connection).
- **RANKED PLAY**: online multiplayer with stake tiers, matchmaking + reconnection via WebSocket.
- **PROFILE / SHOP (Boots)**: team & boot customization, nickname registration.
- **Leaderboard**: "Top 10 Goal Kings" from MongoDB `users.totalGoals`.

## Status (2026-06)
- [DONE] Repo pulled into /app, node deps installed, backend deps installed.
- [DONE] Both services running; app loads at preview URL; leaderboard reads live from Atlas.
- [DONE] Main menu, wallet gate, leaderboard verified via screenshot.

## Backlog / Next
- Awaiting user's edit requests (features / bug fixes / design changes).
