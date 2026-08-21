// Arcade side-view football engine
// Reference resolution 1600x900; the renderer scales to canvas size.

import { audio } from './audio';
import { getBootById } from './boots';

export const FIELD = {
  W: 1600,
  H: 900,
  GROUND_Y: 580,          // top of ground
  GOAL_WIDTH: 30,         // depth of goal net
  GOAL_HEIGHT: 240,       // vertical size of goal opening
  GOAL_BOTTOM: 580,       // ground line
};

const GRAVITY = 0.75;
const PLAYER_SPEED = 5.5;
const JUMP_V = -18.5;
const BALL_BOUNCE = 0.72;
const BALL_AIR_FRICTION = 0.9975;
const BALL_GROUND_FRICTION = 0.985;
const KICK_POWER = 15;
const KICK_LIFT = -9;
const HEAD_KICK_POWER = 12;
const LOB_LIFT = -22;        // strong upward arc for the chip / aşırtma

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function len(x, y) { return Math.hypot(x, y); }

class Player {
  constructor({ x, side, color, name, controlled, theme, bootId }) {
    this.x = x;
    this.y = FIELD.GROUND_Y - 100;
    this.vx = 0;
    this.vy = 0;
    this.w = 70;
    this.h = 100;
    this.headR = 42;
    this.bodyTop = 66; // relative offset where torso starts (below head)
    this.onGround = true;
    this.side = side;          // 'left' | 'right'
    this.color = color;
    this.name = name;
    this.controlled = controlled;
    this.theme = theme || { primary: color, hair: '#3E2723', skin: '#F5D6B5', hairStyle: 'buzz', accessory: 'none' };
    this.boot = getBootById(bootId || 'boot_1'); // Load boot stats and visuals safely
    this.kickCooldown = 0;
    this.kicking = 0;          // countdown for kick animation
    this.facing = side === 'left' ? 1 : -1;
    this.legPhase = 0;
    // Direction toward THIS player's own goal (used to prevent own goals on back hits)
    this.ownGoalDir = side === 'left' ? -1 : 1;
    this.kickType = 'shot';    // 'shot' (flat drive) | 'lob' (chip / aşırtma)
  }

  get feetX() { return this.x + this.w / 2; }
  get feetY() { return this.y + this.h; }
  get headX() { return this.x + this.w / 2; }
  get headY() { return this.y + this.headR + 4; }

  // Apply boot speed bonus (0.2 speed per bonus point)
  get moveSpeed() { return PLAYER_SPEED + (this.boot.spdBonus * 0.2); }

  moveLeft() { this.vx = -this.moveSpeed; this.facing = -1; }
  moveRight() { this.vx = this.moveSpeed; this.facing = 1; }
  stop() { this.vx = 0; }
  jump() {
    if (this.onGround) {
      this.vy = JUMP_V;
      this.onGround = false;
      audio.jump();
    }
  }
  tryKick(type = 'shot') {
    if (this.kickCooldown <= 0) {
      this.kicking = 14;
      this.kickCooldown = 25;
      this.kickType = type;
      return true;
    }
    // Allow upgrading an already-armed shot into a lob while the kick window is open
    if (type === 'lob' && this.kicking > 0) {
      this.kickType = 'lob';
      return true;
    }
    return false;
  }

