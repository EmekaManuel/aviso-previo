import React from 'react';
import { Box, Heading, Inline, Stack, Text, xcss, Lozenge } from '@forge/react';

/**
 * Shared layout & design primitives for Aviso Previo UI Kit surfaces.
 * Built with Atlassian Design tokens for full dark/light theme fidelity.
 */

export const card = xcss({
  backgroundColor: 'elevation.surface',
  borderColor: 'color.border',
  borderStyle: 'solid',
  borderWidth: 'border.width',
  borderRadius: 'radius.large',
  padding: 'space.200',
  maxWidth: '100%',
});

export const cardTight = xcss({
  backgroundColor: 'elevation.surface',
  borderColor: 'color.border',
  borderStyle: 'solid',
  borderWidth: 'border.width',
  borderRadius: 'radius.large',
  padding: 'space.150',
  maxWidth: '100%',
});

export const cardHighlight = xcss({
  backgroundColor: 'elevation.surface',
  borderColor: 'color.border.accent.teal',
  borderStyle: 'solid',
  borderWidth: 'border.width',
  borderRadius: 'radius.large',
  padding: 'space.200',
  maxWidth: '100%',
});

export const cardAlert = xcss({
  backgroundColor: 'color.background.danger.subtle',
  borderColor: 'color.border.danger',
  borderStyle: 'solid',
  borderWidth: 'border.width',
  borderRadius: 'radius.large',
  padding: 'space.200',
  maxWidth: '100%',
});

export const cardSuccess = xcss({
  backgroundColor: 'color.background.success.subtle',
  borderColor: 'color.border.success',
  borderStyle: 'solid',
  borderWidth: 'border.width',
  borderRadius: 'radius.large',
  padding: 'space.200',
  maxWidth: '100%',
});

export const tint = xcss({
  backgroundColor: 'color.background.neutral.subtle',
  borderRadius: 'radius.medium',
  padding: 'space.150',
  maxWidth: '100%',
});

export const quote = xcss({
  backgroundColor: 'color.background.neutral.subtle',
  borderColor: 'color.border.bold',
  borderStyle: 'solid',
  borderWidth: 'border.width',
  borderRadius: 'radius.small',
  padding: 'space.150',
  maxWidth: '100%',
});

/** Responsive KPI tile that flexes and wraps cleanly on narrow sidebar viewports */
export const tile = xcss({
  flexGrow: 1,
  minWidth: '130px',
  backgroundColor: 'elevation.surface',
  borderColor: 'color.border',
  borderStyle: 'solid',
  borderWidth: 'border.width',
  borderRadius: 'radius.large',
  padding: 'space.150',
});

export const tileActive = xcss({
  flexGrow: 1,
  minWidth: '130px',
  backgroundColor: 'color.background.neutral.subtle',
  borderColor: 'color.border.accent.teal',
  borderStyle: 'solid',
  borderWidth: 'border.width',
  borderRadius: 'radius.large',
  padding: 'space.150',
});

export const column = xcss({
  flexGrow: 1,
  minWidth: '240px',
});

export const bannerWrap = xcss({
  padding: 'space.200',
  borderRadius: 'radius.large',
  backgroundColor: 'color.background.neutral.subtle',
  borderColor: 'color.border',
  borderStyle: 'solid',
  borderWidth: 'border.width',
});

export const DISCLAIMER = 'Sample data · Fictional. Aviso Previo summarizes your contracts. It is not legal advice.';

export const Footnote = ({ children }: { children?: React.ReactNode }) => (
  <Box paddingBlockStart="space.100">
    <Text size="small" color="color.text.subtlest">
      {children ?? DISCLAIMER}
    </Text>
  </Box>
);

export const Kpi = ({
  label,
  value,
  hint,
  highlight = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  highlight?: boolean;
}) => (
  <Box xcss={highlight ? tileActive : tile}>
    <Stack space="space.050">
      <Text size="small" color="color.text.subtlest">
        {label}
      </Text>
      <Heading as="h3">{String(value)}</Heading>
      {hint ? (
        <Text size="small" color="color.text.subtlest">
          {hint}
        </Text>
      ) : null}
    </Stack>
  </Box>
);

/** Field / Value component used in structured definition cards */
export const Field = ({
  label,
  children,
  badge,
}: {
  label: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) => (
  <Stack space="space.025">
    <Inline space="space.050" alignBlock="center">
      <Text size="small" color="color.text.subtlest">
        {label}
      </Text>
      {badge}
    </Inline>
    {typeof children === 'string' || typeof children === 'number' ? (
      <Text weight="semibold">{children}</Text>
    ) : (
      children
    )}
  </Stack>
);

export const FieldRow = ({ children }: { children: React.ReactNode }) => (
  <Inline space="space.300" rowSpace="space.150" shouldWrap>
    {children}
  </Inline>
);
