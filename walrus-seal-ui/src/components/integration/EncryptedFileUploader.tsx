import React, { useState, useCallback, useEffect } from 'react';
import { Card, Flex, Text, Button, Select, Badge, Box, Separator, Checkbox } from '@radix-ui/themes';
import { useWalrus } from '../../hooks/useWalrus';
import { useSeal } from '../../hooks/useSeal';
import { useAppContext } from '../../context/AppContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { validateFileSize, validateFileType, formatBytes } from '../../utils/config';
import { APP_CONFIG } from '../../utils/constants';
import { SealEncryptionResult, SealSessionKey } from '../../types/seal';
import { WalrusStoreResult } from '../../types/walrus';

interface EncryptedFileUploaderProps {
  onUploadComplete?: (result: { walrusResult: WalrusStoreResult; sealResult: SealEncryptionResult[]; sessionKey?: SealSessionKey }) => void;
}

export function EncryptedFileUploader({ onUploadComplete }: EncryptedFileUploaderProps) {
  const { state } = useAppContext();
  const { store: storeToWalrus, loading: walrusLoading } = useWalrus();
  const { 
    encrypt, 
    createPolicy, 
    createSessionKey,
    signSessionKey,
    loading: sealLoading 
  } = useSeal();
  
  const [files, setFiles] = useState<File[]>([]);
  const [policyType, setPolicyType] = useState<'private' | 'allowlist' | 'subscription' | 'timelock'>('private');
  const [epochs, setEpochs] = useState(APP_CONFIG.walrus.defaultEpochs);
  const [permanent, setPermanent] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'session' | 'encrypting' | 'uploading' | 'complete'>('select');
  const [sessionKey, setSessionKey] = useState<SealSessionKey | null>(null);
  const [needsSignature, setNeedsSignature] = useState(false);

  // Create session key when needed
  useEffect(() => {
    if (state.wallet.connected && state.wallet.account && !sessionKey && currentStep === 'session') {
      const initSessionKey = async () => {
        try {
          const newSessionKey = await createSessionKey(
            state.network.sealConfig.packageId,
            15, // 15 minutes TTL for longer upload process
            state.wallet.account?.address
          );
          
          if (newSessionKey) {
            setSessionKey(newSessionKey);
            setNeedsSignature(false); // Skip signature requirement in development
          }
        } catch (error) {
          console.error('Failed to create session key:', error);
          setCurrentStep('select');
        }
      };
      
      initSessionKey();
    }
  }, [state.wallet.connected, state.wallet.account, sessionKey, currentStep, createSessionKey, state.network.sealConfig.packageId]);

  const handleSignSessionKey = useCallback(async () => {
    if (!sessionKey || !state.wallet.account) return;

    try {
      // In development mode, skip signature and mark as ready
      console.log('Development mode: Session key marked as ready');
      setNeedsSignature(false);
      setCurrentStep('encrypting');
    } catch (error) {
      console.error('Failed to sign session key:', error);
      setCurrentStep('select');
    }
  }, [sessionKey, state.wallet.account]);;

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

  const startUploadProcess = useCallback(() => {
    if (files.length === 0) return;
    if (!state.wallet.connected) {
      alert('Please connect your wallet to continue');
      return;
    }
    setCurrentStep('session');
  }, [files.length, state.wallet.connected]);

  const handleEncryptAndUpload = useCallback(async () => {
    if (!sessionKey || needsSignature) {
      alert('Session key not ready');
      return;
    }

    setProcessing(true);

    try {
      // Step 1: Encrypt each file
      const encryptedFiles: File[] = [];
      const sealResults: SealEncryptionResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Encrypting file ${i + 1}/${files.length}: ${file.name}`);
        
        const fileData = new Uint8Array(await file.arrayBuffer());
        
        // Create unique policy for each file
        const policy = createPolicy(policyType);
        
        const encryptionResult = await encrypt(fileData, policy);
        
        if (encryptionResult) {
          const encryptedFile = new File(
            [encryptionResult.encryptedData], 
            `${file.name}.seal`,
            { type: 'application/octet-stream' }
          );
          encryptedFiles.push(encryptedFile);
          sealResults.push(encryptionResult);
        } else {
          throw new Error(`Failed to encrypt ${file.name}`);
        }
      }

      setCurrentStep('uploading');

      // Step 2: Upload encrypted files to Walrus
      console.log(`Uploading ${encryptedFiles.length} encrypted files to Walrus`);
      const walrusResult = await storeToWalrus(encryptedFiles, {
        epochs,
        permanent,
        deletable: !permanent,
        attributes: {
          'encrypted': 'true',
          'seal_policy': policyType,
          'original_count': files.length.toString(),
          'encryption_timestamp': new Date().toISOString(),
          'session_key_id': sessionKey.id
        }
      });

      if (walrusResult) {
        setCurrentStep('complete');
        setUploadResult({
          walrusResult,
          sealResults,
          originalFiles: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
          sessionKeyId: sessionKey.id,
          policyType
        });

        if (onUploadComplete) {
          onUploadComplete({ 
            walrusResult, 
            sealResult: sealResults,
            sessionKey: sessionKey
          });
        }
      }

    } catch (error) {
      console.error('Encrypt and upload failed:', error);
      setCurrentStep('select');
    } finally {
      setProcessing(false);
    }
  }, [
    files, 
    sessionKey, 
    needsSignature, 
    createPolicy, 
    policyType, 
    encrypt, 
    storeToWalrus, 
    epochs, 
    permanent, 
    onUploadComplete
  ]);

  const resetProcess = useCallback(() => {
    setFiles([]);
    setUploadResult(null);
    setProcessing(false);
    setCurrentStep('select');
    setSessionKey(null);
    setNeedsSignature(false);
  }, []);

  const totalSize = files.reduce((total, file) => total + file.size, 0);
  const loading = processing || walrusLoading || sealLoading;

  const renderStepIndicator = () => (
    <Flex align="center" gap="3" style={{ marginBottom: '16px' }}>
      <Flex align="center" gap="2">
        <Text size="2" weight={currentStep === 'select' ? 'bold' : 'regular'}>
          {currentStep === 'select' ? '🟦' : '✅'} 1. Select Files
        </Text>
      </Flex>
      
      <Text size="2" color="gray">→</Text>
      
      <Flex align="center" gap="2">
        <Text size="2" weight={currentStep === 'session' ? 'bold' : 'regular'}>
          {currentStep === 'session' ? '🟦' : currentStep === 'encrypting' || currentStep === 'uploading' || currentStep === 'complete' ? '✅' : '⬜'} 
          2. Session Key
        </Text>
      </Flex>

      <Text size="2" color="gray">→</Text>
      
      <Flex align="center" gap="2">
        <Text size="2" weight={currentStep === 'encrypting' ? 'bold' : 'regular'}>
          {currentStep === 'encrypting' ? '🟦' : currentStep === 'uploading' || currentStep === 'complete' ? '✅' : '⬜'} 
          3. Encrypt
        </Text>
      </Flex>

      <Text size="2" color="gray">→</Text>
      
      <Flex align="center" gap="2">
        <Text size="2" weight={currentStep === 'uploading' ? 'bold' : 'regular'}>
          {currentStep === 'uploading' ? '🟦' : currentStep === 'complete' ? '✅' : '⬜'} 
          4. Upload
        </Text>
      </Flex>

      <Text size="2" color="gray">→</Text>
      
      <Flex align="center" gap="2">
        <Text size="2" weight={currentStep === 'complete' ? 'bold' : 'regular'}>
          {currentStep === 'complete' ? '✅' : '⬜'} 5. Complete
        </Text>
      </Flex>
    </Flex>
  );

  return (
    <Card style={{ padding: '24px' }}>
      <Flex direction="column" gap="4">
        <Text size="5" weight="bold">🔐 Encrypted File Upload</Text>
        <Text size="3" color="gray">
          Encrypt files with Seal and store them securely on Walrus
        </Text>

        {renderStepIndicator()}

        {currentStep === 'select' && (
          <>
            {/* File Selection */}
            <Flex direction="column" gap="3">
              <Text size="4" weight="medium">Select Files to Encrypt</Text>
              
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                accept={APP_CONFIG.walrus.supportedTypes.join(',')}
                style={{
                  padding: '12px',
                  border: '2px dashed var(--gray-6)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              />
              
              <Text size="2" color="gray">
                Maximum {APP_CONFIG.walrus.maxFileSize / (1024 * 1024)}MB per file. 
                Up to 3 files supported.
              </Text>
            </Flex>

            {/* Selected Files List */}
            {files.length > 0 && (
              <Flex direction="column" gap="2">
                <Text size="3" weight="medium">Selected Files ({files.length})</Text>
                {files.map((file, index) => (
                  <Card key={index} variant="surface">
                    <Flex justify="between" align="center">
                      <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">{file.name}</Text>
                        <Text size="1" color="gray">
                          {(file.size / 1024).toFixed(1)} KB • {file.type}
                        </Text>
                      </Flex>
                      <Button 
                        size="1" 
                        variant="ghost" 
                        color="red"
                        onClick={() => removeFile(index)}
                      >
                        ✕
                      </Button>
                    </Flex>
                  </Card>
                ))}
                
                <Flex justify="between" align="center">
                  <Text size="2" weight="medium">
                    Total Size: {(totalSize / 1024).toFixed(1)} KB
                  </Text>
                </Flex>
              </Flex>
            )}

            {/* Policy Selection */}
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
            </Flex>

            {/* Walrus Configuration */}
            <Flex direction="column" gap="2">
              <Text size="3" weight="medium">Storage Configuration</Text>
              <Flex gap="3">
                <Flex direction="column" gap="1">
                  <Text size="2">Storage Epochs</Text>
                  <input
                    type="number"
                    value={epochs}
                    onChange={(e) => setEpochs(Number(e.target.value))}
                    min="1"
                    max="53"
                    style={{
                      padding: '6px',
                      border: '1px solid var(--gray-6)',
                      borderRadius: '4px',
                      width: '80px'
                    }}
                  />
                </Flex>
                
                <Flex align="center" gap="2">
                  <input
                    type="checkbox"
                    checked={permanent}
                    onChange={(e) => setPermanent(e.target.checked)}
                  />
                  <Text size="2">Permanent Storage</Text>
                </Flex>
              </Flex>
            </Flex>

            <Button
              onClick={startUploadProcess}
              disabled={files.length === 0 || !state.wallet.connected}
              size="3"
            >
              {!state.wallet.connected ? 'Connect Wallet First' : 'Start Encryption Process'}
            </Button>
          </>
        )}

        {currentStep === 'session' && sessionKey && (
          <Card variant="surface">
            <Flex direction="column" gap="3">
              <Text size="4" weight="bold">🔑 Session Key Setup</Text>
              <Text size="2">
                A session key is required to encrypt your files. Please sign the message in your wallet.
              </Text>
              
              <Flex direction="column" gap="2">
                <Text size="2">Session Key ID: {sessionKey.id}</Text>
                <Text size="2">Package ID: {sessionKey.packageId}</Text>
                <Text size="2">TTL: {sessionKey.ttl} minutes</Text>
                <Text size="2">Status: {needsSignature ? '⚠️ Needs Signature' : '✅ Ready'}</Text>
              </Flex>

              {needsSignature && (
                <Button onClick={handleSignSessionKey} size="3">
                  Sign Session Key
                </Button>
              )}

              {!needsSignature && (
                <Button onClick={handleEncryptAndUpload} size="3" disabled={loading}>
                  {loading ? 'Processing...' : 'Continue with Encryption'}
                </Button>
              )}
            </Flex>
          </Card>
        )}

        {(currentStep === 'encrypting' || currentStep === 'uploading') && (
          <Card variant="surface">
            <Flex direction="column" gap="3">
              <Text size="4" weight="bold">
                {currentStep === 'encrypting' ? '🔐 Encrypting Files...' : '⬆️ Uploading to Walrus...'}
              </Text>
              <Text size="2">
                {currentStep === 'encrypting' 
                  ? `Encrypting ${files.length} files with Seal...`
                  : 'Uploading encrypted files to Walrus network...'
                }
              </Text>
            </Flex>
          </Card>
        )}

        {currentStep === 'complete' && uploadResult && (
          <Card variant="surface">
            <Flex direction="column" gap="4">
              <Text size="4" weight="bold">✅ Upload Complete!</Text>
              
              <Flex direction="column" gap="2">
                <Text size="3" weight="medium">Upload Summary</Text>
                <Text size="2">Files encrypted: {uploadResult.originalFiles.length}</Text>
                <Text size="2">Policy type: {uploadResult.policyType}</Text>
                <Text size="2">Blob ID: {uploadResult.walrusResult.blobId}</Text>
                <Text size="2">Session Key: {uploadResult.sessionKeyId}</Text>
                <Text size="2">Storage epochs: {epochs}</Text>
                <Text size="2">Cost: {uploadResult.walrusResult.cost || 0} SUI</Text>
              </Flex>

              <Flex direction="column" gap="2">
                <Text size="3" weight="medium">Encrypted Files</Text>
                {uploadResult.originalFiles.map((file: any, index: number) => (
                  <Flex key={index} justify="between" align="center">
                    <Text size="2">{file.name}</Text>
                    <Text size="1" color="gray">{(file.size / 1024).toFixed(1)} KB</Text>
                  </Flex>
                ))}
              </Flex>

              <Button onClick={resetProcess} size="3">
                Upload More Files
              </Button>
            </Flex>
          </Card>
        )}
      </Flex>
    </Card>
  );
}
