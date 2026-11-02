import React from 'react';
import {Composition} from 'remotion';
import {JewelShort3} from './JewelShort3';
import {CharTest2} from './CharTest2';

// Ugo: the current video (46 s, 1080x1920, 30 fps).
// Chars2: a sheet with every character view, to check drawings quickly.
// Older passes (Short, Hook, Jewel, Jewel2) stay in src/ as reference but are not registered.
export const Root: React.FC = () => (
  <>
    <Composition id="Ugo" component={JewelShort3} durationInFrames={1380} fps={30} width={1080} height={1920} />
    <Composition id="Chars2" component={CharTest2} durationInFrames={1} fps={30} width={1920} height={1600} />
  </>
);
