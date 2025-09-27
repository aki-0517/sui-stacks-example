import React from 'react';
import { Grid, Flex, Text, Card } from '@radix-ui/themes';
import { BlobUploader } from '../../components/walrus/BlobUploader';
import { BlobViewer } from '../../components/walrus/BlobViewer';
import { useAppContext } from '../../context/AppContext';

export function Store() {
  const { state } = useAppContext();

  const handleUploadComplete = (result: any) => {
    console.log('Upload completed:', result);
  };

  return (
    <Flex direction="column" gap="6">
      <Card style={{ padding: '24px', textAlign: 'center' }}>
        <Text size="7" weight="bold" style={{ 
          background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px',
          display: 'block'
        }}>
          Walrus Blob Storage
        </Text>
        <Text size="4" color="gray">
          Store and retrieve files on the decentralized Walrus network
        </Text>
      </Card>

      {!state.wallet.connected && (
        <Card style={{ padding: '16px', background: 'var(--orange-2)', border: '1px solid var(--orange-6)' }}>
          <Text size="3" color="orange">
            ⚠️ Connect your wallet to upload files to Walrus
          </Text>
        </Card>
      )}

      <Grid columns="2" gap="6">
        <BlobUploader
          maxFiles={5}
          onUploadComplete={handleUploadComplete}
        />
        
        <BlobViewer />
      </Grid>

      <Card style={{ padding: '20px' }}>
        <Text size="4" weight="bold" style={{ marginBottom: '12px', display: 'block' }}>
          How it works
        </Text>
        <Grid columns="3" gap="4">
          <Flex direction="column" gap="2">
            <Text size="3" weight="medium">1. Select Files</Text>
            <Text size="2" color="gray">
              Choose files to upload. Supports images, text, JSON, and more.
              Maximum file size is 50MB per file.
            </Text>
          </Flex>
          
          <Flex direction="column" gap="2">
            <Text size="3" weight="medium">2. Configure Storage</Text>
            <Text size="2" color="gray">
              Set storage duration (epochs), choose permanent storage,
              and add custom metadata attributes.
            </Text>
          </Flex>
          
          <Flex direction="column" gap="2">
            <Text size="3" weight="medium">3. Upload & Share</Text>
            <Text size="2" color="gray">
              Files are encoded and distributed across Walrus nodes.
              Get a unique Blob ID to share or retrieve your files.
            </Text>
          </Flex>
        </Grid>
      </Card>
    </Flex>
  );
}