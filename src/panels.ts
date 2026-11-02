// Canvas2D "content" shown on floating panels: photo, video, animation, carousel, shop, landing pages, chart.
import {drawPerson, lampIcon, YEL, PLUM, CW, CH, Spec} from './toon';
import {OWNER} from './specs';

type G = CanvasRenderingContext2D;
const rr = (g: G, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
};
const ease = (t: number) => {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
};
const bar = (g: G, x: number, y: number, w: number, h: number, c = '#d9d2c4') => {
  rr(g, x, y, w, h, h / 2);
  g.fillStyle = c;
  g.fill();
};

export function photoPanel(g: G, w: number, h: number, t: number) {
  const z = 1 + 0.05 * Math.min(t, 4);
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#ffe3b8');
  bg.addColorStop(1, '#f2a66a');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  // soft bokeh
  for (let i = 0; i < 14; i++) {
    const x = ((i * 137) % 100) / 100 * w;
    const y = ((i * 71) % 100) / 100 * h * 0.7;
    g.fillStyle = `rgba(255,255,255,${0.12 + (i % 3) * 0.05})`;
    g.beginPath();
    g.arc(x, y, 18 + (i % 4) * 14, 0, 7);
    g.fill();
  }
  // table
  g.fillStyle = '#9a5f33';
  g.fillRect(0, h * 0.8, w, h * 0.2);
  g.save();
  g.translate(w / 2, h * 0.84);
  g.scale(z, z);
  const s = (h / 560) * 0.95;
  const gl = g.createRadialGradient(0, -h * 0.28, 10, 0, -h * 0.28, h * 0.5);
  gl.addColorStop(0, 'rgba(255,240,170,.8)');
  gl.addColorStop(1, 'rgba(255,240,170,0)');
  g.fillStyle = gl;
  g.fillRect(-w, -h, w * 2, h * 1.2);
  lampIcon(g, 0, 0, s, true);
  g.restore();
  const v = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(60,20,10,.38)');
  g.fillStyle = v;
  g.fillRect(0, 0, w, h);
}

let _tmp: HTMLCanvasElement | null = null;
export function videoPanel(g: G, w: number, h: number, t: number, logo?: HTMLImageElement) {
  g.fillStyle = '#2f7f8f';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#245f6b';
  g.fillRect(0, h * 0.62, w, h * 0.38);
  // bench items
  g.fillStyle = '#7a4b2a';
  g.fillRect(0, h * 0.78, w, h * 0.22);
  if (!_tmp) {
    _tmp = document.createElement('canvas');
    _tmp.width = CW;
    _tmp.height = CH;
  }
  const tg = _tmp.getContext('2d')!;
  const laugh = Math.sin(t * 9) > 0;
  const spec: Spec = {...OWNER, scale: 1};
  drawPerson(tg, spec, {
    expr: 'happy',
    mouth: laugh ? 0.8 : 0.4,
    tilt: Math.sin(t * 5) * 4,
    armL: [60 + Math.sin(t * 11) * 14, 40],
    armR: [-30, 20],
    holdL: 'tool',
    lean: Math.sin(t * 5) * 2,
  });
  const sc = (w / 600) * 1.5;
  g.save();
  g.translate(w / 2, h * 1.03);
  g.scale(sc, sc);
  g.drawImage(_tmp, -300, -975 - 20);
  g.restore();
  // lamp on bench polished with sparkles
  lampIcon(g, w * 0.78, h * 0.86, h / 1000, true);
  for (let i = 0; i < 4; i++) {
    const a = t * 4 + i * 1.7;
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(w * 0.78 + Math.cos(a) * 60, h * 0.6 + Math.sin(a * 1.3) * 40, 5 + (i % 2) * 3, 0, 7);
    g.fill();
  }
  // video UI cues (no text): rec dot, progress
  g.fillStyle = Math.floor(t * 2) % 2 ? '#e8342a' : '#7a1f1a';
  g.beginPath();
  g.arc(w * 0.1, h * 0.06, 12, 0, 7);
  g.fill();
  bar(g, w * 0.08, h * 0.95, w * 0.84, 8, 'rgba(255,255,255,.35)');
  bar(g, w * 0.08, h * 0.95, w * 0.84 * ((t * 0.25) % 1), 8, '#fff');
}

