import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {BokehPass} from 'three/examples/jsm/postprocessing/BokehPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';

// render -> lens blur -> bloom -> tone map / sRGB -> grade (contrast, saturation, split tone, vignette)
export function makePost(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, w: number, h: number) {
  gl.toneMapping = THREE.NeutralToneMapping;
  gl.toneMappingExposure = 0.92;
  const rt = new THREE.WebGLRenderTarget(w, h, {type: THREE.HalfFloatType, samples: 4});
  const comp = new EffectComposer(gl, rt);
  comp.setPixelRatio(1);
  comp.setSize(w, h);
  comp.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, {focus: 5, aperture: 0.002, maxblur: 0.01});
  comp.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.32, 0.55, 0.92);
  comp.addPass(bloom);
  comp.addPass(new OutputPass());
  const grade = new ShaderPass({
    uniforms: {tDiffuse: {value: null}, uVig: {value: 0.32}, uSat: {value: 1.14}, uCon: {value: 1.07}},
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uVig; uniform float uSat; uniform float uCon; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
        float l = dot(c, vec3(0.299,0.587,0.114));
        c = mix(vec3(l), c, uSat);
        c = (c - 0.5) * uCon + 0.5;
        // warm highlights, cool violet shadows
        c += mix(vec3(-0.012,-0.006,0.03), vec3(0.03,0.012,-0.02), smoothstep(0.2,0.8,l));
        vec2 d = vUv - 0.5; d.x *= 0.62;
        c *= 1.0 - uVig * smoothstep(0.18, 0.62, length(d));
        gl_FragColor = vec4(clamp(c,0.0,1.0), 1.0); }`,
  });
  comp.addPass(grade);
  return {comp, bokeh, bloom, grade};
}
