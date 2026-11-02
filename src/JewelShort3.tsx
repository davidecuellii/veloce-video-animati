import React, {useLayoutEffect, useMemo, useState} from 'react';
import {useCurrentFrame, useVideoConfig, delayRender, continueRender, staticFile, AbsoluteFill, Audio, getInputProps} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {W, H, INK, smooth, inkMat} from './kit';
import {buildWorld} from './world';
import {createUgo as createJewel, UgoStory as JewelStory, CUES} from './jewel3';
import {makePost} from './post';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Services, SERVICES_START, SERVICES_END} from './Services';

let CACHE: {story: JewelStory; post?: ReturnType<typeof makePost>} | null = null;

// Optional Blender scene: render with --props='{"blender":"models/scena.glb","hideTown":true}'
// The GLB is added in world units (1 unit = 1 m, y up, the shop front is the plane z = 0, see docs/BLENDER.md).
const Stage: React.FC<{t: number; logo: HTMLImageElement; testCam?: number[]; extra?: THREE.Object3D | null; hideTown?: boolean}> = ({t, logo, testCam, extra, hideTown}) => {
  const {scene, camera, gl} = useThree();
  const c = useMemo(() => {
    if (!CACHE) {
      const world = buildWorld();
      CACHE = {story: createJewel(world, logo)};
      if (extra) world.root.add(extra);
      if (hideTown) world.townGroup.visible = false;
    }
    return CACHE;
  }, []);
  useLayoutEffect(() => {
    scene.fog = new THREE.Fog(c.story.world.fogColor, 60, 420);
    const cam = camera as THREE.PerspectiveCamera;
    if (!c.post) c.post = makePost(gl, scene, cam, W, H);
    const lens = c.story.update(t, cam, testCam);
    INK.uTan.value = Math.tan((cam.fov * Math.PI) / 360);
    const u = (c.post.bokeh as any).uniforms;
    u.focus.value = lens.focus;
    u.aperture.value = lens.aperture * 0.01;
    u.maxblur.value = lens.aperture > 0 ? 0.012 : 0.0;
    c.post.bokeh.enabled = lens.aperture > 0;
    c.post.comp.render();
  });
  return <primitive object={c.story.world.root} />;
};

const cl = (x: number) => Math.min(1, Math.max(0, x));
const sm = (x: number) => {
  x = cl(x);
  return x * x * (3 - 2 * x);
};
const inR = (t: number, r: [number, number]) => t >= r[0] && t < r[1];
const GOLD = '#d4a94a';

