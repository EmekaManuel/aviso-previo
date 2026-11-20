import React from 'react';
import { Composition } from 'remotion';
import { Demo } from './Demo';
import { FPS, TOTAL } from './timing';

export const Root: React.FC = () => <Composition id="Demo" component={Demo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />;
