import * as THREE from 'three';
import {World} from './world';
import {drawPerson, CW, CH, Spec, Pose, YEL, PLUM} from './toon';
import {HERO, OWNER, PEOPLE, DESIGNER, FRIEND} from './specs';
import {solid, toon, inkMat, tex, setFade, sm, lerp, clamp} from './kit';
import * as P from './panels';

export interface Story {
  world: World;
  update(t: number, cam: THREE.PerspectiveCamera, testCam?: number[]): void;
}

// ---------------------------------------------------------------- tracks
export type K = {t: number; lin?: boolean} & Record<string, any>;
export function at(keys: K[], t: number): any {
  if (t <= keys[0].t) return {...keys[0]};
  const n = keys.length - 1;
  if (t >= keys[n].t) return {...keys[n]};
  let i = 0;
  while (keys[i + 1].t < t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const raw = (t - a.t) / (b.t - a.t);
  const u = b.lin ? raw : sm(raw);
  const out: any = {...a};
  for (const k in b) {
    if (k === 't' || k === 'lin') continue;
    const av = a[k];
    const bv = b[k];
    if (typeof av === 'number' && typeof bv === 'number') out[k] = lerp(av, bv, u);
  }
  out.t = t;
  return out;
}
export const gh = (z: number) => (z < 3.59 && z > -1 ? 0.18 : z > 11.4 && z < 14 ? 0.18 : 0);

// ---------------------------------------------------------------- actors
export class Actor {
  static RES = 1;
  facesZ = 0; // -1: the character faces -z (into the shop); shown from behind when the camera is on the other side
  mesh: THREE.Mesh;
  g: CanvasRenderingContext2D;
  map: THREE.CanvasTexture;
  shadow: THREE.Mesh;
  constructor(root: THREE.Object3D, public spec: Spec, public logo: HTMLImageElement | null, public pos: (t: number) => {x: number; y?: number; z: number; rz?: number} | null, public pose: (t: number) => Pose, public H = 2.37, public draw?: (g: CanvasRenderingContext2D, t: number) => void, public light = -1, res = Actor.RES) {
    const c = document.createElement('canvas');
    c.width = CW * res;
    c.height = CH * res;
    this.g = c.getContext('2d')!;
    this.g.scale(res, res);
    this.map = new THREE.CanvasTexture(c);
    this.map.colorSpace = THREE.SRGBColorSpace;
    this.map.generateMipmaps = false;
    this.map.minFilter = THREE.LinearFilter;
    const geo = new THREE.PlaneGeometry(H * 0.6, H);
    geo.translate(0, H / 2 - 0.059 * (H / 2.37), 0);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({map: this.map, transparent: true, alphaTest: 0.35, alphaToCoverage: true, side: THREE.DoubleSide}));
    this.mesh.visible = false;
    root.add(this.mesh);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({color: '#1a1020', transparent: true, opacity: 0.3, depthWrite: false}));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.visible = false;
    root.add(this.shadow);
  }
  update(t: number, cam: THREE.Camera) {
    const p = this.pos(t);
    if (!p) {
      this.mesh.visible = false;
      this.shadow.visible = false;
      return;
    }
    const gy = gh(p.z);
    const air = Math.max(0, p.y || 0);
    this.mesh.visible = true;
    this.mesh.position.set(p.x, gy + air, p.z);
    this.mesh.lookAt(cam.position.x, this.mesh.position.y, cam.position.z);
    this.shadow.visible = true;
    this.shadow.position.set(p.x + 0.1, gy + 0.015, p.z + 0.04);
    this.shadow.scale.set(1 / (1 + air * 0.6), 0.55 / (1 + air * 0.6), 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.3 / (1 + air);
    if (p.rz) this.mesh.rotateZ(p.rz);
    if (this.draw) this.draw(this.g, t);
    else {
      const pose = {...this.pose(t)};
      pose.logo = this.logo;
      if (this.facesZ && (cam.position.z - p.z) * this.facesZ < 0) pose.back = true;
      drawPerson(this.g, this.spec, pose);
    }
    // scene light on the card: warm on the lit side, cool violet in shade, darker toward the ground
    const g = this.g;
    g.save();
    g.globalCompositeOperation = 'source-atop';
    const lx = this.light < 0 ? 0 : CW;
    const gr = g.createLinearGradient(lx, 0, CW - lx, 0);
    gr.addColorStop(0, 'rgba(255,190,110,0.30)');
    gr.addColorStop(0.45, 'rgba(255,190,110,0.0)');
    gr.addColorStop(1, 'rgba(70,40,140,0.34)');
    g.fillStyle = gr;
    g.fillRect(0, 0, CW, CH);
    const gv = g.createLinearGradient(0, 200, 0, CH);
    gv.addColorStop(0, 'rgba(40,20,70,0)');
    gv.addColorStop(1, 'rgba(40,20,70,0.26)');
    g.fillStyle = gv;
    g.fillRect(0, 0, CW, CH);
    g.restore();
    this.map.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- tube (hero trail, frames)
export class Tube {
  mesh: THREE.Mesh;
  hull: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  im: THREE.ShaderMaterial;
  constructor(root: THREE.Object3D, public r: number, color = YEL) {
    this.mat = new THREE.MeshBasicMaterial({color, transparent: true});
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.mat);
    this.im = inkMat(1);
    this.hull = new THREE.Mesh(new THREE.BufferGeometry(), this.im);
    this.mesh.visible = this.hull.visible = false;
    root.add(this.mesh);
    root.add(this.hull);
  }
  set(pts: THREE.Vector3[], opacity = 1, radius = this.r) {
    if (pts.length < 2 || opacity <= 0.01) {
      this.mesh.visible = this.hull.visible = false;
      return;
    }
    const q: THREE.Vector3[] = [pts[0]];
    for (const p of pts) if (p.distanceTo(q[q.length - 1]) > 0.02) q.push(p);
    if (q.length < 2) {
      this.mesh.visible = this.hull.visible = false;
      return;
    }
    this.mesh.geometry.dispose();
    const curve = new THREE.CatmullRomCurve3(q, false, 'catmullrom', 0.1);
    const geo = new THREE.TubeGeometry(curve, Math.min(300, q.length * 3), radius, 8, false);
    this.mesh.geometry = geo;
    this.hull.geometry = geo;
    this.mat.opacity = opacity;
    this.im.uniforms.uOpacity.value = opacity;
    this.im.transparent = opacity < 0.99;
    this.mesh.visible = this.hull.visible = true;
  }
}

/** flat yellow ribbon lying on the ground (the "paths") */
class Ribbon {
  mesh: THREE.Mesh;
  under: THREE.Mesh;
  constructor(root: THREE.Object3D, public pts: THREE.Vector3[], public w = 1.1) {
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({color: YEL, side: THREE.DoubleSide}));
    this.under = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({color: '#0b0a0c', side: THREE.DoubleSide}));
    root.add(this.under);
    root.add(this.mesh);
    this.mesh.visible = this.under.visible = false;
  }
  len() {
    let L = 0;
    for (let i = 1; i < this.pts.length; i++) L += this.pts[i].distanceTo(this.pts[i - 1]);
    return L;
  }
  pointAt(u: number) {
    const L = this.len() * clamp(u);
    let acc = 0;
    for (let i = 1; i < this.pts.length; i++) {
      const d = this.pts[i].distanceTo(this.pts[i - 1]);
      if (acc + d >= L) return this.pts[i - 1].clone().lerp(this.pts[i], d ? (L - acc) / d : 0);
      acc += d;
    }
    return this.pts[this.pts.length - 1].clone();
  }
  set(u: number) {
    if (u <= 0.001) {
      this.mesh.visible = this.under.visible = false;
      return;
    }
    const L = this.len() * clamp(u);
    const poly: THREE.Vector3[] = [this.pts[0].clone()];
    let acc = 0;
    for (let i = 1; i < this.pts.length; i++) {
      const d = this.pts[i].distanceTo(this.pts[i - 1]);
      if (acc + d >= L) {
        poly.push(this.pts[i - 1].clone().lerp(this.pts[i], d ? (L - acc) / d : 0));
        break;
      }
      poly.push(this.pts[i].clone());
      acc += d;
    }
    const build = (w: number, dy: number) => {
      const v: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[Math.max(0, i - 1)];
        const b = poly[Math.min(poly.length - 1, i + 1)];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const l = Math.hypot(dx, dz) || 1;
        const nx = -dz / l;
        const nz = dx / l;
        v.push(poly[i].x + nx * w, poly[i].y + dy, poly[i].z + nz * w, poly[i].x - nx * w, poly[i].y + dy, poly[i].z - nz * w);
        if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      g.setIndex(idx);
      return g;
    };
    this.mesh.geometry.dispose();
    this.under.geometry.dispose();
    this.mesh.geometry = build(this.w / 2, 0.3);
    this.under.geometry = build(this.w / 2 + 0.25, 0.22);
    this.mesh.visible = this.under.visible = true;
  }
}

