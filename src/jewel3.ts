// "Ugo" — Veloce Digital, final version (~41 s).
// Idea: in 2026, if you're not on social media, people walk right past you.
// Rules: nobody looks into the lens (except Ugo talking to the phone in his reel, and the Veloce guy's final look);
// walkers in profile with their phones; Ugo is buried in work; the Veloce guy works like a real videomaker.
import * as THREE from 'three';
import {World} from './world';
import {at, K} from './story';
import {buildJewelry} from './jewelworld';
import {Spec} from './toon';
import {Pose2, View, phoneArms} from './toon2';
import {Person, PosFn, PoseFn} from './jewel2';
import {PEOPLE} from './specs';
import {solid, toon, tex, sm, lerp, clamp, rnd} from './kit';

export const DUR = 41;
export const CUES = {
  social: [11.0, 13.2] as [number, number],
  rec: [18.8, 22.6] as [number, number],
  subs: [
    [18.9, 19.6, 'Benvenuti'],
    [19.6, 20.6, 'in gioielleria!'],
    [20.7, 21.5, 'Ogni anello'],
    [21.5, 22.0, 'lo creo'],
    [22.0, 22.6, 'a mano.'],
  ] as [number, number, string][],
  wipe: 37.0,
  card: 37.55,
  // unused overlays kept by the shared player component
  reel: [0, 0] as [number, number],
  feed: [0, 0] as [number, number],
  notif: [0, 0] as [number, number],
  flashes: [] as number[],
};

export interface UgoStory {
  world: World;
  update(t: number, cam: THREE.PerspectiveCamera, testCam?: number[]): {focus: number; aperture: number};
}

const HERO: Spec = {skin: '#f2c9a0', hair: '#141418', hairStyle: 'short', shirt: '#1d1d24', pants: '#1d1d24', shoes: '#121216', hero: true, minimal: true, glasses: true, build: 1.02};
const UGO: Spec = {skin: '#e2a878', hair: '#56565e', hairStyle: 'short', shirt: '#f4f1ea', pants: '#2a2a33', shoes: '#3a2a22', apron: '#6e4a2e', stache: true, build: 1.04, glasses: false};
const GUY: Spec = {skin: '#c98e63', hair: '#1d1512', hairStyle: 'short', shirt: '#e0674f', pants: '#3b4a6b', shoes: '#2a2a33'};
const WOMAN2: Spec = {skin: '#f2c9a0', hair: '#c47a2c', hairStyle: 'bun', shirt: '#8a62c9', pants: '#2b2f45', shoes: '#f1f1f1'};
const MAN3: Spec = {skin: '#e2a878', hair: '#3a2a22', hairStyle: 'cap', hat: '#2f7f8f', shirt: '#f0b13a', pants: '#4b4f5c', shoes: '#2a2a33'};
const OLD: Spec = {skin: '#f2c9a0', hair: '#9a9a9a', hairStyle: 'short', shirt: '#6f8f5a', pants: '#5a4a3a', shoes: '#3a2f2b', glasses: true, scale: 0.96};
const TEEN: Spec = {skin: '#8d5a3b', hair: '#15100d', hairStyle: 'curly', shirt: '#3b9ad9', pants: '#23304a', shoes: '#f1f1f1', scale: 0.95};
const LADY: Spec = {skin: '#f2c9a0', hair: '#7a4a2a', hairStyle: 'bun', shirt: '#2f7f8f', pants: '#2a2a33', shoes: '#d9573b'};
const SUIT: Spec = {skin: '#f2c9a0', hair: '#2a1d16', hairStyle: 'short', shirt: '#33415c', pants: '#262b3a', shoes: '#1b1a22'};
const GIRL: Spec = {skin: '#d9a47a', hair: '#22160f', hairStyle: 'bun', shirt: '#e8c4d0', pants: '#3a3a52', shoes: '#f1f1f1', scale: 0.96};

interface Shot {
  t: number;
  p0: number[];
  p1: number[];
  l0: number[];
  l1: number[];
  fov: number;
  ap: number;
  foc?: number[];
  fx?: (t: number) => number;
}

