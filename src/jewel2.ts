// "La gioielleria che nessuno vedeva" v2 — approved outline, 37 s.
// Rules: nobody ever looks into the lens; walkers in profile looking at the road or their phone;
// the Veloce guy works like a real videomaker (lights, gimbal, edit on the laptop); customers use the door.
import * as THREE from 'three';
import {World} from './world';
import {Tube, at, K, gh} from './story';
import {buildJewelry} from './jewelworld';
import {Spec, CW, CH} from './toon';
import {drawPerson2, Pose2, View, phoneArms} from './toon2';
import {PEOPLE} from './specs';
import {solid, toon, tex, sm, lerp, clamp} from './kit';

export const DUR = 37;
export const CUES = {
  rec: [17.0, 18.2] as [number, number],
  flashes: [18.5, 18.85],
  reel: [21.6, 23.0] as [number, number],
  feed: [24.2, 25.4] as [number, number],
  notif: [30.0, 31.4] as [number, number],
  wipe: 33.0,
  card: 33.55,
};

export interface JewelStory2 {
  world: World;
  update(t: number, cam: THREE.PerspectiveCamera, testCam?: number[]): {focus: number; aperture: number};
}

const HERO: Spec = {skin: '#f2c9a0', hair: '#141418', hairStyle: 'short', shirt: '#1d1d24', pants: '#1d1d24', shoes: '#121216', hero: true, minimal: true, glasses: true};
const JEWELLER: Spec = {skin: '#e2a878', hair: '#56565e', hairStyle: 'short', shirt: '#f4f1ea', pants: '#2a2a33', shoes: '#3a2a22', apron: '#6e4a2e', stache: true, build: 1.04};
const LADY: Spec = {skin: '#f2c9a0', hair: '#7a4a2a', hairStyle: 'bun', shirt: '#2f7f8f', pants: '#2a2a33', shoes: '#d9573b'};
const GUY: Spec = {skin: '#c98e63', hair: '#1d1512', hairStyle: 'short', shirt: '#e0674f', pants: '#3b4a6b', shoes: '#2a2a33'};
const WOMAN2: Spec = {skin: '#f2c9a0', hair: '#c47a2c', hairStyle: 'bun', shirt: '#8a62c9', pants: '#2b2f45', shoes: '#f1f1f1'};
const MAN3: Spec = {skin: '#e2a878', hair: '#3a2a22', hairStyle: 'cap', hat: '#2f7f8f', shirt: '#f0b13a', pants: '#4b4f5c', shoes: '#2a2a33'};
const OLD: Spec = {skin: '#f2c9a0', hair: '#9a9a9a', hairStyle: 'short', shirt: '#6f8f5a', pants: '#5a4a3a', shoes: '#3a2f2b', glasses: true, scale: 0.96};
const TEEN: Spec = {skin: '#8d5a3b', hair: '#15100d', hairStyle: 'curly', shirt: '#3b9ad9', pants: '#23304a', shoes: '#f1f1f1', scale: 0.95};

export type PoseFn = (t: number, view: View) => Pose2;
export type PosFn = (t: number) => {x: number; y?: number; z: number; h: number} | null; // h = heading (rad), 0 = +z

