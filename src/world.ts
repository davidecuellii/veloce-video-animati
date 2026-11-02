import * as THREE from 'three';
import {tex, toon, solid, Fade, newFade, paintFacade, paintTiles, rnd, YELLOW, inkMat, smooth} from './kit';
import {lampIcon} from './toon';

export const SKY_TOP = '#3f86dd';
export const SKY_HORIZON = '#c9e3f8';

export interface World {
  root: THREE.Group;
  shop: Fade; // lamp shop: follows the "visibility" arc of the story
  ghost2: Fade; // the next invisible shop
  lamp: THREE.Group;
  lampShade: THREE.MeshToonMaterial;
  lampGlow: THREE.Sprite;
  lampLight: THREE.PointLight;
  pendants: THREE.MeshToonMaterial[];
  sun: THREE.DirectionalLight;
  fogColor: THREE.Color;
  clouds: THREE.Group[];
  boxes: THREE.Group; // leaning stack
  doorBell: THREE.Group;
  shopGroup: THREE.Group;
  bikeGroup: THREE.Group;
  townGroup: THREE.Group;
}

const PAL = [
  {wall: '#d9a98a', trim: '#f1e4cf', shutter: '#4f7a62'},
  {wall: '#e9d5a0', trim: '#fbf3e1', shutter: '#9a4e3b'},
  {wall: '#c9856a', trim: '#f1e4cf', shutter: '#3f5b73'},
  {wall: '#e8c18a', trim: '#fff7e6', shutter: '#6b4c80'},
  {wall: '#b8c9a8', trim: '#f6efdd', shutter: '#9a4e3b'},
  {wall: '#e2b9a0', trim: '#fdf2e0', shutter: '#2f6c72'},
  {wall: '#cfd8e2', trim: '#fff', shutter: '#a24e45'},
];

function glowTex(color = '255,214,140') {
  return tex(128, 128, (g, w, h) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, `rgba(${color},1)`);
    r.addColorStop(0.35, `rgba(${color},.45)`);
    r.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = r;
    g.fillRect(0, 0, w, h);
  });
}