  update() {
    // gravity
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    // Ground clamp
    if (this.y + this.h >= FIELD.GROUND_Y) {
      this.y = FIELD.GROUND_Y - this.h;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Bounds
    if (this.x < 40) this.x = 40;
    if (this.x + this.w > FIELD.W - 40) this.x = FIELD.W - 40 - this.w;

    if (this.kickCooldown > 0) this.kickCooldown--;
    if (this.kicking > 0) this.kicking--;
    if (Math.abs(this.vx) > 0.1 && this.onGround) this.legPhase += 0.25;
    else this.legPhase = 0;
  }
}

class Ball {
  constructor() {
    this.reset();
    this.r = 18;
  }
  reset(direction = 0) {
    this.x = FIELD.W / 2;
    this.y = FIELD.GROUND_Y - 200;
    this.vx = direction * 3;
    this.vy = 0;
    this.spin = 0;
  }
  update() {
    this.vy += GRAVITY * 0.55;
    this.vx *= BALL_AIR_FRICTION;
    this.x += this.vx;
    this.y += this.vy;
    this.spin += this.vx * 0.05;

    // ground bounce
    if (this.y + this.r >= FIELD.GROUND_Y) {
      this.y = FIELD.GROUND_Y - this.r;
      if (Math.abs(this.vy) > 1) {
        this.vy = -this.vy * BALL_BOUNCE;
        audio.bounce();
      } else {
        this.vy = 0;
      }
      this.vx *= BALL_GROUND_FRICTION;
    }

    // side walls (excluding goal openings)
    if (this.x - this.r < 0) {
      if (this.y > FIELD.GROUND_Y - FIELD.GOAL_HEIGHT) {
        // inside goal area vertical range -> handled by goal detection
      }
      this.x = this.r;
      this.vx = -this.vx * BALL_BOUNCE;
    }
    if (this.x + this.r > FIELD.W) {
      this.x = FIELD.W - this.r;
      this.vx = -this.vx * BALL_BOUNCE;
    }

    // ceiling
    if (this.y - this.r < 0) {
      this.y = this.r;
      this.vy = -this.vy * BALL_BOUNCE;
    }
  }
}

function collideBallPlayer(ball, player) {
  // Approximate player as head circle + torso/foot area
  const torsoInset = 15;
  const bx = clamp(ball.x, player.x + torsoInset, player.x + player.w - torsoInset);
  const by = clamp(ball.y, player.y + player.bodyTop, player.y + player.h); // Extended down to foot
  const dx = ball.x - bx;
  const dy = ball.y - by;
  const dist = len(dx, dy);

  // If the player is actively kicking, expand the kick hitbox in front of them
  let kickHit = false;
  if (player.kicking > 0) {
    const reach = 40; // Kick reach
    const kickX = player.x + player.w / 2 + (player.facing * (player.w / 2 + reach / 2));
    const kickY = player.y + player.h - 20; // Foot level
    if (Math.abs(ball.x - kickX) < reach + ball.r && Math.abs(ball.y - kickY) < 40 + ball.r) {
      kickHit = true;
    }
  }

  if (dist < ball.r || kickHit) {
    if (dist < ball.r) {
      // push out of body
      const overlap = ball.r - dist + 0.5;
      let nx = dist === 0 ? (ball.x < player.x + player.w / 2 ? -1 : 1) : dx / dist;
      let ny = dist === 0 ? -1 : dy / dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      // impart velocity from player + reflection
      const relvx = ball.vx - player.vx;
      const relvy = ball.vy - player.vy;
      const vn = relvx * nx + relvy * ny;
      if (vn < 0) {
        ball.vx = ball.vx - (1 + 0.6) * vn * nx + player.vx * 0.5;
        ball.vy = ball.vy - (1 + 0.6) * vn * ny + player.vy * 0.5;
      }

      // BUGFIX: a passive hit on our BACK (own-goal side of the body) must not
      // shove the ball into our own goal. Kill velocity heading toward own goal.
      if (Math.sign(nx) === player.ownGoalDir && Math.sign(ball.vx) === player.ownGoalDir) {
        ball.vx *= 0.2;
      }
    }

    // Kick action boost (foot). Lob = chip up; Shot = flat drive.
    if (player.kicking > 0 && player.kickCooldown > 10) {
      // Boot power scaling (0.5 power per bonus point)
      const currentKickPower = KICK_POWER + (player.boot.powBonus * 0.5);

      if (player.kickType === 'lob') {
        // Aşırtma: less horizontal, strong upward arc (chip over the opponent)
        ball.vx = player.facing * currentKickPower * 0.5 + player.vx * 0.5;
        ball.vy = LOB_LIFT - (player.boot.powBonus * 0.3) + Math.min(0, player.vy);
      } else {
        ball.vx = player.facing * currentKickPower + player.vx;
        ball.vy = KICK_LIFT - 5 - (player.boot.powBonus * 0.2) + Math.min(0, player.vy); // Added more upward lift (-5)
      }
      audio.kick();
      player.kicking = 0; // End kick so it only hits once
      return { type: 'kick', x: ball.x, y: ball.y };
    }
    return { type: 'body', x: ball.x, y: ball.y };
  }
  // Head collision (round)
  const hdx = ball.x - player.headX;
  const hdy = ball.y - player.headY;
  const hdist = len(hdx, hdy);
  if (hdist < ball.r + player.headR) {
    const overlap = ball.r + player.headR - hdist + 0.5;
    const nx = hdist === 0 ? 0 : hdx / hdist;
    const ny = hdist === 0 ? -1 : hdy / hdist;
    ball.x += nx * overlap;
    ball.y += ny * overlap;
    // BUGFIX: back-of-head hit (own-goal side) must NOT power the ball into our
    // own net. Only front-of-head hits get the header boost; back hits soft-pop.
    if (Math.sign(nx) === player.ownGoalDir) {
      ball.vy = ny * HEAD_KICK_POWER * 0.3 - 4;      // gentle upward pop
      ball.vx = player.vx * 0.3 - player.ownGoalDir * 2; // nudge away from own goal
      audio.bounce();
      return { type: 'header-soft', x: player.headX + nx * player.headR, y: player.headY + ny * player.headR };
    } else {
      // Header (front): full power away from our goal.
      ball.vx = nx * HEAD_KICK_POWER + player.vx * 0.6;
      ball.vy = ny * HEAD_KICK_POWER * 0.9 - 3;
      audio.header();
      const power = Math.min(1, (len(ball.vx, ball.vy)) / 16);
      return { type: 'header', x: player.headX + nx * player.headR, y: player.headY + ny * player.headR, nx, ny, power };
    }
  }
  return null;
}

export class GameEngine {
  constructor({ onScore, onEnd, matchDuration = 90, playerTeam, aiTeam, mode = 'ai' }) {
    const pTeam = playerTeam || { primary: '#00FF66', hair: '#1a1a1a', skin: '#F5D6B5', hairStyle: 'buzz', accessory: 'none', name: 'YOU' };
    const aTeam = aiTeam || { primary: '#FF3B30', hair: '#3E2723', skin: '#E0A98C', hairStyle: 'spiky', accessory: 'beard', name: 'CPU' };
    this.player = new Player({ x: 300, side: 'left', color: pTeam.primary, name: pTeam.name || 'YOU', controlled: true, theme: pTeam, bootId: pTeam.bootId });
    this.ai = new Player({ x: FIELD.W - 360, side: 'right', color: aTeam.primary, name: aTeam.name || 'CPU', controlled: false, theme: aTeam, bootId: aTeam.bootId });
    this.mode = mode; // 'ai' | 'host' | 'guest'
    this.remoteInput = { left: false, right: false, jump: false, shoot: false, lob: false };
    this.lastRemoteState = null;
    this.stateTickCount = 0;
    this.snapBuffer = [];      // guest: timed snapshot buffer for interpolation
    this.interpDelay = 110;    // ms render delay behind newest snapshot
    this.ballLocalUntil = 0;   // guest: ms timestamp until which the ball is locally controlled after own contact
    this.ball = new Ball();
    this.scoreL = 0;
    this.scoreR = 0;
    this.time = matchDuration;
    this.matchDuration = matchDuration;
    this.paused = false;
    this.ended = false;
    this.frozen = 0;   // freeze frames after goal
    this.isResetting = false; // prevents double goal detection
    this.onScore = onScore;
    this.onEnd = onEnd;
    this.input = {
      left: false, right: false, jump: false, shoot: false, lob: false,
    };
    this.lastSecond = performance.now();
    this.aiState = { thinkTimer: 0 };
    this.celebration = 0;   // frames of celebration
    this.lastScorer = null; // 'left' | 'right'
    this.confetti = [];     // particles
    this.hits = [];         // header/impact flash effects
    this.shake = 0;
  }

