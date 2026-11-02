// "Il negozio che non si vedeva" — opening 10 s, rebuilt shot by shot.
// Rhythm taken from the reference channel: a cut or a strong move every ~0.9 s,
// macro <-> wide contrast, deadpan animal reaction, physical gag on the hook line.
import * as THREE from 'three';
import {World} from './world';
import {Actor, at, K} from './story';
import {OWNER, PEOPLE} from './specs';
import {Spec, Pose, drawCat} from './toon';
import {setFade, sm, lerp, clamp, tex} from './kit';

export interface HookStory {
  world: World;
  update(t: number, cam: THREE.PerspectiveCamera, testCam?: number[]): {focus: number; aperture: number};
}

const SUIT: Spec = {skin: '#f2c9a0', hair: '#2a1d16', hairStyle: 'short', shirt: '#33415c', pants: '#262b3a', shoes: '#1b1a22', scarf: '#c0392b'};
const TEEN: Spec = {skin: '#e2a878', hair: '#1d1512', hairStyle: 'beanie', hat: '#2f9db0', shirt: '#f0b13a', pants: '#3b4a6b', shoes: '#f1f1f1', scale: 0.95};
const LADY: Spec = {skin: '#f2c9a0', hair: '#b8b8c0', hairStyle: 'bun', shirt: '#8a62c9', pants: '#5a3f6e', shoes: '#2a2a33', skirt: true, glasses: true, scale: 0.93};

interface Shot {
  t: number;
  p0: number[];
  p1: number[];
  l0: number[];
  l1: number[];
  fov: number;
  fov1?: number;
  ap: number; // lens blur strength
  foc?: number[]; // focus point (default: look target)
  roll?: number;
}