/** the iPhone recording frame: what the hero's phone sees */
const RecFrame: React.FC<{t: number}> = ({t}) => {
  const s = t - CUES.rec[0];
  const c = 46;
  const corner = (st: React.CSSProperties) => <div style={{position: 'absolute', width: 110, height: 110, borderColor: '#fff', borderStyle: 'solid', borderWidth: 0, ...st}} />;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {corner({top: c + 80, left: c, borderTopWidth: 7, borderLeftWidth: 7, borderTopLeftRadius: 26})}
      {corner({top: c + 80, right: c, borderTopWidth: 7, borderRightWidth: 7, borderTopRightRadius: 26})}
      {corner({bottom: c + 120, left: c, borderBottomWidth: 7, borderLeftWidth: 7, borderBottomLeftRadius: 26})}
      {corner({bottom: c + 120, right: c, borderBottomWidth: 7, borderRightWidth: 7, borderBottomRightRadius: 26})}
      <div style={{position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{background: 'rgba(0,0,0,.55)', borderRadius: 40, padding: '14px 34px', display: 'flex', alignItems: 'center', gap: 18, color: '#fff', fontFamily: 'Creato, sans-serif', fontSize: 46}}>
          <div style={{width: 30, height: 30, borderRadius: 15, background: Math.floor(s * 2) % 2 ? '#ff3b30' : '#7a1f1a'}} />
          00:0{Math.min(9, Math.floor(s))}
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{width: 150, height: 150, borderRadius: 75, border: '9px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 64, height: 64, borderRadius: 14, background: '#ff3b30'}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** a phone mockup in the centre of the frame, over the (blurred) 3D shot */
const Phone: React.FC<{t: number; t0: number; children: React.ReactNode}> = ({t, t0, children}) => {
  const k = sm((t - t0) / 0.3);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'}}>
      <div style={{transform: `translateY(${(1 - k) * 900}px) rotate(${(1 - k) * -8}deg)`, width: 660, height: 1340, borderRadius: 96, background: '#2f3138', border: '10px solid #0b0a0c', boxShadow: '0 40px 90px rgba(0,0,0,.45)', padding: 22, boxSizing: 'border-box'}}>
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 74, overflow: 'hidden', background: '#111'}}>
          {children}
          <div style={{position: 'absolute', top: 22, left: '50%', marginLeft: -90, width: 180, height: 50, borderRadius: 25, background: '#000'}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Gem: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100">
    <circle r="40" fill="none" stroke={GOLD} strokeWidth="9" cy="14" />
    <path d="M-22,-30 L-12,-44 L12,-44 L22,-30 L0,-6 Z" fill={color} stroke="#0b0a0c" strokeWidth="3" />
  </svg>
);

/** the reel the hero has just edited: jewels, the craftsman, hearts going up */
const Reel: React.FC<{t: number}> = ({t}) => {
  const s = t - CUES.reel[0];
  const slide = Math.floor(s / 0.45) % 3;
  const bgs = ['linear-gradient(#2b3a63,#141a2e)', 'linear-gradient(#5a1f35,#21101a)', 'linear-gradient(#2f6b6a,#132726)'];
  return (
    <AbsoluteFill style={{background: bgs[slide], alignItems: 'center', justifyContent: 'center'}}>
      <div style={{transform: `scale(${1 + 0.15 * ((s % 0.45) / 0.45)})`}}>
        <Gem size={380} color={['#7fd3ff', '#e8344c', '#4ce0a0'][slide]} />
      </div>
      {[0, 1, 2, 3, 4].map((i) => {
        const p = ((s * 0.9 + i * 0.21) % 1) as number;
        return (
          <div key={i} style={{position: 'absolute', right: 60 + (i % 2) * 34, bottom: 260 + p * 520, fontSize: 64, color: '#ff375f', opacity: 1 - p}}>
            ♥
          </div>
        );
      })}
      <div style={{position: 'absolute', bottom: 70, left: 40, right: 40, height: 10, borderRadius: 5, background: 'rgba(255,255,255,.3)'}}>
        <div style={{width: `${cl(s / 1.4) * 100}%`, height: '100%', borderRadius: 5, background: '#fff'}} />
      </div>
    </AbsoluteFill>
  );
};

/** a social feed: the thumb scrolls... and stops on the jeweller's post */
const Feed: React.FC<{t: number}> = ({t}) => {
  const s = t - CUES.feed[0];
  const u = Math.min(1, s / 0.75);
  const off = 3120 * (1 - Math.pow(1 - u, 3));
  const items = ['#9aa4b8', '#c9b49a', '#a7c4a0', 'POST', '#b8a0c4'];
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 120 - off + 1290, display: 'flex', flexDirection: 'column', gap: 30, padding: '0 30px'}}>
        {items.map((c, i) =>
          c === 'POST' ? (
            <div key={i} style={{height: 640, borderRadius: 30, background: 'linear-gradient(#2b3a63,#141a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
              <Gem size={340} color="#7fd3ff" />
              <div style={{position: 'absolute', bottom: 24, left: 30, fontSize: 70, color: '#ff375f'}}>♥</div>
            </div>
          ) : (
            <div key={i} style={{height: 640, borderRadius: 30, background: c}} />
          ),
        )}
      </div>
      {s < 0.7 && <div style={{position: 'absolute', left: 300, top: 900 - (s % 0.3) * 1400, width: 90, height: 90, borderRadius: 45, background: 'rgba(0,0,0,.18)'}} />}
    </AbsoluteFill>
  );
};

/** the jeweller's phone fills up: messages, orders, booking requests */
const Notifs: React.FC<{t: number}> = ({t}) => {
  const s = t - CUES.notif[0];
  const list = [
    ['💬', 'Nuovo messaggio', 'È ancora disponibile l’anello?'],
    ['🛍️', 'Nuovo ordine', 'Collana — pagato'],
    ['📅', 'Appuntamento', 'Sabato ore 11:00'],
    ['💬', 'Nuovo messaggio', 'Fate anche fedi su misura?'],
    ['❤️', '+128 Mi piace', 'al tuo reel'],
  ];
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#1f2f4f,#0e1424)', padding: '150px 26px 0', boxSizing: 'border-box', fontFamily: 'Creato, sans-serif'}}>
      <div style={{color: '#fff', fontSize: 120, textAlign: 'center', marginBottom: 50, opacity: 0.92}}>11:24</div>
      {list.map(([ic, a, b], i) => {
        const k = sm((s - 0.12 - i * 0.22) / 0.18);
        return (
          <div key={i} style={{opacity: k, transform: `translateY(${(1 - k) * -40}px) scale(${0.9 + 0.1 * k})`, background: 'rgba(255,255,255,.88)', borderRadius: 34, padding: '22px 26px', marginBottom: 18, display: 'flex', gap: 22, alignItems: 'center'}}>
            <div style={{fontSize: 58}}>{ic}</div>
            <div>
              <div style={{fontSize: 38, fontWeight: 800, color: '#111'}}>{a}</div>
              <div style={{fontSize: 34, color: '#444'}}>{b}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Ugo's shop profile: almost empty, last post two years ago */
const Social: React.FC<{t: number}> = ({t}) => {
  const s = t - CUES.social[0];
  return (
    <AbsoluteFill style={{background: '#fff', padding: '140px 34px 0', boxSizing: 'border-box', fontFamily: 'Creato, sans-serif', color: '#111'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
        <div style={{width: 150, height: 150, borderRadius: 75, background: '#1f2f4f', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '6px solid #d4a94a'}}>
          <Gem size={110} color="#7fd3ff" />
        </div>
        <div style={{display: 'flex', gap: 34, fontSize: 34, textAlign: 'center'}}>
          <div><b style={{fontSize: 44}}>9</b><br />post</div>
          <div><b style={{fontSize: 44}}>41</b><br />follower</div>
        </div>
      </div>
      <div style={{fontSize: 40, fontWeight: 800, marginTop: 26}}>gioielleria_ugo</div>
      <div style={{fontSize: 30, color: '#666', marginTop: 6}}>Gioielli artigianali dal 1978</div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 40}}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} style={{aspectRatio: '1', background: i < 3 ? ['#c9b49a', '#b8a89a', '#a9a4a0'][i] : '#ececec', filter: 'grayscale(.6)'}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 34, right: 34, top: 760, display: 'flex', justifyContent: 'center', opacity: sm((s - 0.6) / 0.3)}}>
        <div style={{background: '#111', color: '#fff', borderRadius: 30, padding: '20px 34px', fontSize: 40, transform: `scale(${0.9 + 0.1 * sm((s - 0.6) / 0.3)})`}}>Ultimo post: 2 anni fa</div>
      </div>
    </AbsoluteFill>
  );
};

/** reel-style subtitle: big white words with a black outline */
const Subtitle: React.FC<{text: string; k: number}> = ({text, k}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 430, pointerEvents: 'none'}}>
    <div style={{fontFamily: 'Creato, sans-serif', fontSize: 92, fontWeight: 800, color: '#fff', WebkitTextStroke: '10px #0b0a0c', paintOrder: 'stroke fill', transform: `scale(${0.8 + 0.2 * k})`, textAlign: 'center', padding: '0 60px'}}>{text}</div>
  </AbsoluteFill>
);

const EndCard: React.FC<{t: number}> = ({t}) => {
  const band = cl((t - CUES.wipe) / 1.2);
  const k = sm((t - CUES.card) / 0.55);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {t >= CUES.card && (
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 42%, #3a3a3d 0%, #2a2a2a 55%, #1d1d1f 100%)', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{transform: `scale(${(0.82 + 0.18 * k) * (1 + 0.012 * Math.max(0, t - CUES.card - 0.6))})`, opacity: k, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <img src={staticFile('logo.png')} style={{width: 620, height: 'auto'}} />
            <div style={{marginTop: 70, fontFamily: 'Creato, sans-serif', fontSize: 92, letterSpacing: 6, color: '#f3f3f3', fontStyle: 'italic', fontWeight: 800}}>VELOCE DIGITAL</div>
            <div style={{marginTop: 18, width: 240, height: 12, background: '#FFF233', transform: 'skewX(-28deg)'}} />
          </div>
        </AbsoluteFill>
      )}
      {band > 0 && band < 1 && <div style={{position: 'absolute', top: -200, bottom: -200, left: `${-140 + band * 300}%`, width: '120%', background: '#FFF233', transform: 'skewX(-18deg)', borderLeft: '14px solid #0b0a0c', borderRight: '14px solid #0b0a0c'}} />}
    </AbsoluteFill>
  );
};

export const JewelShort3: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [handle] = useState(() => delayRender('logo'));
  useLayoutEffect(() => {
    const img = new Image();
    img.onload = () => {
      setLogo(img);
      continueRender(handle);
    };
    img.src = staticFile('logo.png');
  }, []);
  const props: any = getInputProps();
  const [extra, setExtra] = useState<THREE.Object3D | null>(null);
  const [glbHandle] = useState(() => (props.blender ? delayRender('blender scene') : null));
  useLayoutEffect(() => {
    if (!props.blender || glbHandle === null) return;
    new GLTFLoader().load(
      staticFile(props.blender),
      (g) => {
        // same look as the procedural set: shadows + black ink outline (inverted hull) on every opaque mesh
        const meshes: THREE.Mesh[] = [];
        g.scene.traverse((o: any) => {
          if (o.isMesh) meshes.push(o);
        });
        for (const m of meshes) {
          m.castShadow = true;
          m.receiveShadow = true;
          const transparent = ([] as THREE.Material[]).concat(m.material as any).some((x) => x.transparent);
          if (props.ink !== false && !transparent) m.add(new THREE.Mesh(smooth(m.geometry), inkMat()));
        }
        setExtra(g.scene);
        continueRender(glbHandle);
      },
      undefined,
      (e) => {
        console.error('Blender scene failed to load', e);
        continueRender(glbHandle);
      },
    );
  }, []);
  const ready = logo && (!props.blender || extra);
  // video time -> story time: the services montage (24-30 s) is inserted, the story resumes at 25 s
  const tv: number = props.t !== undefined ? props.t : frame / fps;
  const t: number = tv < SERVICES_START ? tv : tv < SERVICES_END ? 24.9 : tv - (SERVICES_END - 25.0);
  const flash = 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <style>{`@font-face{font-family:Creato;src:url(${staticFile('CreatoDisplay-ExtraBold.otf')});}`}</style>
      {ready && (
        <ThreeCanvas width={W} height={H} shadows frameloop="never" gl={{antialias: true, preserveDrawingBuffer: true}} camera={{fov: 38, near: 0.05, far: 2200, position: [0, 2, 9]}}>
          <Stage t={t} logo={logo!} testCam={props.cam} extra={extra} hideTown={!!props.hideTown} />
        </ThreeCanvas>
      )}
      {inR(t, CUES.rec) && <RecFrame t={t} />}
      {flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: flash}} />}
      {inR(t, CUES.social) && (
        <Phone t={t} t0={CUES.social[0]}>
          <Social t={t} />
        </Phone>
      )}
      {CUES.subs.map(([a, b, w]) => (t >= a && t < b ? <Subtitle key={a} text={w} k={sm((t - a) / 0.12)} /> : null))}
      {tv >= SERVICES_START && tv < SERVICES_END && <Services tv={tv} />}
      <EndCard t={t} />
      <Audio src={staticFile('ugo_mix.wav')} />
    </AbsoluteFill>
  );
};
