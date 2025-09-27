import React, { useState, useCallback } from 'react';
import { Card, Flex, Text, Button, Select, TextArea, Badge, Box, Separator } from '@radix-ui/themes';
import { useSeal } from '../../hooks/useSeal';
import { useAppContext } from '../../context/AppContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatBytes } from '../../utils/config';

interface EncryptionPanelProps {
  onEncryptionComplete?: (result: any) => void;
}

export function EncryptionPanel({ onEncryptionComplete }: EncryptionPanelProps) {
  const { state } = useAppContext();
  const { encrypt, createPolicy, loading, error, clearError } = useSeal();
  
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [policyType, setPolicyType] = useState<'private' | 'allowlist' | 'subscription' | 'timelock'>('private');
  const [encryptionResult, setEncryptionResult] = useState<any>(null);
  const [encryptedSize, setEncryptedSize] = useState<number>(0);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFileInput(file);
  }, []);

  const handleEncrypt = useCallback(async () => {
    let data: Uint8Array;
    
    if (inputType === 'text') {
      if (!textInput.trim()) {
        alert('Please enter some text to encrypt');
        return;
      }
      data = new TextEncoder().encode(textInput);
    } else {
      if (!fileInput) {
        alert('Please select a file to encrypt');
        return;
      }
      const arrayBuffer = await fileInput.arrayBuffer();
      data = new Uint8Array(arrayBuffer);
    }

    if (!state.wallet.connected) {
      alert('Please connect your wallet to encrypt data');
      return;
    }

    clearError();
    
    try {
      const policy = createPolicy(policyType);
      const result = await encrypt(data, policy);
      
      if (result) {
        setEncryptionResult(result);
        setEncryptedSize(result.encryptedObject.length);
        
        if (onEncryptionComplete) {
          onEncryptionComplete(result);
        }
      }
    } catch (error) {
      console.error('Encryption failed:', error);
    }
  }, [inputType, textInput, fileInput, policyType, state.wallet.connected, encrypt, createPolicy, clearError, onEncryptionComplete]);

  const downloadEncryptedData = useCallback(() => {
    if (!encryptionResult) return;
    
    const blob = new Blob([encryptionResult.encryptedObject], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encrypted_${inputType === 'file' ? fileInput?.name || 'file' : 'text'}.enc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [encryptionResult, inputType, fileInput]);

  const originalSize = inputType === 'text' 
    ? new TextEncoder().encode(textInput).length 
    : fileInput?.size || 0;

  return (
    <Card style={{ padding: '24px' }}>
      <Flex direction="column" gap="4">
        <Flex align="center" gap="3">
          <Text size="5" weight="bold">🔐 Encrypt Data</Text>
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
            Input Type
          </Text>
          <Select.Root value={inputType} onValueChange={(value: 'text' | 'file') => setInputType(value)}>
            <Select.Trigger style={{ width: '200px' }} />
            <Select.Content>
              <Select.Item value="text">Text Input</Select.Item>
              <Select.Item value="file">File Upload</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        {inputType === 'text' ? (
          <Box>
            <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              Text to Encrypt
            </Text>
            <TextArea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text to encrypt..."
              rows={6}
              style={{ width: '100%', fontFamily: 'monospace' }}
            />
            {textInput && (
              <Text size="2" color="gray" style={{ marginTop: '4px', display: 'block' }}>
                Size: {formatBytes(originalSize)}
              </Text>
            )}
          </Box>
        ) : (
          <Box>
            <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
              File to Encrypt
            </Text>
            <input
              type="file"
              onChange={handleFileSelect}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px dashed var(--gray-6)',
                borderRadius: '8px',
                background: 'var(--gray-2)',
                cursor: 'pointer'
              }}
            />
            {fileInput && (
              <Box style={{ marginTop: '8px' }}>
                <Text size="2" weight="medium">{fileInput.name}</Text>
                <Text size="2" color="gray" style={{ display: 'block' }}>
                  Size: {formatBytes(fileInput.size)} • Type: {fileInput.type}
                </Text>
              </Box>
            )}
          </Box>
        )}

        <Box>
          <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
            Access Control Policy
          </Text>
          <Select.Root 
            value={policyType} 
            onValueChange={(value: 'private' | 'allowlist' | 'subscription' | 'timelock') => setPolicyType(value)}
          >
            <Select.Trigger style={{ width: '200px' }} />
            <Select.Content>
              <Select.Item value="private">Private (Owner Only)</Select.Item>
              <Select.Item value="allowlist">Allowlist</Select.Item>
              <Select.Item value="subscription">Subscription</Select.Item>
              <Select.Item value="timelock">Time-locked</Select.Item>
            </Select.Content>
          </Select.Root>
          <Text size="2" color="gray" style={{ marginTop: '4px', display: 'block' }}>
            {policyType === 'private' && 'Only you can decrypt this data'}
            {policyType === 'allowlist' && 'Only addresses on the allowlist can decrypt'}
            {policyType === 'subscription' && 'Users must pay to access the data'}
            {policyType === 'timelock' && 'Data will be automatically revealed after a time period'}
          </Text>
        </Box>

        <Button
          size="3"
          onClick={handleEncrypt}
          disabled={
            loading || 
            !state.wallet.connected ||
            (inputType === 'text' && !textInput.trim()) ||
            (inputType === 'file' && !fileInput)
          }
          style={{ width: '100%' }}
        >
          {loading ? (
            <Flex align="center" gap="2">
              <LoadingSpinner size="small" text="" />
              <Text>Encrypting...</Text>
            </Flex>
          ) : (
            'Encrypt Data'
          )}
        </Button>

        {encryptionResult && (
          <>
            <Separator />
            
            <Card style={{ padding: '16px', background: 'var(--green-2)', border: '1px solid var(--green-6)' }}>
              <Text size="3" weight="bold" color="green" style={{ marginBottom: '12px', display: 'block' }}>
                ✅ Encryption Successful
              </Text>
              
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text size="2" color="gray">Original Size</Text>
                  <Text size="2">{formatBytes(originalSize)}</Text>
                </Flex>
                <Flex justify="between" align="center">
                  <Text size="2" color="gray">Encrypted Size</Text>
                  <Text size="2">{formatBytes(encryptedSize)}</Text>
                </Flex>
                <Flex justify="between" align="center">
                  <Text size="2" color="gray">Policy Type</Text>
                  <Badge color="green" variant="soft">{policyType}</Badge>
                </Flex>
                <Flex justify="between" align="center">
                  <Text size="2" color="gray">Session Key ID</Text>
                  <Text size="2" style={{ fontFamily: 'monospace' }}>
                    {encryptionResult.sessionKey.id.slice(0, 16)}...
                  </Text>
                </Flex>
                <Flex justify="between" align="center">
                  <Text size="2" color="gray">Algorithm</Text>
                  <Text size="2">{encryptionResult.metadata.algorithm}</Text>
                </Flex>
              </Flex>
              
              <Button 
                onClick={downloadEncryptedData}
                variant="soft" 
                color="green"
                style={{ width: '100%', marginTop: '12px' }}
              >
                📥 Download Encrypted Data
              </Button>
            </Card>
          </>
        )}
      </Flex>
    </Card>
  );
}