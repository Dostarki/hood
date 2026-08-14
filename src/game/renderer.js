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
  if (celebrating) drawGoalText(ctx, engine.lastScorer, engine.celebration);

  ctx.restore();
}

function drawSky(ctx) {
  // Light blue day sky
  const g = ctx.createLinearGradient(0, 0, 0, 150);
  g.addColorStop(0, '#57A0D3');
  g.addColorStop(1, '#90CDEB');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FIELD.W, 150);

  // Simple clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(200, 60, 30, 0, Math.PI * 2);
  ctx.arc(240, 50, 40, 0, Math.PI * 2);
  ctx.arc(280, 60, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(800, 80, 40, 0, Math.PI * 2);
  ctx.arc(850, 60, 50, 0, Math.PI * 2);
  ctx.arc(900, 80, 40, 0, Math.PI * 2);
  ctx.fill();
}

function drawWallAndGraffiti(ctx) {
  const wallTopY = 120;
  const wallBotY = 300;

  // Modern Stadium Wall
  ctx.fillStyle = '#1A1A24'; // Dark modern base
  ctx.fillRect(0, wallTopY, FIELD.W, wallBotY - wallTopY);

  // Modern Stadium Banners (like reference image)
  const bannerY = 220;
  const bannerH = 60;
  ctx.fillStyle = '#0F101A';
  ctx.fillRect(0, bannerY, FIELD.W, bannerH);
  
  // Neon glowing strip
  ctx.fillStyle = '#00F0FF';
  ctx.fillRect(0, bannerY, FIELD.W, 4);
  ctx.fillStyle = '#FF0055';
  ctx.fillRect(0, bannerY + bannerH - 4, FIELD.W, 4);

  // Digital Ad Boards (Mockups)
  const drawAd = (x, color, text) => {
    ctx.fillStyle = color;
    roundRect(ctx, x, bannerY + 10, 160, 40, 4);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px "Bebas Neue", sans-serif';
    ctx.fillText(text, x + 80, bannerY + 38);
  };
  
  ctx.textAlign = 'center';
  drawAd(100, '#E63946', 'CHICKEN BURGER');
  drawAd(400, '#457B9D', 'PLAY NOW');
  drawAd(740, '#E63946', 'BURGER KING');

  // Bleachers (Trübünler) behind the fence
  const bleacherTopY = 300;
  const bleacherBotY = FIELD.GROUND_Y - 20; // Around 480
  
  // Tiered stadium seating with neon accents
  const bg = ctx.createLinearGradient(0, bleacherTopY, 0, bleacherBotY);
  bg.addColorStop(0, '#2A2A35');
  bg.addColorStop(1, '#1A1A24');
  ctx.fillStyle = bg;
  ctx.fillRect(0, bleacherTopY, FIELD.W, bleacherBotY - bleacherTopY);
  
  // Bleacher steps (more prominent)
  ctx.strokeStyle = '#0F101A';
  ctx.lineWidth = 4;
  for (let y = bleacherTopY; y < bleacherBotY; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD.W, y);
    ctx.stroke();
    // Neon step edge
    ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.fillRect(0, y - 4, FIELD.W, 2);
  }
}

function drawFence(ctx) {
  // We'll replace the basic fence with a modern stadium barrier / LED board line
  const barrierTop = FIELD.GROUND_Y - 30;
  const barrierBot = FIELD.GROUND_Y;

  // Barrier Base
  ctx.fillStyle = '#0F101A';
  ctx.fillRect(0, barrierTop, FIELD.W, barrierBot - barrierTop);

  // Top rail (Glowing)
  ctx.fillStyle = '#00F0FF';
  ctx.fillRect(0, barrierTop, FIELD.W, 4);

  // Digital Ad pattern on the barrier
  for (let x = 20; x < FIELD.W; x += 300) {
    ctx.fillStyle = '#1A1A24';
    ctx.fillRect(x, barrierTop + 8, 260, 16);
    
    // Fake LED dots
    ctx.fillStyle = `rgba(255, 0, 85, ${0.5 + Math.sin(frame * 0.1 + x) * 0.3})`;
    for (let i = 0; i < 250; i += 8) {
      ctx.fillRect(x + i, barrierTop + 10, 4, 12);
    }
  }
}

