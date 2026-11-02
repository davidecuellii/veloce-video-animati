// Fast montage of Veloce Digital services (video time 24-30 s): a reel that entertains and sells,
// product photos, carousels, sponsored ads, online shop, results. One phone screen per beat, whip transitions.
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {CW, CH, Spec} from './toon';
import {drawPerson2} from './toon2';

export const SERVICES_START = 24.0;
export const SERVICES_END = 30.0;
const CARDS: [number, string][] = [
  [24.0, 'REEL CHE VENDONO'],
  [26.6, 'FOTO PRODOTTO'],
  [27.3, 'CAROSELLI'],
  [28.0, 'CAMPAGNE SPONSORIZZATE'],
  [28.9, 'SHOP ONLINE'],
  [29.5, 'RISULTATI'],
];
const YEL = '#FFF233';
const GOLD = '#d4a94a';
const cl = (x: number) => Math.min(1, Math.max(0, x));
const sm = (x: number) => {
  x = cl(x);
  return x * x * (3 - 2 * x);
};
const UGO: Spec = {skin: '#e2a878', hair: '#56565e', hairStyle: 'short', shirt: '#f4f1ea', pants: '#2a2a33', shoes: '#3a2a22', apron: '#6e4a2e', stache: true, build: 1.04};

const Ring: React.FC<{size: number; gem?: string}> = ({size, gem = '#7fd3ff'}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100">
    <circle r="36" cy="12" fill="none" stroke="#0b0a0c" strokeWidth="15" />
    <circle r="36" cy="12" fill="none" stroke={GOLD} strokeWidth="9" />
    <path d="M-20,-28 L-11,-41 L11,-41 L20,-28 L0,-6 Z" fill={gem} stroke="#0b0a0c" strokeWidth="3.5" />
  </svg>
);

/** Ugo doing a trend in the reel, drawn with the same cartoon renderer as the film */
const UgoDance: React.FC<{t: number}> = ({t}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const g = ref.current!.getContext('2d')!;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, CW, CH);
    const b = Math.sin(t * 14);
    drawPerson2(g, UGO, {view: 'front', expr: 'happy', mouth: 0.5 + 0.3 * Math.abs(b), look: 0, armL: [150 + b * 15, -30], armR: [-150 + b * 15, 30], holdL: 'ring', lean: b * 5, bob: Math.abs(b) * 18, tilt: b * 6, legL: [-8 + b * 6, 0], legR: [8 + b * 6, 0]});
  });
  return <canvas ref={ref} width={CW} height={CH} style={{width: 470, height: 783}} />;
};

