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

## NFT Boot Shop (added 2026-06)
- MainMenu button renamed SHOP -> **NFT-SHOP**; BootScreen header -> NFT-SHOP.
- Boots renamed + priced (`src/game/boots.js`): STANDARD BLACK (free), FLAME NFT $1, STORM NFT $3, LIGHTNING NFT $10, TITANIUM NFT $15, GALAXY NFT $30, GOLDEN NFT $50 (S:30 P:25, new).
- Payment: on "BUY", frontend switches to Robinhood chain, fetches live ETH/USD, converts USD price to ETH, and sends native ETH from the connected wallet to treasury `0x603a26e0745aE579ad0F931307a386ddC3DD096F` via `@wagmi/core` sendTransaction + waitForTransactionReceipt.
- Backend (`server.js`): `GET /api/eth-price` (Coinbase primary, CoinGecko fallback, 60s cache), `POST /api/nft/purchase` (records ownership + tx in `nft_purchases`, upserts `users.ownedBoots`), `GET /api/nft/owned/:wallet`.
- Ownership gates EQUIP: free boot always usable; NFT boots require purchase before equipping.
- Verified: UI states, all names/prices/stats, eth-price feed, purchase+owned endpoints (curl). NOT verified end-to-end on-chain (requires a real funded wallet on Robinhood chain).

## Boot Visuals + Live ETH (added 2026-06)
- New high-quality showcase renderer `drawBootShowcase` (`src/game/renderer.js`): side-profile football cleat with starry night backdrop, sparkle stars, gloss highlight, laces panel, sole + studs, accent stripes (normal), nebula (galaxy), shine streak (reflection/golden). Used in shop preview cards; in-game `drawBoot` unchanged.
- Each shop card now shows live ETH equivalent under the USD price (`/api/eth-price`, client refresh every 30s). Purchase converts USD→ETH at the live rate at buy time.

## Boot Art = Reference Style (updated 2026-06)
- Replaced procedural boot drawings with 7 AI-generated hand-drawn comic cleats matching the user's reference (golden classic cleat, starry sky, ink outline, cel shading, studs, stripes). Stored in `/app/public/boots/boot_1..7.jpg` (512px, optimized). `boots.js` has `image` field per boot.
- Shop preview card and quick-select thumbnails now render these images (`<img>`), not canvas. `drawBootShowcase` left in renderer (unused). In-game player boots unchanged.

## Backlog / Next
- Awaiting further user edit requests.

