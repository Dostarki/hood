import { FIELD } from './engine';

// Cached deterministic random for crowd so it doesn't shimmer
const rand = (seed) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

let frame = 0;

export function draw(ctx, engine, canvasW, canvasH) {
  frame++;
  const scaleX = canvasW / FIELD.W;
  const scaleY = canvasH / FIELD.H;
  const scale = Math.min(scaleX, scaleY);
  const drawW = FIELD.W * scale;
  const drawH = FIELD.H * scale;
  const offX = (canvasW - drawW) / 2;
  const offY = (canvasH - drawH) / 2;

  ctx.save();
  ctx.fillStyle = '#0A0D0B';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Screen shake
  const shakeX = engine.shake ? (Math.random() - 0.5) * engine.shake : 0;
  const shakeY = engine.shake ? (Math.random() - 0.5) * engine.shake : 0;

  ctx.translate(offX + shakeX, offY + shakeY);
  ctx.scale(scale, scale);

  const celebrating = engine.celebration > 0;

  drawSky(ctx);
  drawWallAndGraffiti(ctx);
  drawStreetlights(ctx);
  drawCrowd(ctx, celebrating);
  drawFence(ctx);
  drawPitch(ctx);
  drawGoal(ctx, 'left');
  drawGoal(ctx, 'right');
  drawGroundShadow(ctx, engine.ball);
  drawPlayer(ctx, engine.player);
  drawPlayer(ctx, engine.ai);
  drawBall(ctx, engine.ball);
  drawConfetti(ctx, engine.confetti);
  drawHits(ctx, engine.hits);
  if (celebrating) drawGoalText(ctx, engine.lastScorer, engine.celebration);

  ctx.restore();
}

