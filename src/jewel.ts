// "La gioielleria che nessuno vedeva" — 35 s, Veloce Digital.
// Built on the reference rhythm: a cut or a strong move every ~1 s, macro <-> wide, a deadpan cat, physical gags.
import * as THREE from 'three';
import {World} from './world';
import {Actor, Tube, at, K} from './story';
import {buildJewelry} from './jewelworld';
import {Spec, Pose, drawCat, PLUM, YEL} from './toon';
import {PEOPLE} from './specs';
import {solid, toon, tex, sm, lerp, clamp} from './kit';

export const DUR = 35;
export const CUES = {
  rec: [16.3, 18.6] as [number, number], // phone REC frame overlay
  flashes: [18.95, 19.35],
  reel: [19.8, 21.2] as [number, number],
  feed: [22.8, 24.0] as [number, number],
  notif: [27.8, 29.2] as [number, number],
  wipe: 31.0,
  card: 31.55,
};

export interface JewelStory {
  world: World;
  update(t: number, cam: THREE.PerspectiveCamera, testCam?: number[]): {focus: number; aperture: number};
}

const HERO: Spec = {skin: '#f2c9a0', hair: '#141418', hairStyle: 'tuft', shirt: '#1d1d24', pants: '#1d1d24', shoes: '#121216', hero: true, minimal: true, build: 0.98};
const JEWELLER: Spec = {skin: '#e2a878', hair: '#56565e', hairStyle: 'short', shirt: '#f4f1ea', pants: '#2a2a33', shoes: '#3a2a22', apron: '#6e4a2e', stache: true, build: 1.04};
const QUIFF: Spec = {skin: '#f2c9a0', hair: '#c47a2c', hairStyle: 'tuft', shirt: '#2f9db0', pants: '#2b2f45', shoes: '#f1f1f1'};
const SCROLLER: Spec = {skin: '#d9a47a', hair: '#22160f', hairStyle: 'long', shirt: '#e0674f', pants: '#2f3a52', shoes: '#2a2a33'};

interface Shot {
  t: number;
  p0: number[];
  p1: number[];
  l0: number[];
  l1: number[];
  fov: number;
  fov1?: number;
  ap: number;
  foc?: number[];
  roll?: number;
  fx?: (t: number) => number; // follow an actor along x
  lf?: (t: number) => number[]; // look target as a function of time
}

