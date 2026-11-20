import React from 'react';
import { Composition } from 'remotion';
import { Demo } from './Demo';
import { FPS, TOTAL } from './timing';

import { Banner } from './Banner';

export const Root: React.FC = () => (
  <>
    <Composition id="Demo" component={Demo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
    <Composition id="Banner" component={Banner} durationInFrames={1} fps={FPS} width={2400} height={900} />
  </>
);
