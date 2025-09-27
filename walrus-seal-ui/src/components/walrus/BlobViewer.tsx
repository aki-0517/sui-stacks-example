import React, { useState, useCallback } from 'react';
import { Card, Flex, Text, Button, TextField, Badge, Box, Separator } from '@radix-ui/themes';
import { useWalrus } from '../../hooks/useWalrus';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatBytes, formatDate } from '../../utils/config';

interface BlobViewerProps {
  blobId?: string;
  onBlobLoad?: (blob: Blob, blobId: string) => void;
}

export function BlobViewer({ blobId: initialBlobId, onBlobLoad }: BlobViewerProps) {
  const { read, status, loading, error, clearError } = useWalrus();
  
  const [blobId, setBlobId] = useState(initialBlobId || '');
  const [blobData, setBlobData] = useState<Blob | null>(null);
  const [blobStatus, setBlobStatus] = useState<any>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [isText, setIsText] = useState(false);

  const handleRead = useCallback(async () => {
    if (!blobId.trim()) {
      return;
    }

    clearError();
    setBlobData(null);
    setBlobUrl(null);
    setIsImage(false);
    setIsText(false);

    try {
      const [blob, statusData] = await Promise.all([
        read(blobId),
        status(blobId)
      ]);

      if (blob) {
        setBlobData(blob);
        setBlobStatus(statusData);
        
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        
        setIsImage(blob.type.startsWith('image/'));
        setIsText(blob.type.startsWith('text/') || blob.type === 'application/json');
        
        if (onBlobLoad) {
          onBlobLoad(blob, blobId);
        }
      }
    } catch (error) {
      console.error('Failed to read blob:', error);
    }
  }, [blobId, read, status, clearError, onBlobLoad]);

  const handleDownload = useCallback(() => {
    if (blobData && blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `walrus-blob-${blobId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [blobData, blobUrl, blobId]);

  const renderBlobContent = () => {
    if (!blobData || !blobUrl) return null;

    if (isImage) {
      return (
        <Box style={{ textAlign: 'center' }}>
          <img
            src={blobUrl}
            alt="Blob content"
            style={{
              maxWidth: '100%',
              maxHeight: '400px',
              borderRadius: '8px',
              border: '1px solid var(--gray-6)'
            }}
          />
        </Box>
      );
    }

    if (isText && blobData.size < 10000) { // Only show text for small files
      return (
        <BlobTextContent blob={blobData} />
      );
    }

    return (
      <Card style={{ padding: '16px', textAlign: 'center' }}>
        <Text size="3" color="gray">
          📄 File preview not available for this type
        </Text>
        <Text size="2" color="gray" style={{ display: 'block', marginTop: '8px' }}>
          Type: {blobData.type || 'unknown'} • Size: {formatBytes(blobData.size)}
        </Text>
      </Card>
    );
  };

  return (
    <Card style={{ padding: '24px' }}>
      <Flex direction="column" gap="4">
        <Text size="5" weight="bold">🔍 View Blob</Text>

        {error && (
          <Card style={{ padding: '12px', background: 'var(--red-2)', border: '1px solid var(--red-6)' }}>
            <Text size="2" color="red">{error}</Text>
          </Card>
        )}

        <Flex gap="2">
          <TextField.Root
            placeholder="Enter Blob ID (e.g., abc123...)"
            value={blobId}
            onChange={(e) => setBlobId(e.target.value)}
            style={{ flex: 1, fontFamily: 'monospace' }}
          />
          <Button onClick={handleRead} disabled={!blobId.trim() || loading}>
            {loading ? <LoadingSpinner size="small" text="" /> : 'Load'}
          </Button>
        </Flex>

        {blobStatus && (
          <Card style={{ padding: '16px' }}>
            <Text size="3" weight="medium" style={{ marginBottom: '12px', display: 'block' }}>
              Blob Status
            </Text>
            <Flex direction="column" gap="2">
              <Flex justify="between" align="center">
                <Text size="2" color="gray">Status</Text>
                <Badge color={blobStatus.status === 'stored' ? 'green' : 'orange'}>
                  {blobStatus.status}
                </Badge>
              </Flex>
              <Flex justify="between" align="center">
                <Text size="2" color="gray">Size</Text>
                <Text size="2">{formatBytes(blobStatus.size)}</Text>
              </Flex>
              <Flex justify="between" align="center">
                <Text size="2" color="gray">Epochs</Text>
                <Text size="2">{blobStatus.epochs}</Text>
              </Flex>
              {blobStatus.expiry && (
                <Flex justify="between" align="center">
                  <Text size="2" color="gray">Expires</Text>
                  <Text size="2">{formatDate(blobStatus.expiry)}</Text>
                </Flex>
              )}
              <Flex justify="between" align="center">
                <Text size="2" color="gray">Availability</Text>
                <Text size="2">{(blobStatus.availability * 100).toFixed(1)}%</Text>
              </Flex>
              <Flex justify="between" align="center">
                <Text size="2" color="gray">Confirmed</Text>
                <Badge color={blobStatus.confirmed ? 'green' : 'orange'}>
                  {blobStatus.confirmed ? 'Yes' : 'No'}
                </Badge>
              </Flex>
            </Flex>
          </Card>
        )}

        {blobData && (
          <>
            <Separator />
            
            <Flex justify="between" align="center">
              <Text size="3" weight="medium">Blob Content</Text>
              <Button onClick={handleDownload} variant="soft">
                📥 Download
              </Button>
            </Flex>

            {renderBlobContent()}
          </>
        )}
      </Flex>
    </Card>
  );
}

function BlobTextContent({ blob }: { blob: Blob }) {
  const [textContent, setTextContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadText = async () => {
      try {
        const text = await blob.text();
        setTextContent(text);
      } catch (error) {
        console.error('Failed to read text content:', error);
        setTextContent('Failed to load text content');
      } finally {
        setLoading(false);
      }
    };

    loadText();
  }, [blob]);

  if (loading) {
    return <LoadingSpinner size="small" text="Loading text content..." />;
  }

  return (
    <Card style={{ padding: '16px', background: 'var(--gray-2)' }}>
      <pre style={{
        margin: 0,
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.4',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        {textContent}
      </pre>
    </Card>
  );
}