import React from 'react';
import { Grid, Flex, Text, Card } from '@radix-ui/themes';
import { EncryptionPanel } from '../../components/seal/EncryptionPanel';
import { DecryptionPanel } from '../../components/seal/DecryptionPanel';
import { useAppContext } from '../../context/AppContext';

export function Encrypt() {
  const { state } = useAppContext();

  const handleEncryptionComplete = (result: any) => {
    console.log('Encryption completed:', result);
  };

  const handleDecryptionComplete = (result: Uint8Array) => {
    console.log('Decryption completed:', result);
  };

  return (
    <Flex direction="column" gap="6">
      <Card style={{ padding: '24px', textAlign: 'center' }}>
        <Text size="7" weight="bold" style={{ 
          background: 'linear-gradient(45deg, #8b5cf6, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px',
          display: 'block'
        }}>
          Seal Encryption & Decryption
        </Text>
        <Text size="4" color="gray">
          Encrypt data with advanced access control patterns and decrypt with session keys
        </Text>
      </Card>

      {!state.wallet.connected && (
        <Card style={{ padding: '16px', background: 'var(--orange-2)', border: '1px solid var(--orange-6)' }}>
          <Text size="3" color="orange">
            ⚠️ Connect your wallet to use Seal encryption features
          </Text>
        </Card>
      )}

      <Grid columns="2" gap="6">
        <EncryptionPanel onEncryptionComplete={handleEncryptionComplete} />
        <DecryptionPanel onDecryptionComplete={handleDecryptionComplete} />
      </Grid>

      <Card style={{ padding: '20px' }}>
        <Text size="4" weight="bold" style={{ marginBottom: '12px', display: 'block' }}>
          How Seal Encryption Works
        </Text>
        <Grid columns="4" gap="4">
          <Flex direction="column" gap="2">
            <Text size="3" weight="medium">1. Choose Policy</Text>
            <Text size="2" color="gray">
              Select an access control pattern: private, allowlist, 
              subscription, or time-locked encryption.
            </Text>
          </Flex>
          
          <Flex direction="column" gap="2">
            <Text size="3" weight="medium">2. Encrypt Data</Text>
            <Text size="2" color="gray">
              Data is encrypted using threshold encryption with 
              multiple key servers for security and availability.
            </Text>
          </Flex>
          
          <Flex direction="column" gap="2">
            <Text size="3" weight="medium">3. Store Securely</Text>
            <Text size="2" color="gray">
              Encrypted data can be stored anywhere - on Walrus, 
              IPFS, or traditional storage systems.
            </Text>
          </Flex>
          
          <Flex direction="column" gap="2">
            <Text size="3" weight="medium">4. Controlled Access</Text>
            <Text size="2" color="gray">
              Only authorized parties can decrypt data based on 
              the access control policy you've defined.
            </Text>
          </Flex>
        </Grid>
      </Card>

      <Card style={{ padding: '20px' }}>
        <Text size="4" weight="bold" style={{ marginBottom: '12px', display: 'block' }}>
          Access Control Patterns
        </Text>
        <Grid columns="2" gap="4">
          <Card style={{ padding: '16px' }}>
            <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              🔒 Private
            </Text>
            <Text size="2" color="gray">
              Only the data owner can decrypt. Ideal for personal data storage.
            </Text>
          </Card>
          
          <Card style={{ padding: '16px' }}>
            <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              📋 Allowlist
            </Text>
            <Text size="2" color="gray">
              Only specific addresses on an allowlist can decrypt. Perfect for team collaboration.
            </Text>
          </Card>
          
          <Card style={{ padding: '16px' }}>
            <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              💳 Subscription
            </Text>
            <Text size="2" color="gray">
              Users pay to access encrypted content. Great for premium content delivery.
            </Text>
          </Card>
          
          <Card style={{ padding: '16px' }}>
            <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              ⏰ Time-locked
            </Text>
            <Text size="2" color="gray">
              Data is automatically revealed after a specified time period.
            </Text>
          </Card>
        </Grid>
      </Card>
    </Flex>
  );
}