function drawSky(ctx) {
  // Light blue day sky
  const g = ctx.createLinearGradient(0, 0, 0, 320);
  g.addColorStop(0, '#5BA8D4');
  g.addColorStop(1, '#8FCBE8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FIELD.W, 320);

  // Simple clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.arc(230, 55, 26, 0, Math.PI * 2);
  ctx.arc(268, 45, 34, 0, Math.PI * 2);
  ctx.arc(306, 55, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1180, 70, 32, 0, Math.PI * 2);
  ctx.arc(1225, 55, 42, 0, Math.PI * 2);
  ctx.arc(1272, 70, 32, 0, Math.PI * 2);
  ctx.fill();
}

const WALL_TOP = 130;
const WALL_BOT = 470;
const FENCE_TOP = 165;

function drawWallAndGraffiti(ctx) {
  // Concrete wall
  const wg = ctx.createLinearGradient(0, WALL_TOP, 0, WALL_BOT);
  wg.addColorStop(0, '#9A948A');
  wg.addColorStop(1, '#7E786E');
  ctx.fillStyle = wg;
  ctx.fillRect(0, WALL_TOP, FIELD.W, WALL_BOT - WALL_TOP);

  // Wall coping (top edge)
  ctx.fillStyle = '#B3ADA2';
  ctx.fillRect(0, WALL_TOP - 10, FIELD.W, 14);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, WALL_TOP + 4, FIELD.W, 5);

  // Concrete panel seams
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 3;
  for (let x = 200; x < FIELD.W; x += 200) {
    ctx.beginPath();
    ctx.moveTo(x, WALL_TOP);
    ctx.lineTo(x, WALL_BOT);
    ctx.stroke();
  }

  // Stains / weathering
  for (let i = 0; i < 14; i++) {
    const sx = rand(i * 31) * FIELD.W;
    const sy = WALL_TOP + 30 + rand(i * 57) * (WALL_BOT - WALL_TOP - 80);
    ctx.fillStyle = `rgba(60, 55, 45, ${0.05 + rand(i * 7) * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 40 + rand(i * 13) * 60, 20 + rand(i * 17) * 30, rand(i) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGraffiti(ctx);

  // Darker strip at the base of the wall (ground behind crowd)
  const baseG = ctx.createLinearGradient(0, WALL_BOT, 0, FIELD.GROUND_Y);
  baseG.addColorStop(0, '#6E685E');
  baseG.addColorStop(1, '#57524A');
  ctx.fillStyle = baseG;
  ctx.fillRect(0, WALL_BOT, FIELD.W, FIELD.GROUND_Y - WALL_BOT);
}

function drawGraffiti(ctx) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const tag = (x, y, text, size, color, outline, rot) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.font = `bold ${size}px "Bebas Neue", Impact, sans-serif`;
    ctx.globalAlpha = 0.75;
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = size * 0.14;
      ctx.strokeText(text, 0, 0);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };

  tag(380, 235, 'STREET', 96, '#8E7CC3', '#4A3B77', -0.05);
  tag(820, 300, 'KING', 110, '#4CAF50', '#2E5E32', 0.06);
  tag(1230, 240, 'GOAL!', 88, '#D96C6C', '#7E3030', -0.08);
  tag(180, 340, '\u2605', 70, '#E9C46A', null, 0.2);
  tag(1450, 330, '99', 76, '#5BC0BE', '#2F6B6A', 0.1);

  // Spray splats
  ctx.globalAlpha = 0.35;
  const splats = [[560, 200, 28, '#B565A7'], [1030, 210, 22, '#6BAF6E'], [700, 380, 26, '#D9A05B']];
  splats.forEach(([x, y, r, c]) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(x + (rand(x + i) - 0.5) * r * 3.4, y + (rand(y + i) - 0.5) * r * 2.6, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Drip lines
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#4A3B77';
  ctx.lineWidth = 4;
  [350, 410, 830, 1250].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 270);
    ctx.lineTo(x, 270 + 30 + rand(x) * 40);
    ctx.stroke();
  });
  ctx.restore();
}

function drawStreetlights(ctx) {
  const drawLamp = (x, dir) => {
    // Pole
    ctx.fillStyle = '#6B7280';
    ctx.fillRect(x - 7, 60, 14, WALL_BOT - 60);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + 2, 60, 5, WALL_BOT - 60);

    // Curved arm toward the field
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, 70);
    ctx.quadraticCurveTo(x + dir * 55, 48, x + dir * 105, 55);
    ctx.stroke();

    // Lamp head
    ctx.fillStyle = '#4B5563';
    roundRect(ctx, x + dir * 105 - 32, 48, 64, 22, 8);
    ctx.fill();
    // Light glass
    ctx.fillStyle = '#FFF3C4';
    ctx.beginPath();
    ctx.ellipse(x + dir * 105, 72, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  drawLamp(150, 1);
  drawLamp(FIELD.W - 150, -1);
}

function drawFence(ctx) {
  // Chain-link fence between crowd and pitch
  const top = FENCE_TOP;
  const bot = FIELD.GROUND_Y - 4;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top - 12, FIELD.W, bot - top + 20);
  ctx.clip();

  // Diamond mesh
  ctx.strokeStyle = 'rgba(225, 228, 232, 0.45)';
  ctx.lineWidth = 2;
  const step = 34;
  ctx.beginPath();
  for (let x = -((bot - top)); x < FIELD.W + step; x += step) {
    ctx.moveTo(x, top);
    ctx.lineTo(x + (bot - top), bot);
    ctx.moveTo(x + (bot - top), top);
    ctx.lineTo(x, bot);
  }
  ctx.stroke();

  // Fence posts
  ctx.fillStyle = '#8A9199';
  for (let x = 60; x < FIELD.W; x += 245) {
    ctx.fillRect(x - 5, top - 8, 10, bot - top + 8);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + 1, top - 8, 4, bot - top + 8);
    ctx.fillStyle = '#8A9199';
  }

  // Top and bottom rails
  ctx.fillStyle = '#9CA3AB';
  ctx.fillRect(0, top - 10, FIELD.W, 8);
  ctx.fillRect(0, bot - 4, FIELD.W, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(0, top - 10, FIELD.W, 2);

  ctx.restore();
}

function drawCrowd(ctx, celebrating) {
  // Standing crowd rows behind the fence, in front of the graffiti wall
  const rows = [
    { y: 415, r: 20, spacing: 78, off: 0 },
    { y: 452, r: 23, spacing: 74, off: 38 },
  ];
  const shirtColors = ['#C0392B', '#7D9A45', '#8E6FAD', '#3E7CA6', '#D9822B', '#4E4E56', '#B8A24A', '#2A9D8F', '#94553D'];
  const skinColors = ['#F5D6B5', '#E0A98C', '#C68962', '#8D5A3B', '#5D3A26'];

  rows.forEach((row, ti) => {
    const waveSpeed = celebrating ? 0.14 : 0.05;
    const waveMag = celebrating ? 8 : 3;

    for (let x = 30 + row.off; x < FIELD.W; x += row.spacing) {
      const seed = ti * 1000 + x;
      const shirt = shirtColors[Math.floor(rand(seed) * shirtColors.length)];
      const skin = skinColors[Math.floor(rand(seed + 1) * skinColors.length)];
      const baseCheer = Math.sin(frame * 0.08 + seed * 0.13) > 0.35;
      const cheer = celebrating ? true : baseCheer;
      const yOff = Math.sin(frame * waveSpeed + x * 0.05) * waveMag * (cheer ? 1 : 0.3);
      const r = row.r * (0.9 + rand(seed + 3) * 0.25);
      const by = row.y + yOff;

      // Pants (lower body, darker)
      const torsoH = r * 2.2;
      ctx.fillStyle = ['#3B4252', '#4A3728', '#2F3B4C', '#503A50'][Math.floor(rand(seed + 5) * 4)];
      ctx.fillRect(x - r * 0.7, by + torsoH - 6, r * 1.4, FIELD.GROUND_Y - (by + torsoH) + 4);

      // Shirt (upper torso)
      ctx.fillStyle = shirt;
      roundRect(ctx, x - r * 0.85, by, r * 1.7, torsoH, r * 0.5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Arms raised when cheering
      if (cheer) {
        ctx.strokeStyle = skin;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.8, by + r * 0.5);
        ctx.lineTo(x - r * 1.4, by - r * 0.9);
        ctx.moveTo(x + r * 0.8, by + r * 0.5);
        ctx.lineTo(x + r * 1.4, by - r * 0.9);
        ctx.stroke();
      }

      // Big cartoon head
      const headY = by - r * 0.75;
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(x, headY, r * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Hair
      const hairColor = ['#3E2723', '#000000', '#C99B3F', '#8B4513', '#B03A2E'][Math.floor(rand(seed + 2) * 5)];
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.arc(x, headY - r * 0.25, r * 0.85, Math.PI, 0);
      ctx.fill();

      // Face
      ctx.fillStyle = '#000';
      ctx.fillRect(x - r * 0.38, headY - r * 0.12, 4, 4);
      ctx.fillRect(x + r * 0.22, headY - r * 0.12, 4, 4);
      if (cheer) {
        ctx.beginPath();
        ctx.arc(x, headY + r * 0.35, r * 0.28, 0, Math.PI);
        ctx.fill();
      } else {
        ctx.fillRect(x - r * 0.2, headY + r * 0.35, r * 0.4, 3);
      }
    }
  });
}

function drawPitch(ctx) {
  const dirtTop = FIELD.H - 130;

  // Base grass
  ctx.fillStyle = '#4E9B47';
  ctx.fillRect(0, FIELD.GROUND_Y, FIELD.W, dirtTop - FIELD.GROUND_Y);

  // Subtle mow stripes
  const stripes = 12;
  const stripeW = FIELD.W / stripes;
  for (let i = 0; i < stripes; i += 2) {
    ctx.fillStyle = 'rgba(0, 60, 0, 0.08)';
    ctx.fillRect(i * stripeW, FIELD.GROUND_Y, stripeW, dirtTop - FIELD.GROUND_Y);
  }

  // Worn dirt patches on the grass
  ctx.fillStyle = '#C79A57';
  const patches = [
    [140, FIELD.GROUND_Y + 55, 85, 22], [420, FIELD.GROUND_Y + 105, 60, 16],
    [760, FIELD.GROUND_Y + 40, 55, 14], [1010, FIELD.GROUND_Y + 120, 75, 20],
    [1320, FIELD.GROUND_Y + 60, 90, 24], [620, FIELD.GROUND_Y + 150, 50, 13],
    [1490, FIELD.GROUND_Y + 130, 55, 16], [260, FIELD.GROUND_Y + 145, 45, 12],
  ];
  patches.forEach(([px, py, rw, rh], i) => {
    ctx.globalAlpha = 0.55 + rand(i * 11) * 0.25;
    ctx.beginPath();
    ctx.ellipse(px, py, rw, rh, rand(i) * 0.4 - 0.2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Grass edge highlight at the top of pitch
  ctx.fillStyle = '#66B25C';
  ctx.fillRect(0, FIELD.GROUND_Y, FIELD.W, 8);

  // White field markings
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 5;

  // Touchline (top boundary)
  ctx.beginPath();
  ctx.moveTo(30, FIELD.GROUND_Y + 22);
  ctx.lineTo(FIELD.W - 30, FIELD.GROUND_Y + 22);
  ctx.stroke();

  // Center line
  ctx.beginPath();
  ctx.moveTo(FIELD.W / 2, FIELD.GROUND_Y + 22);
  ctx.lineTo(FIELD.W / 2, dirtTop - 12);
  ctx.stroke();

  // Center circle (perspective ellipse)
  ctx.beginPath();
  ctx.ellipse(FIELD.W / 2, FIELD.GROUND_Y + 115, 130, 55, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(FIELD.W / 2, FIELD.GROUND_Y + 115, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Penalty boxes (perspective trapezoids)
  const boxH = 150;
  const drawBox = (isLeft) => {
    const sign = isLeft ? 1 : -1;
    const edgeX = isLeft ? 30 : FIELD.W - 30;
    ctx.beginPath();
    ctx.moveTo(edgeX + sign * 0, FIELD.GROUND_Y + 22);
    ctx.lineTo(edgeX + sign * 210, FIELD.GROUND_Y + 22);
    ctx.lineTo(edgeX + sign * 260, FIELD.GROUND_Y + 22 + boxH);
    ctx.lineTo(edgeX + sign * 0, FIELD.GROUND_Y + 22 + boxH);
    ctx.stroke();
  };
  drawBox(true);
  drawBox(false);

  // Dirt ground below the pitch
  const dg = ctx.createLinearGradient(0, dirtTop, 0, FIELD.H);
  dg.addColorStop(0, '#8A6034');
  dg.addColorStop(1, '#6E4A26');
  ctx.fillStyle = dg;
  ctx.fillRect(0, dirtTop, FIELD.W, FIELD.H - dirtTop);

  // Grass-to-dirt ragged edge
  ctx.fillStyle = '#3E7C38';
  ctx.beginPath();
  ctx.moveTo(0, dirtTop);
  for (let x = 0; x < FIELD.W; x += 40) {
    ctx.lineTo(Math.min(x + 20, FIELD.W), dirtTop + 6 + rand(x) * 8);
    ctx.lineTo(Math.min(x + 40, FIELD.W), dirtTop);
  }
  ctx.closePath();
  ctx.fill();

  // Dirt speckles / pebbles
  for (let i = 0; i < 40; i++) {
    const px = rand(i * 91) * FIELD.W;
    const py = dirtTop + 20 + rand(i * 37) * (FIELD.H - dirtTop - 30);
    ctx.fillStyle = `rgba(0,0,0,${0.08 + rand(i * 3) * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(px, py, 6 + rand(i * 5) * 14, 3 + rand(i * 9) * 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGoal(ctx, side) {
  const isLeft = side === 'left';
  const goalTop = FIELD.GROUND_Y - FIELD.GOAL_HEIGHT;
  const sign = isLeft ? 1 : -1;

  // Front post X (goal line) and back of the net (kept on-screen)
  const frontX = isLeft ? FIELD.GOAL_WIDTH : FIELD.W - FIELD.GOAL_WIDTH;
  const backX = isLeft ? 3 : FIELD.W - 3;
  const backTopY = goalTop + 45;          // net top rear is lower (angled)

  // Net fill (translucent white)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.moveTo(frontX, goalTop);
  ctx.lineTo(backX, backTopY);
  ctx.lineTo(backX, FIELD.GROUND_Y);
  ctx.lineTo(frontX, FIELD.GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Net mesh
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const cols = 7;
  const rowsN = 9;
  for (let i = 0; i <= cols; i++) {
    const t = i / cols;
    const topX = frontX + (backX - frontX) * t;
    const topY = goalTop + (backTopY - goalTop) * t;
    ctx.moveTo(topX, topY);
    ctx.lineTo(topX, FIELD.GROUND_Y);
  }
  for (let j = 1; j <= rowsN; j++) {
    const t = j / rowsN;
    const fy = goalTop + (FIELD.GROUND_Y - goalTop) * t;
    const byy = backTopY + (FIELD.GROUND_Y - backTopY) * t;
    ctx.moveTo(frontX, fy);
    ctx.lineTo(backX, byy);
  }
  ctx.stroke();

  // === White goal frame (like the reference) ===
  const postW = 18;
  const white = '#F4F4F2';
  const shade = '#C9CBC9';
  const dark = '#9EA19E';

  // Diagonal back support (from crossbar top to ground behind)
  ctx.strokeStyle = white;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(frontX - sign * 4, goalTop + 4);
  ctx.lineTo(backX, FIELD.GROUND_Y - 2);
  ctx.stroke();
  ctx.strokeStyle = shade;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(frontX - sign * 2, goalTop + 8);
  ctx.lineTo(backX + sign * 2, FIELD.GROUND_Y - 2);
  ctx.stroke();

  // Bottom back bar
  ctx.strokeStyle = white;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(backX, FIELD.GROUND_Y - 3);
  ctx.lineTo(frontX, FIELD.GROUND_Y - 3);
  ctx.stroke();

  // Front vertical post
  ctx.fillStyle = white;
  roundRect(ctx, frontX - postW / 2, goalTop - 6, postW, FIELD.GOAL_HEIGHT + 6, 5);
  ctx.fill();
  // Post shading (inner side)
  ctx.fillStyle = shade;
  ctx.fillRect(frontX + (isLeft ? 1 : -5), goalTop, 4, FIELD.GOAL_HEIGHT);
  // Post outline
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  roundRect(ctx, frontX - postW / 2, goalTop - 6, postW, FIELD.GOAL_HEIGHT + 6, 5);
  ctx.stroke();

  // Crossbar stub (short top bar pointing back)
  const stubLen = Math.abs(frontX - backX);
  const stubX = isLeft ? backX : frontX;
  ctx.fillStyle = white;
  roundRect(ctx, stubX, goalTop - 6, stubLen, 12, 6);
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Rounded cap on top of the front post
  ctx.fillStyle = white;
  ctx.beginPath();
  ctx.arc(frontX, goalTop - 4, postW / 2 + 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.stroke();

  // Post ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(frontX, FIELD.GROUND_Y + 3, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(backX, FIELD.GROUND_Y + 3, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx, p) {
  const cx = p.x + p.w / 2;
  const renderScale = 1.3; // Make head bigger visually
  const headCY = p.y + p.headR + 4; // Use exact physics center
  const feetY = p.y + p.h;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, FIELD.GROUND_Y + 2, 38, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const kickPhase = p.kicking > 0 ? (14 - p.kicking) / 14 : 0;
  const kickX = p.facing * kickPhase * 50;
  const kickY = -kickPhase * 30;

  // Big Boot (Krampon) Colors
  const bootColor = p.side === 'left' ? '#F4E04D' : '#F4A261'; // Vibrant shoe base
  const bootSecondary = p.color; // Team color for accents

  const bootBaseX = cx;
  const bootBaseY = feetY - 5;
  const bootScale = 1.4; // Make the shoe very big

  // 1. Draw back boot (slightly smaller, darker, behind head)
  const backBootX = bootBaseX - (p.facing * 10) - (kickX * 0.2);
  const backBootY = bootBaseY - 15 - (kickY * 0.1);
  const backBoot = p.boot ? { ...p.boot, color: darkenColor(p.boot.color || '#222', 40), secondary: darkenColor(p.boot.secondary || '#111', 40) } : { color: '#111', secondary: '#000' };
  drawBoot(ctx, backBootX, backBootY, p.facing, backBoot, bootScale * 0.85, 0);

  // 2. Draw Head (so back boot is behind, front boot is in front)
  drawHead(ctx, cx, headCY, p.headR * renderScale, p.theme, p.facing, p.color);

  // 3. Draw front boot (kicking, in front of head)
  const frontBootX = bootBaseX + (p.facing * 15) + kickX;
  const frontBootY = bootBaseY + kickY;
  // Toe goes up during kick -> negative rotation when facing right
  const frontRot = -kickPhase * 0.8; 
  drawBoot(ctx, frontBootX, frontBootY, p.facing, p.boot || { color: '#222', secondary: '#111' }, bootScale, frontRot);

  // Name label with backdrop
  const labelY = p.y - 30;
  ctx.font = 'bold 26px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  const nameW = ctx.measureText(p.name).width + 20;
  ctx.fillStyle = 'rgba(10,13,11,0.75)';
  roundRect(ctx, cx - nameW / 2, labelY - 22, nameW, 30, 6);
  ctx.fill();
  ctx.fillStyle = p.color;
  ctx.fillText(p.name, cx, labelY);
}

// Helper to darken hex colors
function darkenColor(hex, amount) {
  let usePound = false;
  if (hex[0] == "#") {
    hex = hex.slice(1);
    usePound = true;
  }
  let num = parseInt(hex, 16);
  let r = (num >> 16) - amount;
  let b = ((num >> 8) & 0x00FF) - amount;
  let g = (num & 0x0000FF) - amount;

  if (r > 255) r = 255; else if (r < 0) r = 0;
  if (b > 255) b = 255; else if (b < 0) b = 0;
  if (g > 255) g = 255; else if (g < 0) g = 0;

  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

export function drawBoot(ctx, x, y, facing, boot, scale = 1, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.rotate(rotation); 
  ctx.scale(scale, scale);

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#111';

  // Sock / Collar
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.moveTo(-15, -35);
  ctx.lineTo(20, -35);
  ctx.lineTo(25, -10);
  ctx.lineTo(-20, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sock stripes
  ctx.fillStyle = boot.secondary || '#111';
  ctx.beginPath();
  ctx.moveTo(-17, -25); ctx.lineTo(22, -25);
  ctx.lineTo(23, -20); ctx.lineTo(-18, -20);
  ctx.closePath();
  ctx.fill();

  // Boot Body
  ctx.beginPath();
  ctx.moveTo(-20, -10);
  ctx.lineTo(30, -10);
  ctx.quadraticCurveTo(50, -5, 50, 10);
  ctx.quadraticCurveTo(50, 20, 30, 20);
  ctx.lineTo(-25, 20);
  ctx.quadraticCurveTo(-35, 20, -35, 5);
  ctx.lineTo(-20, -10);
  ctx.closePath();
  
  if (boot.effect === 'galaxy') {
    // Galaxy gradient
    const grad = ctx.createLinearGradient(-30, -10, 40, 20);
    grad.addColorStop(0, '#0F0C29');
    grad.addColorStop(0.5, '#302B63');
    grad.addColorStop(1, '#24243E');
    ctx.fillStyle = grad;
    ctx.fill();
    // Stars
    ctx.fillStyle = '#FFF';
    ctx.beginPath(); ctx.arc(-10, 0, 1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(15, 5, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(30, 10, 1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 15, 1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-20, 10, 0.5, 0, Math.PI*2); ctx.fill();
    // Nebula glow
    ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
    ctx.beginPath(); ctx.arc(10, 5, 15, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.beginPath(); ctx.arc(-5, 10, 10, 0, Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle = boot.color || '#222';
    ctx.fill();
  }
  ctx.stroke();

  // Reflection Effect (Titanyum)
  if (boot.effect === 'reflection') {
    ctx.save();
    ctx.clip(); // clip to boot body
    ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(-30, -20);
    ctx.lineTo(0, 30);
    ctx.lineTo(20, 30);
    ctx.lineTo(-10, -20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Boot Pattern (Accent)
  if (boot.effect !== 'galaxy') {
    ctx.fillStyle = boot.secondary || '#111';
    ctx.beginPath();
    ctx.moveTo(-5, -10);
    ctx.lineTo(15, -10);
    ctx.lineTo(5, 20);
    ctx.lineTo(-15, 20);
    ctx.closePath();
    ctx.fill();
  }

  // Boot laces area
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.moveTo(15, -10);
  ctx.lineTo(28, -10);
  ctx.lineTo(25, 0);
  ctx.lineTo(12, 0);
  ctx.closePath();
  ctx.fill();
  
  // Cleats (çiviler)
  ctx.fillStyle = '#333';
  const drawCleat = (cx) => {
    ctx.beginPath();
    ctx.moveTo(cx - 5, 20);
    ctx.lineTo(cx + 5, 20);
    ctx.lineTo(cx + 3, 28);
    ctx.lineTo(cx - 3, 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  drawCleat(-15);
  drawCleat(5);
  drawCleat(25);

  ctx.restore();
}

function drawHead(ctx, cx, headCY, r, theme, facing, teamColor) {
  if (theme?.type === 'ape') {
    // Base head (fur) with jagged edges for furry look
    ctx.fillStyle = theme.hair || '#5A4033';
    ctx.beginPath();
    const segments = 32;
    for(let i=0; i<=segments; i++) {
      const a = (i/segments) * Math.PI * 2;
      const rad = r + (i%2 === 0 ? 3 : -1);
      if(i===0) ctx.moveTo(cx + Math.cos(a)*rad, headCY + Math.sin(a)*rad);
      else ctx.lineTo(cx + Math.cos(a)*rad, headCY + Math.sin(a)*rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Ears
    ctx.fillStyle = theme.hair || '#5A4033';
    ctx.beginPath();
    ctx.arc(cx - facing * r * 0.9, headCY, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = theme.skin || '#D4B595';
    ctx.beginPath();
    ctx.arc(cx - facing * r * 0.9, headCY, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Muzzle (snout)
    ctx.fillStyle = theme.skin || '#D4B595';
    ctx.beginPath();
    ctx.ellipse(cx + facing * r * 0.2, headCY + r * 0.4, r * 0.7, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Nose slits
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx + facing * r * 0.4, headCY + r * 0.15, r * 0.1, r * 0.05, facing * -0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + facing * r * 0.7, headCY + r * 0.15, r * 0.1, r * 0.05, facing * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouth
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (theme.variant === 'icecream') {
      // Big smile for ice cream ape
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx + facing * r * 0.45, headCY + r * 0.5, r * 0.35, 0, Math.PI);
      ctx.fill();
      ctx.stroke();
      // Teeth
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(cx + facing * r * 0.45, headCY + r * 0.5, r * 0.35, 0, Math.PI);
      ctx.clip();
      ctx.fillRect(cx - r, headCY + r * 0.5, r * 2, r * 0.15);
      ctx.strokeRect(cx - r, headCY + r * 0.5, r * 2, r * 0.15);
    } else {
      // Bored straight line
      ctx.moveTo(cx + facing * r * 0.1, headCY + r * 0.6);
      ctx.lineTo(cx + facing * r * 0.8, headCY + r * 0.6);
      ctx.stroke();
    }
    
    // Bored Eyes
    const eyeOffX = facing * r * 0.2;
    const eyeY = headCY - r * 0.2;
    
    // Sclera
    ctx.fillStyle = theme.variant === 'jason' ? '#FF6B6B' : (theme.variant === 'icecream' ? '#FF99C2' : '#FFF');
    ctx.beginPath();
    ctx.arc(cx + eyeOffX - r * 0.3, eyeY, r * 0.25, 0, Math.PI * 2);
    ctx.arc(cx + eyeOffX + r * 0.3, eyeY, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Pupils
    ctx.fillStyle = theme.variant === 'jason' ? '#FF0000' : '#000';
    ctx.beginPath();
    ctx.arc(cx + eyeOffX - r * 0.3 + facing * r * 0.1, eyeY, r * 0.08, 0, Math.PI * 2);
    ctx.arc(cx + eyeOffX + r * 0.3 + facing * r * 0.1, eyeY, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Heavy Eyelids (Bored look)
    if (theme.variant !== 'icecream') {
      ctx.fillStyle = theme.hair || '#5A4033';
      ctx.beginPath();
      // cover top half of eyes
      ctx.rect(cx + eyeOffX - r * 0.6, eyeY - r * 0.35, r * 1.2, r * 0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + eyeOffX - r * 0.6, eyeY + r * 0.05);
      ctx.lineTo(cx + eyeOffX + r * 0.6, eyeY + r * 0.05);
      ctx.stroke();
    }

    // Variants additions
    if (theme.variant === 'king') {
      // Crown
      ctx.fillStyle = '#FFD700'; // Gold
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.6, headCY - r * 0.7);
      ctx.lineTo(cx - r * 0.8, headCY - r * 1.4);
      ctx.lineTo(cx - r * 0.2, headCY - r * 1.0);
      ctx.lineTo(cx + r * 0.1, headCY - r * 1.5);
      ctx.lineTo(cx + r * 0.4, headCY - r * 1.0);
      ctx.lineTo(cx + r * 0.9, headCY - r * 1.3);
      ctx.lineTo(cx + r * 0.7, headCY - r * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } 
    else if (theme.variant === 'jason') {
      // Stitches on cheeks
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      const drawStitch = (sx, sy) => {
        ctx.beginPath();
        ctx.moveTo(sx - 10, sy); ctx.lineTo(sx + 10, sy);
        ctx.moveTo(sx - 5, sy - 4); ctx.lineTo(sx - 5, sy + 4);
        ctx.moveTo(sx + 5, sy - 4); ctx.lineTo(sx + 5, sy + 4);
        ctx.stroke();
      };
      drawStitch(cx + facing * r * 0.6, headCY + r * 0.2);
      drawStitch(cx - facing * r * 0.1, headCY + r * 0.25);

      // Jason Mask (Hockey mask tilted up)
      ctx.save();
      ctx.translate(cx, headCY - r * 0.6);
      ctx.rotate(facing * 0.2);
      
      // Mask base
      ctx.fillStyle = '#E8E8E8';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.2, r * 0.7, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.stroke();

      // Mask holes
      ctx.fillStyle = '#000';
      const drawHole = (hx, hy) => {
        ctx.beginPath(); ctx.arc(hx, hy, r * 0.05, 0, Math.PI * 2); ctx.fill();
      };
      drawHole(-r * 0.2, -r * 0.4); drawHole(r * 0.2, -r * 0.4);
      drawHole(0, -r * 0.2);
      drawHole(-r * 0.3, -r * 0.1); drawHole(r * 0.3, -r * 0.1);
      drawHole(-r * 0.1, 0); drawHole(r * 0.1, 0);

      // Red triangles
      ctx.fillStyle = '#8B0000';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.6); ctx.lineTo(-r * 0.1, -r * 0.45); ctx.lineTo(r * 0.1, -r * 0.45);
      ctx.fill();
      
      // Straps
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.2); ctx.lineTo(-r * 0.9, r * 0.4);
      ctx.stroke();
      ctx.restore();
    }

    return;
  }
  
  if (theme?.type === 'penguin') {
    // Blue body/head
    ctx.fillStyle = '#7AB2FF';
    ctx.beginPath(); 
    ctx.arc(cx, headCY, r, 0, Math.PI*2); 
    ctx.fill(); 
    ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.stroke();
    // White face mask (heart/widow's peak shape)
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.moveTo(cx, headCY - r*0.5);
    ctx.bezierCurveTo(cx+r, headCY-r, cx+r, headCY+r, cx, headCY+r);
    ctx.bezierCurveTo(cx-r, headCY+r, cx-r, headCY-r, cx, headCY - r*0.5);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(cx - facing*r*0.1 - r*0.3, headCY, r*0.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - facing*r*0.1 + r*0.3, headCY, r*0.2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.beginPath(); ctx.arc(cx - facing*r*0.1 - r*0.3 + 2, headCY - 4, r*0.08, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - facing*r*0.1 + r*0.3 + 2, headCY - 4, r*0.08, 0, Math.PI*2); ctx.fill();
    // Beak
    ctx.fillStyle = '#FFA500';
    ctx.beginPath(); ctx.ellipse(cx + facing*r*0.2, headCY + r*0.3, r*0.2, r*0.1, 0, 0, Math.PI*2); 
    ctx.fill(); ctx.stroke();
    return;
  }

  if (theme?.type === 'anime') {
    // Pale skin
    ctx.fillStyle = '#FCEEE9';
    ctx.beginPath(); ctx.arc(cx, headCY, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Hair (Green)
    ctx.fillStyle = '#98D6A4';
    ctx.beginPath(); ctx.arc(cx, headCY-r*0.2, r*1.1, Math.PI, 0); ctx.fill();
    // bangs
    ctx.fillRect(cx - r, headCY-r*0.2, r*2, r*0.4);
    // Huge eyes
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.ellipse(cx + facing*r*0.1 - r*0.3, headCY + r*0.1, r*0.25, r*0.35, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + facing*r*0.1 + r*0.3, headCY + r*0.1, r*0.25, r*0.35, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.beginPath(); ctx.arc(cx + facing*r*0.1 - r*0.3 + 4, headCY - r*0.1, r*0.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + facing*r*0.1 + r*0.3 + 4, headCY - r*0.1, r*0.1, 0, Math.PI*2); ctx.fill();
    // Tiny mouth
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx + facing*r*0.2 - 3, headCY + r*0.6); ctx.lineTo(cx + facing*r*0.2 + 3, headCY + r*0.6); ctx.stroke();
    // Cat ears headband
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - r, headCY - r*0.8, r*2, 6);
    ctx.beginPath(); ctx.moveTo(cx - r*0.8, headCY - r*0.8); ctx.lineTo(cx - r*0.4, headCY - r*1.4); ctx.lineTo(cx - r*0.2, headCY - r*0.8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + r*0.8, headCY - r*0.8); ctx.lineTo(cx + r*0.4, headCY - r*1.4); ctx.lineTo(cx + r*0.2, headCY - r*0.8); ctx.fill();
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath(); ctx.moveTo(cx - r*0.7, headCY - r*0.8); ctx.lineTo(cx - r*0.4, headCY - r*1.2); ctx.lineTo(cx - r*0.3, headCY - r*0.8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + r*0.7, headCY - r*0.8); ctx.lineTo(cx + r*0.4, headCY - r*1.2); ctx.lineTo(cx + r*0.3, headCY - r*0.8); ctx.fill();
    return;
  }

  if (theme?.type === 'pixel') {
    const px = r * 0.25; // pixel size
    const drawPx = (x, y, color) => { ctx.fillStyle = color; ctx.fillRect(cx + x*px*facing, headCY + y*px, px*facing, px); }
    // base face
    for(let y=-3; y<=3; y++) for(let x=-3; x<=3; x++) drawPx(x, y, '#E0A98C');
    
    if (theme.variant === '3d') {
      // Red spiky hair
      for(let x=-4; x<=4; x++) { drawPx(x, -4, '#FF0000'); drawPx(x, -5, '#FF0000'); }
      drawPx(-5, -3, '#FF0000'); drawPx(-5, -2, '#FF0000'); drawPx(5, -4, '#FF0000');
      // Beard
      for(let x=-3; x<=3; x++) { drawPx(x, 3, '#5A4033'); drawPx(x, 4, '#5A4033'); }
      // 3D Glasses
      for(let x=-4; x<=4; x++) drawPx(x, -1, '#FFF');
      drawPx(-2, -1, '#0000FF'); drawPx(-1, -1, '#0000FF');
      drawPx(1, -1, '#FF0000'); drawPx(2, -1, '#FF0000');
    } else if (theme.variant === 'smoke') {
      // Beanie
      for(let x=-3; x<=3; x++) { drawPx(x, -4, '#D95A00'); drawPx(x, -5, '#D95A00'); }
      // Blue glasses
      drawPx(-2, -1, '#00FFFF'); drawPx(2, -1, '#00FFFF');
      drawPx(-3, -1, '#000'); drawPx(-1, -1, '#000'); drawPx(1, -1, '#000'); drawPx(3, -1, '#000');
      // Cigarette
      drawPx(2, 2, '#FFF'); drawPx(3, 2, '#FFF'); drawPx(4, 2, '#FF0000');
    }
    return;
  }

  if (theme?.type === 'robot') {
    // Robot Face
    ctx.fillStyle = '#A0A0A0';
    ctx.beginPath(); ctx.rect(cx - r, headCY - r, r*2, r*2); ctx.fill(); ctx.stroke();
    // Antenna
    ctx.beginPath(); ctx.moveTo(cx, headCY - r); ctx.lineTo(cx, headCY - r - 15); ctx.stroke();
    ctx.fillStyle = '#FF0000'; ctx.beginPath(); ctx.arc(cx, headCY - r - 15, 4, 0, Math.PI*2); ctx.fill();
    // Glowing Eyes
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(cx + facing*5 - 15, headCY - 10, 10, 8);
    ctx.fillRect(cx + facing*5 + 5, headCY - 10, 10, 8);
    // Vent Mouth
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    for(let i=0; i<4; i++) {
      ctx.beginPath(); ctx.moveTo(cx - 10, headCY + 15 + i*4); ctx.lineTo(cx + 10, headCY + 15 + i*4); ctx.stroke();
    }
    return;
  }

  if (theme?.type === 'alien') {
    // Alien Face
    ctx.fillStyle = '#00FF00';
    ctx.beginPath(); ctx.ellipse(cx, headCY, r, r*1.2, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Huge Black Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(cx + facing*10 - 15, headCY, 10, 18, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + facing*10 + 15, headCY, 10, 18, 0.3, 0, Math.PI*2); ctx.fill();
    // Tiny mouth
    ctx.beginPath(); ctx.arc(cx + facing*10, headCY + 25, 2, 0, Math.PI*2); ctx.fill();
    return;
  }

  // Standard Head
  const skin = theme?.skin || '#F5D6B5';
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(cx, headCY, r, 0, Math.PI * 2);
  ctx.fill();
  
  // Head outline
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Hair
  drawHair(ctx, cx, headCY, r, theme, facing);

  // Headband
  if (theme?.hairStyle !== 'bald') {
    ctx.fillStyle = teamColor;
    ctx.beginPath();
    ctx.arc(cx, headCY - r * 0.25, r - 8, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(cx - (r - 8), headCY - r * 0.25, (r - 8) * 2, 4);
  }

  // Eyes
  const eyeOffX = facing * 12;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx + eyeOffX - 12, headCY - 4, 12, 0, Math.PI * 2);
  ctx.arc(cx + eyeOffX + 12, headCY - 4, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0A0D0B';
  ctx.beginPath();
  ctx.arc(cx + eyeOffX - 8 + facing * 3, headCY - 4, 5, 0, Math.PI * 2);
  ctx.arc(cx + eyeOffX + 16 + facing * 3, headCY - 4, 5, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.strokeStyle = '#8D3A3A';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(cx + facing * 10, headCY + 20, 8, 0, Math.PI);
  ctx.stroke();

  // Accessory
  if (theme?.accessory === 'ninja') {
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(cx, headCY, r, 0, Math.PI); ctx.fill();
    ctx.fillRect(cx - r, headCY, r*2, r*0.5);
  } else if (theme?.accessory === 'zombie') {
    ctx.fillStyle = '#FF69B4'; // Brain
    ctx.beginPath(); ctx.arc(cx + facing*5, headCY - r*0.8, r*0.6, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#C71585'; ctx.lineWidth=2; ctx.stroke();
  } else if (theme?.accessory === 'eyepatch') {
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(cx + eyeOffX + 12*facing, headCY - 4, 14, 0, Math.PI*2); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - r, headCY - r*0.5); ctx.lineTo(cx + r, headCY); ctx.stroke();
  } else if (theme?.accessory === 'cyborg') {
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(cx + eyeOffX + 12*facing, headCY - 4, 16, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#FF0000';
    ctx.beginPath(); ctx.arc(cx + eyeOffX + 12*facing, headCY - 4, 6, 0, Math.PI*2); ctx.fill();
  } else if (theme?.accessory === 'clown') {
    ctx.fillStyle = '#FF0000';
    ctx.beginPath(); ctx.arc(cx + facing*15, headCY + 10, 10, 0, Math.PI*2); ctx.fill();
  } else if (theme?.accessory === 'halo') {
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(cx, headCY - r - 10, r*0.8, r*0.2, 0, 0, Math.PI*2); ctx.stroke();
  } else if (theme?.accessory === 'demon') {
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.moveTo(cx - r*0.5, headCY - r*0.8); ctx.lineTo(cx - r*0.8, headCY - r*1.5); ctx.lineTo(cx - r*0.2, headCY - r*0.9); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + r*0.5, headCY - r*0.8); ctx.lineTo(cx + r*0.8, headCY - r*1.5); ctx.lineTo(cx + r*0.2, headCY - r*0.9); ctx.fill();
  } else if (theme?.accessory === 'vampire') {
    ctx.fillStyle = '#FFF';
    ctx.beginPath(); ctx.moveTo(cx + facing*5, headCY + 20); ctx.lineTo(cx + facing*5 + 4, headCY + 28); ctx.lineTo(cx + facing*5 + 8, headCY + 20); ctx.fill();
  } else {
    drawAccessory(ctx, cx, headCY, r, theme, facing);
  }

  // Cheeks
  ctx.fillStyle = 'rgba(230, 80, 80, 0.5)';
  ctx.beginPath();
  ctx.arc(cx + facing * 6 - 22, headCY + 15, 7, 0, Math.PI * 2);
  ctx.arc(cx + facing * 6 + 22, headCY + 15, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawBall(ctx, b) {
  // Trail Effect (Fire/Energy based on speed)
  ctx.save();
  const speed = Math.hypot(b.vx, b.vy);
  if (speed > 4) {
    const trailColor = speed > 15 ? '#FF3300' : (speed > 10 ? '#FF9900' : '#FFF');
    ctx.shadowColor = trailColor;
    ctx.shadowBlur = 15;
    for (let i = 1; i <= 6; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4 - i * 0.06})`;
      ctx.beginPath();
      // Add slight random offset for a "flame" effect
      const offsetX = (Math.random() - 0.5) * i * 2;
      const offsetY = (Math.random() - 0.5) * i * 2;
      ctx.arc(b.x - b.vx * i * 0.5 + offsetX, b.y - b.vy * i * 0.5 + offsetY, b.r * (1 - i * 0.1), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  ctx.restore();

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.spin * 0.02);
  
  // Body (Stylized Cartoon Ball)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, 0, b.r, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner glow/shadow for 3D cartoon effect
  const g = ctx.createRadialGradient(-b.r*0.3, -b.r*0.3, 0, 0, 0, b.r);
  g.addColorStop(0, 'rgba(255,255,255,0.8)');
  g.addColorStop(0.7, 'rgba(200,200,200,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, b.r, 0, Math.PI * 2);
  ctx.fill();

  // Pentagon center
  ctx.fillStyle = '#1A1A1A'; // Darker, not pure black
  ctx.beginPath();
  const petalR = b.r * 0.45;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * petalR, Math.sin(a) * petalR);
    else ctx.lineTo(Math.cos(a) * petalR, Math.sin(a) * petalR);
  }
  ctx.closePath();
  ctx.fill();
  
  // Hexagon accents
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + Math.PI / 5;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * b.r * 0.75, Math.sin(a) * b.r * 0.75, b.r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#1A1A1A';
    ctx.fill();
  }
  
  // Bright Specular Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.ellipse(-b.r * 0.35, -b.r * 0.45, b.r * 0.3, b.r * 0.15, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, b.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawGroundShadow(ctx, b) {
  const yFromGround = FIELD.GROUND_Y - (b.y + b.r);
  const alpha = Math.max(0.05, 0.4 - yFromGround / 700);
  const w = Math.max(8, 26 - yFromGround / 30);
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(b.x, FIELD.GROUND_Y + 2, w, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHair(ctx, cx, headCY, r, theme, facing) {
  const style = theme?.hairStyle || 'buzz';
  const hairColor = theme?.hair || '#3E2723';
  if (style === 'bald') return;

  ctx.fillStyle = hairColor;

  if (style === 'buzz') {
    // Simple dome cap
    ctx.beginPath();
    ctx.arc(cx, headCY - 6, r - 4, Math.PI + 0.2, Math.PI * 2 - 0.2);
    ctx.fill();
  } else if (style === 'spiky') {
    // Base cap
    ctx.beginPath();
    ctx.arc(cx, headCY - 4, r - 6, Math.PI + 0.15, Math.PI * 2 - 0.15);
    ctx.fill();
    // Spikes
    const spikes = 5;
    for (let i = 0; i < spikes; i++) {
      const t = i / (spikes - 1);
      const angle = Math.PI + 0.3 + t * (Math.PI - 0.6);
      const bx = cx + Math.cos(angle) * (r - 8);
      const by = headCY + Math.sin(angle) * (r - 8);
      const tipLen = 14 + Math.sin(t * Math.PI) * 6;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by);
      ctx.lineTo(bx, by - tipLen);
      ctx.lineTo(bx + 6, by);
      ctx.closePath();
      ctx.fill();
    }
  } else if (style === 'curly') {
    // Cloud-like clusters
    const positions = [
      [-18, -8, 14], [-8, -18, 15], [4, -22, 16], [16, -18, 14], [24, -6, 13], [-24, -2, 12],
    ];
    positions.forEach(([dx, dy, rad]) => {
      ctx.beginPath();
      ctx.arc(cx + dx, headCY + dy, rad, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

function drawAccessory(ctx, cx, headCY, r, theme, facing) {
  const acc = theme?.accessory || 'none';
  const hairColor = theme?.hair || '#3E2723';
  if (acc === 'none') return;

  ctx.fillStyle = hairColor;
  if (acc === 'beard') {
    // U-shaped beard around lower jaw
    ctx.beginPath();
    ctx.arc(cx, headCY + 8, r - 8, 0.2, Math.PI - 0.2);
    ctx.arc(cx, headCY + 4, r - 12, Math.PI - 0.2, 0.2, true);
    ctx.closePath();
    ctx.fill();
  } else if (acc === 'mustache') {
    ctx.beginPath();
    ctx.ellipse(cx - 8, headCY + 8, 8, 3, -0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + 8, headCY + 8, 8, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Standalone preview for menu team selector (draws just head/boot)
export function drawTeamPreview(ctx, cx, cy, size, theme) {
  const renderScale = 1.3;
  const r = size * 0.55 * renderScale;
  const headCY = cy - size * 0.15;
  const bootBaseY = cy + size * 0.4;

  // Boot (Krampon)
  const bootColor = theme.primary === '#F4A261' ? '#F4E04D' : '#F4A261'; // Simplified boot color selection
  const bootSecondary = theme.primary;
  
  ctx.save();
  ctx.translate(cx + 10, bootBaseY);
  
  // Draw Boot Shape
  ctx.fillStyle = bootColor;
  ctx.beginPath();
  roundRect(ctx, -20, -15, 45, 25, 8);
  ctx.fill();
  
  // Boot details
  ctx.fillStyle = bootSecondary;
  ctx.beginPath();
  roundRect(ctx, 0, -10, 20, 10, 3);
  ctx.fill();
  
  // Cleats
  ctx.fillStyle = '#444';
  ctx.fillRect(-15, 10, 6, 6);
  ctx.fillRect(5, 10, 6, 6);
  ctx.fillRect(15, 10, 6, 6);
  
  ctx.restore();

  // Draw Head
  drawHead(ctx, cx, headCY, r, theme, 1, theme.primary);
}

function drawConfetti(ctx, particles) {
  particles.forEach((p) => {
    const alpha = Math.min(1, p.life / 60);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  });
  ctx.globalAlpha = 1;
}

// Header / ball-contact impact: expanding glow ring, flash core, comic impact spikes.
function drawHits(ctx, hits) {
  if (!hits || !hits.length) return;
  hits.forEach((h) => {
    const t = 1 - h.life / h.maxLife; // 0 -> 1 over lifetime
    const ease = 1 - Math.pow(1 - t, 2);
    const r = h.r0 + (h.r1 - h.r0) * ease;
    const alpha = 1 - t;

    ctx.save();
    ctx.translate(h.x, h.y);

    // Soft outer glow
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, `rgba(255,255,255,${0.55 * alpha})`);
    grad.addColorStop(0.4, `rgba(255,227,77,${0.45 * alpha})`);
    grad.addColorStop(1, 'rgba(255,227,77,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Shockwave ring
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = `rgba(255,255,255,${0.9 * alpha})`;
    ctx.lineWidth = (h.big ? 5 : 3) * (1 - t * 0.7);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Comic impact spikes (starburst) — only early in the effect
    if (t < 0.6) {
      const spikeAlpha = (1 - t / 0.6);
      const n = h.spikes || 8;
      const inner = h.r0 * 0.5;
      const outer = h.r0 + (r - h.r0) * 0.85;
      ctx.strokeStyle = `rgba(255,227,77,${spikeAlpha})`;
      ctx.lineWidth = h.big ? 6 : 4;
      ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t * 0.6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
        ctx.stroke();
      }
    }

    // Bright flash core
    if (h.big && t < 0.4) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,255,255,${(1 - t / 0.4) * 0.9})`;
      ctx.beginPath();
      ctx.arc(0, 0, h.r0 * (1 - t / 0.4) + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}


function drawGoalText(ctx, side, celebration) {
  // Fade in/out envelope
  const life = 180 - celebration; // 0..180
  let alpha;
  if (life < 20) alpha = life / 20;
  else if (celebration < 40) alpha = celebration / 40;
  else alpha = 1;

  const bounce = Math.sin(life * 0.25) * 0.05;
  const scale = 1 + bounce;
  const color = side === 'left' ? '#00FF66' : '#FF3B30';

  ctx.save();
  ctx.globalAlpha = alpha * 0.55;
  ctx.fillStyle = '#0A0D0B';
  ctx.fillRect(0, 250, FIELD.W, 260);
  ctx.globalAlpha = alpha;

  ctx.translate(FIELD.W / 2, 380);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 40;
  ctx.font = 'bold 160px "Bebas Neue", Impact, sans-serif'; // Slightly smaller to fit UI style
  ctx.fillStyle = color;
  
  // Custom Banner behind text like the reference
  ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
  ctx.shadowBlur = 0;
  roundRect(ctx, -300, -80, 600, 160, 10);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.shadowBlur = 20;
  ctx.fillStyle = '#FFFFFF'; // White text
  ctx.fillText('GOAL!', 0, 0);
  ctx.shadowBlur = 0;

  // Stroke outline
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0A0D0B';
  ctx.strokeText('GOAL!', 0, 0);
  ctx.fillText('GOAL!', 0, 0);

  // Subtitle
  ctx.font = 'bold 34px "Bebas Neue", sans-serif';
  ctx.fillStyle = color; // Colored subtitle
  ctx.fillText(side === 'left' ? 'GREAT SHOT!' : 'CPU SCORED', 0, 110);

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const absW = Math.abs(w);
  const absH = Math.abs(h);
  const rr = Math.min(r, absW / 2, absH / 2);
  const x2 = x + w;
  const y2 = y + h;
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x2 - rr * Math.sign(w), y);
  ctx.quadraticCurveTo(x2, y, x2, y + rr);
  ctx.lineTo(x2, y2 - rr * Math.sign(h));
  ctx.quadraticCurveTo(x2, y2, x2 - rr * Math.sign(w), y2);
  ctx.lineTo(x + rr, y2);
  ctx.quadraticCurveTo(x, y2, x, y2 - rr * Math.sign(h));
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
}
