import React, { useState, useCallback } from 'react';
import { Card, Flex, Text, Button, TextField, Badge, Box, Separator, TextArea } from '@radix-ui/themes';
import { useSeal } from '../../hooks/useSeal';
import { useAppContext } from '../../context/AppContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatBytes } from '../../utils/config';

interface DecryptionPanelProps {
  onDecryptionComplete?: (result: Uint8Array) => void;
}

export function DecryptionPanel({ onDecryptionComplete }: DecryptionPanelProps) {
  const { state } = useAppContext();
  const { decrypt, sessionKeys, loading, error, clearError } = useSeal();
  
  const [encryptedData, setEncryptedData] = useState<Uint8Array | null>(null);
  const [sessionKeyId, setSessionKeyId] = useState('');
  const [decryptionResult, setDecryptionResult] = useState<Uint8Array | null>(null);
  const [isTextResult, setIsTextResult] = useState(false);
  const [textResult, setTextResult] = useState('');

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      setEncryptedData(new Uint8Array(arrayBuffer));
    }
  }, []);

  const handleDecrypt = useCallback(async () => {
    if (!encryptedData) {
      alert('Please select an encrypted file');
      return;
    }

    if (!sessionKeyId.trim()) {
      alert('Please enter a session key ID');
      return;
    }

    if (!state.wallet.connected) {
      alert('Please connect your wallet to decrypt data');
      return;
    }

    const sessionKey = sessionKeys.get(sessionKeyId);
    if (!sessionKey) {
      alert('Session key not found. Please create or import the session key first.');
      return;
    }

    clearError();
    
    try {
      const result = await decrypt(encryptedData, sessionKey);
      
      if (result) {
        setDecryptionResult(result);
        
        // Try to decode as text
        try {
          const decodedText = new TextDecoder().decode(result);
          // Check if it's valid text (no null bytes, printable characters)
          if (decodedText.includes('\0') || !/^[\x20-\x7E\s]*$/.test(decodedText.slice(0, 100))) {
            setIsTextResult(false);
          } else {
            setIsTextResult(true);
            setTextResult(decodedText);
          }
        } catch {
          setIsTextResult(false);
        }
        
        if (onDecryptionComplete) {
          onDecryptionComplete(result);
        }
      }
    } catch (error) {
      console.error('Decryption failed:', error);
    }
  }, [encryptedData, sessionKeyId, state.wallet.connected, sessionKeys, decrypt, clearError, onDecryptionComplete]);

  const downloadDecryptedData = useCallback(() => {
    if (!decryptionResult) return;
    
    const blob = new Blob([decryptionResult], { type: isTextResult ? 'text/plain' : 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decrypted_data${isTextResult ? '.txt' : '.bin'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [decryptionResult, isTextResult]);

  const sessionKeysList = Array.from(sessionKeys.values());

  return (
    <Card style={{ padding: '24px' }}>
      <Flex direction="column" gap="4">
        <Flex align="center" gap="3">
          <Text size="5" weight="bold">🔓 Decrypt Data</Text>
          {!state.wallet.connected && (
            <Badge color="orange" variant="soft">
              Wallet Required
            </Badge>
          )}
        </Flex>

        {error && (
          <Card style={{ padding: '12px', background: 'var(--red-2)', border: '1px solid var(--red-6)' }}>
            <Text size="2" color="red">{error}</Text>
          </Card>
        )}

        <Box>
          <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
            Encrypted File
          </Text>
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".enc,.encrypted"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px dashed var(--gray-6)',
              borderRadius: '8px',
              background: 'var(--gray-2)',
              cursor: 'pointer'
            }}
          />
          {encryptedData && (
            <Text size="2" color="gray" style={{ marginTop: '4px', display: 'block' }}>
              Encrypted data size: {formatBytes(encryptedData.length)}
            </Text>
          )}
        </Box>

        <Box>
          <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
            Session Key ID
          </Text>
          <TextField.Root
            value={sessionKeyId}
            onChange={(e) => setSessionKeyId(e.target.value)}
            placeholder="Enter session key ID..."
            style={{ fontFamily: 'monospace' }}
          />
          {sessionKeysList.length > 0 && (
            <Box style={{ marginTop: '8px' }}>
              <Text size="2" color="gray" style={{ marginBottom: '4px', display: 'block' }}>
                Available Session Keys:
              </Text>
              <Flex direction="column" gap="1">
                {sessionKeysList.map((key) => (
                  <Button
                    key={key.id}
                    variant="soft"
                    size="1"
                    onClick={() => setSessionKeyId(key.id)}
                    style={{ justifyContent: 'flex-start', fontFamily: 'monospace' }}
                  >
                    {key.id.slice(0, 32)}...
                  </Button>
                ))}
              </Flex>
            </Box>
          )}
        </Box>

        <Button
          size="3"
          onClick={handleDecrypt}
          disabled={
            loading || 
            !state.wallet.connected ||
            !encryptedData ||
            !sessionKeyId.trim()
          }
          style={{ width: '100%' }}
        >
          {loading ? (
            <Flex align="center" gap="2">
              <LoadingSpinner size="small" text="" />
              <Text>Decrypting...</Text>
            </Flex>
          ) : (
            'Decrypt Data'
          )}
        </Button>

        {decryptionResult && (
          <>
            <Separator />
            
            <Card style={{ padding: '16px', background: 'var(--green-2)', border: '1px solid var(--green-6)' }}>
              <Text size="3" weight="bold" color="green" style={{ marginBottom: '12px', display: 'block' }}>
                ✅ Decryption Successful
              </Text>
              
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text size="2" color="gray">Decrypted Size</Text>
                  <Text size="2">{formatBytes(decryptionResult.length)}</Text>
                </Flex>
                <Flex justify="between" align="center">
                  <Text size="2" color="gray">Data Type</Text>
                  <Badge color="green" variant="soft">
                    {isTextResult ? 'Text' : 'Binary'}
                  </Badge>
                </Flex>
              </Flex>
              
              {isTextResult && textResult && (
                <Box style={{ marginTop: '12px' }}>
                  <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
                    Decrypted Text:
                  </Text>
                  <TextArea
                    value={textResult}
                    readOnly
                    rows={6}
                    style={{ 
                      width: '100%', 
                      fontFamily: 'monospace',
                      background: 'var(--gray-1)',
                      border: '1px solid var(--gray-6)'
                    }}
                  />
                </Box>
              )}
              
              <Button 
                onClick={downloadDecryptedData}
                variant="soft" 
                color="green"
                style={{ width: '100%', marginTop: '12px' }}
              >
                📥 Download Decrypted Data
              </Button>
            </Card>
          </>
        )}

        {sessionKeysList.length === 0 && (
          <Card style={{ padding: '12px', background: 'var(--yellow-2)', border: '1px solid var(--yellow-6)' }}>
            <Text size="2" color="orange">
              ⚠️ No session keys available. Create or import session keys to decrypt data.
            </Text>
          </Card>
        )}
      </Flex>
    </Card>
  );
}