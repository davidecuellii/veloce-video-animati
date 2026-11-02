// The jewellery shop that replaces the lamp shop: elegant, lit, and ignored.
import * as THREE from 'three';
import {World, makeLamp} from './world';
import {solid, toon, tex, rnd} from './kit';

export interface Jewelry {
  group: THREE.Group;
  sparkleSpots: THREE.Vector3[]; // where glints pop in the window
  gemMats: THREE.MeshToonMaterial[];
  windowGlass: THREE.Mesh;
  deskLamp: THREE.Group;
  doorPivot: THREE.Group;
  benchRing: THREE.Group;
}

const NAVY = '#1f2f4f';
const GOLD = '#d4a94a';
const CREAM = '#f3ead8';
const VELVET = '#5a1f35';

function diamondIcon(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = GOLD;
  g.strokeStyle = '#7a5a1c';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(-40, -14);
  g.lineTo(-22, -34);
  g.lineTo(22, -34);
  g.lineTo(40, -14);
  g.lineTo(0, 34);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(-40, -14);
  g.lineTo(40, -14);
  g.moveTo(-12, -34);
  g.lineTo(-18, -14);
  g.lineTo(0, 34);
  g.lineTo(18, -14);
  g.lineTo(12, -34);
  g.stroke();
  g.restore();
}

