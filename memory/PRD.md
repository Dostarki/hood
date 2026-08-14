# NEON PITCH STRIKER — Product Requirements

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