  setInput(partial) {
    Object.assign(this.input, partial);
  }

  step(dt) {
    if (this.ended || this.paused) return;

    // Guest mode: locally PREDICT own player for instant response, interpolate
    // the host player from snapshots. The ball stays host-authoritative BUT we
    // run a local contact check against our own predicted player so it never
    // phases through — on contact the ball gets brief local control so it reacts
    // instantly, then hands authority back to the host's snapshots.
    if (this.mode === 'guest') {
      const now = performance.now();
      this._stepGuestLocalPlayer();
      const ballLocal = now < this.ballLocalUntil;
      this._interpolateGuest(now, ballLocal);
      if (ballLocal) this.ball.update();
      const hit = collideBallPlayer(this.ball, this.ai);
      if (hit) {
        this._spawnHit(hit);
        this.ballLocalUntil = now + 200; // brief local ball authority after contact
      }
      this._updateParticles();
      if (this.shake > 0) this.shake *= 0.9;
      if (this.celebration > 0) this.celebration--;
      if (this.frozen > 0) this.frozen -= dt;
      return;
    }

    // Update confetti and shake regardless of freeze
    this._updateParticles();
    if (this.shake > 0) this.shake *= 0.9;
    if (this.celebration > 0) this.celebration--;

    // Freeze after goal for a beat
    if (this.frozen > 0) {
      this.frozen -= dt;
      return;
    }

    // Player input
    if (this.input.left && !this.input.right) this.player.moveLeft();
    else if (this.input.right && !this.input.left) this.player.moveRight();
    else this.player.stop();
    if (this.input.jump) this.player.jump();
    if (this.input.lob) this.player.tryKick('lob');
    else if (this.input.shoot) this.player.tryKick('shot');

    // AI or remote opponent
    if (this.mode === 'host') this._updateRemoteOpponent();
    else if (this.mode === 'ai') this._updateAI();

    this.player.update();
    this.ai.update();
    this.ball.update();

    const hitP = collideBallPlayer(this.ball, this.player);
    if (hitP) this._spawnHit(hitP);
    const hitA = collideBallPlayer(this.ball, this.ai);
    if (hitA) this._spawnHit(hitA);

    // Prevent players overlap
    this._playersCollide();

    // Goal detection
    const goalTop = FIELD.GROUND_Y - FIELD.GOAL_HEIGHT;
    if (!this.isResetting) {
      // Left goal: ball crosses x=0 within goal height
      if (this.ball.x - this.ball.r <= FIELD.GOAL_WIDTH && this.ball.y > goalTop) {
        // Right team (AI) scores
        this.scoreR++;
        this._handleGoal('right');
        return;
      }
      if (this.ball.x + this.ball.r >= FIELD.W - FIELD.GOAL_WIDTH && this.ball.y > goalTop) {
        this.scoreL++;
        this._handleGoal('left');
        return;
      }
    }

    // Timer
    const now = performance.now();
    if (now - this.lastSecond >= 1000) {
      this.time--;
      this.lastSecond = now;
      if (this.time <= 5 && this.time > 0) audio.countdown();
      if (this.time <= 0) {
        this.time = 0;
        this.ended = true;
        audio.whistle();
        if (this.onEnd) this.onEnd({ scoreL: this.scoreL, scoreR: this.scoreR });
      }
    }
  }

