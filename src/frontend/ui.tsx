import React from 'react';
import { Box, Heading, Inline, Stack, Text, xcss } from '@forge/react';

/** Shared layout primitives for the Aviso Previo UI Kit surfaces. */

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

/** Flex child that wraps onto its own row on narrow containers. */
export const tile = xcss({
  flexGrow: 1,
  minWidth: '140px',
  backgroundColor: 'elevation.surface',
  borderColor: 'color.border',
  borderStyle: 'solid',
  borderWidth: 'border.width',
  borderRadius: 'radius.large',
  padding: 'space.150',
});

export const column = xcss({
  flexGrow: 1,
  minWidth: '240px',
});

export const DISCLAIMER = 'Sample data · Fictional. Aviso Previo summarizes your contracts. It is not legal advice.';

export const Footnote = ({ children }: { children?: React.ReactNode }) => (
  <Text size="small" color="color.text.subtlest">
    {children ?? DISCLAIMER}
  </Text>
);

export const Kpi = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <Box xcss={tile}>
    <Stack space="space.050">
      <Text size="small" color="color.text.subtlest">
        {label}
      </Text>
      <Heading as="h2">{String(value)}</Heading>
      {hint ? (
        <Text size="small" color="color.text.subtlest">
          {hint}
        </Text>
      ) : null}
    </Stack>
  </Box>
);

/** Label / value pair used in definition-style summaries. */
export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Stack space="space.025">
    <Text size="small" color="color.text.subtlest">
      {label}
    </Text>
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
