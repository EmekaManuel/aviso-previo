import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/styles.css';
import './panel.css';
import { followJiraTheme } from '../src/theme';
import Panel from './Panel';

followJiraTheme();
createRoot(document.getElementById('root')!).render(<React.StrictMode><Panel /></React.StrictMode>);
