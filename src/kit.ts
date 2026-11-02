import * as THREE from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';

export const W = 1080;
export const H = 1920;
export const YELLOW = '#FFF233';

// ---------- shared ink uniforms (line width stays ~constant in pixels) ----------
export const INK = {uPx: {value: 4.2}, uTan: {value: Math.tan((38 * Math.PI) / 360)}, uH: {value: H}};

export function tex(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

const grad = (() => {
  const d = new Uint8Array([150, 205, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

export function toon(color: THREE.ColorRepresentation | null, map?: THREE.Texture | null, extra: any = {}) {
  const m = new THREE.MeshToonMaterial({gradientMap: grad, ...extra});
  if (color !== null) m.color = new THREE.Color(color);
  if (map) m.map = map;
  return m;
}

export function inkMat(opacity = 1) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: opacity < 1,
    uniforms: {...INK, uOpacity: {value: opacity}, uColor: {value: new THREE.Color('#0b0a0c')}},
    vertexShader: `uniform float uPx; uniform float uTan; uniform float uH;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); float d = max(-mv.z,0.1);
      vec3 n = normalize(normalMatrix*normal); mv.xyz += n * d * uPx * 2.0 * uTan / uH;
      gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uOpacity; uniform vec3 uColor; void main(){ gl_FragColor = vec4(uColor,uOpacity); }`,
  });
  return m;
}

export function smooth(g: THREE.BufferGeometry) {
  let h = g.clone();
  h.deleteAttribute('normal');
  h.deleteAttribute('uv');
  if (h.index) h = h.toNonIndexed();
  h = mergeVertices(h, 1e-4);
  h.computeVertexNormals();
  return h;
}

export interface Fade {
  mats: THREE.Material[];
  inks: THREE.ShaderMaterial[];
  base: number[];
  lines: LineMaterial[];
  hulls: THREE.Mesh[];
}
export const newFade = (): Fade => ({mats: [], inks: [], base: [], lines: [], hulls: []});

/** add a mesh + its inverted-hull ink to a parent. fade collects materials that follow the shop "ghost" opacity */
export function solid(parent: THREE.Object3D, g: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], p: [number, number, number], opts: {fade?: Fade; ink?: boolean; rot?: [number, number, number]; shadow?: boolean; scale?: [number, number, number]} = {}) {
  const mesh = new THREE.Mesh(g, mat);
  mesh.position.set(...p);
  if (opts.rot) mesh.rotation.set(...opts.rot);
  if (opts.scale) mesh.scale.set(...opts.scale);
  mesh.castShadow = opts.shadow !== false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (opts.fade) (Array.isArray(mat) ? mat : [mat]).forEach((m) => opts.fade!.mats.push(m));
  if (opts.ink !== false) {
    const im = inkMat();
    const hull = new THREE.Mesh(smooth(g), im);
    hull.position.copy(mesh.position);
    hull.rotation.copy(mesh.rotation);
    hull.scale.copy(mesh.scale);
    parent.add(hull);
    if (opts.fade) {
      opts.fade.inks.push(im);
      opts.fade.hulls.push(hull);
    }
  }
  if (opts.fade) {
    // faint drawn contours used while the shop is "invisible"
    const lm = new LineMaterial({color: 0x3a2a40, linewidth: 2.6, transparent: true, opacity: 0, depthWrite: false});
    lm.resolution.set(W, H);
    const ln = new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(g, 25)), lm);
    ln.position.copy(mesh.position);
    ln.rotation.copy(mesh.rotation);
    ln.scale.copy(mesh.scale);
    parent.add(ln);
    opts.fade.lines.push(lm);
  }
  return mesh;
}