function roofGeo(w: number, d: number, h: number, over = 0.35) {
  const hw = w / 2 + over;
  const hd = d / 2 + over;
  const g = new THREE.BufferGeometry();
  const v: number[] = [];
  const uv: number[] = [];
  const tri = (a: number[], b: number[], c: number[], ua: number[], ub: number[], uc: number[]) => {
    v.push(...a, ...b, ...c);
    uv.push(...ua, ...ub, ...uc);
  };
  // front slope (towards +z)
  tri([-hw, 0, hd], [hw, 0, hd], [hw, h, 0], [0, 0], [w / 3, 0], [w / 3, 1]);
  tri([-hw, 0, hd], [hw, h, 0], [-hw, h, 0], [0, 0], [w / 3, 1], [0, 1]);
  // back slope
  tri([hw, 0, -hd], [-hw, 0, -hd], [-hw, h, 0], [0, 0], [w / 3, 0], [w / 3, 1]);
  tri([hw, 0, -hd], [-hw, h, 0], [hw, h, 0], [0, 0], [w / 3, 1], [0, 1]);
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
function prismGeo(w: number, d: number, h: number, over = 0.35) {
  const hw = w / 2 + over;
  const hd = d / 2 + over;
  const g = new THREE.BufferGeometry();
  const v: number[] = [];
  const uv: number[] = [];
  let count = 0;
  const tri = (a: number[], b: number[], c: number[], ua: number[], ub: number[], uc: number[]) => {
    v.push(...a, ...b, ...c);
    uv.push(...ua, ...ub, ...uc);
    count += 3;
  };
  const A = [-hw, 0, hd], B = [hw, 0, hd], C = [hw, 0, -hd], D = [-hw, 0, -hd], E = [-hw, h, 0], F = [hw, h, 0];
  tri(A, B, F, [0, 0], [w / 3, 0], [w / 3, 1]);
  tri(A, F, E, [0, 0], [w / 3, 1], [0, 1]);
  tri(C, D, E, [0, 0], [w / 3, 0], [w / 3, 1]);
  tri(C, E, F, [0, 0], [w / 3, 1], [0, 1]);
  g.addGroup(0, count, 0);
  const s2 = count;
  tri(D, A, E, [0, 0], [1, 0], [0.5, 1]);
  tri(B, C, F, [0, 0], [1, 0], [0.5, 1]);
  tri(A, D, C, [0, 0], [1, 0], [1, 1]);
  tri(A, C, B, [0, 0], [1, 1], [0, 1]);
  g.addGroup(s2, count - s2, 1);
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
function gableGeo(w: number, d: number, h: number) {
  const g = new THREE.BufferGeometry();
  const hw = w / 2;
  const hd = d / 2;
  const v = [-hw, 0, hd, -hw, 0, -hd, -hw, h, 0, hw, 0, -hd, hw, 0, hd, hw, h, 0];
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

const tileTex = paintTiles('#c4623f', 'rgba(70,25,15,.55)');
const tileTex2 = paintTiles('#b9503a', 'rgba(70,25,15,.55)');

export function makeHouse(parent: THREE.Object3D, x: number, z: number, w: number, h: number, d: number, pi: number, facing = 1, seed = 1, door = true, roof = true, fade?: Fade) {
  const p = PAL[pi % PAL.length];
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  if (facing < 0) g.rotation.y = Math.PI;
  const floors = Math.max(2, Math.round(h / 3));
  const face = paintFacade({w, h, wall: p.wall, trim: p.trim, shutter: p.shutter, floors, cols: Math.max(2, Math.round(w / 2.3)), door, seed});
  const side = toon(p.wall);
  const mats = [side, side, side, side, toon('#ffffff', face), side];
  solid(g, new THREE.BoxGeometry(w, h, d), mats, [0, h / 2, 0], {fade});
  if (roof) {
    const rh = Math.min(3.1, w * 0.3);
    const rm = toon('#ffffff', seed % 2 ? tileTex : tileTex2);
    solid(g, prismGeo(w, d, rh), [rm, toon(p.wall)], [0, h, 0], {fade});
    solid(g, new THREE.BoxGeometry(0.7, 1.7, 0.7), toon('#b9503a'), [w * 0.25, h + rh * 0.55, -d * 0.1], {fade});
  }
  parent.add(g);
  return g;
}

export function makeLamp(color: string, scale = 1) {
  const g = new THREE.Group();
  const bodyM = toon('#b7773d');
  const brass = toon('#e9b44c');
  solid(g, new THREE.CylinderGeometry(0.28, 0.32, 0.07, 24), toon('#7a4b2a'), [0, 0.035, 0]);
  solid(g, new THREE.CylinderGeometry(0.035, 0.035, 0.5, 12), bodyM, [0, 0.3, 0]);
  solid(g, new THREE.TorusGeometry(0.05, 0.015, 8, 16), brass, [0, 0.32, 0], {rot: [Math.PI / 2, 0, 0]});
  const prof: THREE.Vector2[] = [];
  const pts = [[0.05, 0.0], [0.1, 0.05], [0.2, 0.17], [0.3, 0.34], [0.36, 0.5], [0.36, 0.58], [0.33, 0.62]];
  for (const [r, y] of pts) prof.push(new THREE.Vector2(r, y));
  const stripes = tex(128, 64, (g, w, h) => {
    g.fillStyle = color;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 4; i++) g.fillRect(i * 32 + 10, 0, 10, h);
    g.fillStyle = '#d9573b';
    g.fillRect(0, h - 12, w, 12);
  });
  const shadeM = toon('#ffffff', stripes, {emissive: new THREE.Color('#000000'), side: THREE.DoubleSide});
  const shade = solid(g, new THREE.LatheGeometry(prof, 28), shadeM, [0, 0.52, 0], {ink: true});
  g.scale.setScalar(scale);
  return {g, shadeM, shade};
}

export function buildWorld(): World {
  const root = new THREE.Group();
  const r = rnd(7);
  const shopFade = newFade();
  const ghost2 = newFade();

  // ---- sky dome ----
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(900, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {top: {value: new THREE.Color(SKY_TOP)}, hor: {value: new THREE.Color(SKY_HORIZON)}},
      vertexShader: 'varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 hor; varying vec3 vd; void main(){ float t = clamp(vd.y*1.7,0.0,1.0); gl_FragColor = vec4(mix(hor,top,pow(t,0.8)),1.0); }',
    }),
  );
  sky.renderOrder = -10;
  root.add(sky);

  // ---- ground ----
  const grass = tex(256, 256, (g, w, h) => {
    g.fillStyle = '#8dbb68';
    g.fillRect(0, 0, w, h);
    const rr = rnd(3);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = `rgba(${rr() > 0.5 ? '60,120,50' : '190,220,120'},.18)`;
      g.beginPath();
      g.ellipse(rr() * w, rr() * h, 6 + rr() * 22, 4 + rr() * 12, 0, 0, 7);
      g.fill();
    }
  }, [120, 120]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), toon('#ffffff', grass));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  root.add(ground);

  const town = new THREE.Mesh(new THREE.PlaneGeometry(150, 60), toon('#cdb892'));
  town.rotation.x = -Math.PI / 2;
  town.position.set(0, -0.012, -12);
  town.receiveShadow = true;
  root.add(town);

  const asphalt = tex(512, 256, (g, w, h) => {
    g.fillStyle = '#7b7d88';
    g.fillRect(0, 0, w, h);
    const rr = rnd(5);
    for (let i = 0; i < 380; i++) {
      g.fillStyle = `rgba(${rr() > 0.5 ? '255,255,255' : '30,30,50'},${0.03 + rr() * 0.04})`;
      g.fillRect(rr() * w, rr() * h, 3 + rr() * 8, 2 + rr() * 6);
    }
    g.fillStyle = '#f3e7c0';
    for (let x = 0; x < w; x += 128) g.fillRect(x + 20, h / 2 - 4, 70, 8);
  }, [40, 1]);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(1200, 8), toon('#ffffff', asphalt));
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, 0, 7.4);
  street.receiveShadow = true;
  root.add(street);

  const paving = paintTiles('#dccaa4', 'rgba(110,85,55,.35)');
  paving.repeat.set(750, 2);
  for (const [z0, d0] of [[1.75, 3.5], [12.4, 2.2]] as const) {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(1200, 0.18, d0), toon('#ffffff', paving));
    sw.position.set(0, 0.09, z0);
    sw.receiveShadow = true;
    root.add(sw);
  }
  const curb = new THREE.Mesh(new THREE.BoxGeometry(1200, 0.2, 0.18), toon('#b9b2a0'));
  curb.position.set(0, 0.1, 3.59);
  root.add(curb);
  const curb2 = curb.clone();
  curb2.position.z = 11.4;
  root.add(curb2);

  // ---- lamp shop ----
  const SW = 7.4;
  const D = 6.5;
  const cream = toon('#f4e7c8');
  const coral = toon('#e0674f');
  const teal = toon('#2f7f8f');
  const wallM = toon('#efd9b0', tex(256, 256, (g, w, h) => {
    g.fillStyle = '#efd9b0';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(120,80,40,${0.03 + r() * 0.04})`;
      g.beginPath();
      g.ellipse(r() * w, r() * h, 20 + r() * 50, 10 + r() * 30, 0, 0, 7);
      g.fill();
    }
  }));
  const shop = new THREE.Group();
  root.add(shop);
  const F = {fade: shopFade};
  const piece = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material = wallM) => solid(shop, new THREE.BoxGeometry(w, h, d), m, [x, y, z], F);
  const lintelTex = tex(740, 160, (g, w, h) => {
    g.fillStyle = '#2f7f8f';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#f4e7c8';
    g.fillRect(0, 0, w, 10);
    g.fillRect(0, h - 10, w, 10);
    lampIcon(g, w / 2, h - 18, 0.46, true);
    // small decorative bulbs both sides
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
      g.fillStyle = '#f4e7c8';
      g.beginPath();
      g.arc(w / 2 + sx * (190 + k * 70), h / 2, 14, 0, 7);
      g.fill();
    }
  });
  piece(1.3, 5.0, D, -3.05, 2.5, -D / 2 + 0.0); // left pier
  piece(0.7, 5.0, D, 3.35, 2.5, -D / 2); // right pier
  piece(0.2, 2.5, 0.5, 1.5, 1.45, 0.0); // mullion
  piece(3.8, 0.8, 0.5, -0.5, 0.4, -0.05); // window base
  const lintel = solid(shop, new THREE.BoxGeometry(SW, 1.8, 0.7), [wallM, wallM, wallM, wallM, toon('#ffffff', lintelTex), wallM], [0, 4.1, 0.1], F);
  piece(SW, 0.5, 1.2, 0, 5.1, 0.0, coral); // cornice
  piece(0.3, 2.6, 0.3, 2.4, 1.3, 0.2, teal); // door jamb left
  piece(0.3, 2.6, 0.3, 3.0, 1.3, 0.2, teal); // door jamb right
  // striped awning
  const awn = tex(256, 128, (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#f4e7c8' : '#e0674f';
      g.fillRect((i * w) / 8, 0, w / 8, h);
    }
  });
  const aw = solid(shop, new THREE.BoxGeometry(4.4, 0.08, 1.3), toon('#ffffff', awn), [-0.5, 3.15, 0.65], {fade: shopFade, rot: [0.34, 0, 0]});
  // floor, back wall, side walls, ceiling
  const plank = tex(256, 256, (g, w, h) => {
    g.fillStyle = '#c28d56';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(60,30,10,.45)';
    g.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      g.moveTo(0, i * 32);
      g.lineTo(w, i * 32);
      g.stroke();
    }
  }, [6, 6]);
  solid(shop, new THREE.BoxGeometry(SW - 0.3, 0.2, D), toon('#ffffff', plank), [0, 0.02, -D / 2], F);
  solid(shop, new THREE.BoxGeometry(SW, 5, 0.3), wallM, [0, 2.5, -D], F);
  solid(shop, new THREE.BoxGeometry(0.3, 5, D), wallM, [-SW / 2 + 0.05, 2.5, -D / 2], F);
  solid(shop, new THREE.BoxGeometry(0.3, 5, D), wallM, [SW / 2, 2.5, -D / 2], F);
  solid(shop, new THREE.BoxGeometry(SW, 0.3, D), cream, [0, 4.95, -D / 2], F);
  // shelves with small lamps on back wall
  const lampCols = ['#ffb457', '#e0674f', '#f4e7c8', '#2f9db0', '#f0b13a'];
  for (let row = 0; row < 3; row++) {
    solid(shop, new THREE.BoxGeometry(5.6, 0.1, 0.5), toon('#8a5a34'), [0, 1.25 + row * 1.1, -D + 0.4], F);
    for (let k = 0; k < 5; k++) {
      const l = makeLamp(lampCols[(k + row) % 5], 0.8);
      l.g.position.set(-2.3 + k * 1.15, 1.3 + row * 1.1, -D + 0.4);
      shop.add(l.g);
      shopFade.mats.push(l.shadeM);
    }
  }
  // counter
  solid(shop, new THREE.BoxGeometry(2.6, 1.0, 0.9), toon('#8a5a34'), [2.0, 0.5, -3.2], F);
  solid(shop, new THREE.BoxGeometry(2.8, 0.1, 1.0), toon('#d9b27a'), [2.0, 1.05, -3.2], F);
  // display table by the window (S1 close-up)
  solid(shop, new THREE.BoxGeometry(1.3, 0.85, 1.0), toon('#a8703c'), [-1.0, 0.43, -1.0], F);
  // pendants (lit)
  const pendants: THREE.MeshToonMaterial[] = [];
  for (const px of [-2.4, 0.2, 2.5]) {
    solid(shop, new THREE.CylinderGeometry(0.015, 0.015, 1.1, 6), toon('#222'), [px, 4.4, -2.8], F);
    const pm = toon('#ffd89a', null, {emissive: new THREE.Color('#ffb457'), emissiveIntensity: 0.9});
    solid(shop, new THREE.SphereGeometry(0.28, 18, 14), pm, [px, 3.75, -2.8], F);
    pendants.push(pm);
  }
  const doorBell = new THREE.Group();
  doorBell.position.set(2.7, 2.7, 0.35);
  shop.add(doorBell);
  const bellM = toon('#e9b44c');
  solid(doorBell, new THREE.SphereGeometry(0.1, 12, 10), bellM, [0, -0.1, 0], F);

  // ---- main lamp (the one that must stay recognisable everywhere) ----
  const mainLamp = makeLamp('#ffb457', 1.3);
  mainLamp.g.position.set(-1.0, 0.86, -1.0);
  root.add(mainLamp.g);
  const lampLight = new THREE.PointLight('#ffc477', 0, 10, 1.4);
  lampLight.position.set(0, 1.2, 0.3);
  mainLamp.g.add(lampLight);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0}));
  glow.scale.setScalar(3.2);
  glow.position.set(0, 0.95, 0.1);
  mainLamp.g.add(glow);

  // leaning stack of boxes (scene 2/3)
  const boxes = new THREE.Group();
  const boxMat = toon('#c79a62');
  const tape = toon('#e9d7a8');
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Group();
    b.position.set(0.04 * (i % 2), 0.28 + i * 0.56, 0);
    const bx = solid(b, new THREE.BoxGeometry(0.95 - i * 0.04, 0.54, 0.8), boxMat, [0, 0, 0]);
    solid(b, new THREE.BoxGeometry(0.14, 0.545, 0.805), tape, [0, 0, 0], {ink: false});
    boxes.add(b);
  }
  boxes.position.set(3.0, 0.18, 2.4);
  root.add(boxes);

  // ---- second (invisible) shop on the right, for the finale ----
  const bike = new THREE.Group();
  bike.position.set(10.2, 0, 0);
  root.add(bike);
  const bm = toon('#e9efe0');
  const bF = {fade: ghost2};
  const bp = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material = bm) => solid(bike, new THREE.BoxGeometry(w, h, d), m, [x, y, z], bF);
  bp(1.2, 4.6, 6, -3.1, 2.3, -3);
  bp(1.2, 4.6, 6, 3.1, 2.3, -3);
  bp(7.4, 1.4, 0.6, 0, 3.9, 0.1, toon('#3b9ad9'));
  bp(7.4, 0.8, 6, 0, 0.4, -3);
  bp(7.4, 4.6, 0.3, 0, 2.3, -6);
  bp(7.6, 0.4, 6.4, 0, 4.7, -3, toon('#f4f4ee'));
  const bAw = tex(256, 128, (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#ffffff' : '#3b9ad9';
      g.fillRect((i * w) / 8, 0, w / 8, h);
    }
  });
  solid(bike, new THREE.BoxGeometry(5.2, 0.08, 1.3), toon('#ffffff', bAw), [0, 3.1, 0.65], {fade: ghost2, rot: [0.34, 0, 0]});
  // a bicycle inside
  for (const bxp of [-1.0, 0.9]) solid(bike, new THREE.TorusGeometry(0.42, 0.04, 8, 24), toon('#3b3b46'), [bxp, 0.85, -2], {fade: ghost2});
  solid(bike, new THREE.BoxGeometry(1.9, 0.06, 0.06), toon('#e8553d'), [-0.05, 1.05, -2], {fade: ghost2, rot: [0, 0, 0.3]});

  // ---- the street's houses ---- (everything from here to the clouds goes into townGroup, so a Blender city can replace it)
  const townStart = root.children.length;
  const placeRow = (z: number, facing: number, from: number, to: number, skipFrom: number, skipTo: number, seed: number) => {
    const rr = rnd(seed);
    let x = from;
    let i = 0;
    while (x < to) {
      const w = 5 + Math.floor(rr() * 4) * 1.1;
      const h = 7 + Math.floor(rr() * 3) * 1.4;
      const dd = 7 + rr() * 3;
      const cx = x + w / 2;
      if (!(cx + w / 2 > skipFrom && cx - w / 2 < skipTo)) {
        makeHouse(root, cx, z - (facing * dd) / 2, w, h, dd, Math.floor(rr() * 7), facing, i + seed, true);
      }
      x += w + 0.04;
      i++;
    }
  };
  // front row: leave the two shop slots free
  placeRow(0, 1, -62, 62, -3.9, 13.9, 11);
  makeHouse(root, 5.1, -4, 2.8, 8.4, 8, 3, 1, 5, true);
  // opposite side of the street
  placeRow(13.8, -1, -62, 62, 1e9, 1e9, 23);
  // second row (visible from the sky)
  placeRow(-14, 1, -62, 62, 1e9, 1e9, 41);
  placeRow(-26, 1, -62, 62, 1e9, 1e9, 52);

  // ---- districts and the far town (for the aerial shot) ----
  const cluster = (cx: number, cz: number, n: number, seed: number, spread = 1) => {
    const rr = rnd(seed);
    for (let i = 0; i < n; i++) {
      const x = cx + (rr() - 0.5) * 36 * spread;
      const z = cz + (rr() - 0.5) * 26 * spread;
      makeHouse(root, x, z, 5 + rr() * 4, 6 + rr() * 5, 6 + rr() * 3, Math.floor(rr() * 7), rr() > 0.5 ? 1 : -1, i + seed, false);
    }
  };
  cluster(-48, -48, 14, 91, 0.9);
  cluster(52, -46, 14, 92, 0.9);
  cluster(8, -118, 30, 93, 1.8);
  // church tower in the far town
  solid(root, new THREE.BoxGeometry(5, 26, 5), toon('#e9d5a0'), [14, 13, -118]);
  solid(root, new THREE.ConeGeometry(4.2, 9, 4), toon('#b9503a'), [14, 30, -118], {rot: [0, Math.PI / 4, 0]});
  // hills
  for (const [hx, hz, hr, hh] of [[-120, -260, 120, 46], [60, -280, 150, 60], [190, -200, 110, 38], [-230, -150, 100, 40]]) {
    solid(root, new THREE.SphereGeometry(hr, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon('#7fb25e'), [hx, 0, hz], {ink: true, scale: [1, hh / hr, 1], shadow: false});
  }

  // ---- street dressing: trees, lamp posts, parked cars ----
  const tree = (x: number, z: number, s = 1) => {
    solid(root, new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 2.2 * s, 8), toon('#7a5233'), [x, 1.1 * s, z]);
    const cm = toon(['#5ea352', '#6bb25a', '#4f9a56'][Math.floor(r() * 3)]);
    solid(root, new THREE.IcosahedronGeometry(1.5 * s, 1), cm, [x, 3.3 * s, z]);
  };
  for (let x = -60; x <= 60; x += 11) if (Math.abs(x - 0) > 7 && Math.abs(x - 10) > 7) tree(x + r() * 2, 3.15, 0.9 + r() * 0.3);
  for (let x = -57; x <= 60; x += 13) tree(x, 12.6, 1);
  const post = (x: number) => {
    solid(root, new THREE.CylinderGeometry(0.06, 0.08, 4.4, 8), toon('#3b3b46'), [x, 2.2, 3.3]);
    solid(root, new THREE.SphereGeometry(0.22, 12, 10), toon('#ffe9a8', null, {emissive: new THREE.Color('#ffd27a'), emissiveIntensity: 0.4}), [x, 4.5, 3.3]);
  };
  for (let x = -54; x <= 60; x += 18) post(x + 6);
  const car = (x: number, z: number, col: string, dir = 1) => {
    const c = new THREE.Group();
    c.position.set(x, 0, z);
    c.rotation.y = dir > 0 ? 0 : Math.PI;
    solid(c, new THREE.BoxGeometry(4, 0.9, 1.8), toon(col), [0, 0.75, 0]);
    solid(c, new THREE.BoxGeometry(2.1, 0.8, 1.6), toon('#cfe6f7'), [-0.1, 1.6, 0]);
    for (const wx of [-1.2, 1.2]) for (const wz of [-0.9, 0.9]) solid(c, new THREE.CylinderGeometry(0.38, 0.38, 0.25, 14), toon('#222'), [wx, 0.38, wz], {rot: [Math.PI / 2, 0, 0]});
    root.add(c);
  };
  car(-18, 5.4, '#e8553d');
  car(-34, 9.6, '#3b9ad9', -1);
  car(26, 5.4, '#f0b13a');
  car(40, 9.6, '#8a62c9', -1);
  // bench + planters near the shop
  solid(root, new THREE.BoxGeometry(1.8, 0.12, 0.5), toon('#9a6a3c'), [-5.2, 0.55, 2.6]);
  solid(root, new THREE.BoxGeometry(0.1, 0.5, 0.45), toon('#3b3b46'), [-5.9, 0.3, 2.6]);
  solid(root, new THREE.BoxGeometry(0.1, 0.5, 0.45), toon('#3b3b46'), [-4.5, 0.3, 2.6]);

  const townGroup = new THREE.Group();
  townGroup.name = 'town';
  root.children.slice(townStart).forEach((o) => townGroup.add(o));
  root.add(townGroup);

  // clouds
  const clouds: THREE.Group[] = [];
  const cm = new THREE.MeshToonMaterial({color: '#ffffff', gradientMap: (toon('#fff') as any).gradientMap, fog: false});
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(10 + r() * 8, 12, 10), cm);
      s.position.set((k - 1.5) * 12, r() * 4, r() * 3);
      s.scale.y = 0.62;
      c.add(s);
      const h = new THREE.Mesh(smooth(s.geometry), inkMat());
      h.position.copy(s.position);
      h.scale.copy(s.scale);
      c.add(h);
    }
    c.position.set(-300 + i * 80 + r() * 30, 90 + r() * 40, -280 - r() * 120);
    root.add(c);
    clouds.push(c);
  }

  // ---- lights ----
  const sun = new THREE.DirectionalLight('#fff2dc', 2.1);
  sun.position.set(-16, 26, 22);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const sc = sun.shadow.camera;
  sc.left = -42;
  sc.right = 42;
  sc.top = 32;
  sc.bottom = -32;
  sc.near = 5;
  sc.far = 120;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  root.add(sun);
  root.add(sun.target);
  root.add(new THREE.HemisphereLight('#cfe5ff', '#b9a98a', 1.35));

  return {
    root,
    shop: shopFade,
    ghost2,
    lamp: mainLamp.g,
    lampShade: mainLamp.shadeM,
    lampGlow: glow,
    lampLight,
    pendants,
    sun,
    fogColor: new THREE.Color(SKY_HORIZON),
    clouds,
    boxes,
    doorBell,
    shopGroup: shop,
    bikeGroup: bike,
    townGroup,
  };
}
