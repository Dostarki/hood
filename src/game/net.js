// Frontend WebSocket client for online matchmaking + realtime relay.
// Supports keepalive pings and automatic mid-match reconnection (resume).

function wsUrl() {
  // Convert https -> wss, http -> ws
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/api/ws`;
}

const PING_INTERVAL = 10000;
const RECONNECT_DELAY = 1200;
const MAX_RECONNECT_ATTEMPTS = 10;

export class NetClient {
  constructor() {
    this.ws = null;
    this.handlers = new Map(); // eventType -> Set(callback)
    this._connected = false;
    this._closed = false;
    this._connectPromise = null;
    this.sessionToken = null;
    this.inMatch = false;
    this._pingTimer = null;
    this._reconnectTimer = null;
    this._reconnectAttempts = 0;
  }

  on(type, cb) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(cb);
    return () => this.handlers.get(type)?.delete(cb);
  }

  emit(type, msg) {
    const set = this.handlers.get(type);
    if (set) set.forEach((cb) => { try { cb(msg); } catch (e) { console.error(e); } });
    const anySet = this.handlers.get('*');
    if (anySet) anySet.forEach((cb) => cb(msg));
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return this._connectPromise || Promise.resolve();
    }
    this._closed = false;
    this._connectPromise = new Promise((resolve, reject) => {
      let settled = false;
      try {
        this.ws = new WebSocket(wsUrl());
      } catch (e) {
        reject(e);
        return;
      }
      this.ws.onopen = () => {
        this._connected = true;
        settled = true;
        this._startPing();
        resolve();
        this.emit('open');
      };
      this.ws.onerror = (e) => {
        if (!settled) { settled = true; reject(e); }
        this.emit('error', e);
      };
      this.ws.onclose = () => {
        this._connected = false;
        this._stopPing();
        this.emit('close');
        // Auto-reconnect mid-match on unexpected socket drops
        if (!this._closed && this.inMatch && this.sessionToken) {
          this._scheduleReconnect();
        }
      };
      this.ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          this._track(msg);
          this.emit(msg.type, msg);
        } catch (err) {
          console.warn('WS parse error', err);
        }
      };
    });
    return this._connectPromise;
  }

  _track(msg) {
    if (msg.type === 'match_start' || msg.type === 'resumed') {
      if (msg.token) this.sessionToken = msg.token;
      this.inMatch = true;
      this._reconnectAttempts = 0;
    } else if (msg.type === 'opponent_left' || msg.type === 'resume_failed') {
      this.inMatch = false;
      this.sessionToken = null;
    }
  }

  _startPing() {
    this._stopPing();
    this._pingTimer = setInterval(() => this.send({ type: 'ping' }), PING_INTERVAL);
  }

  _stopPing() {
    if (this._pingTimer) { clearInterval(this._pingTimer); this._pingTimer = null; }
  }

  _scheduleReconnect() {
    this._reconnectAttempts++;
    if (this._reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      this.inMatch = false;
      this.sessionToken = null;
      this.emit('resume_failed', {});
      return;
    }
    this.emit('reconnecting', { attempt: this._reconnectAttempts });
    this._reconnectTimer = setTimeout(() => {
      if (this._closed || !this.inMatch) return;
      this.connect()
        .then(() => this.send({ type: 'resume', token: this.sessionToken }))
        .catch(() => this._scheduleReconnect());
    }, RECONNECT_DELAY);
  }

  send(msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  findMatch(name, teamId, stake) {
    this.send({ type: 'find_match', name, teamId, stake });
  }

  cancel() {
    this.send({ type: 'cancel' });
  }

  sendInput(input) {
    this.send({ type: 'input', input });
  }

  sendState(state) {
    this.send({ type: 'state', state });
  }

  sendGoal(payload) {
    this.send({ type: 'goal', ...payload });
  }

  sendMatchEnd(payload) {
    this.send({ type: 'match_end', ...payload });
  }

  leave() {
    this.inMatch = false;
    this.sessionToken = null;
    this.send({ type: 'leave' });
  }

  close() {
    this._closed = true;
    this.inMatch = false;
    this.sessionToken = null;
    this._stopPing();
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
    if (this.ws) this.ws.close();
    this.ws = null;
    this._connected = false;
  }
}

// Singleton
export const net = new NetClient();