  _updateAI() {
    const ai = this.ai;
    const ball = this.ball;
    ai.vx = 0;

    // HARD difficulty (fixed): fast, predictive and aggressive.
    const reactSpeed = PLAYER_SPEED * 1.12;
    const goalDefendX = FIELD.W - 300;
    const half = FIELD.W / 2;

    const aiCenter = ai.x + ai.w / 2;
    const dx = ball.x - aiCenter;
    const dy = ball.y - (ai.y + ai.h / 2);

    // Simple horizontal prediction of the ball.
    const predictX = ball.x + ball.vx * 8;
    const ballOnAiSide = ball.x > half - 260 || ball.vx > 2.5;

    if (ballOnAiSide) {
      // Get to the goal side (right) of the ball so it can drive it toward the left goal.
      const behindTarget = ball.x + 45;
      const target = ball.vx < -4 ? predictX + 45 : behindTarget;
      if (Math.abs(target - aiCenter) > 12) {
        ai.vx = Math.sign(target - aiCenter) * reactSpeed;
      }
      ai.facing = -1; // always aim toward opponent goal when engaged
    } else {
      // Hold a high, ready defensive line.
      if (Math.abs(ai.x - goalDefendX) > 12) {
        ai.vx = Math.sign(goalDefendX - ai.x) * reactSpeed * 0.85;
      }
      ai.facing = -1;
    }

    // Jump to head high balls with good timing.
    if (dy < -60 && dy > -300 && Math.abs(dx) < 130 && ai.onGround) {
      ai.jump();
    }

    // Strike reliably when in range; chip when the ball is close in front.
    if (Math.abs(dx) < 130 && Math.abs(dy) < 160 && ai.kickCooldown <= 0) {
      const useLob = ball.x < aiCenter && Math.abs(dx) < 70 && ball.y < ai.y + ai.h - 30;
      ai.tryKick(useLob ? 'lob' : 'shot');
    }
  }

  _updateRemoteOpponent() {
    const ai = this.ai;
    const inp = this.remoteInput;
    ai.vx = 0;

    // Fallback logic for stringified boolean or anything weird
    const isLeft = inp.left === true || inp.left === 'true';
    const isRight = inp.right === true || inp.right === 'true';
    const isJump = inp.jump === true || inp.jump === 'true';
    const isShoot = inp.shoot === true || inp.shoot === 'true';
    const isLob = inp.lob === true || inp.lob === 'true';

    if (isLeft && !isRight) { ai.vx = -ai.moveSpeed; ai.facing = -1; }
    else if (isRight && !isLeft) { ai.vx = ai.moveSpeed; ai.facing = 1; }
    if (isJump) ai.jump();
    if (isLob) ai.tryKick('lob');
    else if (isShoot) ai.tryKick('shot');
  }

