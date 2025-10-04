import React, { useState, useCallback, useEffect } from 'react';
import { Card, Flex, Text, Button, TextField, Badge, Box, Separator, TextArea } from '@radix-ui/themes';
import { useSeal } from '../../hooks/useSeal';
import { useAppContext } from '../../context/AppContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatBytes } from '../../utils/config';
import { SealSessionKey } from '../../types/seal';
import { SessionKeyInfo } from './SessionKeyInfo';

interface DecryptionPanelProps {
  onDecryptionComplete?: (result: Uint8Array) => void;
}

export function DecryptionPanel({ onDecryptionComplete }: DecryptionPanelProps) {
  const { state, dispatch } = useAppContext();
  const { 
    decrypt, 
    sessionKeys, 
    parseEncryptedObject,
    buildSealApproveTransaction,
    loading, 
    error, 
    clearError 
  } = useSeal();
  
  const [encryptedData, setEncryptedData] = useState<Uint8Array | null>(null);
  const [encryptedObject, setEncryptedObject] = useState<any>(null);
  const [sessionKeyId, setSessionKeyId] = useState('');
  const [decryptionResult, setDecryptionResult] = useState<Uint8Array | null>(null);
  const [isTextResult, setIsTextResult] = useState(false);
  const [textResult, setTextResult] = useState('');
  const [policyFunction, setPolicyFunction] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [functionName, setFunctionName] = useState('seal_approve');

  // Parse encrypted object when data changes
  useEffect(() => {
    if (encryptedData) {
      const parseData = async () => {
        try {
          const parsed = await parseEncryptedObject(encryptedData);
          if (parsed) {
            setEncryptedObject(parsed);
            console.log('Parsed encrypted object:', parsed);
          }
        } catch (error) {
          console.error('Failed to parse encrypted object:', error);
        }
      };
      parseData();
    }
  }, [encryptedData, parseEncryptedObject]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      setEncryptedData(new Uint8Array(arrayBuffer));
    }
  }, []);

  const handleDataUpload = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value.trim();
    if (text) {
      try {
        // Try to parse as comma-separated array
        const numbers = text.split(',').map(s => parseInt(s.trim()));
        if (numbers.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
          setEncryptedData(new Uint8Array(numbers));
        }
      } catch (error) {
        console.error('Failed to parse data array:', error);
      }
    }
  }, []);

  const handleDeleteSessionKey = useCallback((keyId: string) => {
    if (confirm('Are you sure you want to delete this Session Key?')) {
      dispatch({ type: 'REMOVE_SESSION_KEY', payload: keyId });
      if (sessionKeyId === keyId) {
        setSessionKeyId('');
      }
    }
  }, [dispatch, sessionKeyId]);

  const handleSelectSessionKey = useCallback((keyId: string) => {
    setSessionKeyId(keyId);
  }, []);

  const handleDecrypt = useCallback(async () => {
    if (!encryptedData) {
      alert('Please provide encrypted data');
      return;
    }

    if (!sessionKeyId.trim()) {
      alert('Please select a Session Key');
      return;
    }

    if (!state.wallet.connected) {
      alert('Please connect your wallet to decrypt data');
      return;
    }

    const sessionKey = sessionKeys.get(sessionKeyId) as unknown as SealSessionKey;
    if (!sessionKey) {
      alert('Session Key not found. Please create or import a Session Key first.');
      return;
    }

    if (!encryptedObject) {
      alert('Failed to parse encrypted object. Please check the data format.');
      return;
    }

    // Check if session key is expired
    const now = Date.now();
    if (sessionKey.expiresAt && now > sessionKey.expiresAt) {
      alert('The selected Session Key has expired. Please create a new Session Key.');
      return;
    }

    // Check if session key is active
    if (!sessionKey.isActive) {
      alert('The selected Session Key is not signed. Please sign the Session Key.');
      return;
    }

    // Check compatibility
    if (sessionKey.packageId !== encryptedObject.packageId) {
      alert('The selected Session Key is not compatible with the encrypted data. Package IDs do not match.');
      return;
    }

    clearError();
    
    try {
      // Build transaction for seal_approve function
      let txBytes: Uint8Array;
      
      if (policyFunction.trim()) {
        // Use custom policy function
        const parts = policyFunction.split('::');
        if (parts.length !== 3) {
          alert('Policy function must be in format: packageId::module::function');
          return;
        }
        
        txBytes = await buildSealApproveTransaction(
          parts[0], // packageId
          parts[1], // moduleName
          parts[2], // functionName
          encryptedObject.id
        ) || new Uint8Array();
      } else if (moduleName.trim() && functionName.trim()) {
        // Use package from encrypted object
        txBytes = await buildSealApproveTransaction(
          encryptedObject.packageId,
          moduleName,
          functionName,
          encryptedObject.id
        ) || new Uint8Array();
      } else {
        // Default seal_approve function
        txBytes = await buildSealApproveTransaction(
          encryptedObject.packageId,
          'default', // You may need to adjust this based on your contract
          'seal_approve',
          encryptedObject.id
        ) || new Uint8Array();
      }

      if (txBytes.length === 0) {
        throw new Error('Failed to build transaction for access control verification');
      }

      console.log('Decrypting with transaction bytes:', txBytes);
      const result = await decrypt(encryptedData, sessionKey, txBytes);
      
      if (result) {
        setDecryptionResult(result);
        
        // Try to decode as text
        try {
          const decodedText = new TextDecoder().decode(result);
          // Check if it's valid text (no null bytes, mostly printable characters)
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
  }, [
    encryptedData, 
    sessionKeyId, 
    state.wallet.connected, 
    sessionKeys, 
    encryptedObject,
    policyFunction,
    moduleName,
    functionName,
    decrypt, 
    buildSealApproveTransaction,
    clearError, 
    onDecryptionComplete
  ]);

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
        <Text size="5" weight="bold">🔓 Seal Decryption</Text>

        {/* Encrypted Data Input */}
        <Flex direction="column" gap="2">
          <Text size="3" weight="medium">Encrypted Data</Text>
          <Flex direction="column" gap="2">
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".enc,*/*"
            />
            <Text size="2" color="gray">Or paste encrypted data as array:</Text>
            <textarea
              placeholder="e.g., 123,45,67,89,..."
              onChange={handleDataUpload}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--gray-6)',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}
            />
          </Flex>
          
          {encryptedData && (
            <Text size="2" color="gray">
              Loaded: {encryptedData.length} bytes
            </Text>
          )}
        </Flex>

        {/* Encrypted Object Info */}
        {encryptedObject && (
          <Card variant="surface">
            <Flex direction="column" gap="2">
              <Text size="3" weight="medium">📋 Encrypted Object Info</Text>
              <Flex direction="column" gap="1">
                <Text size="2">Policy ID: {encryptedObject.id}</Text>
                <Text size="2">Package ID: {encryptedObject.packageId}</Text>
                <Text size="2">Threshold: {encryptedObject.threshold}</Text>
                <Text size="2">Services: {encryptedObject.services?.length || 0}</Text>
              </Flex>
            </Flex>
          </Card>
        )}

        {/* Session Key Selection */}
        <Flex direction="column" gap="3">
          <Text size="3" weight="medium">Session Key Selection</Text>
          {sessionKeysList.length > 0 ? (
            <Flex direction="column" gap="2">
              {sessionKeysList.map((key) => {
                const sealKey = key as unknown as SealSessionKey;
                return (
                  <SessionKeyInfo
                    key={sealKey.id}
                    sessionKey={sealKey}
                    isSelected={sessionKeyId === sealKey.id}
                    onSelect={() => handleSelectSessionKey(sealKey.id)}
                    onDelete={() => handleDeleteSessionKey(sealKey.id)}
                    encryptedObjectInfo={encryptedObject ? {
                      packageId: encryptedObject.packageId,
                      id: encryptedObject.id
                    } : undefined}
                  />
                );
              })}
            </Flex>
          ) : (
            <Card variant="surface">
              <Text size="2" color="gray">
                No Session Keys available. Please create one in the encryption panel first.
              </Text>
            </Card>
          )}
        </Flex>

        {/* Access Control Policy */}
        <Flex direction="column" gap="2">
          <Text size="3" weight="medium">Access Control Policy</Text>
          <Flex direction="column" gap="2">
            <input
              type="text"
              placeholder="Full function path (optional): packageId::module::function"
              value={policyFunction}
              onChange={(e) => setPolicyFunction(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid var(--gray-6)',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}
            />
            <Text size="2" color="gray">Or specify module and function separately:</Text>
            <Flex gap="2">
              <input
                type="text"
                placeholder="Module name"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid var(--gray-6)',
                  borderRadius: '4px',
                  flex: 1
                }}
              />
              <input
                type="text"
                placeholder="Function name"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid var(--gray-6)',
                  borderRadius: '4px',
                  flex: 1
                }}
              />
            </Flex>
          </Flex>
        </Flex>

        {/* Error Display */}
        {error && (
          <Card variant="surface" style={{ backgroundColor: 'var(--red-2)' }}>
            <Text size="2" color="red">{error}</Text>
          </Card>
        )}

        {/* Decrypt Button */}
        <Button
          onClick={handleDecrypt}
          disabled={
            loading || 
            !encryptedData || 
            !sessionKeyId ||
            !encryptedObject ||
            !state.wallet.connected
          }
          size="3"
        >
          {loading ? 'Decrypting...' : '🔓 Decrypt Data'}
        </Button>

        {/* Decryption Result */}
        {decryptionResult && (
          <Card variant="surface">
            <Flex direction="column" gap="3">
              <Text size="4" weight="bold">✅ Decryption Complete</Text>
              
              <Flex direction="column" gap="2">
                <Text size="3" weight="medium">Decrypted Data</Text>
                <Text size="2">Size: {decryptionResult.length} bytes</Text>
                <Text size="2">Type: {isTextResult ? 'Text' : 'Binary'}</Text>
              </Flex>

              {isTextResult && (
                <Flex direction="column" gap="2">
                  <Text size="3" weight="medium">📄 Text Content</Text>
                  <Card variant="surface">
                    <Text size="2" style={{ 
                      fontFamily: 'monospace', 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {textResult}
                    </Text>
                  </Card>
                </Flex>
              )}

              <Flex gap="2">
                <Button onClick={downloadDecryptedData} variant="outline">
                  📥 Download Decrypted Data
                </Button>
                {isTextResult && (
                  <Button 
                    onClick={() => navigator.clipboard.writeText(textResult)}
                    variant="ghost"
                  >
                    📋 Copy Text
                  </Button>
                )}
              </Flex>
            </Flex>
          </Card>
        )}
      </Flex>
    </Card>
  );
}
