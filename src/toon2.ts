// Character renderer v2: front / three-quarter / side / back views, so people can walk in profile,
// look at their phone or their work, and never stare into the lens.
// Local coords: origin at the feet, y negative = up, +x = the direction the character faces (dir flips it).
import {Spec, Pose, PLUM, YEL, CW, CH, path, limb, fillInk, ell, fk, drawProp} from './toon';

export type View = 'front' | 'three' | 'side' | 'back';
export interface Pose2 extends Pose {
  view?: View;
  lookY?: number; // -1 up .. 1 down
  far?: boolean; // internal
}
type Ctx = CanvasRenderingContext2D;
const rad = (d: number) => (d * Math.PI) / 180;

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
}

const VIEW = {
  front: {tw: 72, shX: [-76, 76], hipX: [-24, 24], face: 0},
  three: {tw: 60, shX: [-44, 44], hipX: [-14, 18], face: 1},
  side: {tw: 44, shX: [-4, 4], hipX: [-4, 4], face: 2},
  back: {tw: 72, shX: [-76, 76], hipX: [-24, 24], face: 3},
};

function head(ctx: Ctx, S: Spec, P: Pose2, view: View) {
  const hw = 96;
  const hh = 104;
  ctx.save();
  ctx.rotate(rad(P.tilt || 0));
  const headPath = () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
  };
  // hair behind (long / bun): kept above the jaw so it never reads as a beard
  if (S.hairStyle === 'long') {
    ctx.beginPath();
    const bx = view === 'side' ? -40 : view === 'three' ? -22 : 0;
    ctx.ellipse(bx, 4, hw * (view === 'side' ? 0.95 : 1.12), hh * 1.08, 0, Math.PI * 1.02, Math.PI * 1.98, false);
    ctx.lineTo(bx + hw * 1.0, hh * 0.55);
    ctx.quadraticCurveTo(bx, hh * 0.75, bx - hw * 1.0, hh * 0.55);
    ctx.closePath();
    fillInk(ctx, S.hair, 7);
  }
  if (S.hairStyle === 'bun') ell(ctx, view === 'front' ? 0 : -50, -hh - 6, 40, 36, S.hair, 7);
  const ears = view === 'front' || view === 'back' ? [-hw * 0.96, hw * 0.96] : view === 'three' ? [-hw * 0.6] : [-hw * 0.1];
  if (view === 'front' || view === 'back') for (const ex of ears) ell(ctx, ex, 14, 13, 21, S.skin, 6);
  headPath();
  fillInk(ctx, S.skin, 8);
  // nose bump on the silhouette in profile
  if (view === 'side') {
    ctx.beginPath();
    ctx.moveTo(hw * 0.94, 2);
    ctx.quadraticCurveTo(hw * 1.14, 22, hw * 0.94, 30);
    ctx.lineWidth = 6;
    ctx.strokeStyle = PLUM;
    ctx.fillStyle = S.skin;
    ctx.fill();
    ctx.stroke();
  }
  // hair: clip to the head and fill above a hairline that shifts back with the view
  const hairCol = S.hairStyle === 'cap' || S.hairStyle === 'beanie' ? S.hat || '#d94f3d' : S.hair;
  if (S.hairStyle !== 'bald') {
    ctx.save();
    headPath();
    ctx.clip();
    ctx.beginPath();
    if (view === 'back') {
      ctx.rect(-hw * 1.2, -hh * 1.2, hw * 2.4, hh * 1.75);
    } else if (view === 'front') {
      ctx.moveTo(-hw * 1.2, hh * 0.05);
      ctx.lineTo(-hw * 0.82, hh * 0.05);
      ctx.quadraticCurveTo(-hw * 0.5, -hh * 0.62, 0, -hh * 0.5);
      ctx.quadraticCurveTo(hw * 0.5, -hh * 0.62, hw * 0.82, hh * 0.05);
      ctx.lineTo(hw * 1.2, hh * 0.05);
      ctx.lineTo(hw * 1.2, -hh * 1.3);
      ctx.lineTo(-hw * 1.2, -hh * 1.3);
    } else {
      // 3/4 and side: hairline slopes down toward the back of the head
      const f = view === 'side' ? 1 : 0.7;
      ctx.moveTo(-hw * 1.2, hh * 0.35);
      ctx.lineTo(-hw * (view === 'side' ? 0.35 : 0.62) * f, hh * 0.35);
      ctx.quadraticCurveTo(-hw * 0.45 * f, -hh * 0.58, hw * 0.2, -hh * 0.64);
      ctx.quadraticCurveTo(hw * 0.8, -hh * 0.58, hw * 1.2, -hh * 0.42);
      ctx.lineTo(hw * 1.2, -hh * 1.3);
      ctx.lineTo(-hw * 1.2, -hh * 1.3);
    }
    ctx.closePath();
    ctx.fillStyle = hairCol;
    ctx.fill();
    ctx.restore();
    headPath();
    ctx.lineWidth = 8;
    ctx.strokeStyle = PLUM;
    ctx.stroke();
    if (S.hairStyle === 'curly') for (let i = -3; i <= 3; i++) ell(ctx, i * 26 - (view === 'front' ? 0 : 20), -hh * 0.9 + Math.abs(i) * 8, 26, 24, S.hair, 6);
    if (S.hairStyle === 'cap' && view !== 'back') {
      ctx.beginPath();
      const d = view === 'front' ? 0 : 1;
      ctx.ellipse(hw * 0.35 * d + 10, -hh * 0.42, hw * (0.75 + 0.35 * d), 16, 0, 0, Math.PI * 2);
      fillInk(ctx, S.hat || '#d94f3d', 6);
    }
  }
  if (view === 'three' || view === 'side') for (const ex of ears) ell(ctx, ex, 16, 12, 19, S.skin, 6);
  if (view === 'back') {
    ctx.restore();
    return;
  }
  // ---- face
  const ey = -4;
  const eyes: [number, number][] = view === 'front' ? [[-34, 1], [34, 1]] : view === 'three' ? [[2, 1], [56, 0.78]] : [[54, 0.85]];
  const lx = (P.look ?? 0.5) * 6;
  const ly = (P.lookY ?? 0) * 7;
  const e = P.expr || 'smile';
  const open = P.blink ? 0.08 : e === 'tired' ? 0.55 : e === 'surprise' ? 1.2 : e === 'sleepy' ? 0.35 : 1;
  for (const [ex, wk] of eyes) {
    ctx.beginPath();
    ctx.ellipse(ex, ey, 14 * wk, 19 * open + 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = PLUM;
    ctx.stroke();
    if (open > 0.2) {
      ctx.beginPath();
      ctx.ellipse(ex + lx * wk + (view === 'front' ? 0 : 3), ey + ly + 2, 7 * wk, 9 * Math.min(1, open + 0.3), 0, 0, Math.PI * 2);
      ctx.fillStyle = PLUM;
      ctx.fill();
    }
    if (e === 'tired') {
      ctx.fillStyle = S.skin;
      ctx.fillRect(ex - 17 * wk, ey - 22, 34 * wk, 13);
      ctx.beginPath();
      ctx.moveTo(ex - 16 * wk, ey - 9);
      ctx.lineTo(ex + 16 * wk, ey - 9);
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }
  // brows: dark, follow the hair colour
  ctx.strokeStyle = S.hairStyle === 'bald' ? PLUM : shade(S.hair.startsWith('#') ? S.hair : '#222222', 0.8);
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  for (const [ex, wk] of eyes) {
    const lift = e === 'surprise' ? -12 : e === 'happy' || e === 'proud' ? -4 : 0;
    const slope = e === 'worry' || e === 'tired' ? 7 : e === 'proud' ? -3 : 0;
    const inner = view === 'front' ? (ex < 0 ? 1 : -1) : -1;
    ctx.beginPath();
    ctx.moveTo(ex - 17 * wk, ey - 34 + lift + (inner < 0 ? slope : -slope) * 0.5);
    ctx.lineTo(ex + 17 * wk, ey - 34 + lift + (inner < 0 ? -slope : slope) * 0.5);
    ctx.stroke();
  }
  // glasses: thick black square frames (the Veloce guy)
  if (S.glasses) {
    ctx.strokeStyle = '#0d0d10';
    ctx.lineWidth = S.hero ? 10 : 6;
    for (const [ex, wk] of eyes) {
      ctx.beginPath();
      if (S.hero) ctx.roundRect(ex - 25 * wk, ey - 21, 50 * wk, 40, 6);
      else ctx.arc(ex, ey, 24 * wk, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    if (view === 'front') {
      ctx.moveTo(-9, ey - 4);
      ctx.lineTo(9, ey - 4);
    } else if (view === 'three') {
      ctx.moveTo(27, ey - 4);
      ctx.lineTo(33, ey - 4);
      ctx.moveTo(eyes[0][0] - 25, ey - 6);
      ctx.lineTo(-hw * 0.7, ey - 2);
    } else {
      ctx.moveTo(eyes[0][0] - 25, ey - 6);
      ctx.lineTo(-hw * 0.1, ey - 2);
    }
    ctx.stroke();
  }
  if (P.loupe) {
    const [ex] = eyes[eyes.length - 1];
    ctx.beginPath();
    ctx.roundRect(ex - 22, ey - 22, 44, 44, 10);
    fillInk(ctx, '#2a2a30', 6);
    ell(ctx, ex, ey, 14, 14, '#9fd3ff', 4);
  }
  // nose + mouth
  const nx = view === 'front' ? 0 : view === 'three' ? 74 : 0;
  if (view !== 'side') {
    ctx.beginPath();
    ctx.ellipse(nx, 22, view === 'three' ? 11 : 9, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120,60,40,.18)';
    ctx.fill();
  }
  const mx = view === 'front' ? 0 : view === 'three' ? 38 : 62;
  const mw = view === 'side' ? 0.55 : view === 'three' ? 0.8 : 1;
  const my = 58;
  const m = P.mouth ?? (e === 'talk' ? 0.6 : 0);
  ctx.strokeStyle = PLUM;
  ctx.lineWidth = 7;
  if (m > 0.05 || e === 'surprise' || e === 'happy') {
    const o = Math.max(m, e === 'surprise' ? 0.8 : e === 'happy' ? 0.5 : 0);
    ctx.beginPath();
    ctx.ellipse(mx, my + 4, (18 + o * 6) * mw, 5 + o * 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#7a1f2b';
    ctx.fill();
    ctx.stroke();
  } else {
    const c = e === 'tired' || e === 'worry' ? -1 : e === 'neutral' ? 0 : 1;
    ctx.beginPath();
    ctx.moveTo(mx - 22 * mw, my);
    ctx.quadraticCurveTo(mx, my + 12 * c, mx + 22 * mw, my - (view === 'front' ? 0 : 4));
    ctx.stroke();
  }
  if (S.stache) {
    ctx.beginPath();
    const sw = mw * 50;
    ctx.moveTo(mx, my - 20);
    ctx.bezierCurveTo(mx - sw * 0.5, my - 30, mx - sw, my - 16, mx - sw * 1.05, my);
    ctx.bezierCurveTo(mx - sw * 0.6, my - 10, mx - sw * 0.2, my - 10, mx, my - 8);
    ctx.bezierCurveTo(mx + sw * 0.2, my - 10, mx + sw * 0.6, my - 10, mx + sw * 1.05, my);
    ctx.bezierCurveTo(mx + sw, my - 16, mx + sw * 0.5, my - 30, mx, my - 20);
    ctx.closePath();
    fillInk(ctx, S.hair, 5);
  }
  ctx.restore();
}

export function drawPerson2(ctx: Ctx, S: Spec, P: Pose2) {
  ctx.clearRect(0, 0, CW, CH);
  const view: View = P.view || 'front';
  const V = VIEW[view];
  const dir = P.dir || 1;
  const sc = S.scale || 1;
  const bw = S.build || 1;
  ctx.save();
  ctx.translate(300, 975);
  ctx.scale(dir * sc, sc);
  const crouch = P.crouch || 0;
  const bob = P.bob || 0;
  const hipY = -330 + crouch - bob;
  const shY = -520 + crouch - bob;
  const w = P.walk || 0;
  const A = P.amp || 0;
  const suit = S.minimal ? '#1d1d24' : null;
  const top = suit || S.shirt;
  const legCol = S.skirt ? S.skin : suit || S.pants;

  // ---- legs
  const legAngles = (i: number): [number, number] => {
    const given = i === 0 ? P.legL : P.legR;
    if (given) return given;
    const ph = w + (i === 0 ? 0 : Math.PI);
    if (view === 'front' || view === 'back') return [Math.sin(ph) * 5 * A + (i ? 3 : -3), -Math.max(0, Math.cos(ph)) * 22 * A + (crouch ? 30 : 0)];
    return [Math.sin(ph) * 32 * A + (crouch ? 20 : 0), -Math.max(0, Math.cos(ph)) * 42 * A - (crouch ? 50 : 0)];
  };
  const drawLeg = (i: number, far: boolean) => {
    const [a1, a2] = legAngles(i);
    const L = 165 - crouch * 0.35;
    const pts = fk([V.hipX[i] * bw, hipY], a1, L, a2, L);
    limb(ctx, pts, 30, far && view !== 'front' ? shade(legCol.startsWith('#') ? legCol : '#333333', 0.78) : legCol);
    if (S.hero) {
      // tall boots
      const k = 0.55;
      limb(ctx, [[pts[1][0] + (pts[2][0] - pts[1][0]) * k, pts[1][1] + (pts[2][1] - pts[1][1]) * k], pts[2]], 36, '#0e0e12');
    }
    const [ax, ay] = pts[2];
    ctx.beginPath();
    if (view === 'front' || view === 'back') ctx.roundRect(ax - 28, ay - 8, 56, 32, 14);
    else ctx.roundRect(ax - 20, ay - 8, 64, 30, 14);
    fillInk(ctx, S.shoes, 7);
  };
  // far leg first
  if (view === 'front' || view === 'back') {
    drawLeg(0, false);
    drawLeg(1, false);
  } else {
    drawLeg(1, true);
    drawLeg(0, false);
  }

  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(rad(P.lean || 0));
  ctx.translate(0, -hipY);

  // ---- arms
  const armCol = top;
  const drawArm = (i: number, far: boolean) => {
    const given = i === 0 ? P.armL : P.armR;
    let a1: number;
    let a2: number;
    if (given) {
      a1 = given[0];
      a2 = given[1];
    } else {
      const ph = w + (i === 0 ? Math.PI : 0);
      if (view === 'front' || view === 'back') {
        a1 = (V.shX[i] < 0 ? -1 : 1) * 8 + Math.sin(ph) * 6 * A;
        a2 = -6;
      } else {
        a1 = Math.sin(ph) * 30 * A;
        a2 = Math.max(0, Math.sin(ph)) * 28 * A + 8;
      }
    }
    const sx = V.shX[i] * bw * (S.hero ? 1.14 : 1);
    const pts = fk([sx, shY + 12], a1, 112, a2, 102);
    const col = far && view !== 'front' && view !== 'back' ? shade(armCol.startsWith('#') ? armCol : '#333333', 0.75) : armCol;
    limb(ctx, pts.slice(0, 2), 24, col);
    const fore = S.sleeves === 'short' ? S.skin : col;
    limb(ctx, pts.slice(1), S.sleeves === 'short' ? 18 : 22, fore);
    ell(ctx, pts[2][0], pts[2][1], 14, 14, S.minimal ? '#121216' : S.skin, 6);
    const hold = i === 0 ? P.holdL : P.holdR;
    if (hold) drawProp(ctx, hold, pts[2], (a1 + a2) * 0 + (hold === 'phone' || hold === 'iphone' || hold === 'iphoneScreen' ? (view === 'side' ? 20 : 0) : 0), dir);
    return pts;
  };
  // far arm behind the body
  const farArm = view === 'front' || view === 'back' ? -1 : 1;
  if (farArm >= 0) drawArm(farArm, true);
  else drawArm(1, false);

  // ---- torso (capsule)
  // heroes get a V-shaped torso: broad shoulders, narrow waist
  const tw = V.tw * bw * (S.hero ? 1.16 : 1);
  const waist = S.hero ? 0.62 : 0.82;
  ctx.beginPath();
  ctx.moveTo(-tw, shY + 8);
  ctx.quadraticCurveTo(-tw, shY - 18, -tw + 30, shY - 18);
  ctx.lineTo(tw - 30, shY - 18);
  ctx.quadraticCurveTo(tw, shY - 18, tw, shY + 8);
  ctx.quadraticCurveTo(tw * (S.hero ? 0.86 : 0.92), hipY - 60, tw * waist, hipY + 16);
  ctx.lineTo(-tw * waist, hipY + 16);
  ctx.quadraticCurveTo(-tw * (S.hero ? 0.86 : 0.92), hipY - 60, -tw, shY + 8);
  ctx.closePath();
  fillInk(ctx, top, 8);
  if (S.hero) {
    // suit seams with a faint sheen, belt with a small yellow buckle, high collar
    ctx.save();
    ctx.strokeStyle = '#3c3c4a';
    ctx.lineWidth = 4;
    for (const sx of view === 'side' ? [0.35] : [-0.62, 0.62]) {
      ctx.beginPath();
      ctx.moveTo(tw * sx, shY - 10);
      ctx.quadraticCurveTo(tw * sx * 0.92, hipY - 80, tw * sx * 0.62, hipY + 6);
      ctx.stroke();
    }
    ctx.fillStyle = '#0e0e12';
    ctx.fillRect(-tw * waist, hipY - 14, tw * waist * 2, 18);
    if (view !== 'back') {
      ctx.fillStyle = YEL;
      ctx.fillRect((view === 'front' ? 0 : view === 'three' ? 10 : tw * 0.45) - 9, hipY - 15, 18, 20);
    }
    ctx.restore();
  }
  if (S.skirt) {
    ctx.beginPath();
    ctx.moveTo(-tw * 0.8, hipY - 6);
    ctx.lineTo(tw * 0.8, hipY - 6);
    ctx.lineTo(tw * 1.05, hipY + 110);
    ctx.lineTo(-tw * 1.05, hipY + 110);
    ctx.closePath();
    fillInk(ctx, S.pants, 7);
  }
  // sheen so black reads as fabric
  if (S.minimal) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-tw, shY - 20, tw * 2, hipY - shY + 40);
    ctx.clip();
    const g = ctx.createLinearGradient(-tw, 0, tw, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.09)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-tw, shY - 20, tw * 2, hipY - shY + 40);
    ctx.restore();
  }
  if (S.apron && view !== 'back') {
    const ax = view === 'front' ? 0 : view === 'three' ? 10 : 18;
    const aw = view === 'front' ? 54 : view === 'three' ? 44 : 26;
    ctx.beginPath();
    ctx.moveTo(ax - aw, shY + 18);
    ctx.lineTo(ax + aw, shY + 18);
    ctx.lineTo(ax + aw * 1.2, hipY + 115);
    ctx.lineTo(ax - aw * 1.2, hipY + 115);
    ctx.closePath();
    fillInk(ctx, S.apron, 7);
  }
  if (S.scarf) {
    ctx.beginPath();
    ctx.roundRect(-tw * 0.6, shY - 30, tw * 1.2, 26, 12);
    fillInk(ctx, S.scarf, 6);
  }
  // logo: front on the chest, back on the shoulders, squeezed in 3/4
  if (S.minimal && P.logo && view !== 'side') {
    const ls = view === 'back' ? 112 : 104;
    ctx.save();
    const lx = view === 'three' ? 14 : 0;
    ctx.translate(lx, shY + 22);
    // the canvas is mirrored when the character faces left: un-mirror so the V always reads the right way
    ctx.scale(dir * (view === 'three' ? 0.8 : 1), 1);
    ctx.drawImage(P.logo, -ls / 2, 0, ls, ls);
    ctx.restore();
  }
  // near arm
  if (farArm >= 0) drawArm(0, false);
  else drawArm(0, false);

  // neck + head
  ctx.beginPath();
  ctx.roundRect(-15 + (view === 'side' ? 6 : 0), shY - 44, 30, 36, 8);
  fillInk(ctx, S.skin, 6);
  ctx.save();
  ctx.translate(view === 'side' ? 10 : view === 'three' ? 6 : 0, shY - 118);
  head(ctx, S, P, view);
  ctx.restore();
  if (P.sweat) {
    ctx.beginPath();
    ctx.ellipse(-60, shY - 190, 9, 15, 0, 0, Math.PI * 2);
    fillInk(ctx, '#9ad7ff', 4);
  }
  ctx.restore();
  ctx.restore();
}

/** a natural "walking while reading the phone" pose for the given view */
export function phoneArms(view: View): Partial<Pose2> {
  if (view === 'side' || view === 'three') return {armL: [24, 96], holdL: 'phone', tilt: 10, lookY: 1, look: 0.6};
  if (view === 'back') return {armL: [-6, -92], holdL: null, armR: [6, 92], tilt: 0};
  return {armR: [-12, -102], holdR: 'phone', tilt: 8, lookY: 1, look: -0.4};
}
