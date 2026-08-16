// Frontend WebSocket client for online matchmaking + realtime relay.

function wsUrl() {
  // Convert https -> wss, http -> ws
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/api/ws`;
}

export class NetClient {
  constructor() {
    this.ws = null;
    this.handlers = new Map(); // eventType -> Set(callback)
    this._connected = false;
    this._closed = false;
    this._connectPromise = null;
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
        resolve();
        this.emit('open');
      };
      this.ws.onerror = (e) => {
        if (!settled) { settled = true; reject(e); }
        this.emit('error', e);
      };
      this.ws.onclose = () => {
        this._connected = false;
        this.emit('close');
      };
      this.ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          this.emit(msg.type, msg);
        } catch (err) {
          console.warn('WS parse error', err);
        }
      };
    });
    return this._connectPromise;
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
    this.send({ type: 'leave' });
  }

  close() {
    this._closed = true;
    if (this.ws) this.ws.close();
    this.ws = null;
    this._connected = false;
  }
}

// Singleton
export const net = new NetClient();