  setRemoteInput(input) {
    Object.assign(this.remoteInput, input);
  }

  // Guest-side client prediction: the guest owns the RIGHT player (this.ai).
  // Simulate it locally from local input so movement/jump react instantly,
  // instead of waiting a full network round-trip through the host.
  _stepGuestLocalPlayer() {
    const me = this.ai;
    if (this.frozen > 0) { me.vx = 0; me.update(); return; }
    if (this.input.left && !this.input.right) me.moveLeft();
    else if (this.input.right && !this.input.left) me.moveRight();
    else me.stop();
    if (this.input.jump) me.jump();
    if (this.input.lob) me.tryKick('lob');
    else if (this.input.shoot) me.tryKick('shot');
    me.update();
  }

  snapshotState() {
    return {
      pX: Math.round(this.player.x), pY: Math.round(this.player.y),
      pF: this.player.facing, pK: this.player.kicking, pL: Math.round(this.player.legPhase * 100),
      aX: Math.round(this.ai.x), aY: Math.round(this.ai.y),
      aF: this.ai.facing, aK: this.ai.kicking, aL: Math.round(this.ai.legPhase * 100),
      bX: Math.round(this.ball.x), bY: Math.round(this.ball.y),
      bVX: Math.round(this.ball.vx * 10), bVY: Math.round(this.ball.vy * 10),
      bS: Math.round(this.ball.spin * 100),
      sL: this.scoreL, sR: this.scoreR,
      t: this.time,
      c: this.celebration, ls: this.lastScorer,
    };
  }

  applyRemoteState(s) {
    if (!s) return;
    // Buffer timed snapshots; guest renders ~interpDelay ms in the past for smoothness.
    this.snapBuffer.push({ t: performance.now(), s });
    if (this.snapBuffer.length > 30) this.snapBuffer.shift();
    const oldScoreL = this.scoreL;
    const oldScoreR = this.scoreR;
    this.scoreL = s.sL; this.scoreR = s.sR;
    this.time = s.t;
    // Trigger celebration on guest when scores change
    if (s.c > 0 && this.celebration <= 0 && (s.sL > oldScoreL || s.sR > oldScoreR)) {
      this.celebration = s.c;
      this.lastScorer = s.ls;
      this.shake = 12;
      this._spawnConfetti();
      audio.goal();
    }
  }

  _interpolateGuest(now, skipBall = false) {
    const buf = this.snapBuffer;
    if (buf.length === 0) return;
    const renderT = now - this.interpDelay;
    let a = buf[0];
    let b = buf[buf.length - 1];
    for (let i = buf.length - 1; i >= 0; i--) {
      if (buf[i].t <= renderT) {
        a = buf[i];
        b = buf[i + 1] || buf[i];
        break;
      }
    }
    const k = b.t > a.t ? clamp((renderT - a.t) / (b.t - a.t), 0, 1) : 1;
    // Snap instead of lerp on teleports (goal resets)
    const L = (v1, v2) => (Math.abs(v2 - v1) > 300 ? v2 : v1 + (v2 - v1) * k);
    const s1 = a.s, s2 = b.s;
    this.player.x = L(s1.pX, s2.pX); this.player.y = L(s1.pY, s2.pY);
    this.player.facing = s2.pF; this.player.kicking = s2.pK;
    this.player.legPhase = L(s1.pL, s2.pL) / 100;
    const newest = buf[buf.length - 1];
    // Ball is host-authoritative via interpolation, UNLESS it is briefly under
    // local control after our own player made contact (skipBall).
    if (!skipBall) {
      this.ball.x = L(s1.bX, s2.bX); this.ball.y = L(s1.bY, s2.bY);
      this.ball.vx = s2.bVX / 10; this.ball.vy = s2.bVY / 10;
      this.ball.spin = L(s1.bS, s2.bS) / 100;
      // Buffer starved (packet gap): extrapolate the ball briefly using last velocity
      if (renderT > newest.t) {
        const dtMs = Math.min(200, renderT - newest.t);
        this.ball.x += (newest.s.bVX / 10) * (dtMs / 16.67);
        this.ball.y += (newest.s.bVY / 10) * (dtMs / 16.67);
      }
    }
    // Reconcile the locally-predicted own player (this.ai) with the host.
    // IMPORTANT: never apply a continuous pull toward the authoritative position —
    // under network latency the authority always lags the prediction, so a pull
    // would drag movement / feel like an invisible wall. Instead trust the local
    // prediction during play and only SNAP on host-side teleports (goal resets)
    // or extreme drift, which keeps movement free while staying in sync.
    const me = this.ai;
    const prevS = buf.length >= 2 ? buf[buf.length - 2].s : newest.s;
    const teleX = Math.abs(newest.s.aX - prevS.aX) > 200;
    const teleY = Math.abs(newest.s.aY - prevS.aY) > 200;
    if (teleX || Math.abs(me.x - newest.s.aX) > 550) me.x = newest.s.aX;
    if (teleY || Math.abs(me.y - newest.s.aY) > 550) me.y = newest.s.aY;
  }

