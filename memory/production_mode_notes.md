# KickHood — Kritik Notlar

## PRODUCTION MODE AKTİF (2026-06)
- `/app/.env` içinde `NODE_ENV=production`. `server.js` dotenv ile okuyup Next'i prod modda başlatıyor.
- HOT RELOAD YOK. Kod değişikliği sonrası: `sudo supervisorctl stop frontend && cd /app && yarn build && sudo supervisorctl start frontend`
- Build'i frontend ÇALIŞIRKEN yapma: dev/prod süreçleri `.next`'e aynı anda yazınca "Cannot find module './chunks/vendor-chunks/next.js'" hatası oluşur. Önce durdur, `rm -rf .next` gerekebilir.
- Sebep: dev modda Next HMR, ağ kopmalarında tam sayfa reload (`_hardReload`) yapıyordu → ranked maçlar kopuyordu.

## Online mimari
- Host otoriter simülasyon, 30Hz state snapshot; guest 30Hz input gönderir, snapshot interpolation ile render eder (engine.js `_interpolateGuest`).
- Resume: server 15sn grace, token bazlı (`net.sessionToken`). WS testleri: /app/tests/ws_resume_test.js, ws_grace_expiry_test.js