const E = Math.PI / 2;
const Wst = -Math.PI / 2;
const IN = Math.PI;
const UGO_DESK = {x: -0.15, z: -3.3};

export function createUgo(world: World, logo: HTMLImageElement): UgoStory {
  const root = world.root;
  const J = buildJewelry(world);

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

  // ===================================================== UGO
  const writing = (t: number, expr: Pose2['expr'], sweat = false): Pose2 => {
    const s = Math.sin(t * 13);
    return {expr, holdL: 'pen', armL: [52 + s * 3, 48 + Math.sin(t * 7) * 6], armR: [40, 52], lookY: 0.9, look: 0.6, tilt: 9, lean: 7, sweat};
  };
  const ugoPos: PosFn = (t) => {
    if (t < 7.0) return {...UGO_DESK, h: Wst + 0.55};
    if (t < 8.3) return {x: lerp(2.7, 0.5, (t - 7.0) / 1.3), z: -5.35, h: Wst}; // carries a parcel across the shop
    if (t < 11.0) return {x: -1.38, z: -0.85, h: 0}; // dressing the window
    if (t < 13.2) return {...UGO_DESK, h: Wst + 0.7};
    if (t < 18.8) return {...UGO_DESK, h: t < 16.0 ? E - 0.6 : Wst + 0.55};
    if (t < 22.6) return {...UGO_DESK, h: 0.3}; // talks into the phone
    if (t < 30.0) return {...UGO_DESK, h: Wst + 0.55};
    return {...UGO_DESK, h: E + 0.35}; // talks to the new customers
  };
  const ugoPose: PoseFn = (t, view) => {
    if (t < 4.4) return writing(t, 'neutral');
    if (t < 7.0) {
      // buried: scribbles, looks from paper to paper
      const p = writing(t, 'worry', t > 5.8);
      p.look = Math.sin(t * 3) > 0 ? 0.9 : -0.2;
      return p;
    }
    if (t < 8.3) return {expr: 'worry', walk: t * 5, amp: 1, bob: 5, holdL: 'box', armL: [70, -12], armR: [64, -8], lean: 4, look: 1};
    if (t < 11.0) {
      // arranging the window: hands up front, eyes on the jewels
      const s = Math.sin(t * 4);
      return {expr: 'neutral', armL: [22 + s * 4, 96], armR: [-26, -92 + s * 6], holdL: 'ring', lookY: 0.7, look: 0.4, tilt: 6};
    }
    if (t < 13.2) return {expr: 'tired', ...phoneArms(view), lean: 2};
    if (t < 14.4) return writing(t, 'tired');
    if (t < 16.0) return {expr: t < 14.9 ? 'surprise' : 'smile', armL: [18, 20], armR: [10, 20], look: 1, lookY: 0, mouth: t > 15.2 ? Math.max(0, Math.sin(t * 9)) * 0.5 : 0};
    if (t < 18.8) return writing(t, 'smile');
    if (t < 22.6) {
      // the reel: Ugo speaks to the phone, hands open
      const talk = Math.max(0, Math.sin(t * 10));
      return {expr: talk > 0.4 ? 'talk' : 'happy', mouth: talk * 0.6, look: 0, lookY: 0, armL: [26 + Math.sin(t * 3) * 6, 70], armR: [-24 - Math.sin(t * 3.4) * 6, -70], holdR: t > 21.0 ? 'ring' : null};
    }
    if (t < 30.0) return writing(t, 'smile');
    const talk = Math.max(0, Math.sin(t * 9));
    return {expr: talk > 0.5 ? 'talk' : 'happy', mouth: talk * 0.5, holdL: 'ring', armL: [70, -40], armR: [40, 40], look: 1, lookY: -0.1, lean: 3};
  };
  add(new Person(root, UGO, logo, ugoPos, ugoPose));

  // ===================================================== VELOCE
  const heroKeys: K[] = [
    {t: 13.1, x: 4.2, z: 1.3, h: Wst},
    {t: 13.75, x: 2.15, z: 1.2, h: Wst, lin: true},
    {t: 14.2, x: 2.1, z: 0.0, h: IN},
    {t: 14.7, x: 1.4, z: -1.9, h: IN + 0.6},
  ];
  const exitKeys: K[] = [
    {t: 34.0, x: 2.1, z: -0.8, h: 0},
    {t: 34.5, x: 2.1, z: 0.5, h: 0},
    {t: 34.95, x: 1.3, z: 1.6, h: 0},
    {t: 36.4, x: 1.3, z: 1.6, h: 0},
    {t: 37.2, x: -1.6, z: 1.8, h: Wst},
  ];
  const towardUgo = (x: number, z: number) => Math.atan2(UGO_DESK.x - x, UGO_DESK.z - z);
  const heroPos: PosFn = (t) => {
    if (t < 13.1) return null;
    if (t < 14.7) return at(heroKeys, t);
    if (t < 16.0) return {x: 1.4, z: -1.9, h: towardUgo(1.4, -1.9)};
    if (t < 17.4) {
      const k = sm((t - 16.0) / 0.8);
      return {x: lerp(1.4, 0.9, k), z: lerp(-1.9, -2.1, k), h: IN + 1.3};
    }
    if (t < 18.8) return {x: lerp(1.7, 0.75, (t - 17.4) / 1.4), z: -2.3, h: Wst};
    if (t < 22.6) return null; // we are looking through his phone
    if (t < 25.0) return {x: 2.8, z: -1.6, h: IN - 0.4};
    if (t < 34.0) return null;
    const k = at(exitKeys, t);
    return {x: k.x, z: k.z, h: t > 36.4 ? Wst : 0};
  };
  const heroPose: PoseFn = (t, view) => {
    if (t < 14.7) return {expr: 'smile', walk: t * 7, amp: 1, bob: 6, holdR: 'gearbag', armR: [6, -6], look: 0.8, lean: 2};
    if (t < 16.0) return {expr: 'smile', holdR: 'gearbag', armR: [6, -6], armL: [20, 100], look: 1, mouth: Math.max(0, Math.sin(t * 9)) * 0.5};
    if (t < 17.4) {
      const r = Math.sin((t - 16.0) * 5);
      return {expr: 'proud', armL: [140 + r * 8, -20], armR: [120, -10], look: 1, lookY: -0.7, lean: 3};
    }
    if (t < 18.8) {
      // gimbal walk: forearms level, phone ahead at chest height, knees bent, smooth
      return {expr: 'neutral', crouch: 50, walk: t * 4.2, amp: 0.5, bob: 2, armL: [38, 54], armR: [30, 58], holdL: 'iphone', lean: 4, look: 1, lookY: 0.3};
    }
    if (t < 25.0) {
      // editing on the laptop: hands on the keys
      const k = Math.sin(t * 22);
      return {expr: 'neutral', armL: [44 + k * 3, 46], armR: [36 - k * 3, 50], lookY: 0.8, look: 0.8, lean: 8, tilt: 7};
    }
    if (t < 34.95 || t > 36.4) return {expr: 'smile', walk: t * 6.5, amp: 1, bob: 6, holdR: 'gearbag', armR: [6, -6], look: 1};
    // outside: looks into the camera, sighs, smiles
    const sigh = sm((t - 35.1) / 0.3) * (1 - sm((t - 35.7) / 0.3));
    return {expr: t < 35.75 ? 'tired' : 'smile', holdR: 'gearbag', armR: [6, -6], armL: [-8, -6], look: 0, lookY: 0, crouch: 12 * sigh, tilt: -4 * sigh};
  };
  add(new Person(root, HERO, logo, heroPos, heroPose));

  // ===================================================== THE STREET
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
  // the hook: busy pavement, everyone on their phone, nobody looks at the window
  walker(GUY, -3.2, 1.7, 1.45, 0, 7);
  walker(WOMAN2, 1.9, 2.5, -1.3, 0, 7);
  walker(OLD, 0.6, 1.9, -1.0, 0, 7, false);
  walker(TEEN, -3.4, 2.3, 1.5, 1.4, 7);
  walker(LADY, 4.2, 3.0, -1.4, 0.4, 7);
  walker(MAN3, -7, 3.1, 1.6, 0.6, 7, false);
  walker(SUIT, 6, 1.5, -1.5, 2.2, 7);
  walker(PEOPLE[5], -10, 12.4, 1.3, 0, 7, false);
  walker(PEOPLE[2], 9, 12.6, -1.2, 0, 7);
  // after the reel: the street again (no graphics)
  walker(MAN3, -9, 3.1, 1.5, 25.0, 34, false);
  walker(PEOPLE[5], 9, 12.4, -1.2, 25.0, 34, false);
  walker(LADY, 7, 2.6, -1.3, 25.0, 34);
  // the scroller who stops, turns and looks
  add(
    new Person(
      root,
      GUY,
      logo,
      (t) => {
        if (t < 24.8 || t > 34) return null;
        if (t < 26.9) return {x: lerp(-4.2, -1.0, (t - 24.8) / 2.1), z: 2.9, h: E};
        if (t < 27.5) return {x: -1.0, z: 2.9, h: lerp(E, IN, sm((t - 26.9) / 0.5))};
        return {x: -1.0, z: lerp(2.9, 0.8, sm((t - 27.6) / 1.1)), h: IN};
      },
      (t, view) => {
        if (t < 26.6) return {expr: 'neutral', walk: t * 5, amp: 1, bob: 6, lean: 3, ...phoneArms(view)};
        if (t < 27.5) return {expr: 'surprise', ...phoneArms(view), tilt: -4, lookY: -0.5, look: 1};
        if (t < 28.7) return {expr: 'happy', walk: t * 5, amp: 1, bob: 6, armL: [10, 20], holdL: 'phone', look: 1, lookY: 0.3};
        return {expr: 'happy', armL: [-4, -10], holdL: 'phone', look: 0.5, lookY: 0.8, armR: [-70, -70]};
      },
    ),
  );
  // people gathering at the window, looking at the jewels (eyes down on the display)
  const gaze = (s: Spec, x: number, z: number, t0: number, point: boolean) =>
    add(
      new Person(
        root,
        s,
        logo,
        (t) => {
          if (t < t0 || t > 34) return null;
          const k = sm((t - t0) / 0.9);
          return {x: lerp(x + (x < -0.8 ? -2.4 : 2.4), x, k), z: lerp(z + 0.4, z, k), h: k < 0.9 ? (x < -0.8 ? E : Wst) : IN};
        },
        (t) => {
          const arrived = t > t0 + 0.9;
          return {expr: 'happy', walk: arrived ? 0 : t * 5, amp: arrived ? 0 : 1, bob: arrived ? 0 : 6, look: 0.3, lookY: 0.7, armR: point && arrived ? [-100 - Math.sin(t * 4) * 6, -20] : undefined, mouth: arrived ? Math.max(0, Math.sin(t * 6 + x)) * 0.3 : 0};
        },
      ),
    );
  gaze(WOMAN2, -2.1, 0.75, 27.4, true);
  gaze(TEEN, -0.2, 0.7, 27.8, false);
  gaze(OLD, 0.6, 0.8, 28.1, true);
  // new customers come in through the open door and gather around Ugo
  const customer = (s: Spec, t0: number, xs: number, end: [number, number]) =>
    add(
      new Person(
        root,
        s,
        logo,
        (t) => {
          if (t < t0 || t > 37) return null;
          const a = clamp((t - t0) / 1.0);
          if (a < 1) return {x: lerp(xs, 2.1, a), z: 1.2, h: xs > 2.1 ? Wst : E};
          const b = clamp((t - t0 - 1.0) / 0.55);
          if (b < 1) return {x: 2.1, z: lerp(1.2, -0.6, b), h: IN};
          const c = clamp((t - t0 - 1.55) / 1.1);
          return {x: lerp(2.1, end[0], sm(c)), z: lerp(-0.6, end[1], sm(c)), h: c < 1 ? Math.atan2(end[0] - 2.1, end[1] + 0.6) : towardUgo(end[0], end[1])};
        },
        (t) => {
          const moving = t < t0 + 2.65;
          return {expr: 'happy', walk: moving ? t * 5 : 0, amp: moving ? 1 : 0, bob: moving ? 6 : 0, lean: 2, look: 1, lookY: 0, mouth: !moving ? Math.max(0, Math.sin(t * 7 + t0)) * 0.35 : 0};
        },
      ),
    );
  customer(GIRL, 29.4, 6, [0.65, -3.7]);
  customer(SUIT, 29.8, -5, [1.2, -3.0]);
  customer(LADY, 30.3, 7, [0.95, -4.4]);
  customer(PEOPLE[1], 30.8, -6, [1.7, -3.6]);

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


  // ===================================================== UGO'S DESK, BURIED IN PAPER
  const rr = rnd(5);
  const paperTex = tex(128, 160, (g, w, h) => {
    g.fillStyle = '#fbf8f0';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#9aa0ad';
    for (let y = 22; y < h - 10; y += 14) g.fillRect(12, y, 30 + ((y * 7) % 70), 4);
  });
  const paperMat = toon('#d8d2c4', paperTex, {side: THREE.DoubleSide});
  for (let i = 0; i < 34; i++) {
    const x = -2.6 + rr() * 2.0;
    const z = -3.6 + rr() * 0.8;
    const pile = Math.floor(rr() * 3);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.28), paperMat);
    m.rotation.set(-Math.PI / 2, 0, rr() * 3);
    m.position.set(x, 1.165 + pile * 0.012 + i * 0.0006, z);
    root.add(m);
  }
  // stacks of paper, binders, invoices on a spike, a pen cup
  for (const [x, z, n] of [[-2.35, -3.45, 9], [-0.95, -3.5, 6], [-1.9, -2.95, 4]] as const) solid(root, new THREE.BoxGeometry(0.24, 0.012 * n, 0.31), toon('#f7f3ea'), [x, 1.16 + 0.006 * n, z], {rot: [0, rr() * 0.4, 0]});
  for (const [k, c] of ['#1f2f4f', '#6e4a2e', '#2f7f8f', '#d9573b'].entries()) solid(root, new THREE.BoxGeometry(0.07, 0.34, 0.28), toon(c), [-2.62 + k * 0.08, 1.33, -3.55], {rot: [0, 0, k === 3 ? 0.25 : 0]});
  solid(root, new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12), toon('#2a2a33'), [-0.75, 1.22, -3.5]);
  // parcels to sort, by the back wall
  const boxMat = toon('#c79a62');
  for (const [x, y, z, w] of [[2.9, 0.32, -5.9, 0.6], [2.9, 0.86, -5.9, 0.5], [2.35, 0.3, -6.0, 0.55], [2.9, 1.3, -5.95, 0.4]] as const) {
    solid(root, new THREE.BoxGeometry(w, w * 0.8, w * 0.9), boxMat, [x, y + 0.12, z]);
    solid(root, new THREE.BoxGeometry(0.08, w * 0.8 + 0.005, w * 0.9 + 0.005), toon('#e9d7a8'), [x, y + 0.12, z], {ink: false});
  }
  // a necklace that Ugo sets into the window (moves down onto the pedestal)
  const neck = new THREE.Group();
  solid(neck, new THREE.TorusGeometry(0.11, 0.018, 8, 28), toon('#d4a94a'), [0, 0, 0], {rot: [-0.2, 0, 0]});
  solid(neck, new THREE.OctahedronGeometry(0.04), toon('#4ce0a0', null, {emissive: new THREE.Color('#4ce0a0'), emissiveIntensity: 0.6}), [0, -0.12, 0.02]);
  root.add(neck);

  // ===================================================== SHOTS
  const SH: Shot[] = [
    // HOOK — the window and the people who walk past it
    {t: 0.0, p0: [-4.2, 1.05, 8.8], p1: [-3.3, 1.1, 8.3], l0: [-0.6, 1.9, 0], l1: [-0.5, 1.9, 0], fov: 46, ap: 0.002, foc: [-0.7, 1.8, 1.8]},
    {t: 1.5, p0: [0, 1.25, 5.6], p1: [0, 1.25, 5.6], l0: [0, 1.35, 2.3], l1: [0, 1.35, 2.3], fov: 40, ap: 0.006, foc: [0, 1.4, 2.3], fx: (t) => -3.4 + 1.5 * (t - 1.4) + 0.15},
    {t: 2.9, p0: [5.0, 5.2, 10.5], p1: [4.5, 5.0, 9.9], l0: [-0.4, 1.4, 1.2], l1: [-0.4, 1.4, 1.2], fov: 46, ap: 0.0},
    // UGO, BURIED IN WORK
    {t: 4.4, p0: [1.4, 1.95, -1.4], p1: [1.25, 1.9, -1.6], l0: [-0.9, 1.35, -3.3], l1: [-0.9, 1.35, -3.3], fov: 46, ap: 0.004, foc: [-0.6, 1.4, -3.3]},
    {t: 5.7, p0: [1.0, 1.8, -1.9], p1: [0.9, 1.78, -2.05], l0: [-0.45, 1.5, -3.3], l1: [-0.45, 1.5, -3.3], fov: 40, ap: 0.01, foc: [-0.15, 1.6, -3.3]},
    // his day: parcels, the window, a ring set on velvet
    {t: 7.0, p0: [0.0, 1.6, -2.2], p1: [0.1, 1.6, -2.4], l0: [1.5, 1.3, -5.35], l1: [1.2, 1.3, -5.35], fov: 46, ap: 0.004, foc: [1.6, 1.3, -4.9]},
    {t: 8.3, p0: [-1.35, 1.65, 3.4], p1: [-1.38, 1.62, 2.8], l0: [-1.38, 1.5, -0.7], l1: [-1.38, 1.5, -0.7], fov: 42, ap: 0.004, foc: [-1.38, 1.5, -0.85]},
    {t: 9.6, p0: [-1.75, 1.55, 1.25], p1: [-1.85, 1.52, 1.0], l0: [-2.0, 1.42, -0.5], l1: [-2.0, 1.42, -0.5], fov: 34, ap: 0.014, foc: [-2.0, 1.45, -0.5]},
    // no time for socials (phone overlay over this)
    {t: 11.0, p0: [1.4, 1.85, -1.5], p1: [1.3, 1.82, -1.65], l0: [-0.6, 1.3, -3.3], l1: [-0.6, 1.3, -3.3], fov: 46, ap: 0.02},
    // VELOCE DIGITAL walks in
    {t: 13.2, p0: [0.4, 1.65, -3.9], p1: [0.5, 1.65, -3.6], l0: [2.1, 1.5, 0.4], l1: [1.9, 1.5, 0.0], fov: 44, ap: 0.004, foc: [2.1, 1.5, 0.4]},
    {t: 14.6, p0: [-2.9, 1.75, -4.3], p1: [-2.75, 1.75, -4.15], l0: [0.3, 1.5, -2.8], l1: [0.3, 1.5, -2.8], fov: 42, ap: 0.006, foc: [1.4, 1.5, -1.9]},
    // RECORDING DAY: lights, gimbal, the reel, macro, edit
    {t: 16.0, p0: [3.0, 2.3, -1.3], p1: [2.9, 2.25, -1.45], l0: [-0.4, 1.5, -3.0], l1: [-0.4, 1.5, -3.0], fov: 52, ap: 0.002},
    {t: 17.4, p0: [0, 1.0, -5.6], p1: [0, 1.0, -5.6], l0: [0, 1.1, -2.3], l1: [0, 1.1, -2.3], fov: 50, ap: 0.006, fx: (t) => lerp(1.7, 0.75, (t - 17.4) / 1.4) - 0.2},
    {t: 18.8, p0: [0.45, 1.62, -1.45], p1: [0.4, 1.62, -1.6], l0: [-0.15, 1.5, -3.3], l1: [-0.15, 1.5, -3.3], fov: 40, ap: 0.01, foc: [-0.15, 1.6, -3.3]},
    {t: 21.4, p0: [-1.15, 1.58, -2.3], p1: [-1.2, 1.52, -2.45], l0: [-1.4, 1.3, -3.0], l1: [-1.4, 1.3, -3.0], fov: 32, ap: 0.014, foc: [-1.35, 1.25, -2.95]},
    {t: 22.6, p0: [1.9, 1.9, 0.2], p1: [1.95, 1.88, 0.0], l0: [2.6, 1.55, -1.9], l1: [2.6, 1.55, -1.9], fov: 46, ap: 0.006, foc: [2.3, 1.6, -2.3]},
    {t: 23.8, p0: [2.3, 1.78, -1.55], p1: [2.3, 1.74, -1.7], l0: [2.3, 1.66, -2.45], l1: [2.3, 1.66, -2.45], fov: 36, ap: 0.01},
    // THE STREET, NO GRAPHICS: scrolling, stopping, looking
    {t: 25.0, p0: [0, 1.4, 6.2], p1: [0, 1.4, 6.2], l0: [0, 1.5, 2.9], l1: [0, 1.5, 2.9], fov: 38, ap: 0.006, foc: [0, 1.5, 2.9], fx: (t) => lerp(-4.2, -1.0, Math.min(1, (t - 24.8) / 2.1)) + 0.3},
    {t: 26.6, p0: [-0.2, 1.75, 5.4], p1: [-0.35, 1.78, 4.9], l0: [-0.9, 1.7, 0], l1: [-0.9, 1.75, 0], fov: 44, ap: 0.004, foc: [-0.9, 1.7, 1.5]},
    {t: 27.8, p0: [-1.38, 1.6, -0.85], p1: [-1.38, 1.62, -0.72], l0: [-0.9, 1.55, 1.2], l1: [-0.9, 1.55, 1.0], fov: 52, ap: 0.005, foc: [-0.9, 1.6, 0.8]},
    // NEW CUSTOMERS
    {t: 30.0, p0: [0.0, 1.7, -4.8], p1: [0.1, 1.7, -4.5], l0: [2.0, 1.5, 0.0], l1: [1.8, 1.5, -0.6], fov: 46, ap: 0.003, foc: [2.0, 1.5, -0.6]},
    {t: 31.6, p0: [2.9, 1.9, -1.3], p1: [2.75, 1.85, -1.5], l0: [0.3, 1.5, -3.5], l1: [0.3, 1.5, -3.5], fov: 50, ap: 0.003, foc: [0.4, 1.6, -3.5]},
    // VELOCE LEAVES: looks at us, sighs, smiles, goes
    {t: 34.0, p0: [1.3, 1.6, 4.9], p1: [1.3, 1.6, 4.5], l0: [1.4, 1.45, 1.0], l1: [1.35, 1.5, 1.4], fov: 38, ap: 0.006, foc: [1.3, 1.5, 1.6]},
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
        let fdx = 0;
        if (s.fx) {
          fdx = s.fx(t);
          p[0] += fdx;
          l[0] += fdx;
        }
        cam.position.set(p[0], p[1], p[2]);
        cam.lookAt(l[0], l[1], l[2]);
        cam.fov = s.fov;
        focusPt = s.foc ? [s.foc[0] + fdx, s.foc[1], s.foc[2]] : l;
        ap = s.ap;
      }
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld();

      const open = (a: number, b: number) => sm((t - a) / 0.4) * (1 - sm((t - b) / 0.5));
      J.doorPivot.rotation.y = 1.25 * Math.max(open(13.5, 14.6), open(29.6, 33.2), open(34.1, 35.0));
      lights.forEach((L, k) => {
        L.g.visible = t > 16.2 + k * 0.5 && t < 25.0;
        const on = t > 17.0 ? 1 : 0;
        L.light.intensity = on * 2.2;
        (L.face.material as THREE.MeshBasicMaterial).color.set(on ? '#ffffff' : '#bdb6a8');
        L.g.scale.setScalar(Math.max(0.001, sm((t - 16.2 - k * 0.5) / 0.3)));
      });
      laptop.visible = t > 22.4 && t < 25.0;
      if (laptop.visible) {
        drawTimeline(t);
        laptopMap.needsUpdate = true;
      }
      benchPhone.visible = false;
      tweezers.visible = false;
      // the necklace goes onto the pedestal while Ugo dresses the window
      const nk = sm((t - 8.6) / 1.6);
      neck.visible = t > 8.3 && t < 11.0;
      neck.position.set(-2.0, lerp(1.95, 1.45, nk), lerp(-0.7, -0.45, nk));
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
