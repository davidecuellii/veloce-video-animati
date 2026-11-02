import React, {useLayoutEffect, useMemo, useState} from 'react';
import {useCurrentFrame, useVideoConfig, delayRender, continueRender, staticFile, AbsoluteFill, Audio, getInputProps} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {W, H, INK} from './kit';
import {buildWorld} from './world';
import {createStory, Story} from './story';

let CACHE: {story: Story} | null = null;

const Stage: React.FC<{t: number; logo: HTMLImageElement; testCam?: number[]}> = ({t, logo, testCam}) => {
  const {scene, camera, gl} = useThree();
  const story = useMemo(() => {
    if (!CACHE) {
      const world = buildWorld();
      CACHE = {story: createStory(world, logo)};
    }
    return CACHE.story;
  }, []);
  useLayoutEffect(() => {
    scene.fog = new THREE.Fog(story.world.fogColor, 80, 520);
    const cam = camera as THREE.PerspectiveCamera;
    story.update(t, cam, testCam);
    INK.uTan.value = Math.tan((cam.fov * Math.PI) / 360);
    gl.render(scene, cam);
  });
  return <primitive object={story.world.root} />;
};

export const Short: React.FC = () => {
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
  const t = props.t !== undefined ? props.t : frame / fps;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {logo && (
        <ThreeCanvas width={W} height={H} shadows gl={{antialias: true}} camera={{fov: 38, near: 0.1, far: 2200, position: [0, 2, 9]}}>
          <Stage t={t} logo={logo} testCam={props.cam} />
        </ThreeCanvas>
      )}
      <EndCard t={t} />
      <Audio src={staticFile('mix.wav')} />
    </AbsoluteFill>
  );
};

const clampN = (x: number) => Math.min(1, Math.max(0, x));
const smN = (x: number) => {
  x = clampN(x);
  return x * x * (3 - 2 * x);
};
const EndCard: React.FC<{t: number}> = ({t}) => {
  const band = clampN((t - 61.0) / 1.25);
  const showCard = t >= 61.62;
  const k = smN((t - 61.62) / 0.55);
  const x = -140 + band * 300;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <style>{`@font-face{font-family:Creato;src:url(${staticFile('CreatoDisplay-ExtraBold.otf')});}`}</style>
      {showCard && (
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 42%, #3a3a3d 0%, #2a2a2a 55%, #1d1d1f 100%)', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{transform: `scale(${(0.82 + 0.18 * k) * (1 + 0.012 * Math.max(0, t - 62.2))})`, opacity: k, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <img src={staticFile('logo.png')} style={{width: 620, height: 'auto'}} />
            <div style={{marginTop: 70, fontFamily: 'Creato, sans-serif', fontSize: 92, letterSpacing: 6, color: '#f3f3f3', fontStyle: 'italic', fontWeight: 800}}>VELOCE DIGITAL</div>
            <div style={{marginTop: 18, width: 240, height: 12, background: '#FFF233', transform: 'skewX(-28deg)'}} />
          </div>
        </AbsoluteFill>
      )}
      {band > 0 && band < 1 && (
        <div style={{position: 'absolute', top: -200, bottom: -200, left: `${x}%`, width: '120%', background: '#FFF233', transform: 'skewX(-18deg)', borderLeft: '14px solid #0b0a0c', borderRight: '14px solid #0b0a0c'}} />
      )}
    </AbsoluteFill>
  );
};
