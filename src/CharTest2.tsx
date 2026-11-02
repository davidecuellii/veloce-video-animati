import React, {useLayoutEffect, useRef} from 'react';
import {staticFile, delayRender, continueRender} from 'remotion';
import {CW, CH, Spec} from './toon';
import {drawPerson2, Pose2, phoneArms} from './toon2';
import {PEOPLE} from './specs';
const HERO: Spec = {skin: '#f2c9a0', hair: '#141418', hairStyle: 'short', shirt: '#1d1d24', pants: '#1d1d24', shoes: '#121216', hero: true, minimal: true, glasses: true};
const JEW: Spec = {skin: '#e2a878', hair: '#56565e', hairStyle: 'short', shirt: '#f4f1ea', pants: '#2a2a33', shoes: '#3a2a22', apron: '#6e4a2e', stache: true};
export const CharTest2: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = React.useState(() => delayRender());
  useLayoutEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = ref.current!;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#e9d9c0';
      ctx.fillRect(0, 0, c.width, c.height);
      const tmp = document.createElement('canvas');
      tmp.width = CW;
      tmp.height = CH;
      const t = tmp.getContext('2d')!;
      const list: [Spec, Pose2][] = [
        [HERO, {view: 'front', expr: 'smile', look: 0.6, logo: img}],
        [HERO, {view: 'three', expr: 'smile', logo: img, holdL: 'iphone', armL: [100, -70]}],
        [HERO, {view: 'side', walk: 1, amp: 0.5, crouch: 50, armL: [70, -20], armR: [60, -10], holdL: 'iphone', logo: img}],
        [HERO, {view: 'back', logo: img}],
        [PEOPLE[0], {view: 'side', walk: 1.2, amp: 1, bob: 6, ...phoneArms('side')}],
        [PEOPLE[2], {view: 'three', walk: 2.5, amp: 1, ...phoneArms('three')}],
        [JEW, {view: 'three', expr: 'neutral', loupe: true, armL: [100, -60], armR: [60, -40], holdL: 'tweezers', tilt: 8, lookY: 1}],
        [PEOPLE[4], {view: 'side', walk: 0.3, amp: 1, expr: 'neutral', look: 1}],
      ];
      list.forEach(([s, p], i) => {
        drawPerson2(t, s, p);
        ctx.drawImage(tmp, (i % 4) * 480 - 20, Math.floor(i / 4) * 800 + 10, 480, 800);
      });
      continueRender(h);
    };
    img.src = staticFile('logo.png');
  }, []);
  return <canvas ref={ref} width={1920} height={1600} />;
};