/** a cut-out person: picks front / 3/4 / side / back from its heading and the camera, never looks into the lens */
export class Person {
  mesh: THREE.Mesh;
  g: CanvasRenderingContext2D;
  map: THREE.CanvasTexture;
  shadow: THREE.Mesh;
  constructor(root: THREE.Object3D, public spec: Spec, public logo: HTMLImageElement | null, public pos: PosFn, public pose: PoseFn, public H = 2.37) {
    const c = document.createElement('canvas');
    c.width = CW * 2;
    c.height = CH * 2;
    this.g = c.getContext('2d')!;
    this.g.scale(2, 2);
    this.map = new THREE.CanvasTexture(c);
    this.map.colorSpace = THREE.SRGBColorSpace;
    this.map.generateMipmaps = false;
    this.map.minFilter = THREE.LinearFilter;
    const geo = new THREE.PlaneGeometry(H * 0.6, H);
    geo.translate(0, H / 2 - 0.059 * (H / 2.37), 0);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({map: this.map, transparent: true, alphaTest: 0.35, alphaToCoverage: true, side: THREE.DoubleSide}));
    this.mesh.visible = false;
    root.add(this.mesh);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({color: '#1a1020', transparent: true, opacity: 0.28, depthWrite: false}));
    this.shadow.rotation.x = -Math.PI / 2;
    root.add(this.shadow);
  }
  update(t: number, cam: THREE.Camera) {
    const p = this.pos(t);
    this.mesh.visible = this.shadow.visible = !!p;
    if (!p) return;
    const gy = p.z < -1 ? 0.12 : gh(p.z);
    this.mesh.position.set(p.x, gy + (p.y || 0), p.z);
    this.mesh.lookAt(cam.position.x, this.mesh.position.y, cam.position.z);
    this.shadow.position.set(p.x + 0.08, gy + 0.015, p.z + 0.04);
    this.shadow.scale.set(1, 0.5, 1);
    // view from heading vs camera
    const hx = Math.sin(p.h);
    const hz = Math.cos(p.h);
    let cx = cam.position.x - p.x;
    let cz = cam.position.z - p.z;
    const l = Math.hypot(cx, cz) || 1;
    cx /= l;
    cz /= l;
    const d = hx * cx + hz * cz;
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const side = hx * right.x + hz * right.z;
    const view: View = d > 0.8 ? 'front' : d > 0.28 ? 'three' : d > -0.55 ? 'side' : 'back';
    const pose: Pose2 = {...this.pose(t, view), view, dir: side >= 0 ? 1 : -1, logo: this.logo};
    // facing the lens: the eyes still look at the subject, never into the camera
    if (view === 'front' && pose.look === undefined) pose.look = 0.8;
    drawPerson2(this.g, this.spec, pose);
    const g = this.g;
    g.save();
    g.globalCompositeOperation = 'source-atop';
    const gr = g.createLinearGradient(0, 0, CW, 0);
    gr.addColorStop(0, 'rgba(255,190,110,0.26)');
    gr.addColorStop(0.45, 'rgba(255,190,110,0.0)');
    gr.addColorStop(1, 'rgba(70,40,140,0.30)');
    g.fillStyle = gr;
    g.fillRect(0, 0, CW, CH);
    const gv = g.createLinearGradient(0, 200, 0, CH);
    gv.addColorStop(0, 'rgba(40,20,70,0)');
    gv.addColorStop(1, 'rgba(40,20,70,0.24)');
    g.fillStyle = gv;
    g.fillRect(0, 0, CW, CH);
    g.restore();
    this.map.needsUpdate = true;
  }
}

interface Shot {
  t: number;
  p0: number[];
  p1: number[];
  l0: number[];
  l1: number[];
  fov: number;
  ap: number;
  foc?: number[];
  roll?: number;
  fx?: (t: number) => number;
}

const E = Math.PI / 2; // heading +x
const Wst = -Math.PI / 2; // heading -x
const IN = Math.PI; // heading -z (into the shop)

