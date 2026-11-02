import React, {useLayoutEffect, useMemo, useState} from 'react';
import {useCurrentFrame, useVideoConfig, delayRender, continueRender, staticFile, AbsoluteFill, Audio, getInputProps} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {W, H, INK} from './kit';
import {buildWorld} from './world';
import {createHook, HookStory} from './hook';
import {makePost} from './post';

let CACHE: {story: HookStory; post?: ReturnType<typeof makePost>} | null = null;

const Stage: React.FC<{t: number; logo: HTMLImageElement; testCam?: number[]}> = ({t, logo, testCam}) => {
  const {scene, camera, gl} = useThree();
  const c = useMemo(() => {
    if (!CACHE) CACHE = {story: createHook(buildWorld(), logo)};
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

export const HookShort: React.FC = () => {
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
        <ThreeCanvas width={W} height={H} shadows frameloop="never" gl={{antialias: true, preserveDrawingBuffer: true}} camera={{fov: 38, near: 0.05, far: 2200, position: [0, 2, 9]}}>
          <Stage t={t} logo={logo} testCam={props.cam} />
        </ThreeCanvas>
      )}
      <Audio src={staticFile('hook.wav')} />
    </AbsoluteFill>
  );
};
