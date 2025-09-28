import React, { useState, useCallback, useEffect } from 'react';
import { Card, Flex, Text, Button, Select, TextArea, Badge, Box, Separator } from '@radix-ui/themes';
import { useSeal } from '../../hooks/useSeal';
import { useAppContext } from '../../context/AppContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatBytes } from '../../utils/config';
import { SealEncryptionResult, SealSessionKey } from '../../types/seal';

interface EncryptionPanelProps {
  onEncryptionComplete?: (result: SealEncryptionResult) => void;
}

export function EncryptionPanel({ onEncryptionComplete }: EncryptionPanelProps) {
  const { state } = useAppContext();
  const { 
    encrypt, 
    createPolicy, 
    createSessionKey,
    signSessionKey,
    loading, 
    error, 
    clearError 
  } = useSeal();
  
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [policyType, setPolicyType] = useState<'private' | 'allowlist' | 'subscription' | 'timelock'>('private');
  const [encryptionResult, setEncryptionResult] = useState<SealEncryptionResult | null>(null);
  const [sessionKey, setSessionKey] = useState<SealSessionKey | null>(null);
  const [needsSignature, setNeedsSignature] = useState(false);

  // Create session key when component mounts
  useEffect(() => {
    if (state.wallet.connected && state.wallet.account && !sessionKey) {
      const initSessionKey = async () => {
        try {
          const newSessionKey = await createSessionKey(
            state.network.sealConfig.packageId,
            10, // 10 minutes TTL
            state.wallet.account?.address
          );
          
          if (newSessionKey) {
            setSessionKey(newSessionKey);
            setNeedsSignature(true);
          }
        } catch (error) {
          console.error('Failed to create session key:', error);
        }
      };
      
      initSessionKey();
    }
  }, [state.wallet.connected, state.wallet.account, sessionKey, createSessionKey, state.network.sealConfig.packageId]);

  const handleSignSessionKey = useCallback(async () => {
    if (!sessionKey || !state.wallet.account) return;

    try {
      // Get the personal message from session key
      const message = sessionKey.key?.getPersonalMessage?.();
      if (!message) {
        throw new Error('Failed to get personal message from session key');
      }

      // Here you would normally call wallet.signPersonalMessage(message)
      // For now, we'll simulate the signing process
      console.log('Please sign this message in your wallet:', message);
      
      // In a real implementation, you would get the signature from the wallet
      // const { signature } = await wallet.signPersonalMessage(message);
      const mockSignature = 'mock_signature_' + Date.now(); // Placeholder
      
      await signSessionKey(sessionKey, mockSignature);
      setNeedsSignature(false);
    } catch (error) {
      console.error('Failed to sign session key:', error);
    }
  }, [sessionKey, signSessionKey, state.wallet.account]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFileInput(file);
  }, []);

  const handleEncrypt = useCallback(async () => {
    if (!sessionKey || needsSignature) {
      alert('Please sign the session key first');
      return;
    }

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
      // Create policy with unique ID
      const policyId = `${policyType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const policy = {
        ...createPolicy(policyType),
        id: policyId
      };
      
      console.log('Encrypting with policy:', policy);
      const result = await encrypt(data, policy);
      
      if (result) {
        setEncryptionResult(result);
        
        if (onEncryptionComplete) {
          onEncryptionComplete(result);
        }
      }
    } catch (error) {
      console.error('Encryption failed:', error);
    }
  }, [
    inputType, 
    textInput, 
    fileInput, 
    policyType, 
    sessionKey, 
    needsSignature, 
    state.wallet.connected, 
    encrypt, 
    createPolicy, 
    clearError, 
    onEncryptionComplete
  ]);

  const downloadEncryptedData = useCallback(() => {
    if (!encryptionResult) return;
    
    const blob = new Blob([encryptionResult.encryptedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encrypted_${inputType === 'file' ? fileInput?.name || 'file' : 'text'}.enc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [encryptionResult, inputType, fileInput]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  const originalSize = inputType === 'text' 
    ? new TextEncoder().encode(textInput).length 
    : fileInput?.size || 0;

  const encryptedSize = encryptionResult?.encryptedData.length || 0;

  return (
    <Card style={{ padding: '24px' }}>
      <Flex direction="column" gap="4">
        <Text size="5" weight="bold">🔒 Seal Encryption</Text>

        {/* Session Key Status */}
        {sessionKey && (
          <Card variant="surface">
            <Flex direction="column" gap="2">
              <Text size="3" weight="medium">Session Key Status</Text>
              <Flex align="center" gap="2">
                <Text size="2">
                  {needsSignature ? '⚠️ Needs Signature' : '✅ Ready'}
                </Text>
                {needsSignature && (
                  <Button size="1" onClick={handleSignSessionKey}>
                    Sign Session Key
                  </Button>
                )}
              </Flex>
              <Text size="1" color="gray">
                Expires: {new Date(sessionKey.expiresAt).toLocaleTimeString()}
              </Text>
            </Flex>
          </Card>
        )}

        {/* Input Type Selection */}
        <Flex direction="column" gap="2">
          <Text size="3" weight="medium">Input Type</Text>
          <Flex gap="2">
            <Button 
              variant={inputType === 'text' ? 'solid' : 'outline'}
              onClick={() => setInputType('text')}
            >
              Text
            </Button>
            <Button 
              variant={inputType === 'file' ? 'solid' : 'outline'}
              onClick={() => setInputType('file')}
            >
              File
            </Button>
          </Flex>
        </Flex>

        {/* Input Content */}
        {inputType === 'text' ? (
          <Flex direction="column" gap="2">
            <Text size="3" weight="medium">Text to Encrypt</Text>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text to encrypt..."
              rows={4}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--gray-6)',
                borderRadius: '4px'
              }}
            />
          </Flex>
        ) : (
          <Flex direction="column" gap="2">
            <Text size="3" weight="medium">File to Encrypt</Text>
            <input
              type="file"
              onChange={handleFileSelect}
              accept="*/*"
            />
            {fileInput && (
              <Text size="2" color="gray">
                Selected: {fileInput.name} ({(fileInput.size / 1024).toFixed(1)} KB)
              </Text>
            )}
          </Flex>
        )}

        {/* Policy Type Selection */}
        <Flex direction="column" gap="2">
          <Text size="3" weight="medium">Access Policy</Text>
          <select
            value={policyType}
            onChange={(e) => setPolicyType(e.target.value as any)}
            style={{
              padding: '8px',
              border: '1px solid var(--gray-6)',
              borderRadius: '4px'
            }}
          >
            <option value="private">Private (Owner Only)</option>
            <option value="allowlist">Allowlist (Specific Users)</option>
            <option value="subscription">Subscription (Paid Access)</option>
            <option value="timelock">Time-locked (Delayed Release)</option>
          </select>
          <Text size="2" color="gray">
            {policyType === 'private' && 'Only you can decrypt this data'}
            {policyType === 'allowlist' && 'Only allowlisted addresses can decrypt'}
            {policyType === 'subscription' && 'Users must pay to decrypt'}
            {policyType === 'timelock' && 'Data will be revealed after a set time'}
          </Text>
        </Flex>

        {/* Error Display */}
        {error && (
          <Card variant="surface" style={{ backgroundColor: 'var(--red-2)' }}>
            <Text size="2" color="red">{error}</Text>
          </Card>
        )}

        {/* Encrypt Button */}
        <Button
          onClick={handleEncrypt}
          disabled={
            loading || 
            !sessionKey || 
            needsSignature ||
            (inputType === 'text' && !textInput.trim()) ||
            (inputType === 'file' && !fileInput)
          }
          size="3"
        >
          {loading ? 'Encrypting...' : '🔒 Encrypt Data'}
        </Button>

        {/* Encryption Result */}
        {encryptionResult && (
          <Card variant="surface">
            <Flex direction="column" gap="3">
              <Text size="4" weight="bold">✅ Encryption Complete</Text>
              
              <Flex direction="column" gap="2">
                <Text size="3" weight="medium">Encryption Details</Text>
                <Flex direction="column" gap="1">
                  <Text size="2">Policy ID: {encryptionResult.id}</Text>
                  <Text size="2">Package ID: {encryptionResult.packageId}</Text>
                  <Text size="2">Threshold: {encryptionResult.threshold}</Text>
                  <Text size="2">Original Size: {originalSize} bytes</Text>
                  <Text size="2">Encrypted Size: {encryptedSize} bytes</Text>
                </Flex>
              </Flex>

              {encryptionResult.backupKey && (
                <Flex direction="column" gap="2">
                  <Text size="3" weight="medium">🔑 Backup Key (Emergency Recovery)</Text>
                  <Flex gap="2" align="center">
                    <Text size="1" style={{ 
                      fontFamily: 'monospace', 
                      wordBreak: 'break-all',
                      flex: 1
                    }}>
                      {encryptionResult.backupKey.substring(0, 32)}...
                    </Text>
                    <Button 
                      size="1" 
                      variant="ghost"
                      onClick={() => copyToClipboard(encryptionResult.backupKey || '')}
                    >
                      Copy
                    </Button>
                  </Flex>
                  <Text size="1" color="orange">
                    ⚠️ Store this key safely! It can decrypt your data without access control.
                  </Text>
                </Flex>
              )}

              <Flex gap="2">
                <Button onClick={downloadEncryptedData} variant="outline">
                  📥 Download Encrypted File
                </Button>
                <Button 
                  onClick={() => copyToClipboard(Array.from(encryptionResult.encryptedData).join(','))}
                  variant="ghost"
                >
                  📋 Copy as Array
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}
      </Flex>
    </Card>
  );
}