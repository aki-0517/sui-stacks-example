import React from 'react';
import { Flex, Text, Card, Box } from '@radix-ui/themes';
import { ConnectWalletButton } from '../common/WalletConnector';
import { NetworkSwitcher } from '../common/NetworkSwitcher';

export function Header() {
  return (
    <Box style={{ 
      borderBottom: '1px solid var(--gray-6)',
      padding: '16px 24px',
      background: 'var(--color-background)'
    }}>
      <Flex justify="between" align="center">
        <Flex align="center" gap="4">
          <Text size="6" weight="bold" style={{ 
            background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Walrus & Seal
          </Text>
          <Text size="3" color="gray">
            Decentralized Storage & Encryption Platform
          </Text>
        </Flex>
        
        <Flex align="center" gap="4">
          <NetworkSwitcher />
          <ConnectWalletButton />
        </Flex>
      </Flex>
    </Box>
  );
}