export function createJewel(world: World, logo: HTMLImageElement): JewelStory {
  const root = world.root;
  Actor.RES = 2;
  const J = buildJewelry(world);

  // ---- golden-hour street, warm interior
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

  const actors: Actor[] = [];
  const add = (a: Actor) => (actors.push(a), a);

  // ================= the jeweller
  const ownerPose = (t: number): Pose => {
    const work = (e: Pose['expr'], loupe: boolean): Pose => ({dir: 1, expr: e, loupe, holdL: 'tweezers', armL: [118 + Math.sin(t * 6) * 4, -70], armR: [-100, 50], tilt: 6, look: 0, lean: 6});
    if (t < 9.6) return work('neutral', true);
    if (t < 10.8) {
      // looks up at the empty door, sighs
      const s = sm((t - 9.7) / 0.5);
      return {dir: 1, expr: 'tired', armL: [lerp(118, 20, s), -40], armR: [-14, -8], look: 0.9, crouch: 14 * s, tilt: -4, blink: t > 10.35 && t < 10.5};
    }
    if (t < 15.0) return work('tired', true);
    if (t < 15.6) return {dir: 1, expr: 'surprise', armL: [30, -20], armR: [-30, -20], look: 0.4, mouth: 0.6};
    if (t < 19.8) return {dir: 1, expr: 'proud', holdL: 'ring', armL: [125, -55], armR: [-12, -8], look: 0.2, tilt: -3, lean: -2};
    if (t < 25.0) return work('smile', true);
    // customers in: happy, talking
    return {dir: 1, expr: Math.sin(t * 3) > 0 ? 'happy' : 'talk', mouth: Math.max(0, Math.sin(t * 9)) * 0.6, holdL: 'ring', armL: [110, -40], armR: [-60, -60], look: 0.6, lean: 2};
  };
  add(new Actor(root, JEWELLER, logo, () => ({x: -1.6, y: 0.1, z: -3.85}), ownerPose, 2.37, undefined, -1));

  // ================= the hero
  const heroKeys: K[] = [
    {t: 12.0, x: -22, z: 2.7},
    {t: 12.78, x: 1.6, z: 2.6, lin: true},
    {t: 13.15, x: 2.15, z: 2.4},
  ];
  const heroPos = (t: number) => {
    if (t < 12.0) return null;
    if (t < 15.0) return at(heroKeys, t);
    if (t < 18.6) return {x: 0.05, y: 0.1, z: -2.9};
    if (t < 19.8) return {x: 0.1, y: 0.1, z: -2.4};
    if (t < 29.0) return null;
    if (t < 30.4) return {x: 2.2, z: 0.8};
    if (t < 31.0) return {x: lerp(2.2, 26, clamp((t - 30.4) / 0.55)), z: 1.2};
    return null;
  };
  const heroPose = (t: number): Pose => {
    if (t < 12.78) return {expr: 'smile', walk: t * 22, amp: 1, lean: 24, bob: 14, armL: [-70, -20], armR: [60, -30]};
    if (t < 13.8) {
      // skids to a stop, back to camera: the logo on his back
      const u = clamp((t - 12.78) / 0.4);
      return {back: true, lean: lerp(-14, 0, u), legL: [lerp(-35, -8, u), 0], legR: [lerp(30, 8, u), 0], armL: [lerp(-60, -10, u), -10], armR: [lerp(60, 10, u), -10]};
    }
    if (t < 15.0) {
      // turns, pulls out the iPhone, little flip
      const u = clamp((t - 13.85) / 0.45);
      return {expr: 'smile', holdL: 'iphone', armL: [lerp(10, 100, u), lerp(0, -70, u)], armR: [-10, -10], lean: 2, look: 0, tilt: t > 14.4 && t < 14.8 ? 6 : 0};
    }
    if (t < 18.6) return {back: true, holdR: 'iphoneScreen', armR: [-150, 10], armL: [20, -20], lean: 4};
    if (t < 19.8) return {dir: -1, expr: 'proud', crouch: 60, holdL: 'iphone', armL: [120, -30], armR: [-30, -40], lean: 8};
    if (t < 30.4) return {expr: 'smile', armR: [-160, -20], armL: [10, -10], look: 0, tilt: 4}; // thumbs up
    return {expr: 'smile', walk: t * 22, amp: 1, lean: 24, bob: 14, armL: [-70, -20], armR: [60, -30]};
  };
  add(new Actor(root, HERO, logo, heroPos, heroPose, 2.37, undefined, -1));

  // ================= the street before: everyone walks past, eyes on the phone
  const walker = (s: Spec, x0: number, z: number, v: number, t0: number, t1: number, hold: Pose['holdL'] = 'phone') =>
    add(
      new Actor(
        root,
        s,
        logo,
        (t) => (t >= t0 && t <= t1 ? {x: x0 + v * (t - t0), z} : null),
        (t) => ({dir: v > 0 ? 1 : -1, walk: (t - t0) * Math.abs(v) * 3.3 + x0, amp: 1, bob: 7, lean: 4, expr: 'neutral', holdL: hold, armL: hold === 'phone' ? [30, -100] : undefined, look: 0}),
      ),
    );
  walker(PEOPLE[0], -8, 2.9, 1.5, 0, 12);
  walker(PEOPLE[2], 7, 1.9, -1.35, 0, 12);
  walker(PEOPLE[3], -11, 2.3, 1.6, 0.8, 12, null);
  walker(PEOPLE[6], 9, 3.2, -1.5, 0.3, 12);
  walker(PEOPLE[5], -9, 1.5, 1.2, 4.6, 12);
  walker(PEOPLE[1], 11, 2.6, -1.4, 4.0, 12);
  walker(PEOPLE[4], -10, 3.3, 1.3, 9.5, 21);
  walker(PEOPLE[3], 10, 1.8, -1.3, 11.5, 21);
  // c: the passer-by we track in close-up
  walker(SCROLLER, -4.6, 1.35, 1.25, 1.9, 3.3);
  // d/e: the one who stops... to fix his hair in the reflection
  const quiff = add(
    new Actor(
      root,
      QUIFF,
      logo,
      (t) => {
        if (t < 2.6 || t > 7.0) return null;
        if (t < 3.6) return {x: lerp(-6.0, -1.4, (t - 2.6) / 1.0), z: 1.5};
        if (t < 5.25) return {x: -1.4, z: lerp(1.5, 0.75, sm((t - 3.6) / 0.5))};
        return {x: -1.4 + (t - 5.25) * 1.4, z: lerp(0.75, 1.6, sm((t - 5.25) / 0.4))};
      },
      (t): Pose => {
        if (t < 3.6) return {dir: 1, walk: t * 5, amp: 1, bob: 7, holdL: 'phone', armL: [30, -100], expr: 'neutral'};
        if (t < 4.45) return {dir: 1, expr: 'surprise', look: 0, lean: 6}; // stops: is he looking at the jewels?
        if (t < 5.25) {
          // no: he fixes his hair and winks at himself
          const k = Math.sin((t - 4.45) * 14);
          return {dir: 1, expr: 'proud', armL: [170, -60 + k * 15], armR: [-12, -8], tilt: k * 3, lean: 3, look: 0};
        }
        return {dir: 1, walk: t * 5, amp: 1, bob: 7, holdL: 'phone', armL: [30, -100], expr: 'smile'};
      },
    ),
  );
  quiff.facesZ = -1;

  // t2: a passer-by stops scrolling and looks up at the shop
  add(
    new Actor(root, PEOPLE[2], logo, (t) => (t > 22.7 && t < 25.2 ? {x: -1.0, z: 3.2} : null), (t): Pose => {
      const up = t > 24.25;
      return {dir: -1, expr: up ? 'surprise' : 'neutral', holdL: 'phone', armL: [30, -100], look: up ? 0.3 : 0, tilt: up ? -6 : 8, mouth: up ? 0.6 : 0};
    }),
  );
  // ================= after: they stop, gather, come in
  const gatherer = (s: Spec, x: number, z: number, t0: number, point: boolean) => {
    const a = add(
      new Actor(
        root,
        s,
        logo,
        (t) => (t >= t0 && t < 31 ? {x, z: lerp(z + 0.8, z, sm((t - t0) / 0.5))} : null),
        (t) => ({dir: x < -0.75 ? 1 : -1, expr: Math.sin(t * 2 + x) > 0.3 ? 'happy' : 'surprise', mouth: 0.3, holdL: 'phone', armL: [30, -100], armR: point ? [-120 - Math.sin(t * 5) * 8, -10] : [-12, -8], look: 0, lean: 2}),
      ),
    );
    a.facesZ = -1;
    return a;
  };
  gatherer(PEOPLE[0], -2.1, 0.75, 24.8, true);
  gatherer(SCROLLER, -1.25, 0.65, 24.9, false);
  gatherer(PEOPLE[6], -0.35, 0.8, 25.0, true);
  gatherer(PEOPLE[3], 0.55, 0.7, 25.1, false);
  // customers coming in through the door
  const customer = (s: Spec, t0: number, xEnd: number, zEnd: number) =>
    add(
      new Actor(
        root,
        s,
        logo,
        (t) => {
          if (t < t0 || t > 31) return null;
          const u = clamp((t - t0) / 1.6);
          if (u < 0.45) return {x: lerp(4.5, 2.1, u / 0.45), z: 1.2};
          return {x: lerp(2.1, xEnd, (u - 0.45) / 0.55), z: lerp(1.2, zEnd, (u - 0.45) / 0.55)};
        },
        (t) => {
          const moving = t < t0 + 1.6;
          return {dir: -1, walk: moving ? t * 5 : 0, amp: moving ? 1 : 0, bob: moving ? 6 : 0, expr: 'happy', look: -0.5, lean: 2};
        },
      ),
    );
  customer(PEOPLE[2], 26.3, 0.4, -2.5);
  customer(PEOPLE[5], 26.8, 1.0, -4.2);
  customer(PEOPLE[1], 27.4, -0.3, -4.6);

  // ================= the cat on the vitrine
  add(new Actor(root, PEOPLE[0], null, () => ({x: 2.3, y: 1.44, z: -2.55}), () => ({}), 1.1, (g, t) => drawCat(g, t, 11.25, 11.1), -1));

  // ================= props: tweezers over the bench ring, sparkles, flying posts, streak
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

  // social posts flying out of the shop
  const postTex = (k: number) =>
    tex(256, 320, (g, w, h) => {
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.roundRect(0, 0, w, h, 18);
      g.fill();
      const bg = g.createLinearGradient(0, 0, 0, 230);
      bg.addColorStop(0, ['#2b3a63', '#5a1f35', '#2f6b6a'][k % 3]);
      bg.addColorStop(1, '#1a1f33');
      g.fillStyle = bg;
      g.beginPath();
      g.roundRect(12, 12, w - 24, 220, 12);
      g.fill();
      g.strokeStyle = '#d4a94a';
      g.lineWidth = 10;
      g.beginPath();
      g.arc(w / 2, 130, 44, 0, 7);
      g.stroke();
      g.fillStyle = ['#7fd3ff', '#e8344c', '#4ce0a0'][k % 3];
      g.beginPath();
      g.moveTo(w / 2, 62);
      g.lineTo(w / 2 + 20, 84);
      g.lineTo(w / 2, 100);
      g.lineTo(w / 2 - 20, 84);
      g.closePath();
      g.fill();
      g.fillStyle = '#e8342a';
      g.font = 'bold 34px sans-serif';
      g.fillText('♥', 22, 284);
      g.fillStyle = '#3d3a45';
      g.fillRect(66, 262, 120, 12);
      g.fillRect(66, 284, 80, 10);
    });
  const posts = [0, 1, 2, 3, 4, 5].map((k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.75), new THREE.MeshBasicMaterial({map: postTex(k), transparent: true, side: THREE.DoubleSide}));
    m.visible = false;
    root.add(m);
    return m;
  });
  const postTargets = [[-5.5, 1.7, 3.0], [-3.2, 1.9, 2.4], [-1.0, 1.6, 3.2], [3.6, 1.8, 2.6], [5.8, 1.6, 2.0], [7.5, 2.0, 3.1]];

  const streak = new Tube(root, 0.09);

  // ================= shots
  const quiffX = () => -0.85;
  const SH: Shot[] = [
    // GANCIO
    {t: 0.0, p0: [-0.7, 1.7, 3.6], p1: [-0.75, 1.75, 2.8], l0: [-0.75, 1.55, -0.5], l1: [-0.75, 1.6, -0.5], fov: 50, ap: 0.005},
    {t: 1.0, p0: [-6.6, 0.8, 8.6], p1: [-5.2, 0.85, 8.2], l0: [-0.5, 2.3, 0], l1: [-0.4, 2.3, 0], fov: 50, ap: 0.003, foc: [-0.75, 2.0, 0]},
    {t: 2.2, p0: [0, 1.6, 4.9], p1: [0, 1.6, 4.6], l0: [0, 1.45, 1.0], l1: [0, 1.45, 1.0], fov: 40, ap: 0.008, foc: [0, 1.5, 1.35], fx: (t) => -4.6 + 1.25 * (t - 1.9) + 0.25},
    {t: 3.1, p0: [-1.35, 1.6, -0.85], p1: [-1.38, 1.62, -0.7], l0: [-1.4, 1.6, 1.4], l1: [-1.4, 1.62, 1.0], fov: 42, ap: 0.008, foc: [-1.4, 1.6, 1.0]},
    {t: 4.4, p0: [-1.38, 1.66, -0.75], p1: [-1.4, 1.67, -0.62], l0: [-1.4, 1.58, 0.75], l1: [-1.4, 1.6, 0.75], fov: 42, ap: 0.01, foc: [-1.4, 1.64, 0.75]},
    {t: 5.6, p0: [1.2, 2.7, 11.6], p1: [0.8, 2.55, 10.6], l0: [-0.2, 2.1, 0], l1: [-0.2, 2.0, 0], fov: 48, ap: 0.0},
    // IL TITOLARE
    {t: 7.0, p0: [-1.42, 1.78, -2.15], p1: [-1.48, 1.74, -2.45], l0: [-1.6, 1.58, -3.85], l1: [-1.6, 1.58, -3.85], fov: 36, ap: 0.01},
    {t: 8.4, p0: [-1.12, 1.6, -2.15], p1: [-1.17, 1.55, -2.3], l0: [-1.35, 1.24, -2.95], l1: [-1.35, 1.24, -2.95], fov: 30, ap: 0.016},
    {t: 9.6, p0: [0.9, 1.6, -1.5], p1: [0.7, 1.6, -1.75], l0: [-1.4, 1.5, -3.6], l1: [-1.45, 1.5, -3.6], fov: 30, ap: 0.006, foc: [-1.6, 1.6, -3.85]},
    {t: 10.8, p0: [2.22, 1.78, -1.25], p1: [2.26, 1.75, -1.55], l0: [2.3, 1.78, -2.55], l1: [2.3, 1.76, -2.55], fov: 32, ap: 0.012},
    // ARRIVA VELOCE
    {t: 12.0, p0: [-2.2, 1.2, 7.4], p1: [-2.0, 1.25, 7.2], l0: [0, 0, 0], l1: [0, 0, 0], fov: 46, ap: 0.002, lf: (t) => [Math.max(-14, (heroPos(t)?.x ?? -14) + 1.2), 1.25, 2.6]},
    {t: 12.8, p0: [2.5, 1.35, 6.2], p1: [2.35, 1.4, 5.3], l0: [2.0, 1.55, 0], l1: [2.0, 1.55, 0], fov: 42, ap: 0.004, foc: [2.15, 1.3, 2.4], roll: 3},
    {t: 13.8, p0: [2.2, 1.6, 4.7], p1: [2.18, 1.58, 4.25], l0: [2.15, 1.45, 2.4], l1: [2.15, 1.45, 2.4], fov: 34, ap: 0.01},
    // IL SERVIZIO
    {t: 15.0, p0: [1.05, 1.85, -1.15], p1: [0.95, 1.8, -1.35], l0: [-1.6, 1.5, -3.85], l1: [-1.6, 1.52, -3.85], fov: 40, ap: 0.006, foc: [-1.6, 1.6, -3.85]},
    {t: 16.3, p0: [-1.5, 1.66, -2.3], p1: [-1.53, 1.65, -2.5], l0: [-1.6, 1.62, -3.85], l1: [-1.6, 1.62, -3.85], fov: 34, ap: 0.01},
    {t: 17.4, p0: [-1.12, 1.6, -2.15], p1: [-1.16, 1.56, -2.28], l0: [-1.35, 1.24, -2.95], l1: [-1.35, 1.24, -2.95], fov: 28, ap: 0.016},
    {t: 18.6, p0: [1.9, 1.85, -0.6], p1: [1.6, 1.8, -0.85], l0: [-0.8, 1.4, -3.2], l1: [-0.8, 1.4, -3.2], fov: 46, ap: 0.004, foc: [0.1, 1.3, -2.4]},
    {t: 19.8, p0: [-0.2, 1.7, -1.6], p1: [-0.25, 1.7, -1.7], l0: [-1.4, 1.5, -3.6], l1: [-1.4, 1.5, -3.6], fov: 40, ap: 0.02},
    {t: 21.2, p0: [0.6, 1.8, 9.8], p1: [0.9, 2.2, 10.6], l0: [0.9, 1.9, 1.2], l1: [0.9, 1.9, 1.2], fov: 50, ap: 0.0},
    {t: 22.8, p0: [-1.0, 1.6, 4.4], p1: [-1.0, 1.6, 4.3], l0: [-1.0, 1.6, 3.2], l1: [-1.0, 1.6, 3.2], fov: 40, ap: 0.02},
    {t: 24.0, p0: [-1.05, 1.62, 5.6], p1: [-1.08, 1.62, 5.25], l0: [-1.0, 1.55, 3.2], l1: [-1.0, 1.55, 3.2], fov: 42, ap: 0.01},
    // RISULTATO
    {t: 25.2, p0: [-1.35, 1.62, -0.85], p1: [-1.38, 1.62, -0.7], l0: [-1.0, 1.6, 1.2], l1: [-1.0, 1.6, 1.0], fov: 50, ap: 0.006, foc: [-0.75, 1.6, 0.8]},
    {t: 26.6, p0: [1.3, 1.75, -4.3], p1: [1.35, 1.75, -4.0], l0: [1.9, 1.5, 0.5], l1: [1.9, 1.5, 0.5], fov: 46, ap: 0.004, foc: [2.0, 1.5, 0.6]},
    {t: 27.8, p0: [-1.0, 1.7, -1.6], p1: [-1.0, 1.7, -1.7], l0: [-1.4, 1.3, -3.2], l1: [-1.4, 1.3, -3.2], fov: 40, ap: 0.02},
    {t: 29.2, p0: [3.0, 2.3, -1.2], p1: [2.9, 2.25, -1.45], l0: [-0.8, 1.4, -3.4], l1: [-0.7, 1.4, -3.4], fov: 56, ap: 0.003, foc: [-0.6, 1.5, -3.0]},
    {t: 30.4, p0: [3.4, 1.5, 6.4], p1: [4.4, 1.5, 6.2], l0: [3.0, 1.3, 1.2], l1: [6.0, 1.3, 1.2], fov: 46, ap: 0.0},
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
        if (s.lf) {
          const q = s.lf(t);
          l[0] = q[0];
          l[1] = q[1];
          l[2] = q[2];
        }
        if (s.fx) {
          const dx = s.fx(t);
          p[0] += dx;
          l[0] += dx;
        }
        // impact kick when the hero brakes
        const kick = t > 12.78 && t < 12.98 ? Math.sin((t - 12.78) * 150) * 0.035 * (1 - (t - 12.78) / 0.2) : 0;
        cam.position.set(p[0], p[1] + kick, p[2]);
        cam.lookAt(l[0], l[1], l[2]);
        if (s.roll) cam.rotateZ((s.roll * Math.PI) / 180);
        cam.fov = lerp(s.fov, s.fov1 ?? s.fov, e);
        focusPt = s.foc || l;
        ap = s.ap;
      }
      cam.updateProjectionMatrix();

      // door opens for the customers
      J.doorPivot.rotation.y = t > 26.6 && t < 30 ? -1.2 * sm((t - 26.6) / 0.5) * (1 - sm((t - 29.4) / 0.6)) : 0;
      // the gem being set with the tweezers
      const work = (t > 7 && t < 10.8) || (t > 17.4 && t < 18.6) || (t > 27.8 && t < 29.2);
      tweezers.visible = work;
      tweezers.position.y = 1.32 + 0.03 * Math.sin(t * 5);
      for (const m of J.gemMats) m.emissiveIntensity = 0.45 + 0.25 * Math.sin(t * 7);
      // glints that pop one after another
      sparkles.forEach(({s, phase}, i) => {
        const c = ((t + phase) % 1.7) / 1.7;
        const a = c < 0.25 ? Math.sin((c / 0.25) * Math.PI) : 0;
        s.visible = a > 0.01;
        s.scale.setScalar((i === sparkles.length - 1 ? 0.12 : 0.28) * a);
        s.material.rotation = t * 2 + i;
      });

      // hero streaks
      const pts: THREE.Vector3[] = [];
      const trailWin = (t > 12.0 && t < 13.3) || (t > 30.4 && t < 31.2);
      if (trailWin) {
        for (let k = 0; k <= 0.6; k += 0.03) {
          const p = heroPos(Math.min(t, t > 30 ? 30.95 : 12.78) - k);
          if (p) pts.push(new THREE.Vector3(p.x, 1.15 + 0.08 * Math.sin(k * 14), p.z));
        }
        streak.set(pts, t > 13.0 && t < 14 ? 1 - sm((t - 13.0) / 0.3) : 1, 0.09);
      } else streak.set([]);

      // posts fly out of the door to the people on the street
      posts.forEach((m, k) => {
        const t0 = 21.35 + k * 0.17;
        const u = clamp((t - t0) / 1.1);
        m.visible = t > t0 && t < 22.8;
        if (!m.visible) return;
        const a = new THREE.Vector3(2.1, 1.6, 0.4);
        const b = new THREE.Vector3(...(postTargets[k] as [number, number, number]));
        const c = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 1.4, 1.2));
        const e = sm(u);
        const p = a.clone().multiplyScalar((1 - e) * (1 - e)).add(c.multiplyScalar(2 * (1 - e) * e)).add(b.clone().multiplyScalar(e * e));
        m.position.copy(p);
        m.lookAt(cam.position);
        m.rotateZ(Math.sin(t * 6 + k) * 0.2);
        m.scale.setScalar(lerp(0.4, 1.0, Math.sin(u * Math.PI)) + 0.2);
      });

      for (const a of actors) a.update(t, cam);
      const fd = cam.position.distanceTo(new THREE.Vector3(focusPt[0], focusPt[1], focusPt[2]));
      return {focus: fd, aperture: ap};
    },
  };
}