export function animPanel(g: G, w: number, h: number, t: number) {
  g.fillStyle = '#1d2540';
  g.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * 0.5;
  const on = Math.floor(t * 1.4) % 2 === 0;
  const pulse = 0.5 + 0.5 * Math.sin(t * 6);
  if (on) {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + t * 0.8;
      g.fillStyle = `rgba(255,214,120,${0.18 + pulse * 0.1})`;
      g.beginPath();
      g.moveTo(cx, cy - h * 0.1);
      g.lineTo(cx + Math.cos(a - 0.1) * w, cy - h * 0.1 + Math.sin(a - 0.1) * w);
      g.lineTo(cx + Math.cos(a + 0.1) * w, cy - h * 0.1 + Math.sin(a + 0.1) * w);
      g.fill();
    }
    for (let k = 1; k <= 3; k++) {
      g.strokeStyle = `rgba(255,230,160,${0.6 - k * 0.14})`;
      g.lineWidth = 6;
      g.beginPath();
      g.arc(cx, cy - h * 0.12, ((t * 120 + k * 60) % 220) + 20, 0, 7);
      g.stroke();
    }
  }
  lampIcon(g, cx, h * 0.78, h / 600, on);
  for (let i = 0; i < 9; i++) {
    const a = t * 2 + i * 0.7;
    g.fillStyle = on ? '#ffe9a8' : '#4a5580';
    g.beginPath();
    g.arc(cx + Math.cos(a) * w * 0.38, h * 0.3 + Math.sin(a * 1.4) * h * 0.2, 4 + (i % 3) * 2, 0, 7);
    g.fill();
  }
}

export function carouselPanel(g: G, w: number, h: number, t: number) {
  g.fillStyle = '#f4e7c8';
  g.fillRect(0, 0, w, h);
  const cols = ['#e0674f', '#2f7f8f', '#f0b13a', '#8a62c9'];
  const slide = t * 1.3;
  const k = Math.floor(slide);
  const f = ease((slide % 1) * 1.6);
  const off = (k + f) * (w * 0.62);
  for (let i = -1; i < 8; i++) {
    const x = w * 0.19 + i * w * 0.62 - (off % (w * 0.62 * 4)) + 0;
    for (const wrap of [0, w * 0.62 * 4]) {
      const xx = x + wrap;
      if (xx < -w * 0.6 || xx > w * 1.1) continue;
      rr(g, xx, h * 0.18, w * 0.56, h * 0.58, 22);
      g.fillStyle = cols[((i % 4) + 4) % 4];
      g.fill();
      g.strokeStyle = PLUM;
      g.lineWidth = 6;
      g.stroke();
      g.save();
      g.beginPath();
      rr(g, xx, h * 0.18, w * 0.56, h * 0.58, 22);
      g.clip();
      g.fillStyle = 'rgba(255,255,255,.28)';
      g.beginPath();
      g.arc(xx + w * 0.28, h * 0.42, h * 0.16, 0, 7);
      g.fill();
      lampIcon(g, xx + w * 0.28, h * 0.7, h / 1100, true);
      g.restore();
    }
  }
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i === k % 4 ? '#1f1f26' : 'rgba(0,0,0,.2)';
    g.beginPath();
    g.arc(w / 2 + (i - 1.5) * 34, h * 0.88, 9, 0, 7);
    g.fill();
  }
}

export function shopPanel(g: G, w: number, h: number, t: number, buy: number, cursor: number) {
  g.fillStyle = '#fbf6ea';
  g.fillRect(0, 0, w, h);
  rr(g, w * 0.07, h * 0.05, w * 0.86, h * 0.44, 24);
  const bg = g.createLinearGradient(0, 0, 0, h * 0.5);
  bg.addColorStop(0, '#ffe3b8');
  bg.addColorStop(1, '#f2a66a');
  g.fillStyle = bg;
  g.fill();
  lampIcon(g, w / 2, h * 0.45, h / 860, true);
  bar(g, w * 0.1, h * 0.54, w * 0.55, 18, '#3d3a45');
  bar(g, w * 0.1, h * 0.59, w * 0.8, 12);
  bar(g, w * 0.1, h * 0.625, w * 0.7, 12);
  // price pill
  rr(g, w * 0.1, h * 0.67, w * 0.28, 34, 17);
  g.fillStyle = '#2f7f8f';
  g.fill();
  // stars
  for (let i = 0; i < 5; i++) {
    g.fillStyle = '#f0b13a';
    g.beginPath();
    g.arc(w * 0.5 + i * 28, h * 0.685, 9, 0, 7);
    g.fill();
  }
  // CTA
  rr(g, w * 0.1, h * 0.76, w * 0.8, h * 0.1, 26);
  g.fillStyle = buy > 0.5 ? '#3bb26b' : '#e0674f';
  g.fill();
  g.strokeStyle = PLUM;
  g.lineWidth = 6;
  g.stroke();
  if (buy > 0.5) {
    g.strokeStyle = '#fff';
    g.lineWidth = 14;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(w * 0.4, h * 0.81);
    g.lineTo(w * 0.47, h * 0.84);
    g.lineTo(w * 0.62, h * 0.775);
    g.stroke();
  } else {
    // bag icon
    g.fillStyle = '#fff';
    rr(g, w * 0.44, h * 0.785, w * 0.12, h * 0.05, 8);
    g.fill();
  }
  // thumbnails strip
  for (let i = 0; i < 4; i++) {
    rr(g, w * 0.07 + i * w * 0.22, h * 0.89, w * 0.2, h * 0.08, 12);
    g.fillStyle = ['#ffe3b8', '#cde7ee', '#f6d1c9', '#e4dcf3'][i];
    g.fill();
  }
  // tap ripple
  if (cursor > 0 && cursor < 1) {
    g.strokeStyle = `rgba(255,255,255,${1 - cursor})`;
    g.lineWidth = 10;
    g.beginPath();
    g.arc(w / 2, h * 0.81, 20 + cursor * 90, 0, 7);
    g.stroke();
  }
}

