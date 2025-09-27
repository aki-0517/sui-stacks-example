import React from 'react';
import { Flex, Text, Box } from '@radix-ui/themes';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
}

export function LoadingSpinner({ 
  size = 'medium', 
  text = 'Loading...', 
  overlay = false 
}: LoadingSpinnerProps) {
  const spinnerSize = {
    small: '16px',
    medium: '24px',
    large: '32px'
  }[size];

  const spinner = (
    <Box
      style={{
        width: spinnerSize,
        height: spinnerSize,
        border: `2px solid var(--gray-6)`,
        borderTop: `2px solid var(--accent-9)`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    />
  );

  const content = (
    <Flex direction="column" align="center" gap="3">
      {spinner}
      {text && (
        <Text size={size === 'small' ? '2' : '3'} color="gray">
          {text}
        </Text>
      )}
    </Flex>
  );

  if (overlay) {
    return (
      <Box
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(2px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Flex justify="center" align="center" style={{ padding: '20px' }}>
      {content}
    </Flex>
  );
}

export function InlineSpinner({ size = 'small' }: { size?: 'small' | 'medium' }) {
  const spinnerSize = {
    small: '12px',
    medium: '16px'
  }[size];

  return (
    <Box
      style={{
        width: spinnerSize,
        height: spinnerSize,
        border: `1px solid var(--gray-6)`,
        borderTop: `1px solid var(--accent-9)`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        display: 'inline-block'
      }}
    />
  );
}