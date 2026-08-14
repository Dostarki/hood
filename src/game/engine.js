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
const JUMP_V = -16;
const BALL_BOUNCE = 0.72;
const BALL_AIR_FRICTION = 0.9975;
const BALL_GROUND_FRICTION = 0.985;
const KICK_POWER = 15;
const KICK_LIFT = -9;
const HEAD_KICK_POWER = 12;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function len(x, y) { return Math.hypot(x, y); }

class Player {
  constructor({ x, side, color, name, controlled, theme, bootId }) {
    this.x = x;
    this.y = FIELD.GROUND_Y - 130;
    this.vx = 0;
    this.vy = 0;
    this.w = 90;
    this.h = 130;
    this.headR = 55;
    this.bodyTop = 85; // relative offset where torso starts (below head)
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
  tryKick() {
    if (this.kickCooldown <= 0) {
      this.kicking = 14;
      this.kickCooldown = 25;
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
    }

    // Kick action boost
    if (player.kicking > 0 && player.kickCooldown > 10) {
      // Boot power scaling (0.5 power per bonus point)
      const currentKickPower = KICK_POWER + (player.boot.powBonus * 0.5);

      ball.vx = player.facing * currentKickPower + player.vx;
      ball.vy = KICK_LIFT - 5 - (player.boot.powBonus * 0.2) + Math.min(0, player.vy); // Added more upward lift (-5)
      audio.kick();
      player.kicking = 0; // End kick so it only hits once
    }
    return true;
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
    // Header
    ball.vx = nx * HEAD_KICK_POWER + player.vx * 0.6;
    ball.vy = ny * HEAD_KICK_POWER * 0.9 - 3;
    audio.kick();
    return true;
  }
  return false;
}

export class GameEngine {
  constructor({ onScore, onEnd, matchDuration = 90, playerTeam, aiTeam, mode = 'ai' }) {
    const pTeam = playerTeam || { primary: '#00FF66', hair: '#1a1a1a', skin: '#F5D6B5', hairStyle: 'buzz', accessory: 'none', name: 'YOU' };
    const aTeam = aiTeam || { primary: '#FF3B30', hair: '#3E2723', skin: '#E0A98C', hairStyle: 'spiky', accessory: 'beard', name: 'CPU' };
    this.player = new Player({ x: 300, side: 'left', color: pTeam.primary, name: pTeam.name || 'YOU', controlled: true, theme: pTeam, bootId: pTeam.bootId });
    this.ai = new Player({ x: FIELD.W - 360, side: 'right', color: aTeam.primary, name: aTeam.name || 'CPU', controlled: false, theme: aTeam, bootId: aTeam.bootId });
    this.mode = mode; // 'ai' | 'host' | 'guest'
    this.remoteInput = { left: false, right: false, jump: false, shoot: false };
    this.lastRemoteState = null;
    this.stateTickCount = 0;
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
      left: false, right: false, jump: false, shoot: false,
    };
    this.lastSecond = performance.now();
    this.aiState = { thinkTimer: 0 };
    this.celebration = 0;   // frames of celebration
    this.lastScorer = null; // 'left' | 'right'
    this.confetti = [];     // particles
    this.shake = 0;
  }

  setInput(partial) {
    Object.assign(this.input, partial);
  }

  step(dt) {
    if (this.ended || this.paused) return;

    // Guest mode: skip simulation, only advance visual effects
    if (this.mode === 'guest') {
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
    if (this.input.shoot) this.player.tryKick();

    // AI or remote opponent
    if (this.mode === 'host') this._updateRemoteOpponent();
    else if (this.mode === 'ai') this._updateAI();

    this.player.update();
    this.ai.update();
    this.ball.update();

    collideBallPlayer(this.ball, this.player);
    collideBallPlayer(this.ball, this.ai);

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

    // difficulty tuning
    const reactSpeed = PLAYER_SPEED * 0.9;
    const goalDefendX = FIELD.W - 320;

    // Predict ball x
    const dx = ball.x - (ai.x + ai.w / 2);
    const dy = ball.y - (ai.y + ai.h / 2);

    // If ball is on AI half or coming: pursue
    if (ball.x > FIELD.W / 2 - 200 || ball.vx > 3) {
      if (Math.abs(dx) > 20) {
        ai.vx = Math.sign(dx) * reactSpeed;
        ai.facing = Math.sign(dx) || ai.facing;
      }
      // Position slightly behind ball to shoot toward left goal
      if (ball.x < ai.x + ai.w / 2 && Math.abs(dx) < 90 && ai.onGround) {
        // aim: get behind the ball, then push left
        if (ball.x > ai.x - 10) ai.vx = -reactSpeed;
      }
    } else {
      // Return to defensive spot
      const target = goalDefendX;
      if (Math.abs(ai.x - target) > 15) {
        ai.vx = Math.sign(target - ai.x) * reactSpeed * 0.7;
      }
    }

    // Jump for high ball
    if (dy < -80 && dy > -260 && Math.abs(dx) < 110 && ai.onGround) {
      ai.jump();
    }

    // Kick when near
    if (Math.abs(dx) < 110 && Math.abs(dy) < 140) {
      if (ai.kickCooldown <= 0) {
        ai.tryKick();
      }
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

    if (isLeft && !isRight) { ai.vx = -ai.moveSpeed; ai.facing = -1; }
    else if (isRight && !isLeft) { ai.vx = ai.moveSpeed; ai.facing = 1; }
    if (isJump) ai.jump();
    if (isShoot) ai.tryKick();
  }

  setRemoteInput(input) {
    Object.assign(this.remoteInput, input);
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
    this.player.x = s.pX; this.player.y = s.pY;
    this.player.facing = s.pF; this.player.kicking = s.pK;
    this.player.legPhase = s.pL / 100;
    this.ai.x = s.aX; this.ai.y = s.aY;
    this.ai.facing = s.aF; this.ai.kicking = s.aK;
    this.ai.legPhase = s.aL / 100;
    this.ball.x = s.bX; this.ball.y = s.bY;
    this.ball.vx = s.bVX / 10; this.ball.vy = s.bVY / 10;
    this.ball.spin = s.bS / 100;
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

  _updateParticles() {
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
