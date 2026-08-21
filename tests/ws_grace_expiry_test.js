// Verifies host receives 'opponent_left' after grace period expires (~15s)
const WebSocket = require('ws');
const URL = 'ws://localhost:3000/api/ws';
const log = (t, m) => console.log(`[${t}] ${Date.now()%100000} ${m}`);

function client(tag) {
  const ws = new WebSocket(URL);
  ws.on('message', (d) => { const m = JSON.parse(d); log(tag, 'recv ' + m.type); ws.emit('m:' + m.type, m); });
  return ws;
}
const host = client('HOST'), guest = client('GUEST');
let result = { matched: false, reconnecting: false, opponent_left: false, elapsed: 0 };
let tStart = 0;

host.on('open', () => host.send(JSON.stringify({ type: 'find_match', name: 'H', teamId: 'neon', stake: 10 })));
guest.on('open', () => setTimeout(() => guest.send(JSON.stringify({ type: 'find_match', name: 'G', teamId: 'crimson', stake: 10 })), 300));

guest.on('m:match_start', () => {
  result.matched = true;
  setTimeout(() => { tStart = Date.now(); log('GUEST', 'terminate'); guest.terminate(); }, 400);
});
host.on('m:opponent_reconnecting', () => { result.reconnecting = true; });
host.on('m:opponent_left', () => {
  result.opponent_left = true;
  result.elapsed = Date.now() - tStart;
  log('HOST', `opponent_left after ${result.elapsed}ms`);
  console.log('\nRESULT:', JSON.stringify(result, null, 1));
  const ok = result.matched && result.reconnecting && result.opponent_left && result.elapsed >= 13000 && result.elapsed <= 20000;
  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
});
setTimeout(() => { console.log('TIMEOUT', result); process.exit(1); }, 25000);
