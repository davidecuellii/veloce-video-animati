// 2D cartoon character renderer (Canvas2D) — bean heads, plum ink, stick-ish limbs.
// Local coords: origin at the feet centre, y negative = up. Canvas 600x1000, feet at (300, 975).
export const PLUM = '#241726';
export const YEL = '#FFF233';
export const CW = 600;
export const CH = 1000;
type Ctx = CanvasRenderingContext2D;
const rad = (d: number) => (d * Math.PI) / 180;

export interface Spec {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'tuft' | 'bun' | 'long' | 'bald' | 'cap' | 'curly' | 'beanie';
  shirt: string;
  pants: string;
  shoes: string;
  apron?: string;
  glasses?: boolean;
  stache?: boolean;
  hat?: string;
  scale?: number;
  build?: number; // torso width factor
  hero?: boolean;
  minimal?: boolean; // all-black suit, logo front and back
  scarf?: string;
  skirt?: boolean;
  sleeves?: 'long' | 'short';
}

export type Expr = 'smile' | 'neutral' | 'surprise' | 'tired' | 'happy' | 'worry' | 'talk' | 'proud' | 'oops' | 'sleepy';
export type Hold = 'phone' | 'box' | 'tool' | 'folder' | 'bag' | 'brush' | 'cushion' | 'plant' | 'lamp' | 'camera' | 'paint' | 'mug' | 'tablet' | 'rag' | 'iphone' | 'iphoneScreen' | 'tweezers' | 'ring' | 'gearbag' | 'pen' | null;

export interface Pose {
  dir?: 1 | -1;
  lean?: number; // deg
  bob?: number; // px
  walk?: number; // phase rad
  amp?: number; // walk amplitude 0..1
  armL?: [number, number]; // deg: [upper, lower-rel] from "down", + toward +x (screen right, before dir flip)
  armR?: [number, number];
  legL?: [number, number];
  legR?: [number, number];
  holdL?: Hold;
  holdR?: Hold;
  expr?: Expr;
  mouth?: number; // 0..1 open
  blink?: boolean;
  tilt?: number; // head tilt deg
  crouch?: number; // px lowering of hips
  look?: number; // -1..1 pupil direction
  sweat?: boolean;
  logo?: HTMLImageElement | null;
  back?: boolean; // seen from behind
  loupe?: boolean; // jeweller's eye loupe
}

export function path(ctx: Ctx, pts: number[][]) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
}
export function limb(ctx: Ctx, pts: number[][], w: number, col: string) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  path(ctx, pts);
  ctx.strokeStyle = PLUM;
  ctx.lineWidth = w + 9;
  ctx.stroke();
  path(ctx, pts);
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.stroke();
}
export function fillInk(ctx: Ctx, fill: string, lw = 7) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = PLUM;
  ctx.lineJoin = 'round';
  ctx.stroke();
}
export function ell(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string, lw = 6) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  fillInk(ctx, fill, lw);
}
export function fk(p0: number[], a1: number, l1: number, a2: number, l2: number) {
  const A = rad(a1);
  const B = rad(a1 + a2);
  const p1 = [p0[0] + Math.sin(A) * l1, p0[1] + Math.cos(A) * l1];
  const p2 = [p1[0] + Math.sin(B) * l2, p1[1] + Math.cos(B) * l2];
  return [p0, p1, p2];
}