export function createJewel2(world: World, logo: HTMLImageElement): JewelStory2 {
  const root = world.root;
  const J = buildJewelry(world);

  // golden hour outside, warm inside
  world.sun.color.set('#ffd2a0');
  world.sun.intensity = 3.4;
  world.sun.position.set(-24, 14, 20);
  root.traverse((o) => {
    if ((o as THREE.HemisphereLight).isHemisphereLight) {
      const h = o as THREE.HemisphereLight;
      h.color.set('#c2ceff');
      h.groundColor.set('#b98f6a');
      h.intensity = 1.6;
    }
  });
  const su = ((root.children[0] as THREE.Mesh).material as THREE.ShaderMaterial).uniforms;
  su.top.value.set('#4f8ade');
  su.hor.value.set('#ffd9ae');
  world.fogColor.set('#f4cfa8');

  const people: Person[] = [];
  const add = (p: Person) => (people.push(p), p);

  // ================= the jeweller (behind his bench, facing the street side)
  const owner = add(
    new Person(
      root,
      JEWELLER,
      logo,
      (t) => {
        if (t < 27.6) return {x: -1.6, z: -3.85, h: 0.35};
        // turns to the customers by the vitrine
        return {x: -1.45, z: -3.75, h: lerp(0.35, 1.25, sm((t - 27.6) / 0.5))};
      },
      (t, view): Pose2 => {
        const work = (expr: Pose2['expr']): Pose2 => ({expr, loupe: true, holdL: 'tweezers', armL: [118 + Math.sin(t * 6) * 4, -66], armR: [70, -50], tilt: 10, lookY: 1, look: 0.5, lean: 6});
        if (t < 7.0) return work('neutral');
        if (t < 8.4) {
          // lifts the ring to the light, admires it
          const k = sm((t - 7.0) / 0.5);
          return {expr: 'smile', holdL: 'ring', armL: [lerp(110, 150, k), -40], armR: [-12, -8], tilt: -6, lookY: -0.8, look: 0.7};
        }
        if (t < 11.0) {
          const sigh = sm((t - 9.7) / 0.6) * (1 - sm((t - 10.7) / 0.4));
          return {...work('tired'), crouch: 16 * sigh, tilt: 4};
        }
        if (t < 14.0) return {expr: 'surprise', armL: [30, -20], armR: [-14, -10], look: 1, lookY: 0, tilt: -3, mouth: 0.3}; // the Veloce guy comes in
        if (t < 18.2) return work('smile');
        if (t < 19.2) return {expr: 'proud', holdL: 'ring', armL: [150, -40], armR: [-12, -8], tilt: -6, lookY: -0.8, look: 0.7};
        if (t < 27.6) return work('smile');
        // shows a ring to the customers and talks
        const talk = Math.max(0, Math.sin(t * 9));
        return {expr: talk > 0.5 ? 'talk' : 'happy', mouth: talk * 0.5, holdL: 'ring', armL: [100, -40], armR: [60, -60], look: 1, lookY: 0, lean: 3};
      },
    ),
  );
  void owner;

  // ================= the Veloce videomaker
  const heroKeys: K[] = [
    {t: 10.9, x: 4.2, z: 1.3, h: Wst},
    {t: 11.55, x: 2.15, z: 1.2, h: Wst, lin: true},
    {t: 12.0, x: 2.1, z: 0.0, h: IN},
    {t: 12.5, x: 1.6, z: -1.8, h: IN + 0.6},
    {t: 14.0, x: 1.5, z: -2.0, h: IN + 1.1},
  ];
  const heroPos: PosFn = (t) => {
    if (t < 10.9) return null;
    if (t < 14.0) return at(heroKeys, t);
    if (t < 15.6) {
      // places the two lights
      const k = sm((t - 14.0) / 0.7);
      return {x: lerp(1.5, 0.3, k), z: lerp(-2.0, -2.2, k), h: IN + 1.4};
    }
    if (t < 17.0) {
      // ninja walk with the gimbal, low and smooth
      return {x: lerp(0.9, -0.35, (t - 15.6) / 1.4), z: -2.35, h: Wst};
    }
    if (t < 18.2) return {x: -0.2, z: -2.35, h: IN + 1.2};
    if (t < 19.2) return {x: 0.6, z: -2.9, h: Wst - 0.3};
    if (t < 21.6) return {x: 2.8, z: -1.6, h: IN - 0.4}; // at the laptop on the vitrine
    if (t < 31.4) return null;
    if (t < 33.0) return {x: lerp(2.1, 6.0, sm((t - 31.6) / 1.4)), z: 1.4, h: E};
    return null;
  };
  const heroPose: PoseFn = (t, view) => {
    if (t < 12.5) return {expr: 'smile', walk: t * 7, amp: 1, bob: 6, holdR: 'gearbag', armR: [6, -6], look: 0.6, lean: 2};
    if (t < 14.0) return {expr: 'smile', holdR: 'gearbag', armR: [6, -6], armL: [60, -100], look: 1, mouth: Math.max(0, Math.sin(t * 9)) * 0.5};
    if (t < 15.6) {
      const reach = Math.sin((t - 14.0) * 5);
      return {expr: 'proud', armL: [130 + reach * 10, -30], armR: [100, -20], look: 0.6, lookY: -0.6, lean: 4};
    }
    if (t < 17.0) {
      // gimbal: both hands forward, phone ahead, knees bent, heel-to-toe
      return {expr: 'neutral', crouch: 55, walk: t * 4.2, amp: 0.55, bob: 2, armL: [62, -18], armR: [56, -14], holdL: 'iphone', lean: 6, look: 1, lookY: 0.3};
    }
    if (t < 18.2) return {expr: 'neutral', crouch: 40, armL: [80, -20], armR: [70, -14], holdL: 'iphone', look: 1, lean: 8};
    if (t < 19.2) return {expr: 'smile', armL: [95, -40], armR: [80, -30], holdL: 'iphone', look: 1, lean: 4};
    if (t < 21.6) {
      // editing: typing on the laptop
      const k = Math.sin(t * 22);
      return {expr: 'neutral', armL: [70 + k * 4, -60], armR: [60 - k * 4, -50], lookY: 0.8, look: 0.6, lean: 10, tilt: 8};
    }
    return {expr: 'smile', walk: t * 7, amp: 1, bob: 6, holdR: 'gearbag', armR: [6, -6], look: 0.8};
  };
  add(new Person(root, HERO, logo, heroPos, heroPose));

  // ================= the street: profiles, phones, nobody stops (until the post)
  const walker = (s: Spec, x0: number, z: number, v: number, t0: number, t1: number, phone = true) =>
    add(
      new Person(
        root,
        s,
        logo,
        (t) => (t >= t0 && t <= t1 ? {x: x0 + v * (t - t0), z, h: v > 0 ? E : Wst} : null),
        (t, view) => ({expr: 'neutral', walk: (t - t0) * Math.abs(v) * 3.3 + x0, amp: 1, bob: 6, lean: 3, look: 1, ...(phone ? phoneArms(view) : {})}),
      ),
    );
  // before (0-11): busy pavement, eyes on phones or ahead
  walker(GUY, -7.2, 1.7, 1.45, 0, 11);
  walker(WOMAN2, 5.6, 2.5, -1.3, 0, 11);
  walker(MAN3, -12, 3.1, 1.6, 0.6, 11, false);
  walker(OLD, 3.4, 1.9, -1.0, 2.6, 11, false);
  walker(TEEN, -10, 2.3, 1.5, 3.2, 11);
  walker(LADY, 10, 3.0, -1.4, 3.6, 11);
  walker(PEOPLE[5], -14, 12.4, 1.3, 0, 11, false); // opposite pavement, depth
  walker(PEOPLE[2], 12, 12.6, -1.2, 0, 11);
  // after (23-33)
  walker(MAN3, -9, 3.1, 1.5, 23.0, 33, false);
  walker(PEOPLE[5], 9, 12.4, -1.2, 23.0, 33, false);
  // the passer-by who stops on the post and looks up at the window
  add(
    new Person(
      root,
      GUY,
      logo,
      (t) => {
        if (t < 22.8 || t > 33) return null;
        if (t < 25.2) return {x: lerp(-6.2, -1.0, (t - 22.8) / 2.4), z: 2.9, h: E};
        if (t < 26.0) return {x: -1.0, z: 2.9, h: lerp(E, IN, sm((t - 25.4) / 0.5))};
        return {x: -1.0, z: lerp(2.9, 1.0, sm((t - 26.2) / 1.2)), h: IN};
      },
      (t, view) => {
        if (t < 25.2) return {expr: 'neutral', walk: t * 5, amp: 1, bob: 6, lean: 3, ...phoneArms(view)};
        if (t < 26.2) return {expr: 'surprise', ...phoneArms(view), tilt: -4, lookY: -0.6, look: 1};
        return {expr: 'happy', walk: t * 5, amp: 1, bob: 6, armL: [20, 60], holdL: 'phone', look: 1};
      },
    ),
  );
  // customers: walk along the pavement, turn, come through the OPEN door
  const customer = (s: Spec, t0: number, xs: number, end: [number, number], lookAt: number) =>
    add(
      new Person(
        root,
        s,
        logo,
        (t) => {
          if (t < t0 || t > 33) return null;
          const a = clamp((t - t0) / 1.2);
          if (a < 1) return {x: lerp(xs, 2.1, a), z: 1.2, h: xs > 2.1 ? Wst : E};
          const b = clamp((t - t0 - 1.2) / 0.6);
          if (b < 1) return {x: 2.1, z: lerp(1.2, -0.6, b), h: IN};
          const c = clamp((t - t0 - 1.8) / 1.2);
          return {x: lerp(2.1, end[0], sm(c)), z: lerp(-0.6, end[1], sm(c)), h: c < 1 ? Math.atan2(end[0] - 2.1, end[1] + 0.6) : lookAt};
        },
        (t) => {
          const moving = t < t0 + 3.0;
          return {expr: 'happy', walk: moving ? t * 5 : 0, amp: moving ? 1 : 0, bob: moving ? 6 : 0, lean: 2, look: 1, lookY: -0.2, mouth: !moving ? Math.max(0, Math.sin(t * 7 + t0)) * 0.3 : 0};
        },
      ),
    );
  customer(WOMAN2, 25.9, 6, [-0.25, -3.95], -1.5);
  customer(LADY, 26.4, -5, [0.45, -4.35], -1.4);
  customer(OLD, 27.0, 7, [0.55, -3.35], -1.7);

  // ================= props: softbox lights, laptop, bench phone, tweezers, sparkles
  const softbox = (x: number, z: number, rotY: number) => {
    const g = new THREE.Group();
    for (const a of [0, 2.1, 4.2]) solid(g, new THREE.CylinderGeometry(0.012, 0.012, 0.9, 6), toon('#202024'), [Math.cos(a) * 0.22, 0.42, Math.sin(a) * 0.22], {rot: [Math.sin(a) * -0.45, 0, Math.cos(a) * 0.45]});
    solid(g, new THREE.CylinderGeometry(0.015, 0.015, 1.3, 6), toon('#202024'), [0, 1.4, 0]);
    solid(g, new THREE.BoxGeometry(0.7, 0.55, 0.35), toon('#1a1a1e'), [0, 2.1, 0]);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.47), new THREE.MeshBasicMaterial({color: '#fffaf0'}));
    face.position.set(0, 2.1, 0.18);
    g.add(face);
    const light = new THREE.PointLight('#fff4e0', 0, 6, 1.5);
    light.position.set(0, 2.1, 0.6);
    g.add(light);
    g.position.set(x, 0.12, z);
    g.rotation.y = rotY;
    g.visible = false;
    root.add(g);
    return {g, face, light};
  };
  const lights = [softbox(-0.1, -2.0, -0.9), softbox(-2.9, -2.1, 0.8)];

  const laptopCv = document.createElement('canvas');
  laptopCv.width = 512;
  laptopCv.height = 320;
  const laptopMap = new THREE.CanvasTexture(laptopCv);
  laptopMap.colorSpace = THREE.SRGBColorSpace;
  const laptop = new THREE.Group();
  solid(laptop, new THREE.BoxGeometry(0.6, 0.03, 0.42), toon('#9aa0aa'), [0, 0.015, 0]);
  solid(laptop, new THREE.BoxGeometry(0.6, 0.4, 0.02), toon('#9aa0aa'), [0, 0.22, -0.2], {rot: [-0.25, 0, 0]});
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.35), new THREE.MeshBasicMaterial({map: laptopMap}));
  screen.position.set(0, 0.22, -0.185);
  screen.rotation.x = -0.25;
  laptop.add(screen);
  laptop.position.set(2.3, 1.45, -2.25);
  laptop.visible = false;
  root.add(laptop);
  const drawTimeline = (t: number) => {
    const g = laptopCv.getContext('2d')!;
    g.fillStyle = '#16171c';
    g.fillRect(0, 0, 512, 320);
    // preview window
    const pg = g.createLinearGradient(0, 0, 0, 160);
    pg.addColorStop(0, '#2b3a63');
    pg.addColorStop(1, '#141a2e');
    g.fillStyle = pg;
    g.fillRect(150, 14, 212, 150);
    g.strokeStyle = '#d4a94a';
    g.lineWidth = 7;
    g.beginPath();
    g.arc(256, 100, 34 + 4 * Math.sin(t * 4), 0, 7);
    g.stroke();
    g.fillStyle = '#7fd3ff';
    g.beginPath();
    g.moveTo(256, 44);
    g.lineTo(272, 62);
    g.lineTo(256, 74);
    g.lineTo(240, 62);
    g.closePath();
    g.fill();
    // tracks
    const cols = ['#e0674f', '#2f9db0', '#f0b13a', '#8a62c9', '#3bb26b'];
    for (let r = 0; r < 3; r++)
      for (let k = 0; k < 6; k++) {
        g.fillStyle = cols[(k + r) % 5];
        g.fillRect(20 + k * 80 + (r % 2) * 20, 190 + r * 36, 70 - (k % 3) * 10, 26);
      }
    const ph = 20 + ((t * 120) % 470);
    g.fillStyle = '#fff';
    g.fillRect(ph, 180, 3, 120);
  };

  const benchPhone = new THREE.Group();
  solid(benchPhone, new THREE.BoxGeometry(0.09, 0.012, 0.18), toon('#2a2c32'), [0, 0, 0]);
  const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.17), new THREE.MeshBasicMaterial({color: '#0b0b0e'}));
  phoneScreen.rotation.x = -Math.PI / 2;
  phoneScreen.position.y = 0.008;
  benchPhone.add(phoneScreen);
  benchPhone.position.set(-0.75, 1.17, -2.95);
  benchPhone.rotation.y = 0.3;
  root.add(benchPhone);

  const tweezers = new THREE.Group();
  for (const s of [-1, 1]) solid(tweezers, new THREE.CylinderGeometry(0.006, 0.01, 0.28, 6), toon('#d6d9df'), [s * 0.012, 0.14, 0], {rot: [0, 0, s * 0.05]});
  tweezers.position.set(-1.35, 1.32, -2.95);
  root.add(tweezers);

  const starTex = tex(128, 128, (g) => {
    g.translate(64, 64);
    g.fillStyle = '#fffbe8';
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? 8 : 62;
      const a = (i / 8) * Math.PI * 2;
      g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
  });
  const sparkles = J.sparkleSpots.concat([new THREE.Vector3(-1.35, 1.33, -2.9)]).map((p, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: starTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
    s.position.copy(p);
    root.add(s);
    return {s, phase: i * 0.83};
  });

  // ================= street depth: a café next door and a parked bicycle
  for (const [tx, tz] of [[6.4, 2.4], [8.4, 2.6]]) {
    solid(root, new THREE.CylinderGeometry(0.38, 0.38, 0.04, 20), toon('#f4f1ea'), [tx, 0.95, tz]);
    solid(root, new THREE.CylinderGeometry(0.04, 0.06, 0.78, 8), toon('#2a2a30'), [tx, 0.56, tz]);
    for (const s of [-1, 1]) {
      solid(root, new THREE.BoxGeometry(0.4, 0.05, 0.4), toon('#2f7f8f'), [tx + s * 0.6, 0.62, tz]);
      solid(root, new THREE.BoxGeometry(0.05, 0.45, 0.4), toon('#2f7f8f'), [tx + s * 0.8, 0.85, tz]);
    }
    solid(root, new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10), toon('#ffffff'), [tx + 0.1, 1.03, tz]);
  }
  const bike = new THREE.Group();
  for (const bx of [-0.5, 0.5]) solid(bike, new THREE.TorusGeometry(0.34, 0.035, 8, 26), toon('#26262c'), [bx, 0.34, 0]);
  solid(bike, new THREE.BoxGeometry(1.0, 0.05, 0.05), toon('#e0674f'), [0, 0.62, 0], {rot: [0, 0, 0.12]});
  solid(bike, new THREE.BoxGeometry(0.05, 0.5, 0.05), toon('#e0674f'), [-0.15, 0.48, 0], {rot: [0, 0, 0.3]});
  solid(bike, new THREE.BoxGeometry(0.22, 0.05, 0.1), toon('#26262c'), [-0.25, 0.78, 0]);
  bike.position.set(-4.3, 0.18, 3.2);
  bike.rotation.y = 0.15;
  root.add(bike);

  // ================= shots
  const SH: Shot[] = [
    // the jeweller from the first second
    {t: 0.0, p0: [-1.1, 1.62, -2.2], p1: [-1.16, 1.56, -2.4], l0: [-1.4, 1.3, -3.0], l1: [-1.4, 1.32, -3.0], fov: 34, ap: 0.014, foc: [-1.35, 1.27, -2.95]},
    {t: 1.4, p0: [0.4, 1.7, -2.5], p1: [0.15, 1.68, -2.6], l0: [-1.6, 1.45, -3.6], l1: [-1.6, 1.45, -3.6], fov: 38, ap: 0.006, foc: [-1.6, 1.6, -3.85]},
    // outside: curated window, busy pavement in depth
    {t: 3.0, p0: [-4.2, 1.05, 8.8], p1: [-3.2, 1.1, 8.3], l0: [-0.6, 1.9, 0], l1: [-0.5, 1.9, 0], fov: 46, ap: 0.002, foc: [-0.7, 1.8, 1.5]},
    {t: 4.6, p0: [0, 1.25, 5.6], p1: [0, 1.25, 5.6], l0: [0, 1.35, 1.7], l1: [0, 1.35, 1.7], fov: 40, ap: 0.006, foc: [0, 1.4, 1.7], fx: (t) => -9 + 1.45 * t + 0.2},
    {t: 5.8, p0: [5.0, 5.2, 10.5], p1: [4.4, 5.0, 9.8], l0: [-0.4, 1.4, 1.2], l1: [-0.4, 1.4, 1.2], fov: 46, ap: 0.0},
    // inside: works, admires the ring, the silent phone, alone
    {t: 7.0, p0: [-0.7, 1.8, -1.85], p1: [-0.78, 1.8, -2.05], l0: [-1.5, 1.8, -3.85], l1: [-1.5, 1.82, -3.85], fov: 42, ap: 0.008},
    {t: 8.4, p0: [-0.55, 1.42, -2.55], p1: [-0.6, 1.38, -2.68], l0: [-0.75, 1.17, -2.95], l1: [-0.75, 1.17, -2.95], fov: 30, ap: 0.018},
    {t: 9.6, p0: [3.0, 2.3, -1.3], p1: [2.9, 2.25, -1.5], l0: [-1.0, 1.4, -3.5], l1: [-1.1, 1.4, -3.5], fov: 50, ap: 0.003, foc: [-1.6, 1.5, -3.85]},
    // the Veloce guy walks in through the door
    {t: 11.0, p0: [0.4, 1.65, -3.6], p1: [0.5, 1.65, -3.3], l0: [2.1, 1.5, 0.4], l1: [1.9, 1.5, 0.0], fov: 44, ap: 0.004, foc: [2.1, 1.5, 0.4]},
    {t: 12.6, p0: [-2.6, 1.75, -5.2], p1: [-2.4, 1.75, -4.95], l0: [1.0, 1.5, -2.0], l1: [1.0, 1.5, -2.0], fov: 40, ap: 0.006, foc: [1.5, 1.5, -2.0]},
    // lights
    {t: 14.0, p0: [3.0, 2.3, -1.3], p1: [2.9, 2.25, -1.45], l0: [-0.9, 1.6, -3.0], l1: [-0.9, 1.6, -3.0], fov: 52, ap: 0.002},
    // gimbal ninja walk, low tracking
    {t: 15.6, p0: [0, 1.0, -5.3], p1: [0, 1.0, -5.3], l0: [0, 1.1, -2.35], l1: [0, 1.1, -2.35], fov: 50, ap: 0.006, fx: (t) => lerp(0.9, -0.35, (t - 15.6) / 1.4)},
    // what the phone sees (REC overlay)
    {t: 17.0, p0: [-1.15, 1.58, -2.3], p1: [-1.2, 1.52, -2.45], l0: [-1.4, 1.32, -3.0], l1: [-1.4, 1.32, -3.0], fov: 32, ap: 0.014, foc: [-1.35, 1.27, -2.95]},
    // photo: the jeweller proudly holds the ring, flashes
    {t: 18.2, p0: [1.6, 1.75, -1.3], p1: [1.5, 1.75, -1.45], l0: [-0.5, 1.55, -3.4], l1: [-0.5, 1.55, -3.4], fov: 46, ap: 0.006, foc: [-1.6, 1.7, -3.85]},
    // editing on the laptop: over the shoulder, then the screen
    {t: 19.2, p0: [1.9, 1.9, 0.2], p1: [1.95, 1.88, 0.0], l0: [2.6, 1.55, -1.9], l1: [2.6, 1.55, -1.9], fov: 46, ap: 0.006, foc: [2.3, 1.6, -2.3]},
    {t: 20.4, p0: [2.3, 1.78, -1.55], p1: [2.3, 1.74, -1.7], l0: [2.3, 1.66, -2.45], l1: [2.3, 1.66, -2.45], fov: 36, ap: 0.01},
    // (21.6-23 phone reel overlay over this)
    {t: 21.6, p0: [2.6, 1.8, -1.2], p1: [2.6, 1.8, -1.3], l0: [1.0, 1.5, -3.0], l1: [1.0, 1.5, -3.0], fov: 46, ap: 0.02},
    // the street again: someone scrolling, in profile
    {t: 23.0, p0: [0, 1.4, 6.2], p1: [0, 1.4, 6.2], l0: [0, 1.5, 2.9], l1: [0, 1.5, 2.9], fov: 38, ap: 0.006, foc: [0, 1.5, 2.9], fx: (t) => lerp(-6.2, -1.0, (t - 22.8) / 2.4) + 0.4},
    {t: 24.2, p0: [-1.0, 1.6, 6.0], p1: [-1.0, 1.6, 6.0], l0: [-1.0, 1.6, 3.0], l1: [-1.0, 1.6, 3.0], fov: 40, ap: 0.02},
    // stops, looks up at the window (over his shoulder)
    {t: 25.4, p0: [-0.2, 1.75, 5.4], p1: [-0.35, 1.78, 4.9], l0: [-0.9, 1.7, 0], l1: [-0.9, 1.75, 0], fov: 44, ap: 0.004, foc: [-0.75, 1.8, 0]},
    // customers come in through the open door
    {t: 26.6, p0: [0.0, 1.7, -4.5], p1: [0.1, 1.7, -4.25], l0: [2.0, 1.5, 0.0], l1: [1.8, 1.5, -0.4], fov: 46, ap: 0.003, foc: [2.0, 1.5, -0.4]},
    // the jeweller shows a ring, talks to them
    {t: 28.2, p0: [2.9, 1.85, -1.4], p1: [2.75, 1.82, -1.6], l0: [-0.4, 1.5, -3.4], l1: [-0.4, 1.5, -3.4], fov: 46, ap: 0.004, foc: [-0.8, 1.6, -3.4]},
    // (30-31.4 the phone fills up — overlay over the bench)
    {t: 30.0, p0: [-0.5, 1.6, -2.4], p1: [-0.52, 1.58, -2.5], l0: [-0.75, 1.17, -2.95], l1: [-0.75, 1.17, -2.95], fov: 40, ap: 0.02},
    // outside: the shop is alive, the Veloce guy walks off
    {t: 31.4, p0: [1.4, 2.4, 10.8], p1: [1.2, 2.3, 10.2], l0: [0.4, 1.9, 0.5], l1: [0.4, 1.9, 0.5], fov: 48, ap: 0.0},
  ];

  return {
    world,
    update(t, cam, testCam) {
      let focusPt = [0, 1.5, 0];
      let ap = 0;
      if (testCam) {
        cam.position.set(testCam[0], testCam[1], testCam[2]);
        cam.lookAt(testCam[3], testCam[4], testCam[5]);
        cam.fov = testCam[6];
        focusPt = [testCam[3], testCam[4], testCam[5]];
      } else {
        let i = 0;
        while (i < SH.length - 1 && SH[i + 1].t <= t) i++;
        const s = SH[i];
        const t1 = i < SH.length - 1 ? SH[i + 1].t : DUR;
        const u = clamp((t - s.t) / (t1 - s.t));
        const e = 1 - Math.pow(1 - u, 2.2);
        const p = s.p0.map((x, j) => lerp(x, s.p1[j], e));
        const l = s.l0.map((x, j) => lerp(x, s.l1[j], e));
        if (s.fx) {
          const dx = s.fx(t);
          p[0] += dx;
          l[0] += dx;
        }
        cam.position.set(p[0], p[1], p[2]);
        cam.lookAt(l[0], l[1], l[2]);
        if (s.roll) cam.rotateZ((s.roll * Math.PI) / 180);
        cam.fov = s.fov;
        focusPt = s.foc || l;
        if (s.fx) focusPt = [focusPt[0] + s.fx(t), focusPt[1], focusPt[2]];
        ap = s.ap;
      }
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld();

      // door: opens for the Veloce guy and for the customers
      const open = (a: number, b: number) => sm((t - a) / 0.4) * (1 - sm((t - b) / 0.5));
      J.doorPivot.rotation.y = -1.25 * Math.max(open(11.3, 12.4), open(26.9, 29.6));
      // softboxes appear as he places them, then switch on
      lights.forEach((L, k) => {
        L.g.visible = t > 14.2 + k * 0.5 && t < 21.6;
        const on = t > 15.2 ? 1 : 0;
        L.light.intensity = on * 2.2;
        (L.face.material as THREE.MeshBasicMaterial).color.set(on ? '#ffffff' : '#bdb6a8');
        L.g.scale.setScalar(sm((t - 14.2 - k * 0.5) / 0.3));
      });
      laptop.visible = t > 19.0 && t < 23.0;
      if (laptop.visible) {
        drawTimeline(t);
        laptopMap.needsUpdate = true;
      }
      // the silent phone, later buzzing with messages
      const buzz = t > 29.8 && t < 31.4;
      benchPhone.position.x = -0.75 + (buzz ? Math.sin(t * 90) * 0.006 : 0);
      (phoneScreen.material as THREE.MeshBasicMaterial).color.set(buzz ? '#9fd3ff' : '#0b0b0e');
      tweezers.visible = false;
      tweezers.position.y = 1.32 + 0.03 * Math.sin(t * 5);
      for (const m of J.gemMats) m.emissiveIntensity = 0.45 + 0.25 * Math.sin(t * 7);
      sparkles.forEach(({s, phase}, i) => {
        const c = ((t + phase) % 1.7) / 1.7;
        const a = c < 0.25 ? Math.sin((c / 0.25) * Math.PI) : 0;
        s.visible = a > 0.01;
        s.scale.setScalar((i === sparkles.length - 1 ? 0.12 : 0.28) * a);
        s.material.rotation = t * 2 + i;
      });

      for (const p of people) p.update(t, cam);
      const fd = cam.position.distanceTo(new THREE.Vector3(focusPt[0], focusPt[1], focusPt[2]));
      return {focus: fd, aperture: ap};
    },
  };
}
// keep Tube import used by future passes
void Tube;
