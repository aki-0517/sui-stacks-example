import React, { useState, useCallback } from 'react';
import { Card, Flex, Text, Button, Checkbox, TextField, Badge, Box, Separator } from '@radix-ui/themes';
import { useWalrus } from '../../hooks/useWalrus';
import { useAppContext } from '../../context/AppContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { validateFileSize, validateFileType, formatBytes } from '../../utils/config';
import { APP_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../utils/constants';

interface BlobUploaderProps {
  maxFiles?: number;
  onUploadComplete?: (result: any) => void;
}

export function BlobUploader({ maxFiles = 5, onUploadComplete }: BlobUploaderProps) {
  const { state } = useAppContext();
  const { store, loading, error, clearError } = useWalrus();
  
  const [files, setFiles] = useState<File[]>([]);
  const [epochs, setEpochs] = useState(APP_CONFIG.walrus.defaultEpochs);
  const [permanent, setPermanent] = useState(false);
  const [deletable, setDeletable] = useState(true);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    clearError();
    setUploadSuccess(false);

    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      if (!validateFileSize(file, APP_CONFIG.walrus.maxFileSize)) {
        errors.push(`${file.name}: ${ERROR_MESSAGES.FILE_TOO_LARGE}`);
        continue;
      }

      if (!validateFileType(file, APP_CONFIG.walrus.supportedTypes)) {
        errors.push(`${file.name}: ${ERROR_MESSAGES.INVALID_FILE_TYPE}`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      console.warn('File validation errors:', errors);
    }

    setFiles(prev => [...prev, ...validFiles].slice(0, maxFiles));
  }, [maxFiles, clearError]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addAttribute = useCallback(() => {
    if (newAttributeKey && newAttributeValue) {
      setAttributes(prev => ({
        ...prev,
        [newAttributeKey]: newAttributeValue
      }));
      setNewAttributeKey('');
      setNewAttributeValue('');
    }
  }, [newAttributeKey, newAttributeValue]);

  const removeAttribute = useCallback((key: string) => {
    setAttributes(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      return;
    }

    if (!state.wallet.connected) {
      alert(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      return;
    }

    clearError();
    setUploadSuccess(false);

    try {
      const result = await store(files, {
        epochs,
        permanent,
        deletable,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined
      });

      if (result) {
        setUploadSuccess(true);
        setFiles([]);
        setAttributes({});
        
        if (onUploadComplete) {
          onUploadComplete(result);
        }

        setTimeout(() => setUploadSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [files, epochs, permanent, deletable, attributes, state.wallet.connected, store, clearError, onUploadComplete]);

  const totalSize = files.reduce((total, file) => total + file.size, 0);

  return (
    <Card style={{ padding: '24px' }}>
      <Flex direction="column" gap="4">
        <Flex align="center" gap="3">
          <Text size="5" weight="bold">🐋 Upload to Walrus</Text>
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

        {uploadSuccess && (
          <Card style={{ padding: '12px', background: 'var(--green-2)', border: '1px solid var(--green-6)' }}>
            <Text size="2" color="green">{SUCCESS_MESSAGES.FILE_UPLOADED}</Text>
          </Card>
        )}

        <Box>
          <input
            type="file"
            multiple={maxFiles > 1}
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
            Max {maxFiles} files, up to {formatBytes(APP_CONFIG.walrus.maxFileSize)} each
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
          <Text size="3" weight="medium">Storage Options</Text>
          
          <Flex align="center" gap="4">
            <Box>
              <Text size="2" style={{ marginBottom: '4px', display: 'block' }}>Epochs</Text>
              <TextField.Root
                type="number"
                value={epochs.toString()}
                onChange={(e) => setEpochs(Number(e.target.value))}
                min="1"
                max="53"
                style={{ width: '100px' }}
              />
            </Box>
            
            <Flex direction="column" gap="2">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Checkbox
                  checked={permanent}
                  onCheckedChange={(checked) => setPermanent(checked === true)}
                />
                <Text size="2">Permanent Storage</Text>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Checkbox
                  checked={deletable}
                  onCheckedChange={(checked) => setDeletable(checked === true)}
                />
                <Text size="2">Deletable</Text>
              </label>
            </Flex>
          </Flex>
        </Flex>

        <Flex direction="column" gap="3">
          <Text size="3" weight="medium">Metadata Attributes</Text>
          
          <Flex gap="2">
            <TextField.Root
              placeholder="Key"
              value={newAttributeKey}
              onChange={(e) => setNewAttributeKey(e.target.value)}
              style={{ flex: 1 }}
            />
            <TextField.Root
              placeholder="Value"
              value={newAttributeValue}
              onChange={(e) => setNewAttributeValue(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button onClick={addAttribute} disabled={!newAttributeKey || !newAttributeValue}>
              Add
            </Button>
          </Flex>

          {Object.entries(attributes).length > 0 && (
            <Card style={{ padding: '12px' }}>
              <Flex direction="column" gap="2">
                {Object.entries(attributes).map(([key, value]) => (
                  <Flex key={key} justify="between" align="center">
                    <Text size="2" style={{ fontFamily: 'monospace' }}>
                      {key}: {value}
                    </Text>
                    <Button size="1" variant="soft" color="red" onClick={() => removeAttribute(key)}>
                      Remove
                    </Button>
                  </Flex>
                ))}
              </Flex>
            </Card>
          )}
        </Flex>

        <Button
          size="3"
          onClick={handleUpload}
          disabled={files.length === 0 || loading || !state.wallet.connected}
          style={{ width: '100%' }}
        >
          {loading ? (
            <Flex align="center" gap="2">
              <LoadingSpinner size="small" text="" />
              <Text>Uploading...</Text>
            </Flex>
          ) : (
            `Upload ${files.length} file${files.length !== 1 ? 's' : ''} to Walrus`
          )}
        </Button>
      </Flex>
    </Card>
  );
}