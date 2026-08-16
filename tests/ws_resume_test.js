const WebSocket = require('ws');
const URL = 'ws://localhost:3000/api/ws';
const log = (t, m) => console.log(`[${t}] ${m}`);
let hostToken, guestToken, done = {};

function client(tag) {
  const ws = new WebSocket(URL);
  ws.msgs = [];
  ws.on('message', (d) => { const m = JSON.parse(d); ws.msgs.push(m); log(tag, 'recv ' + m.type); ws.emit('m:' + m.type, m); });
  return ws;
}

const host = client('HOST');
const guest = client('GUEST');

host.on('open', () => host.send(JSON.stringify({ type: 'find_match', name: 'HostP', teamId: 'neon', stake: 10 })));
guest.on('open', () => setTimeout(() => guest.send(JSON.stringify({ type: 'find_match', name: 'GuestP', teamId: 'crimson', stake: 10 })), 300));

host.on('m:match_start', (m) => { hostToken = m.token; done.hostStart = m.role === 'host' && !!m.token; });
guest.on('m:match_start', (m) => {
  guestToken = m.token; done.guestStart = m.role === 'guest' && !!m.token;
  // relay test: guest sends input, host must receive opponent_input
  guest.send(JSON.stringify({ type: 'input', input: { left: true } }));
  // simulate dirty disconnect after 500ms
  setTimeout(() => { log('GUEST', 'terminating socket (simulated drop)'); guest.terminate(); }, 500);
});
host.on('m:opponent_input', () => { done.relay = true; });
host.on('m:opponent_reconnecting', () => {
  done.graceStarted = true;
  // reconnect with resume token
  setTimeout(() => {
    const g2 = client('GUEST2');
    g2.on('open', () => g2.send(JSON.stringify({ type: 'resume', token: guestToken })));
    g2.on('m:resumed', (m) => {
      done.resumed = m.role === 'guest' && m.opponent && m.opponent.name === 'HostP';
      // host sends state after resume, guest2 must get it
      host.send(JSON.stringify({ type: 'state', state: { bX: 800, t: 45, sL: 1, sR: 0 } }));
    });
    g2.on('m:state', (m) => { done.stateAfterResume = m.state.bX === 800; finish(); });
  }, 800);
});
host.on('m:opponent_reconnected', () => { done.oppReconnected = true; });

// bad token test
const bad = client('BAD');
bad.on('open', () => bad.send(JSON.stringify({ type: 'resume', token: 'nope' })));
bad.on('m:resume_failed', () => { done.badTokenRejected = true; });

function finish() {
  setTimeout(() => {
    console.log('\nRESULTS:', JSON.stringify(done, null, 1));
    const keys = ['hostStart', 'guestStart', 'relay', 'graceStarted', 'resumed', 'oppReconnected', 'stateAfterResume', 'badTokenRejected'];
    const pass = keys.every((k) => done[k]);
    console.log(pass ? 'ALL PASS' : 'FAILED: ' + keys.filter((k) => !done[k]).join(','));
    process.exit(pass ? 0 : 1);
  }, 500);
}
setTimeout(() => { console.log('TIMEOUT', JSON.stringify(done)); process.exit(1); }, 12000);
