import React from 'react';
import { Flex, Text, Box } from '@radix-ui/themes';

export function Footer() {
  return (
    <Box style={{ 
      borderTop: '1px solid var(--gray-6)',
      padding: '16px 24px',
      background: 'var(--gray-1)'
    }}>
      <Flex justify="between" align="center">
        <Text size="2" color="gray">
          © 2024 Walrus & Seal Integration UI - Built with React, Vite, and TypeScript
        </Text>
        <Flex gap="4">
          <Text size="2" color="gray">
            Powered by Sui Network
          </Text>
          <Text size="2" color="gray">
            v1.0.0
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
}