export function buildJewelry(world: World): Jewelry {
  // retire the old lamp shop and the props of the previous story
  world.shopGroup.visible = false;
  world.lamp.visible = false;
  world.boxes.visible = false;
  const group = new THREE.Group();
  world.root.add(group);
  const r = rnd(11);

  const navy = toon(NAVY);
  const gold = toon(GOLD, null, {emissive: new THREE.Color('#5a3c08'), emissiveIntensity: 0.25});
  const cream = toon(CREAM);
  const marble = toon('#ffffff', tex(256, 256, (g, w, h) => {
    g.fillStyle = '#f1ebe0';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(150,140,130,.35)';
    g.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      let x = r() * w;
      let y = 0;
      g.moveTo(x, y);
      while (y < h) {
        x += (r() - 0.5) * 30;
        y += 20;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  }));
  const P = (gg: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material | THREE.Material[]) => solid(gg, new THREE.BoxGeometry(w, h, d), m, [x, y, z]);

  // ---------------- facade (front plane z = 0) ----------------
  const D = 6.5;
  P(group, 1.1, 5.2, 0.5, -3.15, 2.6, -0.05, navy); // left pier
  P(group, 1.1, 5.2, 0.5, 3.15, 2.6, -0.05, navy); // right pier
  P(group, 0.3, 2.9, 0.5, 1.35, 1.45, -0.05, navy); // between window and door
  P(group, 3.7, 0.75, 0.5, -0.75, 0.375, -0.05, marble); // marble sill below the window
  const signTex = tex(1024, 220, (g, w, h) => {
    g.fillStyle = NAVY;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = GOLD;
    g.lineWidth = 8;
    g.strokeRect(18, 18, w - 36, h - 36);
    g.lineWidth = 3;
    g.strokeRect(34, 34, w - 68, h - 68);
    diamondIcon(g, w / 2, h / 2, 1.5);
    for (const sx of [-1, 1]) {
      g.strokeStyle = GOLD;
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(w / 2 + sx * 110, h / 2);
      g.lineTo(w / 2 + sx * 380, h / 2);
      g.stroke();
      g.fillStyle = GOLD;
      g.beginPath();
      g.arc(w / 2 + sx * 400, h / 2, 9, 0, 7);
      g.fill();
    }
  });
  P(group, 7.4, 1.6, 0.6, 0, 4.0, 0.0, [navy, navy, navy, navy, toon('#ffffff', signTex), navy]);
  P(group, 7.7, 0.35, 0.9, 0, 4.95, 0.05, gold); // gilded cornice
  P(group, 7.5, 0.12, 0.62, 0, 3.22, 0.02, gold); // gold lintel strip
  P(group, 3.8, 0.1, 0.6, -0.75, 0.78, 0.02, gold); // gold sill strip
  // walls above, so the shop sits in the row
  P(group, 7.4, 2.4, 6.5, 0, 6.3, -3.3, toon('#e8d9bd'));
  // door: a glass door on a pivot (opens when customers come in)
  const doorPivot = new THREE.Group();
  doorPivot.position.set(1.55, 0.12, 0.0);
  group.add(doorPivot);
  // glass door: the inverted-hull ink would show through the glass as a black slab, so no hull here
  const dglass = new THREE.MeshToonMaterial({color: '#bcd8e8', transparent: true, opacity: 0.3, depthWrite: false});
  solid(doorPivot, new THREE.BoxGeometry(1.1, 2.95, 0.08), [gold, gold, gold, gold, dglass, dglass], [0.55, 1.47, 0], {ink: false});
  for (const [w, h, x, y] of [[1.1, 0.08, 0.55, 2.95], [1.1, 0.08, 0.55, 0.0], [0.08, 2.95, 0.0, 1.47], [0.08, 2.95, 1.1, 1.47]]) P(doorPivot, w, h, 0.1, x, y, 0, gold);
  P(doorPivot, 0.05, 0.7, 0.08, 0.95, 1.35, 0.06, gold);
  // sconces + topiaries
  for (const sx of [0.95, 3.0]) {
    P(group, 0.18, 0.34, 0.18, sx + (sx > 2 ? 0.2 : -0.3), 2.6, 0.32, toon('#ffe2a0', null, {emissive: new THREE.Color('#ffb84a'), emissiveIntensity: 0.8}));
  }
  for (const tx of [-3.2, 3.35]) {
    solid(group, new THREE.CylinderGeometry(0.28, 0.22, 0.55, 16), toon('#2a2a33'), [tx, 0.45, 0.6]);
    solid(group, new THREE.SphereGeometry(0.42, 16, 12), toon('#3f8a4a'), [tx, 1.15, 0.6]);
  }

  // ---------------- window display ----------------
  P(group, 3.7, 2.5, 0.12, -0.75, 2.0, -1.05, toon(VELVET)); // velvet back panel
  P(group, 3.7, 0.1, 1.1, -0.75, 0.75, -0.5, toon(VELVET));
  const gemMats: THREE.MeshToonMaterial[] = [];
  const gem = (c: string) => {
    const m = toon(c, null, {emissive: new THREE.Color(c), emissiveIntensity: 0.6});
    gemMats.push(m);
    return m;
  };
  const sparkleSpots: THREE.Vector3[] = [];
  const plinth = toon('#2b3354');
  const pedestal = (x: number, h: number, w = 0.7) => P(group, w, h, 0.55, x, 0.8 + h / 2, -0.55, plinth);
  pedestal(-2.0, 0.55);
  pedestal(-0.75, 0.95);
  pedestal(0.5, 0.4);
  // necklace bust on the tall pedestal
  const bust = new THREE.LatheGeometry([0.02, 0.17, 0.2, 0.12, 0.09, 0.1, 0.0].map((rr, i) => new THREE.Vector2(rr, i * 0.11)), 24);
  solid(group, bust, toon('#3a2030'), [-0.75, 1.75, -0.55], {scale: [0.75, 0.75, 0.75]});
  solid(group, new THREE.TorusGeometry(0.16, 0.022, 8, 32, Math.PI), gold, [-0.75, 2.1, -0.45], {rot: [Math.PI, 0, 0], scale: [0.75, 0.75, 0.75]});
  solid(group, new THREE.OctahedronGeometry(0.06), gem('#e8344c'), [-0.75, 1.98, -0.4]);
  sparkleSpots.push(new THREE.Vector3(-0.75, 2.0, -0.33));
  // ring boxes
  for (const [x, y, c] of [[-2.0, 1.35, '#7fd3ff'], [0.5, 1.2, '#4ce0a0']] as const) {
    P(group, 0.34, 0.22, 0.3, x, y + 0.11, -0.5, toon('#16243f'));
    solid(group, new THREE.TorusGeometry(0.09, 0.025, 10, 28), gold, [x, y + 0.32, -0.45]);
    solid(group, new THREE.OctahedronGeometry(0.055), gem(c), [x, y + 0.43, -0.45]);
    sparkleSpots.push(new THREE.Vector3(x, y + 0.45, -0.38));
  }
  // bracelets and earrings on the base
  solid(group, new THREE.TorusGeometry(0.15, 0.03, 10, 32), gold, [-1.4, 0.88, -0.35], {rot: [-1.2, 0, 0]});
  solid(group, new THREE.TorusGeometry(0.12, 0.03, 10, 32), toon('#e8e8f0'), [1.0, 0.86, -0.35], {rot: [-1.3, 0, 0]});
  sparkleSpots.push(new THREE.Vector3(-1.4, 0.98, -0.25), new THREE.Vector3(1.0, 0.95, -0.25));
  // little spotlights in the window head
  for (let i = 0; i < 4; i++) solid(group, new THREE.SphereGeometry(0.07, 10, 8), toon('#fff3c4', null, {emissive: new THREE.Color('#ffe08a'), emissiveIntensity: 0.9}), [-2.3 + i * 1.05, 3.08, -0.4]);
  const winLight = new THREE.PointLight('#ffe3a8', 1.6, 4, 1.8);
  winLight.position.set(-0.75, 2.9, -0.2);
  group.add(winLight);

  // glass pane with painted reflections
  const glassTex = tex(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(200,225,255,0.05)';
    g.fillRect(0, 0, w, h);
    for (const [x0, ww, a] of [[60, 70, 0.14], [170, 26, 0.1], [330, 110, 0.09], [460, 20, 0.12]]) {
      g.fillStyle = `rgba(255,255,255,${a})`;
      g.beginPath();
      g.moveTo(x0, h);
      g.lineTo(x0 + ww, h);
      g.lineTo(x0 + ww + 260, 0);
      g.lineTo(x0 + 260, 0);
      g.closePath();
      g.fill();
    }
  });
  const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 2.42), new THREE.MeshBasicMaterial({map: glassTex, transparent: true, depthWrite: false, side: THREE.DoubleSide}));
  windowGlass.position.set(-0.75, 2.0, 0.0);
  windowGlass.renderOrder = 5;
  group.add(windowGlass);

  // ---------------- interior ----------------
  const floorTex = tex(256, 256, (g, w, h) => {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.fillStyle = (i + j) % 2 ? '#e9e1d2' : '#2d3550';
      g.fillRect(i * 64, j * 64, 64, 64);
    }
  }, [6, 5]);
  solid(group, new THREE.BoxGeometry(7.2, 0.2, D), toon('#ffffff', floorTex), [0, 0.02, -D / 2 - 0.2], {ink: false});
  const wall = toon('#efe2c6');
  P(group, 7.4, 5, 0.3, 0, 2.5, -D - 0.2, wall);
  P(group, 0.3, 5, D, -3.6, 2.5, -D / 2 - 0.2, wall);
  P(group, 0.3, 5, D, 3.6, 2.5, -D / 2 - 0.2, wall);
  P(group, 7.2, 0.3, D, 0, 4.95, -D / 2 - 0.2, cream);
  // gilded mirrors / frames on the back wall
  for (const fx of [-2.2, 0, 2.2]) {
    P(group, 1.2, 1.6, 0.08, fx, 2.7, -D + 0.0, gold);
    P(group, 1.0, 1.4, 0.1, fx, 2.7, -D + 0.02, toon('#c9dbe6'));
  }
  // glass vitrine counters along the right
  for (const [vx, vz] of [[2.3, -2.6], [2.3, -4.4]]) {
    P(group, 1.5, 0.85, 1.4, vx, 0.55, vz, toon('#4a2c22'));
    P(group, 1.52, 0.08, 1.42, vx, 1.0, vz, gold);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.4, 1.35), new THREE.MeshBasicMaterial({color: '#cfe6f2', transparent: true, opacity: 0.25, depthWrite: false}));
    glass.position.set(vx, 1.24, vz);
    group.add(glass);
    for (let k = 0; k < 3; k++) solid(group, new THREE.TorusGeometry(0.07, 0.02, 8, 20), gold, [vx - 0.45 + k * 0.45, 1.12, vz], {rot: [-1.3, 0, 0]});
  }
  // the owner's workbench (left, facing the street)
  P(group, 2.2, 1.0, 0.9, -1.6, 0.6, -3.2, toon('#6a3f2a'));
  P(group, 2.3, 0.08, 1.0, -1.6, 1.12, -3.2, toon('#8a5a34'));
  const deskLamp = makeLamp('#2f7f8f', 0.55).g;
  deskLamp.position.set(-2.35, 1.16, -3.3);
  group.add(deskLamp);
  const benchLight = new THREE.PointLight('#ffd08a', 1.1, 3, 1.8);
  benchLight.position.set(-1.9, 1.9, -2.9);
  group.add(benchLight);
  const benchRing = new THREE.Group();
  solid(benchRing, new THREE.TorusGeometry(0.06, 0.018, 10, 28), gold, [0, 0, 0], {rot: [-0.4, 0, 0]});
  solid(benchRing, new THREE.OctahedronGeometry(0.04), gem('#7fd3ff'), [0, 0.075, 0]);
  benchRing.position.set(-1.35, 1.24, -2.95);
  group.add(benchRing);
  // chandelier
  solid(group, new THREE.CylinderGeometry(0.012, 0.012, 0.8, 6), toon('#222'), [0.3, 4.4, -3.2]);
  solid(group, new THREE.TorusGeometry(0.45, 0.04, 8, 32), gold, [0.3, 3.95, -3.2], {rot: [Math.PI / 2, 0, 0]});
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    solid(group, new THREE.SphereGeometry(0.07, 10, 8), toon('#fff3c4', null, {emissive: new THREE.Color('#ffd27a'), emissiveIntensity: 1.6}), [0.3 + Math.cos(a) * 0.45, 4.03, -3.2 + Math.sin(a) * 0.45], {ink: false});
  }
  const room = new THREE.PointLight('#ffd9a0', 3.5, 10, 1.4);
  room.position.set(0.3, 3.6, -3.2);
  group.add(room);

  // the neighbour bike shop becomes an ordinary solid shop
  world.bikeGroup.visible = true;
  return {group, sparkleSpots, gemMats, windowGlass, deskLamp, doorPivot, benchRing};
}