function drawCrowd(ctx, celebrating) {
  // Adjusted tiers to match the bleachers area (300 to 460)
  const tiers = [
    { y: 310, r: 16, spacing: 35 },
    { y: 345, r: 18, spacing: 40 },
    { y: 385, r: 20, spacing: 45 },
    { y: 430, r: 22, spacing: 50 },
  ];
  const shirtColors = ['#E63946', '#F4A261', '#2A9D8F', '#00FF66', '#457B9D', '#F1FAEE', '#E9C46A', '#EF476F', '#7209B7', '#4CC9F0'];
  const skinColors = ['#F5D6B5', '#E0A98C', '#C68962', '#8D5A3B', '#5D3A26'];

  tiers.forEach((tier, ti) => {
    const waveSpeed = celebrating ? 0.12 : 0.04;
    const waveMag = celebrating ? 7 : 3;
    const wave = Math.sin(frame * waveSpeed + ti * 0.7) * waveMag;

    for (let x = 20; x < FIELD.W; x += tier.spacing) {
      const seed = ti * 1000 + x;
      const shirt = shirtColors[Math.floor(rand(seed) * shirtColors.length)];
      const skin = skinColors[Math.floor(rand(seed + 1) * skinColors.length)];
      const baseCheer = Math.sin(frame * 0.08 + seed * 0.13) > 0.3;
      const cheer = celebrating ? true : baseCheer;
      const yOff = ti % 2 === 0 ? wave : -wave;
      const armLift = cheer ? (celebrating ? -15 : -8) : 0;

      // Torso
      ctx.fillStyle = shirt;
      roundRect(ctx, x - tier.r * 0.8, tier.y + yOff, tier.r * 1.6, tier.r * 1.5, 4);
      ctx.fill();

      // Arms (raised when cheering)
      if (cheer) {
        ctx.fillStyle = skin;
        ctx.fillRect(x - tier.r * 1.1, tier.y + yOff + armLift, 5, tier.r);
        ctx.fillRect(x + tier.r * 0.7, tier.y + yOff + armLift, 5, tier.r);
      }

      // Head (Big cartoonish head for crowd too)
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(x, tier.y + yOff - tier.r * 0.6, tier.r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      
      // Face details (Eyes/Mouth)
      ctx.fillStyle = '#000';
      ctx.fillRect(x - tier.r * 0.4, tier.y + yOff - tier.r * 0.8, 3, 3);
      ctx.fillRect(x + tier.r * 0.2, tier.y + yOff - tier.r * 0.8, 3, 3);
      if (cheer) {
        ctx.beginPath();
        ctx.arc(x, tier.y + yOff - tier.r * 0.3, 4, 0, Math.PI);
        ctx.fill();
      } else {
        ctx.fillRect(x - tier.r * 0.2, tier.y + yOff - tier.r * 0.3, tier.r * 0.4, 2);
      }

      // Hair
      const hairColor = ['#3E2723', '#000000', '#D4AF37', '#8B4513'][Math.floor(rand(seed + 2) * 4)];
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.arc(x, tier.y + yOff - tier.r * 0.9, tier.r * 0.8, Math.PI, 0);
      ctx.fill();
    }
  });
}

function drawPitch(ctx) {
  // Grass field with alternating stripes
  const stripes = 14;
  const stripeW = FIELD.W / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#43A047' : '#388E3C'; // Brighter green grass
    ctx.fillRect(i * stripeW, FIELD.GROUND_Y, stripeW, FIELD.H - FIELD.GROUND_Y);
  }

  // Dirt/mud at the bottom edge of the pitch
  const dirtHeight = 30;
  ctx.fillStyle = '#6D4C41'; // Dirt color
  ctx.fillRect(0, FIELD.H - dirtHeight, FIELD.W, dirtHeight);

  // Perspective darkening at top of pitch
  const gp = ctx.createLinearGradient(0, FIELD.GROUND_Y, 0, FIELD.H - dirtHeight);
  gp.addColorStop(0, 'rgba(0,0,0,0.3)');
  gp.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gp;
  ctx.fillRect(0, FIELD.GROUND_Y, FIELD.W, FIELD.H - FIELD.GROUND_Y - dirtHeight);

  // Center line
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(FIELD.W / 2, FIELD.GROUND_Y);
  ctx.lineTo(FIELD.W / 2, FIELD.H - dirtHeight);
  ctx.stroke();

  // Center circle (half arc)
  ctx.beginPath();
  ctx.arc(FIELD.W / 2, FIELD.GROUND_Y, 90, 0, Math.PI);
  ctx.stroke();

  // Center spot
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(FIELD.W / 2, FIELD.GROUND_Y, 6, 0, Math.PI * 2);
  ctx.fill();

  // Goal areas (small rectangles on both sides)
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 4;
  ctx.strokeRect(FIELD.GOAL_WIDTH, FIELD.GROUND_Y, 160, FIELD.H - FIELD.GROUND_Y - dirtHeight - 20);
  ctx.strokeRect(FIELD.W - FIELD.GOAL_WIDTH - 160, FIELD.GROUND_Y, 160, FIELD.H - FIELD.GROUND_Y - dirtHeight - 20);
}