export function createHook(world: World, logo: HTMLImageElement): HookStory {
  const root = world.root;
  Actor.RES = 2;

  // ---- golden hour: low warm sun from the left, peach horizon, violet shade
  world.sun.color.set('#ffc98f');
  world.sun.intensity = 3.6;
  world.sun.position.set(-26, 11, 18);
  root.traverse((o) => {
    if ((o as THREE.HemisphereLight).isHemisphereLight) {
      const h = o as THREE.HemisphereLight;
      h.color.set('#b9c6ff');
      h.groundColor.set('#b98f6a');
      h.intensity = 1.6;
    }
  });
  const sky = root.children[0] as THREE.Mesh;
  const su = (sky.material as THREE.ShaderMaterial).uniforms;
  su.top.value.set('#4f8ade');
  su.hor.value.set('#ffd2a0');
  world.fogColor.set('#f4c9a0');

  // warm interior light so the shop's insides glow even as a "ghost"
  const inner = new THREE.PointLight('#ffb35c', 3, 9, 1.6);
  inner.position.set(1.2, 3.2, -2.4);
  root.add(inner);

  const actors: Actor[] = [];
  const add = (a: Actor) => (actors.push(a), a);

  // ---- the owner: polishes the same lamp, forever
  add(
    new Actor(
      root,
      OWNER,
      logo,
      () => ({x: -0.42, z: -0.72}),
      (t): Pose => {
        const c = t * 9;
        const proud = t < 2.5;
        return {
          dir: -1,
          expr: t > 1.0 && t < 1.5 ? 'happy' : proud ? 'proud' : 'smile',
          armL: [118 + Math.sin(c) * 10, -28 + Math.cos(c) * 14],
          armR: [40 + Math.sin(c * 0.5) * 4, -60],
          holdL: 'rag',
          look: -0.8,
          lean: 4 + Math.sin(c) * 1.2,
          tilt: Math.sin(t * 2.2) * 3,
          blink: (t % 2.7) < 0.12,
        };
      },
      2.37,
      undefined,
      -1,
    ),
  );

  // ---- crowd on the pavement: nobody looks at the shop
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
  walker(PEOPLE[0], -9, 2.9, 1.5, 0, 10);
  walker(PEOPLE[2], 7, 1.9, -1.35, 0, 10);
  walker(PEOPLE[3], -12, 2.2, 1.6, 1.5, 10, null);
  walker(PEOPLE[6], 9, 3.2, -1.5, 0.2, 10);
  walker(PEOPLE[5], -8, 4.7, 1.2, 2.0, 10, null); // close to the lens in the street shot (foreground blur)
  walker(PEOPLE[1], 10, 2.6, -1.4, 4.5, 10);

  // ---- the man in the suit walks straight through the wall (and the shop, and out the back)
  const suitZ = (t: number) => 3.6 - 2.05 * (t - 2.6);
  add(
    new Actor(
      root,
      SUIT,
      logo,
      (t) => (t > 2.6 && t < 8.2 ? {x: -3.0, z: suitZ(t)} : null),
      (t) => ({dir: 1, walk: t * 7, amp: 1, bob: 7, lean: 5, expr: 'neutral', holdL: 'phone', armL: [28, -104], look: 0}),
    ),
  );
  // ---- the lady crosses the whole shop sideways, through both side walls
  add(
    new Actor(
      root,
      LADY,
      logo,
      (t) => (t > 5.5 && t < 10 ? {x: 5.2 - 1.25 * (t - 5.5), z: -2.3} : null),
      (t) => ({dir: -1, walk: t * 4.4, amp: 0.8, bob: 5, lean: 3, expr: 'neutral', holdR: 'bag', armR: [-10, -20]}),
    ),
  );
  // ---- the teen leans on the wall that isn't there
  const teenKeys: K[] = [
    {t: 5.0, x: 4.6, z: 0.55, rz: 0},
    {t: 6.25, x: 2.75, z: 0.55, rz: 0, lin: true},
    {t: 6.42, x: 2.72, z: 0.5, rz: 0},
    {t: 6.85, x: 2.35, z: -0.4, rz: 1.35},
    {t: 7.9, x: 2.35, z: -0.4, rz: 1.35},
    {t: 8.4, x: 2.3, z: -0.5, rz: 0},
    {t: 10, x: 0.6, z: -3.6, rz: 0},
  ];
  add(
    new Actor(
      root,
      TEEN,
      logo,
      (t) => (t < 5.0 ? null : at(teenKeys, t)),
      (t): Pose => {
        if (t < 6.25) return {dir: -1, walk: t * 6, amp: 1, bob: 7, lean: 3, expr: 'neutral', holdL: 'phone', armL: [30, -100]};
        if (t < 6.42) return {dir: -1, expr: 'smile', armR: [-95, -10], armL: [30, -100], holdL: 'phone', lean: -8};
        if (t < 7.9) return {dir: -1, expr: 'surprise', mouth: 0.9, armR: [-150, 20], armL: [150, -20], holdL: null, legL: [40, 0], legR: [-30, 0]};
        if (t < 8.4) return {dir: -1, expr: 'oops', armL: [10, -20], armR: [-10, -20]};
        return {dir: -1, walk: t * 6, amp: 1, bob: 6, expr: 'worry', armL: [10, -20], armR: [-10, -20], lean: 3};
      },
    ),
  );
  // ---- the cat, deadpan, on the window sill
  add(new Actor(root, PEOPLE[0], null, () => ({x: 0.55, y: 0.63, z: -0.12}), () => ({}), 1.1, (g, t) => drawCat(g, t, 5.62), -1));

  // ---- sparkles on the lamp
  const starTex = tex(128, 128, (g) => {
    g.translate(64, 64);
    g.fillStyle = '#fffbe8';
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 ? 9 : 60;
      const a = (i / 8) * Math.PI * 2;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
  });
  const sparkles = [0, 1, 2].map(() => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: starTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
    s.visible = false;
    root.add(s);
    return s;
  });
  const sparkAt = [0.35, 1.25, 8.35];

  // ---- shots (a cut every ~0.9 s, every shot moves)
  const SH: Shot[] = [
    // A macro: the lamp, warm, almost a jewel
    {t: 0.0, p0: [-0.7, 1.5, 2.9], p1: [-0.8, 1.56, 2.25], l0: [-1.0, 1.58, -1.0], l1: [-1.0, 1.6, -1.0], fov: 38, ap: 0.01},
    // B owner's proud face, lamp blurred in the foreground
    {t: 0.7, p0: [-1.65, 1.8, 0.9], p1: [-1.45, 1.8, 0.7], l0: [-0.42, 1.62, -0.72], l1: [-0.42, 1.64, -0.72], fov: 40, ap: 0.01},
    // C low-angle hero shot of the craftsman, orbiting
    {t: 1.6, p0: [0.75, 0.75, 1.0], p1: [0.25, 0.8, 1.35], l0: [-0.7, 1.65, -0.9], l1: [-0.7, 1.7, -0.9], fov: 42, ap: 0.004, roll: -4},
    // D street, knee height: the shop is only an outline, people walk past
    {t: 2.45, p0: [-6.4, 0.75, 7.2], p1: [-4.6, 0.8, 7.0], l0: [-1.5, 2.2, 0], l1: [-1.0, 2.2, 0], fov: 50, ap: 0.003, foc: [-1.5, 1.5, 1.5]},
    // E inside, looking out: the suit walks at us, phone in face
    {t: 3.4, p0: [-2.6, 1.5, -2.6], p1: [-2.65, 1.48, -2.2], l0: [-3.0, 1.4, 2.0], l1: [-3.0, 1.4, 1.2], fov: 40, ap: 0.006, foc: [-3.0, 1.4, 1.2]},
    // F side view along the facade: he crosses the wall line
    {t: 4.3, p0: [3.4, 1.3, 1.6], p1: [3.1, 1.3, 1.3], l0: [-2.2, 1.25, -0.3], l1: [-2.4, 1.25, -0.6], fov: 44, ap: 0.003, foc: [-3.0, 1.3, 0]},
    // G the cat: deadpan into the lens
    {t: 5.2, p0: [0.58, 1.08, 1.75], p1: [0.57, 1.07, 1.45], l0: [0.55, 1.0, -0.12], l1: [0.55, 1.0, -0.12], fov: 30, ap: 0.012},
    // H the teen leans on the wall that is not there
    {t: 6.05, p0: [3.2, 1.25, 5.0], p1: [3.0, 1.2, 4.7], l0: [2.3, 0.95, 0.2], l1: [2.2, 0.85, 0.0], fov: 42, ap: 0.003},
    // I the owner, calm, keeps polishing (the fall happens behind him, blurred)
    {t: 7.0, p0: [0.35, 1.72, 1.6], p1: [0.25, 1.72, 1.35], l0: [-0.42, 1.62, -0.72], l1: [-0.42, 1.63, -0.72], fov: 38, ap: 0.01},
    // J macro: the rag on the shade
    {t: 7.8, p0: [-0.35, 1.95, 1.6], p1: [-0.5, 1.9, 1.15], l0: [-0.85, 1.8, -0.9], l1: [-0.85, 1.8, -0.9], fov: 34, ap: 0.012},
    // K crane up and out: the whole absurd scene
    {t: 8.9, p0: [1.0, 3.0, 8.6], p1: [1.4, 6.2, 12.5], l0: [-0.4, 1.6, -0.8], l1: [-0.2, 1.4, -1.2], fov: 46, fov1: 50, ap: 0.0},
  ];
  const END = 10.0;

  return {
    world,
    update(t, cam, testCam) {
      let focusPt: number[] = [0, 1.5, 0];
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
        const t1 = i < SH.length - 1 ? SH[i + 1].t : END;
        // ease-out move: fast start, settles (feels like a push), never fully static
        const u = clamp((t - s.t) / (t1 - s.t));
        const e = 1 - Math.pow(1 - u, 2.2);
        const p = s.p0.map((x, j) => lerp(x, s.p1[j], e));
        const l = s.l0.map((x, j) => lerp(x, s.l1[j], e));
        // impact kick when the teen hits the floor
        const kick = t > 6.82 && t < 7.0 ? Math.sin((t - 6.82) * 140) * 0.03 * (1 - (t - 6.82) / 0.18) : 0;
        cam.position.set(p[0], p[1] + kick, p[2]);
        cam.lookAt(l[0], l[1], l[2]);
        if (s.roll) cam.rotateZ((s.roll * Math.PI) / 180);
        cam.fov = lerp(s.fov, s.fov1 ?? s.fov, e);
        focusPt = s.foc || l;
        ap = s.ap;
      }
      cam.updateProjectionMatrix();

      setFade(world.shop, 0.06, 0.75);
      setFade(world.ghost2, 0.06, 0.6);
      world.lamp.position.set(-1.0, 0.86, -1.0);
      world.lampShade.emissive.set('#ffb457');
      world.lampShade.emissiveIntensity = 0.14 + 0.03 * Math.sin(t * 3);
      world.lampLight.intensity = 0.6;
      (world.lampGlow.material as THREE.SpriteMaterial).opacity = 0.4;
      world.lampGlow.scale.setScalar(1.5);
      for (const p of world.pendants) p.emissiveIntensity = 1.2;
      world.boxes.visible = false;

      sparkles.forEach((s, k) => {
        const d = t - sparkAt[k];
        s.visible = d > 0 && d < 0.45;
        if (s.visible) {
          const a = Math.sin((d / 0.45) * Math.PI);
          s.position.set(-1.0 + [0.28, -0.3, 0.22][k], 0.86 + [1.25, 1.05, 1.3][k], -0.7);
          s.scale.setScalar(0.35 * a);
          s.material.rotation = d * 3;
        }
      });

      for (const a of actors) a.update(t, cam);
      const fd = cam.position.distanceTo(new THREE.Vector3(focusPt[0], focusPt[1], focusPt[2]));
      return {focus: fd, aperture: ap};
    },
  };
}