interface CamKey {
  t: number;
  p: number[] | ((t: number) => number[]);
  l: number[] | ((t: number) => number[]);
  fov?: number;
  roll?: number;
  cut?: boolean;
}

export function createStory(world: World, logo: HTMLImageElement): Story {
  const root = world.root;
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  // timeline anchors (seconds), from voice/cues.json
  const S = {s1: 0.6, s2: 7.245, s3: 17.534, s4: 22.499, s5: 32.493, s6: 39.908, s7: 51.492, s8: 58.674, logo: 61.58, end: 67.3};

  const actors: Actor[] = [];
  const add = (a: Actor) => (actors.push(a), a);

  // ---------------------------------------------------------------- hero
  const FR = [-2.0, 0.25, 2.5, 4.75]; // frame centres
  const FT = [22.3, 23.1, 23.9, 24.7]; // frame start times
  const FD = 0.62;
  const rectPt = (xc: number, u: number): [number, number] => {
    // starts bottom-right, goes left, up, right, down
    const x0 = xc - 0.95;
    const x1 = xc + 0.95;
    const y0 = 0.45;
    const y1 = 2.85;
    const w = x1 - x0;
    const h = y1 - y0;
    let d = clamp(u) * 2 * (w + h);
    if (d < w) return [x1 - d, y0];
    d -= w;
    if (d < h) return [x0, y0 + d];
    d -= h;
    if (d < w) return [x0 + d, y1];
    d -= w;
    return [x1, y1 - d];
  };
  const heroDash = (t: number) => {
    for (let i = 0; i < 4; i++) {
      if (t >= FT[i] && t <= FT[i] + FD) {
        const [x, y] = rectPt(FR[i], (t - FT[i]) / FD);
        return {x, y: Math.max(0, y - 1.0), z: 3.05, u: (t - FT[i]) / FD};
      }
    }
    return null;
  };
  const heroPosKeys: K[] = [
    {t: 0, x: -30, y: 0, z: 5.4},
    {t: 17.3, x: -18, y: 0, z: 5.6},
    {t: 18.1, x: -1.4, y: 0, z: 5.0, lin: true},
    {t: 18.55, x: 1.0, y: 0, z: 3.2},
    {t: 19.1, x: 2.3, y: 0, z: 2.8},
    {t: 21.0, x: 2.3, y: 0, z: 2.8},
    {t: 22.0, x: -0.2, y: 0, z: 3.0},
    {t: 22.3, x: -0.55, y: 0, z: 3.0},
    {t: 25.4, x: 4.4, y: 0, z: 3.1},
    {t: 26.2, x: 0.0, y: 0, z: 3.4},
    {t: 31.5, x: 0.4, y: 0, z: 3.4},
    {t: 32.2, x: -0.6, y: 0, z: 3.2},
    {t: 34.8, x: -0.6, y: 0, z: 3.2},
    {t: 35.6, x: 1.2, y: 0, z: 3.2},
    {t: 39.2, x: 1.2, y: 0, z: 3.2},
    {t: 40.0, x: 2.2, y: 0, z: 3.4},
    {t: 48.0, x: 1.2, y: 0, z: 3.4},
    {t: 50.2, x: 3.6, y: 0, z: 3.2},
    {t: 56.0, x: 3.6, y: 0, z: 3.2},
    {t: 56.6, x: 0.45, y: 0, z: 2.9, lin: true},
    {t: 58.0, x: 0.45, y: 0, z: 2.9},
    {t: 58.7, x: 3.0, y: 0, z: 3.0},
    {t: 59.4, x: 9.6, y: 0, z: 2.8},
    {t: 61.0, x: 9.7, y: 0, z: 2.8},
    {t: 61.8, x: 30, y: 0, z: 2.9, lin: true},
  ];
  const heroPos = (t: number) => {
    const d = heroDash(t);
    if (d) return d;
    if (t < 17.3 || t > 61.9) return null;
    const k = at(heroPosKeys, t);
    return {x: k.x as number, y: k.y as number, z: k.z as number};
  };
  const heroPose = (t: number): Pose => {
    const dash = heroDash(t);
    if ((t > 17.2 && t < 18.5) || dash || (t > 24.6 && t < 26.0) || (t > 56.1 && t < 56.7) || (t > 58.6 && t < 59.5) || (t > 61.0 && t < 62)) {
      return {expr: 'smile', walk: t * 20, amp: 1, lean: dash ? 12 : 22, bob: 14, dir: dash ? (dash.u < 0.5 ? -1 : 1) : 1, armL: [-70, -20], armR: [60, -30]};
    }
    if (t >= 18.5 && t < 19.2) {
      const u = (t - 18.5) / 0.7;
      return {expr: 'proud', lean: -10 + 14 * u, crouch: u < 0.5 ? 70 * Math.sin(u * Math.PI * 2) : 0, walk: u * 6, amp: 0.7, armL: [0, 0], armR: [-20, -10], holdR: u > 0.5 ? 'tool' : null};
    }
    if (t >= 19.2 && t < 19.9) return {expr: 'smile', lean: 3, armL: [95, -5], armR: [-12, -10], holdR: 'tool', look: -0.4};
    if (t >= 19.9 && t < 21.9) {
      const look = t < 20.6 ? -1 : 1;
      const nod = t > 21.0 && t < 21.5 ? Math.sin((t - 21.0) * 20) * 5 : 0;
      return {expr: 'smile', look: look * 0.8, tilt: nod, armL: [8, -10], armR: [-14, -10], holdR: 'tool', lean: 1};
    }
    if (t >= 21.9 && t < 22.3) return {expr: 'proud', lean: 8, armL: [-40, -20], armR: [70, -30], holdR: null};
    if (t >= 25.1 && t < 32.2) return {expr: t > 28 ? 'proud' : 'smile', lean: 2, armL: [30 + Math.sin(t * 2) * 6, -40], armR: [-10, -10], look: 0.4};
    if (t >= 32.2 && t < 35.4) return {expr: 'smile', lean: 2, armL: [50, -30], armR: [-12, -8], look: -0.5};
    if (t >= 35.4 && t < 39.9) return {expr: 'smile', lean: 2, armL: [30, -10], armR: [-12, -8], look: 0.3};
    if (t >= 39.9 && t < 42.3) {
      const s = Math.sin((t - 39.9) * 3);
      return {expr: 'proud', lean: 3, armL: [75 + s * 12, -40], armR: [-70 - s * 12, 40]};
    }
    if (t >= 42.3 && t < 43.2) return {expr: 'smile', lean: 3, armL: [110, -10], armR: [-14, -8]};
    if (t >= 43.2 && t < 50.2) {
      const s = Math.sin((t - 43.2) * 2.2);
      return {expr: 'smile', lean: 4, armL: [80 + s * 14, -20], armR: [-80 - s * 14, 20], look: s * 0.5};
    }
    if (t >= 56.0 && t < 56.6) return {expr: 'smile', holdR: 'tool', armL: [0, 0], armR: [-20, -10]};
    if (t >= 56.6 && t < 58.0) {
      const give = t < 57.1;
      return {expr: 'smile', lean: 4, holdR: give ? 'tool' : null, armL: [20, -10], armR: give ? [-95, -10] : [-14, -8], tilt: t > 57.3 ? Math.sin((t - 57.3) * 16) * 6 : 0};
    }
    if (t >= 59.4 && t < 61.0) return {expr: 'smile', look: 0, lean: 1, armL: [20, -15], armR: [-14, -8]};
    return {expr: 'smile', lean: 1, armL: [8, -10], armR: [-10, -8]};
  };
  add(new Actor(root, HERO, logo, heroPos, heroPose));

  // ---------------------------------------------------------------- owner
  const ownerPosKeys: K[] = [
    {t: 0, x: -0.25, y: 0, z: -0.7},
    {t: 6.9, x: -0.25, y: 0, z: -0.7},
    {t: 7.2, x: -0.7, y: 0, z: 2.6},
    {t: 9.2, x: -0.7, y: 0, z: 2.6},
    {t: 10.4, x: 0.7, y: 0, z: 2.6},
    {t: 11.2, x: 1.9, y: 0, z: 2.7},
    {t: 17.0, x: 1.9, y: 0, z: 2.7},
    {t: 19.0, x: 1.4, y: 0, z: 2.5},
    {t: 21.6, x: 1.4, y: 0, z: 2.5},
    {t: 22.6, x: -3.2, y: 0, z: 2.2},
    {t: 31.0, x: -3.2, y: 0, z: 2.2},
    {t: 32.0, x: -1.0, y: 0, z: 2.7},
    {t: 51.0, x: -1.0, y: 0, z: 2.7},
    {t: 52.0, x: -1.0, y: 0, z: 2.7},
    {t: 57.5, x: -1.0, y: 0, z: 2.7},
    {t: 59.0, x: 2.0, y: 0, z: 2.6},
    {t: 60.0, x: 4.4, y: 0, z: 2.8},
    {t: 62.0, x: 4.4, y: 0, z: 2.8},
  ];
  const ownerPose = (t: number): Pose => {
    if (t < 7.0) {
      const sw = clamp((t - 0.35) / 0.4);
      return {dir: -1, expr: t < 1.1 ? 'neutral' : 'happy', armL: [60 + 40 * sw, -20], armR: [-8, -6], look: -0.7, lean: 2 * sw};
    }
    if (t < 9.0) {
      const raise = clamp((t - 7.4) / 0.6);
      return {dir: -1, expr: t < 8.8 ? 'proud' : 'surprise', armL: [lerp(10, 105, raise), lerp(0, -45, raise)], armR: [lerp(-8, 100, raise), lerp(0, -45, raise)], holdL: 'phone', look: -0.6, lean: -3};
    }
    if (t < 10.4) return {dir: -1, expr: 'surprise', armL: [-40 + Math.sin(t * 40) * 6, -80], armR: [-12, -10], holdL: 'phone', mouth: 0.5};
    if (t < 12.2) return {dir: 1, expr: 'worry', walk: t * 9, amp: 0.8, armL: [-40, -105], armR: [-110 + Math.sin(t * 8) * 10, 10], holdL: 'phone', lean: 4, mouth: 0.4, sweat: t > 11.5};
    if (t < 14.4) {
      const w = Math.sin(t * 7);
      return {dir: 1, expr: 'worry', legR: [-62 + w * 6, -5], legL: [2, 0], armL: [-55, -100], armR: [-95 + w * 12, -30], holdL: 'phone', lean: -6, mouth: 0.3, sweat: true};
    }
    if (t < 17.5) {
      const blink = Math.floor(t * 1.2) % 3 === 2 && (t * 1.2) % 1 < 0.15;
      return {dir: 1, expr: 'tired', legR: [-62, -5], legL: [2, 0], armL: [-14, -10], armR: [-95, -30], lean: -4, sweat: true, blink, look: 0.2};
    }
    if (t < 19.0) return {dir: 1, expr: 'surprise', armL: [-24, -14], armR: [-30, -10], lean: -4, tilt: -3, look: 0.6};
    if (t < 22.6) return {dir: 1, expr: t < 20.2 ? 'surprise' : 'happy', armL: [30, -100 - 20 * Math.sin(t * 6)], armR: [-10, -8], look: 0.7};
    if (t < 31.5) return {dir: 1, expr: t > 27 ? 'happy' : 'smile', armL: [20, -20], armR: [-12, -8], look: -0.6, tilt: Math.sin(t * 2) * 3};
    if (t < 51.0) return {dir: 1, expr: 'smile', armL: [12, -20], armR: [-12, -8], holdL: 'tool', look: -0.2};
    if (t < 58.2) return {dir: -1, expr: t < 56.6 ? 'smile' : 'happy', armL: [55 + Math.sin(t * 3) * 10, -35], armR: [-10, -8], holdL: t > 57.2 ? 'tool' : null, look: -0.6, lean: 3};
    return {dir: 1, expr: t < 60.8 ? 'talk' : 'smile', mouth: 0.4 + 0.4 * Math.sin(t * 14), armL: [10, -10], armR: [-130 + Math.sin(t * 9) * 12, -20], look: 0.8, lean: 2};
  };
  add(new Actor(root, OWNER, logo, (t) => (t < 62.5 ? at(ownerPosKeys, t) : null), ownerPose));

  // ---------------------------------------------------------------- passers-by
  const walker = (si: number, x0: number, z: number, speed: number, t0: number, t1: number, dir: 1 | -1, hold: Pose['holdL'] = null) =>
    add(
      new Actor(
        root,
        PEOPLE[si % PEOPLE.length],
        logo,
        (t) => (t >= t0 && t <= t1 ? {x: x0 + dir * speed * (t - t0), z} : null),
        (t) => ({dir, walk: (t - t0) * speed * 3.4 + si, amp: 1, bob: 6, lean: 3, expr: 'neutral', holdL: hold, armL: hold === 'phone' ? [30, -95] : undefined, look: 0}),
      ),
    );
  walker(0, -9, 1.6, 1.35, 1.0, 17.5, 1, 'phone');
  walker(1, 9, 1.3, 1.2, 2.2, 14.0, -1);
  walker(2, -12, 1.2, 1.5, 3.0, 12, 1);
  walker(3, 11, 1.5, 1.4, 4.6, 16, -1, 'phone');
  walker(5, -6, 1.4, 1.1, 8.0, 17, 1);
  walker(6, 12, 1.1, 1.25, 2.0, 12, -1);
  walker(4, 10, 1.5, 1.2, 17.6, 31, -1);
  // the scroller who stops to look at the content
  add(
    new Actor(
      root,
      PEOPLE[1],
      logo,
      (t) => {
        if (t < 25.0 || t > 31.8) return null;
        const x = t < 28.9 ? lerp(-8, 0.7, (t - 25.0) / 3.9) : t < 30.4 ? 0.7 : 0.7 + (t - 30.4) * 1.2;
        return {x, z: 4.6};
      },
      (t) => {
        const moving = t < 28.9 || t > 30.4;
        const flick = t < 28.9 ? Math.sin(t * 9) * 8 : 0;
        return {dir: 1, walk: moving ? t * 5 : 0, amp: moving ? 1 : 0, bob: moving ? 6 : 0, holdL: 'phone', armL: [32 + flick, -95], expr: t > 29.0 ? 'happy' : 'neutral', look: t > 28.9 ? -0.5 : 0, lean: moving ? 3 : -2};
      },
    ),
  );
  // people decorating homes: some notice the signal, some keep walking
  const decorator = (si: number, x0: number, z: number, hold: Pose['holdL'], tStart: number, stopAt: number, notice: boolean) => {
    const a = add(
      new Actor(
        root,
        PEOPLE[si],
        logo,
        (t) => {
          if (t < tStart || t > 51.4) return null;
          if (notice && t > stopAt) {
            const u = clamp((t - stopAt - 0.5) / 2.2);
            return {x: lerp(x0 + (stopAt - tStart), 0.1 + (si - 2) * 0.7, sm(u)), z: lerp(z, 3.5, sm(u))};
          }
          return {x: x0 + (t - tStart), z};
        },
        (t) => {
          const stopped = notice && t > stopAt && t < stopAt + 0.5;
          const arrived = notice && t >= stopAt + 2.7;
          const moving = !stopped && !arrived;
          return {dir: 1, walk: moving ? t * 5 : 0, amp: moving ? 1 : 0, bob: moving ? 6 : 0, holdR: hold, armR: hold ? [-35, -60] : undefined, expr: notice && t > stopAt ? (stopped ? 'surprise' : 'happy') : 'neutral', look: notice && t > stopAt ? -0.6 : 0.2, lean: 2};
        },
      ),
    );
    return a;
  };
  decorator(0, -9.5, 5.6, 'brush', 40.5, 44.2, true);
  decorator(2, -12, 6.0, 'cushion', 40.5, 45.2, true);
  decorator(3, -8, 10.0, 'paint', 40.5, 46, false);
  decorator(5, -13, 5.2, 'plant', 41.5, 46.3, true);
  // S7: customers
  add(
    new Actor(
      root,
      PEOPLE[4],
      logo,
      (t) => {
        if (t < 51.8 || t > 55.2) return null;
        if (t < 53.2) return {x: lerp(8, 2.6, (t - 51.8) / 1.4), z: 3.0};
        return {x: 2.6, z: lerp(3.0, -1.2, sm((t - 53.2) / 1.5))};
      },
      (t) => ({dir: t < 53.2 ? -1 : 1, walk: t * 5, amp: t < 54.7 ? 1 : 0.5, bob: 6, expr: 'happy', look: -0.5}),
    ),
  );
  add(new Actor(root, FRIEND, logo, (t) => (t > 51.6 && t < 62 ? {x: -3.1, z: 3.0} : null), (t) => ({dir: 1, expr: t > 54 ? 'happy' : 'neutral', look: -0.5, mouth: Math.max(0, Math.sin(t * 9)) * 0.5, armR: [-40, -30], lean: 2})));
  add(new Actor(root, PEOPLE[2], logo, (t) => (t > 51.6 && t < 62 ? {x: -3.8, z: 3.3} : null), (t) => ({dir: -1, expr: 'happy', holdL: 'phone', armL: [-95 - Math.sin(t * 3) * 5, -15], look: 0.6, mouth: Math.max(0, Math.sin(t * 8)) * 0.5, lean: 2})));
  add(
    new Actor(
      root,
      DESIGNER,
      logo,
      (t) => (t < 52.4 || t > 58.3 ? null : {x: t < 56.4 ? lerp(8, 1.4, clamp((t - 52.4) / 2.6)) : lerp(1.4, 8, clamp((t - 56.4) / 2)), z: 3.2}),
      (t) => {
        const arrived = t > 55.0 && t < 56.4;
        return {dir: t < 56.4 ? -1 : 1, walk: arrived ? 0 : t * 5, amp: arrived ? 0 : 1, bob: arrived ? 0 : 6, holdR: 'folder', armR: arrived ? [-70, -30] : [-12, -50], expr: 'proud', look: 0.6, lean: 2};
      },
    ),
  );
  walker(1, 14, 3.0, 1.2, 58.5, 67, -1);
  walker(6, -10, 2.4, 1.3, 58.4, 67, 1);
  walker(5, -7, 2.0, 1.2, 59.0, 67, 1);

  // ---------------------------------------------------------------- props
  const stool = new THREE.Group();
  solid(stool, new THREE.CylinderGeometry(0.34, 0.3, 0.07, 18), toon('#a8703c'), [0, 0.6, 0]);
  for (const [lx, lz] of [[0.2, 0.2], [-0.2, 0.2], [0.2, -0.2], [-0.2, -0.2]]) solid(stool, new THREE.CylinderGeometry(0.035, 0.03, 0.6, 8), toon('#8a5a34'), [lx, 0.3, lz]);
  stool.position.set(-2.0, 0.18, 2.4);
  stool.visible = false;
  root.add(stool);
  const tripod = new THREE.Group();
  for (const a of [0, 2.1, 4.2]) solid(tripod, new THREE.CylinderGeometry(0.014, 0.014, 1.1, 6), toon('#2d3142'), [Math.cos(a) * 0.16, 0.55, Math.sin(a) * 0.16], {rot: [Math.sin(a) * -0.2, 0, Math.cos(a) * 0.2]});
  solid(tripod, new THREE.BoxGeometry(0.2, 0.34, 0.03), toon('#2d3142'), [0, 1.3, 0]);
  tripod.position.set(0.5, 0.18, 2.9);
  tripod.visible = false;
  root.add(tripod);
  const tool = new THREE.Group();
  solid(tool, new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), toon('#e0833a'), [0, 0, 0], {rot: [0, 0, Math.PI / 2]});
  solid(tool, new THREE.CylinderGeometry(0.01, 0.01, 0.16, 6), toon('#c9cdd4'), [0.19, 0, 0], {rot: [0, 0, Math.PI / 2]});
  tool.visible = false;
  root.add(tool);

  const clockCanvas = document.createElement('canvas');
  clockCanvas.width = clockCanvas.height = 512;
  const clockMap = new THREE.CanvasTexture(clockCanvas);
  clockMap.colorSpace = THREE.SRGBColorSpace;
  const clock = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), new THREE.MeshBasicMaterial({map: clockMap, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide}));
  clock.position.set(1.4, 3.3, 0.6);
  clock.visible = false;
  root.add(clock);
  const drawClock = (hand: number) => {
    const g = clockCanvas.getContext('2d')!;
    g.clearRect(0, 0, 512, 512);
    g.fillStyle = PLUM;
    g.beginPath();
    g.arc(256, 256, 250, 0, 7);
    g.fill();
    g.fillStyle = '#f7f1df';
    g.beginPath();
    g.arc(256, 256, 232, 0, 7);
    g.fill();
    g.strokeStyle = PLUM;
    g.lineWidth = 12;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.beginPath();
      g.moveTo(256 + Math.sin(a) * 196, 256 - Math.cos(a) * 196);
      g.lineTo(256 + Math.sin(a) * 222, 256 - Math.cos(a) * 222);
      g.stroke();
    }
    g.lineCap = 'round';
    g.lineWidth = 18;
    g.beginPath();
    g.moveTo(256, 256);
    g.lineTo(256 + Math.sin(0.4) * 100, 256 - Math.cos(0.4) * 100);
    g.stroke();
    g.strokeStyle = '#e8342a';
    g.lineWidth = 14;
    g.beginPath();
    g.moveTo(256, 256);
    g.lineTo(256 + Math.sin(hand) * 205, 256 - Math.cos(hand) * 205);
    g.stroke();
    g.fillStyle = PLUM;
    g.beginPath();
    g.arc(256, 256, 20, 0, 7);
    g.fill();
    clockMap.needsUpdate = true;
  };

  // content frames / panels
  class Frame {
    tube: Tube;
    panel: THREE.Mesh;
    cv = document.createElement('canvas');
    g: CanvasRenderingContext2D;
    map: THREE.CanvasTexture;
    constructor(public xc: number, cw: number, ch: number, pw: number, ph: number) {
      this.cv.width = cw;
      this.cv.height = ch;
      this.g = this.cv.getContext('2d')!;
      this.map = new THREE.CanvasTexture(this.cv);
      this.map.colorSpace = THREE.SRGBColorSpace;
      this.panel = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({map: this.map, transparent: true, side: THREE.DoubleSide}));
      this.panel.position.set(xc, 1.65, 2.9);
      this.panel.visible = false;
      root.add(this.panel);
      this.tube = new Tube(root, 0.055);
    }
  }
  const frames = FR.map((x) => new Frame(x, 340, 440, 1.8, 2.34));
  const ecom = new Frame(FR[0], 340, 600, 1.5, 2.65);
  const landing = new Frame(0.4, 380, 480, 2.4, 3.0);
  const chart = new Frame(3.4, 300, 240, 1.5, 1.2);

  const trail = new Tube(root, 0.1);

  const parcel = new THREE.Group();
  solid(parcel, new THREE.BoxGeometry(0.7, 0.5, 0.55), toon('#c79a62'), [0, 0.25, 0]);
  solid(parcel, new THREE.BoxGeometry(0.1, 0.505, 0.555), toon('#e9d7a8'), [0, 0.25, 0], {ink: false});
  const lid = new THREE.Group();
  lid.position.set(0, 0.5, -0.28);
  solid(lid, new THREE.BoxGeometry(0.7, 0.03, 0.55), toon('#b98a52'), [0, 0, 0.275]);
  parcel.add(lid);
  parcel.visible = false;
  root.add(parcel);
  const smallParcels: THREE.Group[] = [];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Group();
    solid(m, new THREE.BoxGeometry(2.2, 1.6, 1.8), toon('#c79a62'), [0, 0.8, 0]);
    solid(m, new THREE.BoxGeometry(0.4, 1.62, 1.82), toon('#e9d7a8'), [0, 0.8, 0], {ink: false});
    m.visible = false;
    root.add(m);
    smallParcels.push(m);
  }
  const pathA = new Ribbon(root, [V(-2, 0.3, 6.2), V(-5, 7, -4), V(-14, 15, -18), V(-30, 17, -32), V(-42, 12, -42), V(-48, 8, -46)], 2.4);
  const pathB = new Ribbon(root, [V(-2, 0.3, 6.2), V(3, 9, -8), V(8, 19, -40), V(12, 21, -78), V(10, 14, -100), V(8, 9, -112)], 2.4);
  const bag = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshBasicMaterial({
      map: tex(128, 128, (g) => {
        g.fillStyle = PLUM;
        g.beginPath();
        g.roundRect(24, 44, 80, 76, 10);
        g.fill();
        g.fillStyle = '#e8553d';
        g.beginPath();
        g.roundRect(30, 50, 68, 64, 8);
        g.fill();
        g.strokeStyle = PLUM;
        g.lineWidth = 8;
        g.beginPath();
        g.arc(64, 44, 20, Math.PI, 0);
        g.stroke();
      }),
      transparent: true,
      side: THREE.DoubleSide,
    }),
  );
  bag.position.set(8, 44, -112);
  bag.visible = false;
  root.add(bag);

  const signalMat = new THREE.MeshBasicMaterial({color: YEL});
  const signals: THREE.Group[] = [];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 4), signalMat));
    g.add(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 4), inkMat()));
    g.visible = false;
    root.add(g);
    signals.push(g);
  }
  const rings = [0, 1, 2].map((i) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(1.2 + i * 1.1, 1.45 + i * 1.1, 48), new THREE.MeshBasicMaterial({color: YEL, transparent: true, side: THREE.DoubleSide}));
    m.rotation.x = -Math.PI / 2;
    m.visible = false;
    root.add(m);
    return m;
  });
  const footprints = new Ribbon(root, [V(-6.5, 0, 6.6), V(-5.2, 0, 4.3), V(-4.0, 0, 6.3), V(-3.4, 0, 4.2)], 0.9);
  const fpStraight = new Ribbon(root, [V(-6.5, 0, 6.6), V(-3.0, 0, 4.0), V(-1.6, 0, 3.5)], 0.9);
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshBasicMaterial({color: '#fff6c8', transparent: true, opacity: 0, depthWrite: false}));
  flash.position.set(0, 3, 9);
  root.add(flash);
  const hand = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.9),
    new THREE.MeshBasicMaterial({
      map: tex(256, 256, (g) => {
        g.fillStyle = '#f2c9a0';
        g.strokeStyle = PLUM;
        g.lineWidth = 9;
        g.lineJoin = 'round';
        for (const [x, y, w, h, r] of [[108, 30, 40, 120, 20], [70, 110, 116, 120, 34], [70, 110, 38, 70, 18], [150, 118, 34, 60, 17]]) {
          g.beginPath();
          g.roundRect(x, y, w, h, r);
          g.fill();
          g.stroke();
        }
      }),
      transparent: true,
      side: THREE.DoubleSide,
    }),
  );
  hand.visible = false;
  root.add(hand);

  const fx = ((window as any).__fx = {wipe: 0, logo: 0});

  // ---------------------------------------------------------------- cameras
  const heroP = (t: number) => {
    const p = heroPos(t);
    return p ? [p.x, 1.25 + (p.y || 0), p.z] : [0, 1.3, 3];
  };
  const CAMS: CamKey[] = [
    {t: 0.0, p: [-0.15, 1.78, 1.2], l: [-0.8, 1.7, -1.0], fov: 36},
    {t: 1.5, p: [-0.12, 1.78, 1.28], l: [-0.8, 1.7, -1.0], fov: 36},
    {t: 6.9, p: [0.3, 2.2, 12.4], l: [0.0, 2.6, 0.0], fov: 57},
    {t: 7.245, p: [-5.2, 1.5, 7.4], l: [-1.6, 1.35, 2.2], fov: 42, cut: true},
    {t: 9.6, p: [-1.4, 1.5, 7.2], l: [0.3, 1.35, 2.4], fov: 42},
    {t: 12.3, p: [1.3, 1.55, 6.8], l: [2.2, 1.6, 2.2], fov: 41},
    {t: 14.7, p: [1.6, 1.6, 6.5], l: [1.8, 2.2, 1.8], fov: 44},
    {t: 17.45, p: [1.9, 1.6, 4.0], l: [1.9, 1.55, 2.5], fov: 28},
    {t: 17.534, p: [-9.5, 1.3, 8.0], l: [-5, 1.4, 4.5], fov: 44, cut: true},
    {t: 18.15, p: [-3.0, 1.4, 8.4], l: (t) => heroP(t), fov: 40},
    {t: 19.0, p: [1.5, 1.5, 7.2], l: [1.6, 1.4, 2.7], fov: 40},
    {t: 19.4, p: [1.9, 1.5, 6.6], l: [1.85, 1.35, 2.7], fov: 37},
    {t: 21.8, p: [1.9, 1.5, 6.2], l: [1.85, 1.4, 2.7], fov: 36},
    {t: 22.4, p: [-0.4, 1.7, 8.8], l: [-1.4, 1.5, 2.8], fov: 42, cut: true},
    {t: 25.4, p: [2.0, 1.8, 7.8], l: [2.2, 1.7, 2.9], fov: 44},
    {t: 26.0, p: [-2.0, 1.7, 7.4], l: [-2.0, 1.65, 2.9], fov: 36, cut: true},
    {t: 27.4, p: [-2.0, 1.7, 6.6], l: [-2.0, 1.65, 2.9], fov: 36},
    {t: 27.6, p: [4.75, 1.7, 7.4], l: [4.75, 1.65, 2.9], fov: 36, cut: true},
    {t: 28.9, p: [4.75, 1.7, 6.6], l: [4.75, 1.65, 2.9], fov: 36},
    {t: 29.0, p: [0.9, 1.7, 8.4], l: [0.6, 1.5, 3.4], fov: 44, cut: true},
    {t: 32.3, p: [0.6, 1.7, 7.6], l: [0.5, 1.6, 3.2], fov: 44},
    {t: 32.493, p: [-2.4, 1.7, 9.2], l: [-2.0, 1.7, 2.9], fov: 40, cut: true},
    {t: 35.2, p: [-2.3, 1.7, 8.3], l: [-2.0, 1.7, 2.9], fov: 40},
    {t: 35.5, p: [-6, 3.5, 15], l: [-2, 3, 3], fov: 46, cut: true},
    {t: 39.9, p: [-3, 52, 52], l: [-1, 8, -42], fov: 54},
    {t: 39.908, p: [0.6, 2.0, 12.0], l: [0.8, 1.9, 3.2], fov: 44, cut: true},
    {t: 42.2, p: [0.8, 2.0, 11.2], l: [0.8, 1.9, 3.2], fov: 44},
    {t: 42.5, p: [-6.5, 2.2, 11.5], l: [-5.5, 1.2, 5.5], fov: 46, cut: true},
    {t: 46.0, p: [-4.4, 2.0, 10.6], l: [-3.8, 1.2, 4.6], fov: 46},
    {t: 46.1, p: [1.0, 2.1, 11.8], l: [1.0, 2.2, 3.2], fov: 46, cut: true},
    {t: 51.4, p: [0.8, 2.0, 10.4], l: [1.0, 2.1, 3.2], fov: 46},
    {t: 51.492, p: [-0.5, 2.0, 13.0], l: [-0.5, 1.8, 2.0], fov: 58, cut: true},
    {t: 56.4, p: [-0.5, 2.0, 11.6], l: [-0.5, 1.7, 2.2], fov: 56},
    {t: 56.45, p: [-0.3, 1.6, 8.8], l: [-0.3, 1.5, 2.6], fov: 46, cut: true},
    {t: 58.5, p: [-0.3, 1.6, 8.2], l: [-0.3, 1.5, 2.6], fov: 46},
    {t: 58.674, p: [1.5, 1.7, 9.4], l: [3.2, 1.6, 2.4], fov: 44, cut: true},
    {t: 59.4, p: [6.0, 1.6, 8.0], l: [9.4, 1.5, 2.8], fov: 42},
    {t: 59.9, p: [8.6, 1.55, 5.6], l: [9.6, 1.55, 2.8], fov: 30, cut: true},
    {t: 61.3, p: [8.8, 1.55, 5.1], l: [9.6, 1.55, 2.8], fov: 30},
    {t: 62.0, p: [8.8, 1.55, 5.1], l: [9.6, 1.55, 2.8], fov: 30},
  ];
  const val = (v: number[] | ((t: number) => number[]), t: number) => (typeof v === 'function' ? v(t) : v);
  function camAt(t: number) {
    let i = 0;
    while (i < CAMS.length - 1 && CAMS[i + 1].t <= t) i++;
    const a = CAMS[i];
    const b = CAMS[i + 1];
    let p: number[];
    let l: number[];
    let fov = a.fov || 40;
    let roll = a.roll || 0;
    if (!b || b.cut) {
      p = val(a.p, t).slice();
      l = val(a.l, t).slice();
      const k = Math.min(0.0035 * (t - a.t), 0.04);
      for (let j = 0; j < 3; j++) p[j] += (l[j] - p[j]) * k;
    } else {
      const u = sm((t - a.t) / (b.t - a.t));
      const pa = val(a.p, t);
      const pb = val(b.p, t);
      const la = val(a.l, t);
      const lb = val(b.l, t);
      p = pa.map((x, j) => lerp(x, pb[j], u));
      l = la.map((x, j) => lerp(x, lb[j], u));
      fov = lerp(a.fov || 40, b.fov || 40, u);
      roll = lerp(a.roll || 0, b.roll || 0, u);
    }
    return {p, l, fov, roll};
  }

  const visKeys: K[] = [
    {t: 0, v: 0.1},
    {t: 22.3, v: 0.1},
    {t: 23.2, v: 0.28},
    {t: 24.0, v: 0.42},
    {t: 24.8, v: 0.58},
    {t: 25.6, v: 0.8},
    {t: 31.0, v: 0.85},
    {t: 51.4, v: 0.88},
    {t: 51.9, v: 1},
  ];

  const tmp: THREE.Vector3[] = [];
  return {
    world,
    update(t, cam, testCam) {
      if (testCam) {
        cam.position.set(testCam[0], testCam[1], testCam[2]);
        cam.lookAt(testCam[3], testCam[4], testCam[5]);
        cam.fov = testCam[6];
      } else {
        const c = camAt(t);
        cam.position.set(c.p[0], c.p[1], c.p[2]);
        cam.lookAt(c.l[0], c.l[1], c.l[2]);
        if (c.roll) cam.rotateZ((c.roll * Math.PI) / 180);
        cam.fov = c.fov;
      }
      cam.updateProjectionMatrix();

      setFade(world.shop, at(visKeys, t).v, 0.22);
      setFade(world.ghost2, 0.1, 0.2);

      // lamp: inside until S2, then on the stool outside
      const lampIn = t < 7.2;
      const lampOn = t > 0.95 ? 1 : 0;
      if (lampIn) world.lamp.position.set(-1.0, 0.86, -1.0);
      else world.lamp.position.set(-2.0, 0.18 + 0.64, 2.4);
      world.lampShade.emissive.set('#ffb457');
      world.lampShade.emissiveIntensity = lampOn * 0.25;
      world.lampLight.intensity = lampOn * 1.6;
      (world.lampGlow.material as THREE.SpriteMaterial).opacity = lampOn * (t < 1.4 ? sm((t - 0.95) / 0.45) * 0.9 : 0.85);
      stool.visible = !lampIn;
      for (const p of world.pendants) p.emissiveIntensity = lampOn ? 0.9 : 0.15;

      // ---- S2 props
      tripod.visible = t > 7.2 && t < 17.8;
      let lean = 0;
      if (t < 9.6) lean = 0;
      else if (t < 12.4) lean = lerp(0, 0.34, sm((t - 9.6) / 2.4)) + 0.03 * Math.sin(t * 9) * sm((t - 10) / 1);
      else if (t < 17.9) lean = 0.34 + 0.02 * Math.sin(t * 5);
      else if (t < 18.9) lean = lerp(0.34, 0.72, sm((t - 17.9) / 0.9));
      else if (t < 19.12) lean = lerp(0.72, 0.0, sm((t - 18.9) / 0.2));
      world.boxes.rotation.z = -lean;
      world.boxes.position.set(3.0, 0.18, 2.4);
      tool.visible = t > 10.3 && t < 18.8;
      if (tool.visible) {
        const fall = clamp((t - 10.3) / 0.35);
        tool.position.set(1.0, 0.18 + lerp(1.1, 0.05, fall * fall), 2.9);
        tool.rotation.z = fall * 1.2;
      }
      clock.visible = t > 11.7 && t < 16.4;
      if (clock.visible) {
        const pop = sm((t - 11.7) / 0.35) * (1 - sm((t - 15.9) / 0.5));
        clock.scale.setScalar(Math.max(0.001, pop));
        const hand = t < 14.5 ? ((t - 11.9) / 2.6) * Math.PI * 2 : Math.PI * 2;
        drawClock(Math.max(0, hand));
        clock.lookAt(cam.position.x, clock.position.y, cam.position.z);
      }

      // ---- hero trail
      tmp.length = 0;
      if (t > 17.35 && t < 19.2) {
        for (let s = 0; s <= 0.55; s += 0.03) {
          const p = heroPos(t - s);
          if (p) tmp.push(V(p.x, 1.15 + 0.1 * Math.sin(s * 14), p.z));
        }
        trail.set(tmp, 1 - sm((t - 18.7) / 0.5), 0.07);
      } else if ((t > 24.6 && t < 26.0) || (t > 56.1 && t < 56.8) || (t > 58.6 && t < 59.5)) {
        for (let s = 0; s <= 0.5; s += 0.03) {
          const p = heroPos(t - s);
          if (p) tmp.push(V(p.x, 1.15 + 0.1 * Math.sin(s * 12), p.z));
        }
        trail.set(tmp, 1, 0.09);
      } else if (t > 61.0 && t < 62.4) {
        for (let s = 0; s <= 1.2; s += 0.04) {
          const p = heroPos(Math.min(t, 61.85) - s);
          if (p) tmp.push(V(p.x, 1.25 + 0.12 * Math.sin(s * 9), p.z));
        }
        trail.set(tmp, 1, 0.12);
      } else trail.set([]);

      // ---- S4 frames
      for (let i = 0; i < 4; i++) {
        const f = frames[i];
        const xc = FR[i];
        const prog = clamp((t - FT[i]) / FD);
        const pts: THREE.Vector3[] = [];
        if (t >= FT[i] && !(i === 0 && t >= S.s5) && !(i > 0 && t > S.s5 + 0.2)) {
          const N = 60;
          for (let k = 0; k <= N * prog; k++) {
            const [x, y] = rectPt(xc, k / N);
            pts.push(V(x, y, 2.9));
          }
        }
        f.tube.set(pts, 1);
        const showAt = FT[i] + FD + 0.12;
        const showing = t > showAt && !(i === 0 && t >= S.s5) && !(i > 0 && t > S.s5 + 0.2);
        f.panel.visible = showing;
        if (showing) {
          const lt = t - showAt;
          const pop = sm(lt / 0.25);
          f.panel.scale.setScalar(0.85 + 0.15 * pop);
          (f.panel.material as THREE.MeshBasicMaterial).opacity = pop;
          const g = f.g;
          g.clearRect(0, 0, f.cv.width, f.cv.height);
          if (i === 0) P.photoPanel(g, f.cv.width, f.cv.height, lt);
          else if (i === 1) P.videoPanel(g, f.cv.width, f.cv.height, lt);
          else if (i === 2) P.animPanel(g, f.cv.width, f.cv.height, lt);
          else P.carouselPanel(g, f.cv.width, f.cv.height, lt);
          f.map.needsUpdate = true;
        }
      }

      // ---- S5: frame 0 becomes the vertical shop, tap, parcel, crane, paths
      {
        const t0 = S.s5;
        const on = t >= t0 && t < 35.6;
        if (on) {
          const m = sm((t - t0) / 0.6);
          const w = lerp(0.95, 0.78, m);
          const y0 = lerp(0.45, 0.25, m);
          const y1 = lerp(2.85, 3.4, m);
          const c = [V(FR[0] + w, y0, 2.9), V(FR[0] - w, y0, 2.9), V(FR[0] - w, y1, 2.9), V(FR[0] + w, y1, 2.9), V(FR[0] + w, y0, 2.9)];
          const q: THREE.Vector3[] = [];
          for (let k = 0; k < 4; k++) for (let s = 0; s < 6; s++) q.push(c[k].clone().lerp(c[k + 1], s / 6));
          q.push(c[4].clone());
          frames[0].tube.set(q, 1 - sm((t - 35.2) / 0.4));
        }
        ecom.panel.visible = on;
        if (on) {
          const m = sm((t - t0) / 0.6);
          ecom.panel.position.set(FR[0], lerp(1.65, 1.85, m), 2.9);
          const tap = (t - 34.0) / 0.5;
          const g = ecom.g;
          g.clearRect(0, 0, ecom.cv.width, ecom.cv.height);
          P.shopPanel(g, ecom.cv.width, ecom.cv.height, t, t > 34.05 ? 1 : 0, tap);
          ecom.map.needsUpdate = true;
          (ecom.panel.material as THREE.MeshBasicMaterial).opacity = sm((t - t0) / 0.3) * (1 - sm((t - 35.3) / 0.3));
        }
        hand.visible = t > 33.2 && t < 35.0;
        if (hand.visible) {
          const u = clamp((t - 33.2) / 0.8);
          const pressed = t > 33.95 && t < 34.15 ? 0.06 : 0;
          const by = 1.85 - 1.325 + 2.65 * 0.19;
          hand.position.set(lerp(FR[0] + 1.6, FR[0] + 0.12, sm(u)), lerp(0.2, by - 0.35, sm(u)) - pressed, 3.0);
        }
        parcel.visible = t > 34.1 && t < 35.5;
        if (parcel.visible) {
          const u = clamp((t - 34.1) / 0.4);
          parcel.position.set(FR[0] + 0.1, 0.18, 3.7 + (t > 34.9 ? (t - 34.9) * 6 : 0));
          parcel.scale.setScalar(Math.max(0.001, sm(u)));
          lid.rotation.x = lerp(-1.9, 0, sm((t - 34.4) / 0.35));
        }
        const aer = t > 35.4 && t < 40.2;
        const u = clamp((t - 35.5) / 3.6);
        pathA.set(aer ? sm(clamp(u * 1.1)) : 0);
        pathB.set(aer ? sm(u) : 0);
        smallParcels.forEach((m, i) => {
          const rb = i < 3 ? pathA : pathB;
          const uu = clamp((t - 36.0 - (i % 3) * 0.35) / 3.3);
          m.visible = aer && uu > 0;
          if (m.visible) {
            const p = rb.pointAt(uu * 0.98 * clamp(u * 1.2));
            m.position.set(p.x, p.y + 1.2 + Math.abs(Math.sin(t * 6 + i)) * 0.6, p.z);
            m.scale.setScalar(1.3);
          }
        });
        bag.visible = aer && t > 37.6;
        if (bag.visible) {
          bag.lookAt(cam.position.x, bag.position.y, cam.position.z);
          bag.scale.setScalar(Math.max(0.001, sm((t - 37.6) / 0.4)) * (1 + 0.06 * Math.sin(t * 6)));
        }
      }

      // ---- S6: landing page, signals, rings, chart, route
      {
        const on = t > S.s6 - 0.1 && t < S.s7 - 0.1;
        landing.panel.visible = on;
        if (on) {
          const m = sm((t - S.s6) / 0.5);
          landing.panel.position.set(0.4, 1.95, 3.1);
          landing.panel.scale.setScalar(0.4 + 0.6 * m);
          const ab = t < 42.4 ? 0 : t < 42.9 ? sm((t - 42.4) / 0.5) : 1;
          const g = landing.g;
          g.clearRect(0, 0, landing.cv.width, landing.cv.height);
          P.landingPanel(g, landing.cv.width, landing.cv.height, t, ab);
          landing.map.needsUpdate = true;
          (landing.panel.material as THREE.MeshBasicMaterial).opacity = m * (1 - sm((t - (S.s7 - 0.5)) / 0.4));
        }
        const sig = t > 42.7 && t < 46.2;
        signals.forEach((s, i) => {
          s.visible = sig;
          if (!sig) return;
          const tgt = [[-9.0 + (t - 40.5), 5.6], [-11.5 + (t - 40.5), 6.0], [-8 + (t - 40.5), 10.0], [-12 + (t - 41.5), 5.2], [-3, 4.0]][i];
          const u = clamp((t - 42.8 - i * 0.12) / 0.9);
          s.position.set(lerp(1.2, tgt[0], sm(u)), 2.6 + Math.sin(t * 7 + i) * 0.1, lerp(3.2, tgt[1], sm(u)));
          s.lookAt(tgt[0], 1.7, tgt[1]);
          s.rotateX(Math.PI / 2);
          s.scale.setScalar(Math.max(0.001, sm(u) * (1 - sm((t - 45.7) / 0.5)) * 1.6));
        });
        const rg = t > 45.6 && t < 49.9;
        rings.forEach((r, i) => {
          r.visible = rg;
          if (rg) {
            const k = sm((t - 45.6 - i * 0.2) / 0.5);
            r.scale.setScalar(Math.max(0.001, k));
            (r.material as THREE.MeshBasicMaterial).opacity = k * 0.9 * (1 - sm((t - 49.4) / 0.5));
            r.position.set(-6.0, 0.3, 6.2);
          }
        });
        const ch = t > 47.4 && t < 50.8;
        chart.panel.visible = ch;
        if (ch) {
          const m = sm((t - 47.4) / 0.4);
          chart.panel.position.set(3.6, 2.7, 3.1);
          chart.panel.scale.setScalar(Math.max(0.001, m * (1 - sm((t - 50.4) / 0.4))));
          const g = chart.g;
          g.clearRect(0, 0, chart.cv.width, chart.cv.height);
          P.chartPanel(g, chart.cv.width, chart.cv.height, t, clamp((t - 47.6) / 2.2));
          chart.map.needsUpdate = true;
        }
        const fp = t > 48.0 && t < 51.0;
        footprints.set(fp && t < 49.2 ? clamp((t - 48.0) / 0.9) : 0);
        fpStraight.set(fp && t >= 49.2 ? clamp((t - 49.2) / 0.6) : 0);
      }

      // ---- S7 flash + door bell
      {
        const k = clamp((t - 51.4) / 0.5) * (1 - clamp((t - 52.2) / 0.8));
        (flash.material as THREE.MeshBasicMaterial).opacity = k * 0.35;
        flash.visible = k > 0.01;
        flash.lookAt(cam.position);
        world.doorBell.rotation.z = t > 53.2 && t < 54.4 ? Math.sin((t - 53.2) * 22) * 0.4 * (1 - (t - 53.2) / 1.2) : 0;
      }

      fx.wipe = t > 61.0 ? clamp((t - 61.0) / 0.7) : 0;
      fx.logo = t > 61.58 ? clamp((t - 61.58) / 0.5) : 0;

      for (const a of actors) a.update(t, cam);
    },
  };
}