/** landing page layouts A / B (ab: 0..1 morph) */
export function landingPanel(g: G, w: number, h: number, t: number, ab: number) {
  const A = 1 - ab;
  g.fillStyle = ab < 0.5 ? '#fff8ea' : '#2b2f45';
  g.fillRect(0, 0, w, h);
  const dark = ab >= 0.5;
  const ink = dark ? '#f3efe0' : '#3d3a45';
  if (!dark) {
    rr(g, w * 0.06, h * 0.05, w * 0.88, h * 0.4, 22);
    const bg = g.createLinearGradient(0, 0, 0, h * 0.5);
    bg.addColorStop(0, '#ffe3b8');
    bg.addColorStop(1, '#f2a66a');
    g.fillStyle = bg;
    g.fill();
    lampIcon(g, w / 2, h * 0.42, h / 900, true);
    bar(g, w * 0.1, h * 0.5, w * 0.6, 20, ink);
    bar(g, w * 0.1, h * 0.55, w * 0.8, 12);
    for (let i = 0; i < 3; i++) {
      rr(g, w * 0.07 + i * w * 0.3, h * 0.62, w * 0.26, h * 0.12, 14);
      g.fillStyle = ['#ffe3b8', '#cde7ee', '#f6d1c9'][i];
      g.fill();
      lampIcon(g, w * 0.2 + i * w * 0.3, h * 0.72, h / 3000, true);
    }
    rr(g, w * 0.1, h * 0.8, w * 0.8, h * 0.1, 24);
    g.fillStyle = YEL;
    g.fill();
    g.strokeStyle = PLUM;
    g.lineWidth = 6;
    g.stroke();
  } else {
    rr(g, w * 0.06, h * 0.06, w * 0.88, h * 0.5, 22);
    const bg = g.createRadialGradient(w / 2, h * 0.3, 10, w / 2, h * 0.3, w * 0.6);
    bg.addColorStop(0, '#ffcf8a');
    bg.addColorStop(1, '#46304a');
    g.fillStyle = bg;
    g.fill();
    lampIcon(g, w / 2, h * 0.5, h / 780, true);
    bar(g, w * 0.1, h * 0.62, w * 0.5, 20, ink);
    bar(g, w * 0.1, h * 0.67, w * 0.8, 12, '#5a5f7d');
    bar(g, w * 0.1, h * 0.7, w * 0.62, 12, '#5a5f7d');
    rr(g, w * 0.1, h * 0.78, w * 0.8, h * 0.12, 24);
    g.fillStyle = YEL;
    g.fill();
    g.strokeStyle = PLUM;
    g.lineWidth = 6;
    g.stroke();
  }
}

export function chartPanel(g: G, w: number, h: number, t: number, grow: number) {
  g.fillStyle = '#fffaf0';
  rr(g, 0, 0, w, h, 24);
  g.fill();
  g.strokeStyle = PLUM;
  g.lineWidth = 8;
  g.stroke();
  const vals = [0.25, 0.4, 0.33, 0.55, 0.62, 0.85];
  for (let i = 0; i < vals.length; i++) {
    const bh = vals[i] * h * 0.66 * ease(grow * 1.6 - i * 0.18);
    rr(g, w * 0.1 + i * (w * 0.14), h * 0.85 - bh, w * 0.1, bh, 8);
    g.fillStyle = i === vals.length - 1 ? YEL : '#2f7f8f';
    g.fill();
    g.strokeStyle = PLUM;
    g.lineWidth = 5;
    g.stroke();
  }
}