  _playersCollide() {
    const a = this.player, b = this.ai;
    const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (overlapX > 0 && overlapY > 0) {
      // push apart horizontally
      const push = overlapX / 2 + 0.5;
      if (a.x < b.x) {
        a.x -= push; b.x += push;
      } else {
        a.x += push; b.x -= push;
      }
    }
  }

  _handleGoal(side) {
    this.isResetting = true;
    audio.goal();
    this.frozen = 1000; // Freeze 1 second showing the goal
    this.celebration = 180;
    this.lastScorer = side;
    this.shake = 12;
    this._spawnConfetti();
    if (this.onScore) this.onScore({ side, scoreL: this.scoreL, scoreR: this.scoreR });
    // Reset positions
    setTimeout(() => {
      this.player.x = 300; this.player.y = FIELD.GROUND_Y - this.player.h;
      this.player.vx = 0; this.player.vy = 0;
      this.ai.x = FIELD.W - 360; this.ai.y = FIELD.GROUND_Y - this.ai.h;
      this.ai.vx = 0; this.ai.vy = 0;
      this.ball.reset(0); // Place ball exactly in the center with no velocity
      this.isResetting = false;
      this.frozen = 1000; // Freeze for 1 second AFTER reset
    }, 1000);
  }

  _spawnConfetti() {
    const colors = ['#00FF66', '#FF3B30', '#F4E04D', '#4CC9F0', '#F1FAEE', '#EF476F', '#F4A261'];
    // Two side cannons + top burst
    for (let i = 0; i < 160; i++) {
      const fromLeft = Math.random() < 0.5;
      const x = fromLeft ? 60 : FIELD.W - 60;
      const y = FIELD.GROUND_Y - 40 - Math.random() * 20;
      const angle = fromLeft
        ? -Math.PI / 3 + Math.random() * 0.6
        : -Math.PI * 2 / 3 + Math.random() * 0.6;
      const speed = 12 + Math.random() * 10;
      this.confetti.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.4,
        w: 8 + Math.random() * 8,
        h: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 200,
      });
    }
    // Overhead burst
    for (let i = 0; i < 80; i++) {
      this.confetti.push({
        x: FIELD.W / 2 + (Math.random() - 0.5) * 300,
        y: 200 + Math.random() * 100,
        vx: (Math.random() - 0.5) * 6,
        vy: -2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        w: 8 + Math.random() * 8,
        h: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 220,
      });
    }
  }

  _spawnHit(hit) {
    if (!hit) return;
    if (hit.type === 'header') {
      // Prominent flash + shockwave ring + impact spikes for a real header
      const power = hit.power || 0.6;
      this.hits.push({
        x: hit.x, y: hit.y,
        life: 20, maxLife: 20,
        r0: 18, r1: 70 + power * 55,
        spikes: 8,
        color: '#FFE34D',
        big: true,
      });
      this.shake = Math.max(this.shake, 6 + power * 8);
    } else if (hit.type === 'header-soft') {
      this.hits.push({
        x: hit.x, y: hit.y,
        life: 12, maxLife: 12,
        r0: 12, r1: 42,
        spikes: 6,
        color: '#BFE9FF',
        big: false,
      });
    }
  }

  _updateHits() {
    const list = this.hits;
    for (let i = list.length - 1; i >= 0; i--) {
      list[i].life--;
      if (list[i].life <= 0) list.splice(i, 1);
    }
  }

  _updateParticles() {
    this._updateHits();
    const list = this.confetti;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.vy += 0.25;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life--;
      if (p.y > FIELD.H + 40 || p.life <= 0) list.splice(i, 1);
    }
  }
}