function drawGoal(ctx, side) {
  const isLeft = side === 'left';
  const x0 = isLeft ? 0 : FIELD.W - FIELD.GOAL_WIDTH;
  const goalTop = FIELD.GROUND_Y - FIELD.GOAL_HEIGHT;
  
  // Base Goal Position
  const backTopX = isLeft ? x0 : x0 + FIELD.GOAL_WIDTH;
  const frontTopX = isLeft ? x0 + FIELD.GOAL_WIDTH : x0;
  
  // Drawing 3D angled net
  // Draw the back netting (darker)
  ctx.fillStyle = 'rgba(200, 200, 200, 0.15)';
  ctx.beginPath();
  ctx.moveTo(backTopX, goalTop + 20); // Top back
  ctx.lineTo(frontTopX, goalTop);     // Top front (crossbar)
  ctx.lineTo(frontTopX, FIELD.GROUND_Y); // Bottom front
  ctx.lineTo(backTopX, FIELD.GROUND_Y);  // Bottom back
  ctx.closePath();
  ctx.fill();

  // Net grid pattern (perspective)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Vertical lines
  for(let i=1; i<10; i++) {
    const t = i/10;
    const topX = backTopX + (frontTopX - backTopX) * t;
    const topY = (goalTop + 20) + (goalTop - (goalTop + 20)) * t;
    ctx.moveTo(topX, topY);
    ctx.lineTo(topX, FIELD.GROUND_Y);
  }
  // Horizontal lines
  for(let i=1; i<10; i++) {
    const t = i/10;
    const y = FIELD.GROUND_Y - (FIELD.GOAL_HEIGHT * t);
    const topX = backTopX + (frontTopX - backTopX) * t;
    // angled horizontal
    ctx.moveTo(backTopX, y);
    ctx.lineTo(frontTopX, y);
  }
  ctx.stroke();

  // Goal Posts (thick, stylized like the image)
  const postColor = isLeft ? '#FF9900' : '#B829FF'; // Left orange/gold, right purple/magenta
  const postShadow = isLeft ? '#CC5500' : '#7700CC';
  
  // Crossbar
  ctx.fillStyle = postColor;
  ctx.fillRect(Math.min(backTopX, frontTopX), goalTop - 6, FIELD.GOAL_WIDTH, 12);
  ctx.fillStyle = postShadow;
  ctx.fillRect(Math.min(backTopX, frontTopX), goalTop, FIELD.GOAL_WIDTH, 6);
  
  // Front Pole
  ctx.fillStyle = postColor;
  ctx.fillRect(frontTopX - (isLeft?12:-4), goalTop - 6, 16, FIELD.GOAL_HEIGHT + 6);
  ctx.fillStyle = postShadow;
  ctx.fillRect(frontTopX - (isLeft?4:-12), goalTop - 6, 8, FIELD.GOAL_HEIGHT + 6);

  // Back Pole (Diagonal Support)
  ctx.strokeStyle = postColor;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(frontTopX - (isLeft?4:-4), goalTop);
  ctx.lineTo(backTopX, FIELD.GROUND_Y);
  ctx.stroke();

  // Glow effect on poles
  ctx.shadowColor = postColor;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#FFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(frontTopX - (isLeft?4:-4), goalTop);
  ctx.lineTo(frontTopX - (isLeft?4:-4), FIELD.GROUND_Y);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Base pole shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(frontTopX - (isLeft?4:-4), FIELD.GROUND_Y + 2, 12, 4, 0, 0, Math.PI * 2);
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
  ctx.ellipse(cx, FIELD.GROUND_Y + 2, 50, 10, 0, 0, Math.PI * 2);
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
  ctx.fillText('GOOOL!', 0, 0);
  ctx.shadowBlur = 0;

  // Stroke outline
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0A0D0B';
  ctx.strokeText('GOOOL!', 0, 0);
  ctx.fillText('GOOOL!', 0, 0);

  // Subtitle
  ctx.font = 'bold 34px "Bebas Neue", sans-serif';
  ctx.fillStyle = color; // Colored subtitle
  ctx.fillText(side === 'left' ? 'HARIKA VURUS!' : 'CPU SKORLADI', 0, 110);

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