const Screen: React.FC<{i: number; s: number; t: number}> = ({i, s, t}) => {
  if (i === 0) {
    // entertaining reel: a trend, then the sale sticker pops in
    const sale = s > 1.3;
    return (
      <AbsoluteFill style={{background: 'linear-gradient(#2b3a63,#5a1f35)', alignItems: 'center', justifyContent: 'flex-end'}}>
        <div style={{position: 'absolute', top: 120, left: 40, right: 40, fontFamily: 'Creato, sans-serif', fontWeight: 800, fontSize: 52, color: '#fff', textAlign: 'center', WebkitTextStroke: '8px #0b0a0c', paintOrder: 'stroke fill'}}>POV: trovi l'anello perfetto 💍</div>
        <div style={{marginBottom: 40}}>
          <UgoDance t={t} />
        </div>
        {[0, 1, 2, 3].map((k) => {
          const p = ((s * 0.8 + k * 0.27) % 1) as number;
          return <div key={k} style={{position: 'absolute', right: 40 + (k % 2) * 30, bottom: 300 + p * 560, fontSize: 70, color: '#ff375f', opacity: 1 - p}}>♥</div>;
        })}
        {sale && (
          <div style={{position: 'absolute', bottom: 150, left: '50%', transform: `translateX(-50%) scale(${0.6 + 0.4 * sm((s - 1.3) / 0.2)}) rotate(-4deg)`, background: '#fff', borderRadius: 26, padding: '18px 34px', display: 'flex', alignItems: 'center', gap: 16, border: '6px solid #0b0a0c', fontFamily: 'Creato, sans-serif', fontWeight: 800, fontSize: 44, color: '#111'}}>
            🛍️ Anello Aurora · 189€
          </div>
        )}
      </AbsoluteFill>
    );
  }
  if (i === 1) {
    // product photo on a warm set
    return (
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #fff1d6 0%, #f2a66a 70%, #a55a33 100%)', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{transform: `scale(${1.0 + 0.08 * s})`}}>
          <Ring size={430} />
        </div>
        <div style={{position: 'absolute', bottom: 120, width: 360, height: 40, borderRadius: '50%', background: 'rgba(80,30,10,.25)'}} />
      </AbsoluteFill>
    );
  }
  if (i === 2) {
    // carousel swiping
    const off = sm(s / 0.5) * 420;
    return (
      <AbsoluteFill style={{background: '#fbf6ea'}}>
        <div style={{position: 'absolute', top: 260, left: 40 - off, display: 'flex', gap: 30}}>
          {['#2b3a63', '#5a1f35', '#2f6b6a'].map((c, k) => (
            <div key={k} style={{width: 390, height: 520, borderRadius: 30, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '6px solid #0b0a0c'}}>
              <Ring size={260} gem={['#7fd3ff', '#e8344c', '#4ce0a0'][k]} />
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', top: 830, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14}}>
          {[0, 1, 2].map((k) => <div key={k} style={{width: 18, height: 18, borderRadius: 9, background: k === (s > 0.3 ? 1 : 0) ? '#111' : '#ccc'}} />)}
        </div>
      </AbsoluteFill>
    );
  }
  if (i === 3) {
    // sponsored post with CTA
    return (
      <AbsoluteFill style={{background: '#fff', fontFamily: 'Creato, sans-serif'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '130px 30px 20px'}}>
          <div style={{width: 74, height: 74, borderRadius: 37, background: '#1f2f4f', border: `4px solid ${GOLD}`}} />
          <div>
            <div style={{fontSize: 34, fontWeight: 800}}>gioielleria_ugo</div>
            <div style={{fontSize: 26, color: '#777'}}>Sponsorizzato</div>
          </div>
        </div>
        <div style={{height: 560, background: 'linear-gradient(#2b3a63,#141a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Ring size={320} gem="#e8344c" />
        </div>
        <div style={{margin: '24px 30px', background: '#2f6bff', color: '#fff', borderRadius: 18, padding: '22px 0', textAlign: 'center', fontSize: 40, fontWeight: 800, transform: `scale(${1 + 0.05 * Math.sin(s * 12)})`}}>Scopri di più</div>
      </AbsoluteFill>
    );
  }
  if (i === 4) {
    // online shop: add to cart
    const added = s > 0.3;
    return (
      <AbsoluteFill style={{background: '#fbf6ea', fontFamily: 'Creato, sans-serif', padding: '130px 34px 0', boxSizing: 'border-box'}}>
        <div style={{height: 470, borderRadius: 30, background: 'linear-gradient(#ffe3b8,#f2a66a)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Ring size={300} gem="#4ce0a0" />
        </div>
        <div style={{fontSize: 46, fontWeight: 800, marginTop: 30}}>Fede Classica</div>
        <div style={{fontSize: 40, color: '#2f7f8f', marginTop: 8}}>240 €</div>
        <div style={{marginTop: 30, background: added ? '#3bb26b' : '#111', color: '#fff', borderRadius: 40, padding: '24px 0', textAlign: 'center', fontSize: 40, fontWeight: 800}}>{added ? '✓ Nel carrello' : 'Aggiungi al carrello'}</div>
      </AbsoluteFill>
    );
  }
  // results: views and followers going up
  const k = sm(s / 0.45);
  return (
    <AbsoluteFill style={{background: '#111', fontFamily: 'Creato, sans-serif', color: '#fff', padding: '170px 40px 0', boxSizing: 'border-box'}}>
      <div style={{fontSize: 40, color: '#aaa'}}>Visualizzazioni</div>
      <div style={{fontSize: 120, fontWeight: 800, color: YEL}}>{Math.round(48 * k)}K</div>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 22, height: 360, marginTop: 30}}>
        {[0.15, 0.22, 0.3, 0.48, 0.7, 1].map((h, j) => (
          <div key={j} style={{flex: 1, height: `${h * 100 * k}%`, background: j === 5 ? YEL : '#3a3a46', borderRadius: 10}} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Services: React.FC<{tv: number}> = ({tv}) => {
  let i = 0;
  while (i < CARDS.length - 1 && CARDS[i + 1][0] <= tv) i++;
  const [c0, label] = CARDS[i];
  const s = tv - c0;
  const whip = 1 - sm(s / 0.16);
  const tilt = (i % 2 ? 1 : -1) * 4;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #34343a 0%, #1b1b1f 70%)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
      <style>{`@font-face{font-family:Creato;src:url(${staticFile('CreatoDisplay-ExtraBold.otf')});}`}</style>
      {/* yellow speed band behind the phone */}
      <div style={{position: 'absolute', width: '160%', height: 260, background: YEL, transform: `rotate(-12deg) translateX(${(i % 2 ? -1 : 1) * whip * 600}px)`, opacity: 0.95}} />
      <div style={{transform: `translateX(${whip * (i % 2 ? -1100 : 1100)}px) rotate(${tilt * (1 - whip)}deg)`, width: 640, height: 1300, borderRadius: 92, background: '#2f3138', border: '10px solid #0b0a0c', padding: 20, boxSizing: 'border-box', boxShadow: '0 40px 90px rgba(0,0,0,.5)'}}>
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 72, overflow: 'hidden', background: '#111'}}>
          <Screen i={i} s={s} t={tv} />
          <div style={{position: 'absolute', top: 20, left: '50%', marginLeft: -85, width: 170, height: 48, borderRadius: 24, background: '#000'}} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{background: YEL, color: '#0b0a0c', fontFamily: 'Creato, sans-serif', fontWeight: 800, fontSize: 54, padding: '14px 34px', borderRadius: 16, border: '6px solid #0b0a0c', transform: `skewX(-8deg) scale(${0.85 + 0.15 * sm(s / 0.15)})`}}>{label}</div>
      </div>
    </AbsoluteFill>
  );
};