export function drawProp(ctx: Ctx, kind: Hold, p: number[], ang: number, dir: number) {
  if (!kind) return;
  ctx.save();
  ctx.translate(p[0], p[1]);
  ctx.rotate(rad(ang));
  switch (kind) {
    case 'phone':
      ctx.beginPath();
      ctx.roundRect(-16, -50, 32, 58, 6);
      fillInk(ctx, '#2d3142');
      ctx.beginPath();
      ctx.roundRect(-11, -44, 22, 42, 3);
      ctx.fillStyle = '#9ad7ff';
      ctx.fill();
      break;
    case 'camera':
      ctx.beginPath();
      ctx.roundRect(-30, -42, 60, 42, 6);
      fillInk(ctx, '#2d3142');
      ell(ctx, 0, -21, 14, 14, '#9ad7ff', 5);
      break;
    case 'tablet':
      ctx.beginPath();
      ctx.roundRect(-34, -64, 68, 84, 6);
      fillInk(ctx, '#2d3142');
      ctx.beginPath();
      ctx.roundRect(-28, -58, 56, 72, 3);
      ctx.fillStyle = '#fff6d6';
      ctx.fill();
      ctx.strokeStyle = '#d96b4b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-20, -40);
      ctx.bezierCurveTo(-8, -52, 6, -20, 20, -34);
      ctx.stroke();
      break;
    case 'tool': // small screwdriver / pliers
      ctx.beginPath();
      ctx.roundRect(-9, -70, 18, 70, 7);
      fillInk(ctx, '#e0833a');
      ctx.beginPath();
      ctx.roundRect(-4, -108, 8, 40, 3);
      fillInk(ctx, '#c9cdd4', 5);
      break;
    case 'box':
      ctx.beginPath();
      ctx.rect(-62, -90, 124, 90);
      fillInk(ctx, '#c79a62');
      ctx.fillStyle = '#e9d7a8';
      ctx.fillRect(-9, -90, 18, 90);
      break;
    case 'folder':
      ctx.beginPath();
      ctx.roundRect(-34, -80, 68, 90, 4);
      fillInk(ctx, '#2f7f8f');
      ctx.fillStyle = '#fff6d6';
      ctx.fillRect(-26, -72, 52, 30);
      break;
    case 'bag':
      ctx.beginPath();
      ctx.roundRect(-30, -10, 60, 62, 5);
      fillInk(ctx, '#e8553d');
      ctx.strokeStyle = PLUM;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, -10, 14, Math.PI, 0);
      ctx.stroke();
      break;
    case 'brush': // paint roller
      ctx.beginPath();
      ctx.roundRect(-34, -88, 68, 24, 8);
      fillInk(ctx, '#3b9ad9');
      ctx.strokeStyle = PLUM;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, -64);
      ctx.lineTo(0, -40);
      ctx.lineTo(0, 0);
      ctx.stroke();
      break;
    case 'paint':
      ctx.beginPath();
      ctx.roundRect(-26, -48, 52, 52, 5);
      fillInk(ctx, '#f0b13a');
      break;
    case 'cushion':
      ctx.beginPath();
      ctx.roundRect(-44, -66, 88, 66, 18);
      fillInk(ctx, '#e0674f');
      break;
    case 'plant':
      ctx.beginPath();
      ctx.roundRect(-24, -40, 48, 44, 5);
      fillInk(ctx, '#c9703f');
      for (const [x, y, r] of [[-14, -66, 18], [12, -74, 22], [0, -96, 18]]) ell(ctx, x, y, r, r, '#4c9c4a', 5);
      break;
    case 'mug':
      ctx.beginPath();
      ctx.roundRect(-18, -40, 36, 44, 5);
      fillInk(ctx, '#f4efe2');
      break;
    case 'iphone': {
      // back of an iPhone Pro: titanium body, big square camera plateau with three lenses
      ctx.beginPath();
      ctx.roundRect(-30, -96, 60, 118, 14);
      fillInk(ctx, '#3a3d44', 6);
      ctx.beginPath();
      ctx.roundRect(-25, -90, 38, 40, 10);
      fillInk(ctx, '#2a2c32', 4);
      for (const [lx, ly] of [[-15, -80], [3, -80], [-6, -62]]) ell(ctx, lx, ly, 7, 7, '#0e0f14', 3);
      ell(ctx, 8, -60, 3, 3, '#fff6c8', 1);
      break;
    }
    case 'pen':
      ctx.strokeStyle = PLUM;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4, 6);
      ctx.lineTo(10, -54);
      ctx.stroke();
      ctx.strokeStyle = '#1f2f4f';
      ctx.lineWidth = 6;
      ctx.stroke();
      break;
    case 'gearbag':
      ctx.beginPath();
      ctx.roundRect(-70, -6, 140, 78, 22);
      fillInk(ctx, '#202026', 7);
      ctx.fillStyle = YEL;
      ctx.fillRect(-60, 26, 120, 9);
      ctx.strokeStyle = PLUM;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-40, -4);
      ctx.lineTo(0, -40);
      ctx.lineTo(40, -4);
      ctx.stroke();
      break;
    case 'iphoneScreen':
      ctx.beginPath();
      ctx.roundRect(-30, -96, 60, 118, 14);
      fillInk(ctx, '#3a3d44', 6);
      ctx.beginPath();
      ctx.roundRect(-25, -90, 50, 106, 10);
      ctx.fillStyle = '#ffe3b8';
      ctx.fill();
      ell(ctx, 0, -40, 12, 12, '#f3c24a', 3);
      ctx.fillStyle = '#e8342a';
      ctx.beginPath();
      ctx.arc(-16, -82, 4, 0, 7);
      ctx.fill();
      break;
    case 'tweezers':
      ctx.strokeStyle = PLUM;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-2, -80);
      ctx.moveTo(6, 0);
      ctx.lineTo(2, -80);
      ctx.stroke();
      ctx.strokeStyle = '#d6d9df';
      ctx.lineWidth = 4;
      ctx.stroke();
      ell(ctx, 0, -86, 7, 7, '#9fe3ff', 3);
      break;
    case 'ring':
      ctx.beginPath();
      ctx.ellipse(0, -20, 20, 20, 0, 0, Math.PI * 2);
      ctx.lineWidth = 14;
      ctx.strokeStyle = PLUM;
      ctx.stroke();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#f3c24a';
      ctx.stroke();
      ell(ctx, 0, -44, 10, 10, '#bff0ff', 3);
      break;
    case 'rag':
      ctx.beginPath();
      ctx.moveTo(-30, -14);
      ctx.bezierCurveTo(-20, -44, 22, -46, 32, -12);
      ctx.bezierCurveTo(20, 8, -18, 8, -30, -14);
      fillInk(ctx, '#f6f1e4', 6);
      ctx.strokeStyle = '#d9573b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-18, -18);
      ctx.lineTo(18, -18);
      ctx.stroke();
      break;
    case 'lamp':
      lampIcon(ctx, 0, 0, 0.5, true);
      break;
  }
  ctx.restore();
}

