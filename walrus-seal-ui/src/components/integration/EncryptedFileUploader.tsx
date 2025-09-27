import React, { useState, useCallback } from 'react';
import { Card, Flex, Text, Button, Select, Badge, Box, Separator, Checkbox } from '@radix-ui/themes';
import { useWalrus } from '../../hooks/useWalrus';
import { useSeal } from '../../hooks/useSeal';
import { useAppContext } from '../../context/AppContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { validateFileSize, validateFileType, formatBytes } from '../../utils/config';
import { APP_CONFIG } from '../../utils/constants';

interface EncryptedFileUploaderProps {
  onUploadComplete?: (result: { walrusResult: any; sealResult: any }) => void;
}

export function EncryptedFileUploader({ onUploadComplete }: EncryptedFileUploaderProps) {
  const { state } = useAppContext();
  const { store: storeToWalrus, loading: walrusLoading } = useWalrus();
  const { encrypt, createPolicy, loading: sealLoading } = useSeal();
  
  const [files, setFiles] = useState<File[]>([]);
  const [policyType, setPolicyType] = useState<'private' | 'allowlist' | 'subscription' | 'timelock'>('private');
  const [epochs, setEpochs] = useState(APP_CONFIG.walrus.defaultEpochs);
  const [permanent, setPermanent] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'encrypting' | 'uploading' | 'complete'>('select');

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      if (!validateFileSize(file, APP_CONFIG.walrus.maxFileSize)) {
        errors.push(`${file.name}: File too large`);
        continue;
      }

      if (!validateFileType(file, APP_CONFIG.walrus.supportedTypes)) {
        errors.push(`${file.name}: Unsupported file type`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      console.warn('File validation errors:', errors);
    }

    setFiles(validFiles.slice(0, 3)); // Limit to 3 files for demo
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleEncryptAndUpload = useCallback(async () => {
    if (files.length === 0) return;

    if (!state.wallet.connected) {
      alert('Please connect your wallet to continue');
      return;
    }

    setProcessing(true);
    setCurrentStep('encrypting');

    try {
      // Step 1: Encrypt each file
      const policy = createPolicy(policyType);
      const encryptedFiles: File[] = [];
      const sealResults: any[] = [];

      for (const file of files) {
        const fileData = new Uint8Array(await file.arrayBuffer());
        const encryptionResult = await encrypt(fileData, policy);
        
        if (encryptionResult) {
          const encryptedFile = new File(
            [encryptionResult.encryptedObject], 
            `${file.name}.seal`,
            { type: 'application/octet-stream' }
          );
          encryptedFiles.push(encryptedFile);
          sealResults.push(encryptionResult);
        }
      }

      setCurrentStep('uploading');

      // Step 2: Upload encrypted files to Walrus
      const walrusResult = await storeToWalrus(encryptedFiles, {
        epochs,
        permanent,
        deletable: true,
        attributes: {
          'encrypted': 'true',
          'seal_policy': policyType,
          'original_count': files.length.toString(),
          'encryption_timestamp': new Date().toISOString()
        }
      });

      if (walrusResult) {
        setCurrentStep('complete');
        setUploadResult({
          walrusResult,
          sealResults,
          originalFiles: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
        });

        if (onUploadComplete) {
          onUploadComplete({ walrusResult, sealResult: sealResults });
        }
      }

    } catch (error) {
      console.error('Encrypt and upload failed:', error);
      setCurrentStep('select');
    } finally {
      setProcessing(false);
    }
  }, [files, state.wallet.connected, createPolicy, policyType, encrypt, storeToWalrus, epochs, permanent, onUploadComplete]);

  const totalSize = files.reduce((total, file) => total + file.size, 0);
  const loading = processing || walrusLoading || sealLoading;

  const renderStepIndicator = () => (
    <Flex align="center" gap="3" style={{ marginBottom: '16px' }}>
      <Badge color={currentStep === 'select' ? 'blue' : 'green'} variant={currentStep === 'select' ? 'solid' : 'soft'}>
        1. Select Files
      </Badge>
      <Text color="gray">→</Text>
      <Badge color={currentStep === 'encrypting' ? 'blue' : currentStep === 'select' ? 'gray' : 'green'} 
             variant={currentStep === 'encrypting' ? 'solid' : 'soft'}>
        2. Encrypt
      </Badge>
      <Text color="gray">→</Text>
      <Badge color={currentStep === 'uploading' ? 'blue' : ['select', 'encrypting'].includes(currentStep) ? 'gray' : 'green'} 
             variant={currentStep === 'uploading' ? 'solid' : 'soft'}>
        3. Upload
      </Badge>
      <Text color="gray">→</Text>
      <Badge color={currentStep === 'complete' ? 'green' : 'gray'} 
             variant={currentStep === 'complete' ? 'solid' : 'soft'}>
        4. Complete
      </Badge>
    </Flex>
  );

  return (
    <Card style={{ padding: '24px' }}>
      <Flex direction="column" gap="4">
        <Flex align="center" gap="3">
          <Text size="5" weight="bold">🔐🐋 Encrypted File Storage</Text>
          {!state.wallet.connected && (
            <Badge color="orange" variant="soft">
              Wallet Required
            </Badge>
          )}
        </Flex>

        <Text size="3" color="gray">
          Encrypt files with Seal and store them securely on Walrus in one seamless operation.
        </Text>

        {renderStepIndicator()}

        {currentStep === 'select' && (
          <>
            <Box>
              <Text size="3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
                Select Files to Encrypt & Store
              </Text>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                accept={APP_CONFIG.walrus.supportedTypes.join(',')}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px dashed var(--gray-6)',
                  borderRadius: '8px',
                  background: 'var(--gray-2)',
                  cursor: 'pointer'
                }}
              />
              <Text size="2" color="gray" style={{ marginTop: '8px', display: 'block' }}>
                Max 3 files, up to {formatBytes(APP_CONFIG.walrus.maxFileSize)} each
              </Text>
            </Box>

            {files.length > 0 && (
              <Card style={{ padding: '16px' }}>
                <Text size="3" weight="medium" style={{ marginBottom: '12px', display: 'block' }}>
                  Selected Files ({files.length})
                </Text>
                <Flex direction="column" gap="2">
                  {files.map((file, index) => (
                    <Flex key={index} justify="between" align="center">
                      <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">{file.name}</Text>
                        <Text size="1" color="gray">{formatBytes(file.size)} • {file.type}</Text>
                      </Flex>
                      <Button size="1" variant="soft" color="red" onClick={() => removeFile(index)}>
                        Remove
                      </Button>
                    </Flex>
                  ))}
                </Flex>
                <Separator style={{ margin: '12px 0' }} />
                <Text size="2" weight="medium">
                  Total Size: {formatBytes(totalSize)}
                </Text>
              </Card>
            )}

            <Flex direction="column" gap="3">
              <Text size="3" weight="medium">Encryption & Storage Options</Text>
              
              <Flex gap="4" align="end">
                <Box style={{ flex: 1 }}>
                  <Text size="2" style={{ marginBottom: '4px', display: 'block' }}>Access Control Policy</Text>
                  <Select.Root 
                    value={policyType} 
                    onValueChange={(value: 'private' | 'allowlist' | 'subscription' | 'timelock') => setPolicyType(value)}
                  >
                    <Select.Trigger style={{ width: '100%' }} />
                    <Select.Content>
                      <Select.Item value="private">Private (Owner Only)</Select.Item>
                      <Select.Item value="allowlist">Allowlist</Select.Item>
                      <Select.Item value="subscription">Subscription</Select.Item>
                      <Select.Item value="timelock">Time-locked</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>
                
                <Box>
                  <Text size="2" style={{ marginBottom: '4px', display: 'block' }}>Storage Epochs</Text>
                  <input
                    type="number"
                    value={epochs}
                    onChange={(e) => setEpochs(Number(e.target.value))}
                    min="1"
                    max="53"
                    style={{
                      width: '80px',
                      padding: '8px',
                      border: '1px solid var(--gray-6)',
                      borderRadius: '4px'
                    }}
                  />
                </Box>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px' }}>
                  <Checkbox
                    checked={permanent}
                    onCheckedChange={(checked) => setPermanent(checked === true)}
                  />
                  <Text size="2">Permanent</Text>
                </label>
              </Flex>
            </Flex>

            <Button
              size="3"
              onClick={handleEncryptAndUpload}
              disabled={files.length === 0 || loading || !state.wallet.connected}
              style={{ width: '100%' }}
            >
              {loading ? (
                <Flex align="center" gap="2">
                  <LoadingSpinner size="small" text="" />
                  <Text>Processing...</Text>
                </Flex>
              ) : (
                `Encrypt & Upload ${files.length} file${files.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </>
        )}

        {(currentStep === 'encrypting' || currentStep === 'uploading') && (
          <Card style={{ padding: '20px', textAlign: 'center' }}>
            <LoadingSpinner size="large" />
            <Text size="3" weight="medium" style={{ marginTop: '16px', display: 'block' }}>
              {currentStep === 'encrypting' && 'Encrypting files with Seal...'}
              {currentStep === 'uploading' && 'Uploading encrypted files to Walrus...'}
            </Text>
            <Text size="2" color="gray" style={{ marginTop: '8px', display: 'block' }}>
              This may take a few moments. Please don't close this window.
            </Text>
          </Card>
        )}

        {currentStep === 'complete' && uploadResult && (
          <Card style={{ padding: '16px', background: 'var(--green-2)', border: '1px solid var(--green-6)' }}>
            <Text size="3" weight="bold" color="green" style={{ marginBottom: '12px', display: 'block' }}>
              ✅ Encrypted Files Successfully Stored on Walrus!
            </Text>
            
            <Flex direction="column" gap="2">
              <Flex justify="between" align="center">
                <Text size="2" color="gray">Blob ID</Text>
                <Text size="2" style={{ fontFamily: 'monospace' }}>
                  {uploadResult.walrusResult.blobId.slice(0, 16)}...
                </Text>
              </Flex>
              <Flex justify="between" align="center">
                <Text size="2" color="gray">Files Encrypted</Text>
                <Text size="2">{uploadResult.originalFiles.length}</Text>
              </Flex>
              <Flex justify="between" align="center">
                <Text size="2" color="gray">Policy Type</Text>
                <Badge color="green" variant="soft">{policyType}</Badge>
              </Flex>
              <Flex justify="between" align="center">
                <Text size="2" color="gray">Storage Epochs</Text>
                <Text size="2">{epochs}</Text>
              </Flex>
              <Flex justify="between" align="center">
                <Text size="2" color="gray">Session Keys</Text>
                <Text size="2">{uploadResult.sealResults.length} created</Text>
              </Flex>
            </Flex>
            
            <Button 
              onClick={() => {
                setCurrentStep('select');
                setFiles([]);
                setUploadResult(null);
              }}
              variant="soft" 
              color="green"
              style={{ width: '100%', marginTop: '12px' }}
            >
              Upload More Files
            </Button>
          </Card>
        )}
      </Flex>
    </Card>
  );
}