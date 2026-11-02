import React, {useLayoutEffect, useRef} from 'react';
import {staticFile, delayRender, continueRender} from 'remotion';
import {drawPerson, CW, CH, Pose} from './toon';
import {HERO, OWNER, PEOPLE, DESIGNER} from './specs';
export const CharTest: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = React.useState(() => delayRender());
  useLayoutEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = ref.current!;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#9fd0f5'; ctx.fillRect(0, 0, c.width, c.height);
      const tmp = document.createElement('canvas'); tmp.width = CW; tmp.height = CH;
      const t = tmp.getContext('2d')!;
      const list: [any, Pose][] = [
        [HERO, {expr: 'smile', logo: img, armL: [20, -10], armR: [-10, 5]}],
        [HERO, {expr: 'proud', logo: img, lean: 6, walk: 1, amp: 1, dir: -1}],
        [OWNER, {expr: 'tired', sweat: true, holdL: 'tool', armL: [10, -60]}],
        [PEOPLE[0], {walk: 0.5, amp: 1}], [PEOPLE[2], {walk: 2, amp: 1, expr: 'neutral'}], [DESIGNER, {holdR: 'folder', armR: [-30, -40]}],
        [PEOPLE[4], {walk: 1}], [PEOPLE[5], {expr: 'surprise'}],
      ];
      list.forEach(([s, p], i) => { drawPerson(t, s, p); ctx.drawImage(tmp, (i % 4) * 480 - 20, Math.floor(i / 4) * 800 + 10, 480, 800); });
      continueRender(h);
    };
    img.src = staticFile('logo.png');
  }, []);
  return <canvas ref={ref} width={1920} height={1600} />;
};