// shop's signature lamp: reused by every content (identity must stay recognisable)
export function lampIcon(ctx: Ctx, x: number, y: number, s: number, lit: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // base
  ctx.beginPath();
  ctx.ellipse(0, -10, 70, 20, 0, 0, Math.PI * 2);
  fillInk(ctx, '#7a4b2a', 9);
  // stem
  ctx.beginPath();
  ctx.roundRect(-9, -150, 18, 140, 6);
  fillInk(ctx, '#b7773d', 8);
  // two brass rings
  for (const yy of [-60, -110]) {
    ctx.beginPath();
    ctx.ellipse(0, yy, 18, 7, 0, 0, Math.PI * 2);
    fillInk(ctx, '#e9b44c', 6);
  }
  // distinctive shade: tall tulip made of three petals, coral + cream
  ctx.beginPath();
  ctx.moveTo(-84, -250);
  ctx.bezierCurveTo(-96, -190, -58, -150, 0, -150);
  ctx.bezierCurveTo(58, -150, 96, -190, 84, -250);
  ctx.bezierCurveTo(50, -280, -50, -280, -84, -250);
  ctx.closePath();
  fillInk(ctx, lit ? '#ffb457' : '#f2c9a0', 10);
  if (lit) {
    ctx.fillStyle = 'rgba(255,240,170,.75)';
    ctx.beginPath();
    ctx.ellipse(0, -215, 44, 46, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#d9573b';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-70, -228);
  ctx.bezierCurveTo(-30, -200, 30, -200, 70, -228);
  ctx.stroke();
  ctx.restore();
}

function drawHead(ctx: Ctx, S: Spec, P: Pose, hx: number, hy: number) {
  const hw = 100;
  const hh = 112;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(rad(P.tilt || 0));
  // long hair behind
  if (S.hairStyle === 'long') {
    ctx.beginPath();
    ctx.moveTo(-hw * 0.95, -20);
    ctx.bezierCurveTo(-hw * 1.2, hh * 1.1, -hw * 0.6, hh * 1.4, 0, hh * 1.25);
    ctx.bezierCurveTo(hw * 0.6, hh * 1.4, hw * 1.2, hh * 1.1, hw * 0.95, -20);
    ctx.closePath();
    fillInk(ctx, S.hair, 7);
  }
  if (S.hairStyle === 'bun') ell(ctx, 0, -hh - 14, 44, 40, S.hair, 7);
  // skin bean
  ctx.beginPath();
  ctx.moveTo(0, -hh);
  ctx.bezierCurveTo(hw * 0.95, -hh, hw, -hh * 0.35, hw * 0.88, hh * 0.3);
  ctx.bezierCurveTo(hw * 0.74, hh * 0.95, hw * 0.22, hh, 0, hh);
  ctx.bezierCurveTo(-hw * 0.22, hh, -hw * 0.74, hh * 0.95, -hw * 0.88, hh * 0.3);
  ctx.bezierCurveTo(-hw, -hh * 0.35, -hw * 0.95, -hh, 0, -hh);
  ctx.closePath();
  fillInk(ctx, S.skin, 8);
  // ears
  ell(ctx, -hw * 0.92, 12, 13, 22, S.skin, 6);
  ell(ctx, hw * 0.92, 12, 13, 22, S.skin, 6);

  // hair on top
  const topPath = (depth: number) => {
    ctx.beginPath();
    ctx.moveTo(-hw * 0.93, -hh * 0.1);
    ctx.bezierCurveTo(-hw * 1.0, -hh * 0.9, -hw * 0.5, -hh * 1.12, 0, -hh * 1.08);
    ctx.bezierCurveTo(hw * 0.5, -hh * 1.12, hw * 1.0, -hh * 0.9, hw * 0.93, -hh * 0.1);
    ctx.bezierCurveTo(hw * 0.7, -hh * (0.55 - depth), hw * 0.2, -hh * (0.62 - depth), 0, -hh * (0.5 - depth));
    ctx.bezierCurveTo(-hw * 0.3, -hh * (0.7 - depth), -hw * 0.7, -hh * (0.55 - depth), -hw * 0.93, -hh * 0.1);
    ctx.closePath();
  };
  if (S.hairStyle === 'short' || S.hairStyle === 'long' || S.hairStyle === 'bun') {
    topPath(0);
    fillInk(ctx, S.hair, 7);
  } else if (S.hairStyle === 'tuft') {
    topPath(0.1);
    fillInk(ctx, S.hair, 7);
  } else if (S.hairStyle === 'curly') {
    for (let i = -4; i <= 4; i++) ell(ctx, i * 24, -hh * 0.82 + Math.abs(i) * 7, 28, 26, S.hair, 6);
  } else if (S.hairStyle === 'cap' || S.hairStyle === 'beanie') {
    topPath(0.05);
    fillInk(ctx, S.hat || '#d94f3d', 7);
    if (S.hairStyle === 'cap') {
      ctx.beginPath();
      ctx.moveTo(-hw * 0.3, -hh * 0.5);
      ctx.quadraticCurveTo(hw * 0.9, -hh * 0.5, hw * 1.35, -hh * 0.38);
      ctx.quadraticCurveTo(hw * 0.9, -hh * 0.28, -hw * 0.3, -hh * 0.3);
      ctx.closePath();
      fillInk(ctx, S.hat || '#d94f3d', 7);
    }
  }
  if (P.back) {
    // back of the head: hair cap, no face
    ctx.beginPath();
    ctx.ellipse(0, -hh * 0.25, hw * 0.97, hh * 0.85, 0, Math.PI, 0);
    ctx.bezierCurveTo(hw * 0.95, hh * 0.35, -hw * 0.95, hh * 0.35, -hw * 0.97, -hh * 0.25);
    ctx.closePath();
    fillInk(ctx, S.hair, 7);
    ctx.restore();
    return;
  }
  if (S.hero) {
    // swept-back dark tuft for speed
    ctx.beginPath();
    ctx.moveTo(-hw * 0.2, -hh * 1.02);
    ctx.bezierCurveTo(-hw * 0.7, -hh * 1.3, -hw * 1.3, -hh * 1.28, -hw * 1.45, -hh * 1.02);
    ctx.bezierCurveTo(-hw * 1.1, -hh * 1.04, -hw * 0.8, -hh * 0.96, -hw * 0.45, -hh * 0.86);
    ctx.closePath();
    fillInk(ctx, '#1b1a22', 7);
  }

  // mask for the hero
  const ey = -6;
  if (S.hero && !S.minimal) {
    ctx.beginPath();
    ctx.moveTo(-hw * 0.92, ey - 24);
    ctx.quadraticCurveTo(-hw * 0.5, ey - 46, 0, ey - 30);
    ctx.quadraticCurveTo(hw * 0.5, ey - 46, hw * 0.92, ey - 24);
    ctx.quadraticCurveTo(hw * 0.84, ey + 36, hw * 0.4, ey + 34);
    ctx.quadraticCurveTo(hw * 0.12, ey + 30, 0, ey + 14);
    ctx.quadraticCurveTo(-hw * 0.12, ey + 30, -hw * 0.4, ey + 34);
    ctx.quadraticCurveTo(-hw * 0.84, ey + 36, -hw * 0.92, ey - 24);
    ctx.closePath();
    fillInk(ctx, '#15141a', 6);
  }

  // eyes
  const ex = 36;
  const open = P.blink ? 0.08 : P.expr === 'sleepy' ? 0.35 : P.expr === 'tired' ? 0.55 : P.expr === 'surprise' ? 1.25 : 1;
  const look = (P.look || 0) * 7;
  for (const sx of [-1, 1]) {
    const cx = sx * ex;
    ctx.beginPath();
    ctx.ellipse(cx, ey, 17, 22 * open + 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = S.hero ? 3 : 5;
    ctx.strokeStyle = PLUM;
    ctx.stroke();
    if (open > 0.2) {
      ctx.beginPath();
      ctx.ellipse(cx + look, ey + 2, 8, 11 * Math.min(1, open + 0.3), 0, 0, Math.PI * 2);
      ctx.fillStyle = PLUM;
      ctx.fill();
    }
    if (P.expr === 'tired' || P.expr === 'sleepy') {
      ctx.beginPath(); // heavy lid
      ctx.rect(cx - 19, ey - 25, 38, 16 + (P.expr === 'sleepy' ? 8 : 0));
      ctx.fillStyle = S.hero ? '#15141a' : S.skin;
      ctx.fill();
      ctx.strokeStyle = PLUM;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx - 19, ey - 9);
      ctx.lineTo(cx + 19, ey - 9);
      ctx.stroke();
    }
    if (S.glasses) {
      ctx.beginPath();
      ctx.arc(cx, ey, 26, 0, Math.PI * 2);
      ctx.strokeStyle = PLUM;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }
  if (S.glasses) {
    ctx.beginPath();
    ctx.moveTo(-10, ey);
    ctx.lineTo(10, ey);
    ctx.stroke();
  }
  if (P.loupe) {
    ctx.beginPath();
    ctx.roundRect(ex - 26, ey - 26, 52, 52, 12);
    fillInk(ctx, '#2a2a30', 6);
    ell(ctx, ex, ey, 17, 17, '#9fd3ff', 4);
  }
  // brows
  const browY = ey - 38;
  const bw = S.hero ? 0 : 1;
  ctx.strokeStyle = PLUM;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  const brow = (sx: number, a: number, dy = 0) => {
    ctx.beginPath();
    ctx.moveTo(sx * ex - 20, browY + dy + sx * a * -1);
    ctx.lineTo(sx * ex + 20, browY + dy + sx * a);
    ctx.stroke();
  };
  if (!S.hero || true) {
    const e = P.expr || 'smile';
    if (S.hero) ctx.strokeStyle = '#f3efe0';
    if (e === 'worry' || e === 'oops') { brow(-1, 10, -2); brow(1, 10, -2); }
    else if (e === 'surprise') { brow(-1, 0, -14); brow(1, 0, -14); }
    else if (e === 'tired' || e === 'sleepy') { brow(-1, 11, 0); brow(1, 11, 0); }
    else if (e === 'proud') { brow(-1, -4, -4); brow(1, -4, -4); }
    else { brow(-1, 3); brow(1, -3, 0); }
    if (bw) ctx.strokeStyle = PLUM;
  }
  // nose
  ctx.beginPath();
  ctx.ellipse(0, 22, 9, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = S.skin === '#f2c9a0' ? '#e9b58a' : 'rgba(0,0,0,.12)';
  ctx.fill();
  // mouth
  const my = 62;
  ctx.strokeStyle = PLUM;
  ctx.lineWidth = 7;
  const e = P.expr || 'smile';
  const m = P.mouth ?? (e === 'talk' ? 0.6 : 0);
  if (m > 0.05 || e === 'surprise' || e === 'happy' || e === 'oops') {
    const o = Math.max(m, e === 'surprise' ? 0.9 : e === 'happy' ? 0.55 : e === 'oops' ? 0.5 : 0);
    ctx.beginPath();
    ctx.ellipse(0, my + 4, 22 + o * 8, 6 + o * 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#7a1f2b';
    ctx.fill();
    ctx.stroke();
  } else if (e === 'smile' || e === 'proud') {
    ctx.beginPath();
    ctx.moveTo(-26, my - 2);
    ctx.quadraticCurveTo(0, my + 16, 30, my - 8);
    ctx.stroke();
  } else if (e === 'tired' || e === 'sleepy' || e === 'worry') {
    ctx.beginPath();
    ctx.moveTo(-24, my + 6);
    ctx.quadraticCurveTo(0, my - 8, 24, my + 6);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-20, my);
    ctx.lineTo(20, my);
    ctx.stroke();
  }
  if (S.stache) {
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.bezierCurveTo(-30, 30, -64, 44, -58, 62);
    ctx.bezierCurveTo(-40, 50, -16, 50, 0, 52);
    ctx.bezierCurveTo(16, 50, 40, 50, 58, 62);
    ctx.bezierCurveTo(64, 44, 30, 30, 0, 40);
    ctx.closePath();
    fillInk(ctx, S.hair, 5);
  }
  if (P.sweat) {
    ctx.beginPath();
    ctx.moveTo(hw * 0.95, -50);
    ctx.quadraticCurveTo(hw * 1.15, -10, hw * 0.95, 4);
    ctx.quadraticCurveTo(hw * 0.75, -10, hw * 0.95, -50);
    fillInk(ctx, '#9ad7ff', 5);
  }
  ctx.restore();
}

export function drawPerson(ctx: Ctx, S: Spec, P: Pose) {
  ctx.clearRect(0, 0, CW, CH);
  const dir = P.dir || 1;
  const sc = S.scale || 1;
  const bw = S.build || 1;
  ctx.save();
  ctx.translate(300, 975);
  ctx.scale(dir * sc, sc);
  const crouch = P.crouch || 0;
  const bob = P.bob || 0;
  const hip = [0, -330 + crouch - bob];
  // legs --------------------------------------------------------------
  const w = P.walk || 0;
  const A = P.amp || 0;
  const swing = (ph: number) => Math.sin(ph) * 34 * A;
  const knee = (ph: number) => -Math.max(0, Math.cos(ph)) * 38 * A;
  const legAngles = (side: number): [number, number] => {
    const given = side < 0 ? P.legL : P.legR;
    if (given) return given;
    return [swing(w + (side < 0 ? 0 : Math.PI)), knee(w + (side < 0 ? 0 : Math.PI)) + (crouch ? 40 : 0)];
  };
  const drawLeg = (side: number) => {
    const [a1, a2] = legAngles(side);
    const L1 = 165 - crouch * 0.4;
    const L2 = 165 - crouch * 0.4;
    const pts = fk([side * 26, hip[1]], a1, L1, a2, L2);
    limb(ctx, pts, S.hero ? 36 : 32, S.skirt ? S.skin : S.pants);
    if (S.hero && !S.minimal) {
      // yellow oblique bands on the thigh
      const t0 = [pts[0][0] + (pts[1][0] - pts[0][0]) * 0.25, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.25];
      const t1 = [pts[0][0] + (pts[1][0] - pts[0][0]) * 0.62, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.62];
      ctx.lineCap = 'butt';
      path(ctx, [[t0[0] - 5, t0[1] + 10], [t1[0] + 5, t1[1] - 10]]);
      ctx.strokeStyle = YEL;
      ctx.lineWidth = 9;
      ctx.stroke();
    }
    // boot
    const ax = pts[2][0];
    const ay = pts[2][1];
    ctx.beginPath();
    ctx.roundRect(ax - 30 + side * 4, ay - 8, 70, 36, 14);
    fillInk(ctx, S.shoes, 7);
    if (S.hero && !S.minimal) {
      ctx.beginPath();
      ctx.roundRect(ax - 22, ay - 18, 44, 28, 8);
      fillInk(ctx, '#15141a', 6);
    }
  };
  ctx.save();
  // lean around hips
  ctx.translate(0, hip[1]);
  ctx.rotate(rad(P.lean || 0));
  ctx.translate(0, -hip[1]);
  // back arm (right side of figure)
  const sh = [0, -520 + crouch - bob];
  const shoulderY = sh[1];
  const armColor = S.minimal ? '#1d1d24' : S.hero ? '#2e2f36' : S.shirt;
  const drawArm = (side: number) => {
    const given = side < 0 ? P.armL : P.armR;
    let a1 = side * 8 + (given ? given[0] : 0);
    let a2 = given ? given[1] : 0;
    if (!given) {
      const ph = w + (side < 0 ? Math.PI : 0);
      a1 = side * 6 + Math.sin(ph) * 26 * A;
      a2 = -Math.max(0, Math.sin(ph)) * 24 * A - 6;
    }
    const sx = side * (80 * bw);
    const pts = fk([sx, shoulderY + 8], a1, 118, a2, 110);
    limb(ctx, pts.slice(0, 2), S.hero ? 28 : 24, armColor);
    if (S.minimal) {
      limb(ctx, pts.slice(1), 25, '#1d1d24');
      ell(ctx, pts[2][0], pts[2][1], 18, 18, '#121216', 6);
    } else if (S.hero) {
      limb(ctx, pts.slice(1), 25, '#15141a');
      const mid = [(pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2];
      const d = [pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]];
      path(ctx, [[mid[0] - d[0] * 0.18, mid[1] - d[1] * 0.18], [mid[0] + d[0] * 0.05, mid[1] + d[1] * 0.05]]);
      ctx.lineCap = 'butt';
      ctx.strokeStyle = YEL;
      ctx.lineWidth = 22;
      ctx.stroke();
      ell(ctx, pts[2][0], pts[2][1], 19, 19, '#15141a', 6);
      ell(ctx, sx, shoulderY + 8, 33, 30, YEL, 7); // yellow shoulder cap
    } else {
      if (S.sleeves !== 'short') limb(ctx, pts.slice(1), 24, S.shirt);
      else limb(ctx, pts.slice(1), 18, S.skin);
      ell(ctx, pts[2][0], pts[2][1], 15, 15, S.skin, 6);
    }
    return pts;
  };
  drawLeg(1);
  drawLeg(-1);
  const armBack = drawArm(1);
  const holdR = P.holdR;
  if (holdR) drawProp(ctx, holdR, armBack[2], 0, dir);

  // torso ------------------------------------------------------------
  const tw = (v: number) => v * bw;
  ctx.beginPath();
  ctx.moveTo(-tw(74), shoulderY - 6);
  ctx.quadraticCurveTo(0, shoulderY - 26, tw(74), shoulderY - 6);
  ctx.quadraticCurveTo(tw(78), shoulderY + 50, tw(54), hip[1] - 70);
  ctx.quadraticCurveTo(tw(58), hip[1] - 20, tw(56), hip[1] + 18);
  ctx.lineTo(-tw(56), hip[1] + 18);
  ctx.quadraticCurveTo(-tw(58), hip[1] - 20, -tw(54), hip[1] - 70);
  ctx.quadraticCurveTo(-tw(78), shoulderY + 50, -tw(74), shoulderY - 6);
  ctx.closePath();
  fillInk(ctx, S.minimal ? '#1d1d24' : S.hero ? '#44454d' : S.shirt, 8);
  if (S.skirt) {
    ctx.beginPath();
    ctx.moveTo(-60, hip[1] - 10);
    ctx.lineTo(60, hip[1] - 10);
    ctx.lineTo(82, hip[1] + 120);
    ctx.lineTo(-82, hip[1] + 120);
    ctx.closePath();
    fillInk(ctx, S.pants, 7);
  }
  if (S.minimal) {
    // a single soft sheen so the black reads as fabric, not a hole
    ctx.save();
    ctx.clip();
    const sh = ctx.createLinearGradient(-70, 0, 70, 0);
    sh.addColorStop(0, 'rgba(255,255,255,0.10)');
    sh.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(-90, shoulderY - 40, 180, 260);
    ctx.restore();
    ctx.beginPath();
    ctx.roundRect(-34, shoulderY - 30, 68, 34, 10);
    fillInk(ctx, '#1d1d24', 6);
    if (P.logo) {
      const ls = P.back ? 104 : 84;
      ctx.drawImage(P.logo, -ls / 2, shoulderY + (P.back ? 30 : 34), ls, ls);
    }
  } else if (S.hero) {
    ctx.save();
    ctx.clip();
    // black side panels
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 74, shoulderY);
      ctx.lineTo(s * 46, shoulderY);
      ctx.lineTo(s * 36, hip[1] + 20);
      ctx.lineTo(s * 60, hip[1] + 20);
      ctx.closePath();
      ctx.fillStyle = '#15141a';
      ctx.fill();
      // yellow oblique band pointing forward (toward centre, upward)
      ctx.beginPath();
      ctx.moveTo(s * 62, hip[1] + 10);
      ctx.lineTo(s * 40, hip[1] + 10);
      ctx.lineTo(s * 22, hip[1] - 42);
      ctx.lineTo(s * 44, hip[1] - 42);
      ctx.closePath();
      ctx.fillStyle = YEL;
      ctx.fill();
    }
    // thin black belt
    ctx.fillStyle = '#15141a';
    ctx.fillRect(-70, hip[1] - 22, 140, 13);
    ctx.restore();
    // high collar
    ctx.beginPath();
    ctx.roundRect(-34, shoulderY - 30, 68, 34, 10);
    fillInk(ctx, '#2e2f36', 6);
    // official logo, untouched, on the chest
    if (P.logo) {
      const ls = 74;
      ctx.drawImage(P.logo, -ls / 2, shoulderY + 40, ls, ls);
    }
  }
  if (S.apron) {
    ctx.beginPath();
    ctx.moveTo(-tw(52), shoulderY + 16);
    ctx.lineTo(tw(52), shoulderY + 16);
    ctx.lineTo(tw(64), hip[1] + 120 + crouch * 0.2);
    ctx.lineTo(-tw(64), hip[1] + 120 + crouch * 0.2);
    ctx.closePath();
    fillInk(ctx, S.apron, 7);
    ctx.beginPath();
    ctx.roundRect(-30, hip[1] - 10, 60, 44, 6);
    ctx.strokeStyle = PLUM;
    ctx.lineWidth = 5;
    ctx.stroke();
    path(ctx, [[-tw(46), shoulderY + 16], [-20, shoulderY - 20]]);
    ctx.lineWidth = 7;
    ctx.stroke();
    path(ctx, [[tw(46), shoulderY + 16], [20, shoulderY - 20]]);
    ctx.stroke();
  }
  if (S.scarf) {
    ctx.beginPath();
    ctx.roundRect(-44, shoulderY - 34, 88, 30, 14);
    fillInk(ctx, S.scarf, 7);
  }
  // neck
  const front = drawArm(-1);
  if (P.holdL) drawProp(ctx, P.holdL, front[2], 0, dir);
  // head
  const headX = 0;
  const headY = shoulderY - 122;
  if (!S.hero) {
    ctx.beginPath();
    ctx.roundRect(-16, shoulderY - 44, 32, 40, 8);
    fillInk(ctx, S.skin, 6);
  }
  drawHead(ctx, S, P, headX, headY);
  ctx.restore();
  ctx.restore();
}

/** sitting orange tabby looking into the lens: slow deadpan blink */
export function drawCat(g: CanvasRenderingContext2D, t: number, blinkAt = 99, yawnAt = 99) {
  g.clearRect(0, 0, CW, CH);
  g.save();
  g.translate(300, 975);
  const O = '#f0922e';
  const OD = '#d9701c';
  const body = () => {
    g.beginPath();
    g.moveTo(-120, 0);
    g.bezierCurveTo(-150, -190, -80, -330, 0, -330);
    g.bezierCurveTo(80, -330, 150, -190, 120, 0);
    g.closePath();
  };
  // tail
  g.beginPath();
  g.moveTo(110, -20);
  g.bezierCurveTo(240, -10, 260, -150, 200, -230);
  g.lineWidth = 34;
  g.lineCap = 'round';
  g.strokeStyle = PLUM;
  g.stroke();
  g.lineWidth = 22;
  g.strokeStyle = O;
  g.stroke();
  body();
  fillInk(g, O, 9);
  g.save();
  body();
  g.clip();
  g.strokeStyle = OD;
  g.lineWidth = 14;
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.moveTo(-130, -60 - i * 55);
    g.quadraticCurveTo(-90, -80 - i * 55, -60, -50 - i * 55);
    g.stroke();
    g.beginPath();
    g.moveTo(130, -60 - i * 55);
    g.quadraticCurveTo(90, -80 - i * 55, 60, -50 - i * 55);
    g.stroke();
  }
  g.beginPath();
  g.ellipse(0, -110, 55, 120, 0, 0, 7);
  g.fillStyle = '#fbf3e6';
  g.fill();
  g.restore();
  // paws
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.ellipse(sx * 42, -10, 40, 22, 0, 0, 7);
    fillInk(g, '#fbf3e6', 8);
  }
  // head
  const hy = -390;
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.moveTo(sx * 40, hy - 70);
    g.lineTo(sx * 110, hy - 190);
    g.lineTo(sx * 130, hy - 40);
    g.closePath();
    fillInk(g, O, 9);
    g.beginPath();
    g.moveTo(sx * 62, hy - 80);
    g.lineTo(sx * 106, hy - 150);
    g.lineTo(sx * 112, hy - 70);
    g.closePath();
    g.fillStyle = '#f2a9a0';
    g.fill();
  }
  g.beginPath();
  g.ellipse(0, hy, 140, 108, 0, 0, 7);
  fillInk(g, O, 9);
  g.save();
  g.beginPath();
  g.ellipse(0, hy, 140, 108, 0, 0, 7);
  g.clip();
  g.fillStyle = '#fbf3e6';
  g.beginPath();
  g.ellipse(0, hy + 60, 80, 62, 0, 0, 7);
  g.fill();
  g.strokeStyle = OD;
  g.lineWidth = 12;
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
    g.beginPath();
    g.moveTo(sx * (30 + k * 26), hy - 112);
    g.lineTo(sx * (40 + k * 26), hy - 74);
    g.stroke();
  }
  g.restore();
  const phase = (t - blinkAt) / 0.7;
  const closed = phase > 0 && phase < 1 ? Math.sin(phase * Math.PI) : 0;
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.ellipse(sx * 52, hy - 8, 30, 27, 0, 0, 7);
    g.fillStyle = '#d8e66a';
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = PLUM;
    g.stroke();
    g.beginPath();
    g.ellipse(sx * 52, hy - 8, 7, 22, 0, 0, 7);
    g.fillStyle = PLUM;
    g.fill();
    // deadpan half lid, closes fully on blink
    g.beginPath();
    g.rect(sx * 52 - 32, hy - 38, 64, 20 + closed * 40);
    g.fillStyle = O;
    g.fill();
    g.beginPath();
    g.moveTo(sx * 52 - 32, hy - 18 + closed * 40);
    g.lineTo(sx * 52 + 32, hy - 18 + closed * 40);
    g.lineWidth = 7;
    g.strokeStyle = PLUM;
    g.stroke();
  }
  const yw = (t - yawnAt) / 1.0;
  const yawn = yw > 0 && yw < 1 ? Math.sin(yw * Math.PI) : 0;
  if (yawn > 0.05) {
    g.beginPath();
    g.ellipse(0, hy + 52, 26 + yawn * 10, 8 + yawn * 40, 0, 0, 7);
    g.fillStyle = '#7a1f2b';
    g.fill();
    g.lineWidth = 6;
    g.strokeStyle = PLUM;
    g.stroke();
  }
  g.beginPath();
  g.moveTo(-14, hy + 24);
  g.lineTo(14, hy + 24);
  g.lineTo(0, hy + 38);
  g.closePath();
  g.fillStyle = '#e8837a';
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = PLUM;
  g.stroke();
  g.beginPath();
  g.moveTo(0, hy + 38);
  g.quadraticCurveTo(-16, hy + 58, -34, hy + 50);
  g.moveTo(0, hy + 38);
  g.quadraticCurveTo(16, hy + 58, 34, hy + 50);
  g.stroke();
  g.lineWidth = 4;
  for (const sx of [-1, 1]) for (const dy of [-6, 8, 22]) {
    g.beginPath();
    g.moveTo(sx * 60, hy + 34 + dy * 0.4);
    g.lineTo(sx * 170, hy + 24 + dy);
    g.stroke();
  }
  g.restore();
}