export function setFade(f: Fade, o: number, inkMin = 0.2) {
  for (const m of f.mats) {
    (m as any).opacity = o;
    m.transparent = o < 0.999;
    m.depthWrite = o > 0.45;
    m.visible = o > 0.005;
  }
  // the inverted hull only works on opaque solids; ghosts get thin contour lines instead
  const hullOn = o > 0.6;
  for (const h of f.hulls) h.visible = hullOn;
  for (const i of f.inks) {
    const v = o < 0.999 ? o : 1;
    i.uniforms.uOpacity.value = v;
    i.transparent = v < 0.999;
  }
  for (const l of f.lines) {
    l.opacity = o < 0.999 ? inkMin * (1 - o) : 0;
    l.visible = l.opacity > 0.01;
  }
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const sm = (t: number) => {
  t = clamp(t);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const ease = (t: number) => sm(t);
export function mix3(a: number[], b: number[], t: number) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
export function rnd(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------- painted textures ----------
export function paintFacade(opts: {w: number; h: number; wall: string; trim: string; shutter: string; floors: number; cols: number; door?: boolean; seed?: number; ground?: boolean}) {
  const pxm = 96;
  const cw = Math.round(opts.w * pxm);
  const ch = Math.round(opts.h * pxm);
  return tex(cw, ch, (g, w, h) => {
    const r = rnd(opts.seed || 1);
    g.fillStyle = opts.wall;
    g.fillRect(0, 0, w, h);
    // plaster mottling
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '90,60,40'},${0.025 + r() * 0.03})`;
      g.beginPath();
      g.ellipse(r() * w, r() * h, 20 + r() * 60, 12 + r() * 40, 0, 0, 7);
      g.fill();
    }
    // plinth + cornice
    g.fillStyle = 'rgba(60,40,30,.22)';
    g.fillRect(0, h - h * 0.07, w, h * 0.07);
    g.fillStyle = opts.trim;
    g.fillRect(0, 0, w, h * 0.045);
    g.fillStyle = 'rgba(40,30,30,.35)';
    g.fillRect(0, h * 0.045, w, 5);
    const fh = h / opts.floors;
    for (let f = 0; f < opts.floors; f++) {
      for (let c = 0; c < opts.cols; c++) {
        const cx = ((c + 0.5) / opts.cols) * w;
        const isDoor = opts.door && f === opts.floors - 1 && c === Math.floor(opts.cols / 2);
        if (isDoor) {
          g.fillStyle = opts.trim;
          g.fillRect(cx - 44, h - fh * 0.82 - 10, 88, fh * 0.82 + 10 - h * 0.02);
          g.fillStyle = '#6e3f2a';
          g.fillRect(cx - 36, h - fh * 0.82, 72, fh * 0.82 - h * 0.02);
          g.fillStyle = '#e9b44c';
          g.beginPath();
          g.arc(cx + 22, h - fh * 0.38, 5, 0, 7);
          g.fill();
          continue;
        }
        const ww = w / opts.cols * 0.36;
        const wh = fh * 0.46;
        const wy = f * fh + fh * 0.2 + (f === 0 ? h * 0.03 : 0);
        // shutters
        g.fillStyle = opts.shutter;
        g.fillRect(cx - ww * 0.5 - ww * 0.42, wy, ww * 0.4, wh);
        g.fillRect(cx + ww * 0.5 + ww * 0.02, wy, ww * 0.4, wh);
        g.strokeStyle = 'rgba(0,0,0,.25)';
        g.lineWidth = 2;
        for (let k = 1; k < 6; k++) {
          const yy = wy + (wh / 6) * k;
          g.beginPath();
          g.moveTo(cx - ww * 0.92, yy);
          g.lineTo(cx - ww * 0.52, yy);
          g.moveTo(cx + ww * 0.52, yy);
          g.lineTo(cx + ww * 0.92, yy);
          g.stroke();
        }
        // window frame + glass
        g.fillStyle = opts.trim;
        g.fillRect(cx - ww / 2 - 7, wy - 7, ww + 14, wh + 14);
        const gl = g.createLinearGradient(0, wy, 0, wy + wh);
        gl.addColorStop(0, '#6aa0cf');
        gl.addColorStop(1, '#3f6e9e');
        g.fillStyle = gl;
        g.fillRect(cx - ww / 2, wy, ww, wh);
        g.fillStyle = 'rgba(255,255,255,.28)';
        g.beginPath();
        g.moveTo(cx - ww / 2, wy + wh * 0.7);
        g.lineTo(cx - ww / 2 + ww * 0.55, wy);
        g.lineTo(cx - ww / 2 + ww * 0.8, wy);
        g.lineTo(cx - ww / 2, wy + wh * 0.95);
        g.fill();
        g.fillStyle = opts.trim;
        g.fillRect(cx - 2.5, wy, 5, wh);
        g.fillRect(cx - ww / 2, wy + wh * 0.5 - 2.5, ww, 5);
        // sill
        g.fillStyle = opts.trim;
        g.fillRect(cx - ww / 2 - 12, wy + wh + 7, ww + 24, 9);
        if (r() > 0.55) {
          g.fillStyle = '#c9703f';
          g.fillRect(cx - ww * 0.4, wy + wh + 16, ww * 0.8, 12);
          for (let k = 0; k < 5; k++) {
            g.fillStyle = ['#4c9c4a', '#e8553d', '#f0b13a'][k % 3];
            g.beginPath();
            g.arc(cx - ww * 0.32 + k * ww * 0.16, wy + wh + 12, 9, 0, 7);
            g.fill();
          }
        }
      }
    }
  });
}

export function paintTiles(color: string, dark: string) {
  return tex(256, 256, (g, w, h) => {
    g.fillStyle = color;
    g.fillRect(0, 0, w, h);
    const rows = 8;
    for (let y = 0; y < rows; y++) {
      for (let x = -1; x < 8; x++) {
        const ox = (y % 2) * 16;
        g.fillStyle = (x + y) % 3 === 0 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.05)';
        g.fillRect(x * 32 + ox, y * 32, 32, 32);
        g.strokeStyle = dark;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x * 32 + ox, y * 32);
        g.lineTo(x * 32 + ox, y * 32 + 32);
        g.stroke();
      }
      g.strokeStyle = dark;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(0, y * 32 + 30);
      g.lineTo(w, y * 32 + 30);
      g.stroke();
    }
  }, [4, 2]);
}
