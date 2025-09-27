import React from 'react';
import { Flex, Text, Card, Grid } from '@radix-ui/themes';
import { EncryptedFileUploader } from '../../components/integration/EncryptedFileUploader';
import { useAppContext } from '../../context/AppContext';

export function SecureStorage() {
  const { state } = useAppContext();

  const handleUploadComplete = (result: { walrusResult: any; sealResult: any }) => {
    console.log('Secure storage upload completed:', result);
  };

  return (
    <Flex direction="column" gap="6">
      <Card style={{ padding: '24px', textAlign: 'center' }}>
        <Text size="7" weight="bold" style={{ 
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px',
          display: 'block'
        }}>
          Secure Encrypted Storage
        </Text>
        <Text size="4" color="gray">
          Combine Seal encryption with Walrus storage for ultimate data security
        </Text>
      </Card>

      {!state.wallet.connected && (
        <Card style={{ padding: '16px', background: 'var(--orange-2)', border: '1px solid var(--orange-6)' }}>
          <Text size="3" color="orange">
            ⚠️ Connect your wallet to use secure storage features
          </Text>
        </Card>
      )}

      <EncryptedFileUploader onUploadComplete={handleUploadComplete} />

      <Card style={{ padding: '20px' }}>
        <Text size="4" weight="bold" style={{ marginBottom: '16px', display: 'block' }}>
          Why Use Encrypted Storage?
        </Text>
        <Grid columns="2" gap="4">
          <Card style={{ padding: '16px' }}>
            <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              🔐 End-to-End Encryption
            </Text>
            <Text size="2" color="gray">
              Files are encrypted before leaving your device using Seal's advanced
              threshold encryption. Even storage providers cannot access your data.
            </Text>
          </Card>
          
          <Card style={{ padding: '16px' }}>
            <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              🌐 Decentralized Storage
            </Text>
            <Text size="2" color="gray">
              Encrypted files are stored on Walrus's decentralized network,
              ensuring high availability and resistance to censorship.
            </Text>
          </Card>
          
          <Card style={{ padding: '16px' }}>
            <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              🎯 Access Control
            </Text>
            <Text size="2" color="gray">
              Define exactly who can access your data with flexible policies:
              private, allowlist, subscription, or time-locked access.
            </Text>
          </Card>
          
          <Card style={{ padding: '16px' }}>
            <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              🔑 Key Management
            </Text>
            <Text size="2" color="gray">
              Session keys are managed securely through Seal's key servers,
              enabling controlled decryption without exposing master keys.
            </Text>
          </Card>
        </Grid>
      </Card>

      <Card style={{ padding: '20px' }}>
        <Text size="4" weight="bold" style={{ marginBottom: '16px', display: 'block' }}>
          How It Works
        </Text>
        <Grid columns="4" gap="4">
          <Flex direction="column" gap="2" style={{ textAlign: 'center' }}>
            <Text size="6">📁</Text>
            <Text size="3" weight="medium">1. Select Files</Text>
            <Text size="2" color="gray">
              Choose files to encrypt and store securely
            </Text>
          </Flex>
          
          <Flex direction="column" gap="2" style={{ textAlign: 'center' }}>
            <Text size="6">🔐</Text>
            <Text size="3" weight="medium">2. Encrypt</Text>
            <Text size="2" color="gray">
              Files are encrypted using Seal with your chosen access policy
            </Text>
          </Flex>
          
          <Flex direction="column" gap="2" style={{ textAlign: 'center' }}>
            <Text size="6">🐋</Text>
            <Text size="3" weight="medium">3. Store</Text>
            <Text size="2" color="gray">
              Encrypted files are uploaded to Walrus's decentralized network
            </Text>
          </Flex>
          
          <Flex direction="column" gap="2" style={{ textAlign: 'center' }}>
            <Text size="6">🔗</Text>
            <Text size="3" weight="medium">4. Share</Text>
            <Text size="2" color="gray">
              Share the Blob ID with authorized users for secure access
            </Text>
          </Flex>
        </Grid>
      </Card>

      <Card style={{ padding: '20px', background: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
        <Text size="3" weight="bold" color="blue" style={{ marginBottom: '8px', display: 'block' }}>
          💡 Pro Tip
        </Text>
        <Text size="3" color="blue">
          For maximum security, use allowlist or subscription policies to control who can decrypt your data.
          The encryption happens client-side, so your files are secure even if Walrus nodes are compromised.
        </Text>
      </Card>
    </Flex>
  );
}