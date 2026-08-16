# KICKHOOD — Product Requirements

## Ranked Stakes + Hard AI (2026-06)
- **AI zorluğu sabit HARD**: `engine.js._updateAI()` yeniden yazıldı (hızlı reactSpeed ~PLAYER_SPEED*1.12, top tahmini, topun gol tarafına geçme, güvenilir şut/kafa/aşırtma). Menüde zorluk seçimi yok.
- **Ranked Play stake seçimi**: RANKED PLAY → yeni `RankedStake.js` ekranı. **Cüzdan bağlı olması ZORUNLU** (wagmi `useAccount`); bağlı değilse `ranked-connect-prompt` + inline ConnectButton gösterilir.
- Bağlıyken $1/$10/$50/$100 butonları; her butonun altında **canlı ETH karşılığı** (CoinGecko `simple/price` ETH/USD, 60sn'de bir yenilenir, CORS `*`, key gerekmez). Transfer YOK, sadece seçim.
- **Stake bazlı eşleşme**: `server.js` artık her stake için ayrı FIFO kuyruk (`waitingByStake`). Sadece aynı stake'i seçenler eşleşir; eşleşmeyen sırada bekler. `net.findMatch(name, teamId, stake)`, `match_start` mesajına `stake` eklendi.
- Doğrulama: backend WebSocket testi (iki $100 eşleşti, $50 sırada kaldı) + testing agent iteration_4 %100 (stake ekranı cüzdan kapısı, Back, HARD AI maç smoke). Not: bağlı-cüzdan stake butonları + ETH gösterimi otomasyon ortamında cüzdan olmadığı için test edilemedi; kod ve CoinGecko uç noktası doğrulandı.

## Rebrand & Localization (2026-06)
- Proje adı **KickHood** olarak değiştirildi (başlık: KICK + neon yeşil HOOD, sekme başlığı `<title>KickHood`)
- Tüm arayüz **İngilizceye** çevrildi (MainMenu, ProfileScreen, BootScreen/Shop, Matchmaking, HUD, EndScreen, PauseOverlay, StatsCard, MobileControls, canvas metinleri: GOAL!!!/GREAT SHOT!/CPU SCORED, takım & krampon isimleri, server default name PLAYER)
- Ana menü değişiklikleri: **Ayarlar (Settings) kaldırıldı**; "Oyna"→**AI-PLAY**, "Krampon"→**SHOP** (ShoppingBag ikonu), "Maç Bul"→**RANKED PLAY**, "Profil"→PROFILE, "Ses"→SOUND ON/OFF
- Not: parallel same-file search_replace race yaşandı → aynı dosyaya eş zamanlı düzenleme yerine sıralı yapılmalı

## Original Problem Statement
Web tarayıcısında çalışan 2D futbol oyunu geliştir. Hızlı arcade futbol mantığında, tek oyuncu bilgisayara karşı. HTML5 Canvas + React. Klavye (WASD/oklar/space) ve mobil dokunmatik butonlar. Skor, süre (90sn), gol animasyonu, ses efektleri. Yan görünüş (side-view), modern minimalist stil, stilize futbolcu figürleri, programatik ses efektleri (Web Audio API), responsive mobil destekli.

## User Choices (from ask_human)
- Görsel stil: Modern minimalist
- Perspektif: Yan görünüş (Head Ball tarzı)
- Süre / zorluk: Sabit 90 saniye, orta zorluk AI
- Ses: Programatik Web Audio SFX
- Karakter: Stilize futbolcu figürleri

## Architecture
- **Frontend only** React 19 + HTML5 Canvas + Tailwind (Bebas Neue + Outfit fonts)
- **No backend dependency** — game runs entirely client-side. Backend left as-is (hello-world FastAPI).
- **Game engine**: fixed-timestep-ish loop via requestAnimationFrame in `/app/frontend/src/game/engine.js`
- **Rendering**: pure Canvas2D in `/app/frontend/src/game/renderer.js`, coordinate space 1600x900 scaled to viewport with letterboxing
- **Audio**: `AudioContext` oscillator-based SFX (`/app/frontend/src/game/audio.js`)
- **State machine**: MENU → PLAYING → PAUSED → ENDED (see `/app/frontend/src/pages/Game.js`)

## Implemented (2026-06) — RainbowKit Cüzdan Entegrasyonu
- RainbowKit v2 + wagmi v2 + viem v2 kuruldu (`@tanstack/react-query` zaten mevcuttu)
- Sağ üstte her ekranda sabit "Connect Wallet" butonu (`/app/src/components/WalletButton.js`, data-testid `wallet-connect-container`), `_app.js` içinde global render
- Provider sırası: WagmiProvider → QueryClientProvider → RainbowKitProvider (neon yeşil darkTheme)
- Özel zincir: Robinhood Chain (id 4663, RPC https://rpc.mainnet.chain.robinhood.com, ETH, explorer robinhoodchain.blockscout.com) — `/app/src/lib/chain.js`
- Config: `/app/src/lib/wagmi.js` getDefaultConfig, projectId env `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (/app/.env), ssr:true
- ConnectButton showBalance=true → bağlanınca adres + ETH bakiye; yanlış ağda otomatik "Wrong network" uyarısı (yalnızca Robinhood Chain tanımlı)
- Test: iteration_3.json %100 (4/4) — buton, modal (Rainbow/Base/MetaMask/WalletConnect), oyun içi kalıcılık, hata yok
- Not: Gerçek cüzdan bağlantısı için kullanıcının tarayıcı cüzdanı (MetaMask vb.) gerekir; otomasyon ortamında tam bağlantı test edilemez

## Implemented (2026-06) — Street Style Görsel Yenileme
- Kullanıcının paylaştığı Head Ball 2 referans görseline uygun sahne (`/app/src/game/renderer.js`):
  - Grafiti kaplı beton duvar, ayakta tezahürat yapan çizgi film seyirci kalabalığı
  - Tel örgü (chain-link) çit, sokak lambaları, açık mavi gökyüzü + bulutlar
  - Beyaz çerçeveli kaleler (dik ön direk, eğik arka destek, beyaz file ağı)
  - Yıpranmış çim saha (toprak lekeleri, beyaz çizgiler, perspektif orta yuvarlak, ceza sahaları)
  - Sahanın altında kahverengi toprak zemin (çakıl/benek dokulu)

## Implemented (2026-02-13)
- Main menu (Neon Pitch Striker branding, Oyna/Ayarlar/Ses toggle)
- Side-view canvas: pitch, dual goals with nets, ground stripes, stadium bg
- Player + AI with stylized bodies (head, body, animated legs, arms, kick anim)
- Ball with physics (gravity, bounce, air/ground friction, rolling shadow)
- Collisions: body-rect + head-circle vs ball, ball vs walls, ball vs ground
- Kick action: Space (desktop) / Şut button (mobile) applies directional impulse
- AI: pursues ball, jumps for headers, kicks when close, retreats to defend
- Goal detection + score reset + 800ms freeze + siren SFX
- 90s countdown timer with warning color under 10s
- End screen with winner and rematch
- ESC pause overlay
- Keyboard input (A/D/W/Space + Arrow keys)
- Mobile virtual controls (pointer events, multi-touch capable, semi-transparent)
- Programmatic SFX: kick, jump, bounce, goal, whistle, menu beep
- Responsive canvas (DPR-aware, resize/orientation listeners)

## Backlog / Next Actions (P1)
- Difficulty selector (Easy/Medium/Hard) with AI tuning
- Configurable match length in settings
- Power meter for shots (hold Space to charge)
- Simple particle effects on goal (confetti/streamers)
- Best-of series / tournament mode
- Local leaderboard (persist high scores in localStorage)
- Optional 2-player local mode (P2 uses different keys)

## Notes
- All lint clean in our code; existing shadcn UI files have pre-existing warnings (unused by our game).
- Test iteration 1 passed at ~95% (see `/app/test_reports/iteration_1.json`); one LOW-priority hardening applied.
