import React from 'react';
import { Card, Flex, Text, Badge, Button, Box, Separator } from '@radix-ui/themes';
import { SealSessionKey } from '../../types/seal';

interface SessionKeyInfoProps {
  sessionKey: SealSessionKey;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  encryptedObjectInfo?: {
    packageId: string;
    id: string;
  };
}

export function SessionKeyInfo({ 
  sessionKey, 
  isSelected = false, 
  onSelect, 
  onDelete,
  encryptedObjectInfo 
}: SessionKeyInfoProps) {
  const now = Date.now();
  const isExpired = sessionKey.expiresAt ? now > sessionKey.expiresAt : false;
  const isExpiringSoon = sessionKey.expiresAt ? (sessionKey.expiresAt - now) < (30 * 60 * 1000) : false; // 30 minutes
  const timeRemaining = sessionKey.expiresAt ? sessionKey.expiresAt - now : null;
  
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusBadge = () => {
    if (!sessionKey.isActive) {
      return <Badge color="red">Unsigned</Badge>;
    }
    if (isExpired) {
      return <Badge color="red">Expired</Badge>;
    }
    if (isExpiringSoon) {
      return <Badge color="orange">Expiring Soon</Badge>;
    }
    return <Badge color="green">Active</Badge>;
  };

  const isCompatible = encryptedObjectInfo ? 
    sessionKey.packageId === encryptedObjectInfo.packageId : true;

  const getCompatibilityStatus = () => {
    if (!encryptedObjectInfo) return null;
    
    if (isCompatible) {
      return <Badge color="green">Compatible</Badge>;
    } else {
      return <Badge color="red">Incompatible</Badge>;
    }
  };

  return (
    <Card 
      variant={isSelected ? "surface" : "outline"}
      style={{ 
        cursor: onSelect ? 'pointer' : 'default',
        borderColor: isSelected ? 'var(--accent-9)' : undefined,
        backgroundColor: isSelected ? 'var(--accent-2)' : undefined
      }}
      onClick={onSelect}
    >
      <Flex direction="column" gap="3">
        {/* Header with ID and Status */}
        <Flex justify="between" align="center">
          <Flex direction="column" gap="1">
            <Text size="3" weight="medium" style={{ fontFamily: 'monospace' }}>
              {sessionKey.id}
            </Text>
            <Flex gap="2" align="center">
              {getStatusBadge()}
              {getCompatibilityStatus()}
            </Flex>
          </Flex>
          {onSelect && (
            <Button 
              size="1" 
              variant={isSelected ? "solid" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              {isSelected ? 'Selected' : 'Select'}
            </Button>
          )}
        </Flex>

        <Separator />

        {/* Package ID */}
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium" color="gray">Package ID</Text>
          <Text size="2" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {sessionKey.packageId}
          </Text>
        </Flex>

        {/* Address */}
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium" color="gray">Address</Text>
          <Text size="2" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {sessionKey.address}
          </Text>
        </Flex>

        {/* TTL and Expiration */}
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium" color="gray">Expiration</Text>
          <Flex direction="column" gap="1">
            <Text size="2">
              TTL: {sessionKey.ttl} minutes
            </Text>
            {sessionKey.expiresAt && (
              <Flex direction="column" gap="1">
                <Text size="2" color={isExpired ? 'red' : isExpiringSoon ? 'orange' : 'gray'}>
                  Expires: {new Date(sessionKey.expiresAt).toLocaleString()}
                </Text>
                {timeRemaining && !isExpired && (
                  <Text size="2" color={isExpiringSoon ? 'orange' : 'gray'}>
                    Time remaining: {formatTimeRemaining(timeRemaining)}
                  </Text>
                )}
              </Flex>
            )}
          </Flex>
        </Flex>

        {/* Created At */}
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium" color="gray">Created At</Text>
          <Text size="2">
            {new Date(sessionKey.createdAt).toLocaleString()}
          </Text>
        </Flex>

        {/* Compatibility Warning */}
        {encryptedObjectInfo && !isCompatible && (
          <Box style={{ 
            padding: '8px', 
            backgroundColor: 'var(--red-2)', 
            borderRadius: '4px',
            border: '1px solid var(--red-6)'
          }}>
            <Text size="2" color="red">
              ⚠️ This Session Key is not compatible with the selected encrypted data.
              Package IDs do not match.
            </Text>
          </Box>
        )}

        {/* Expiration Warning */}
        {isExpired && (
          <Box style={{ 
            padding: '8px', 
            backgroundColor: 'var(--red-2)', 
            borderRadius: '4px',
            border: '1px solid var(--red-6)'
          }}>
            <Text size="2" color="red">
              ❌ This Session Key has expired. Please create a new Session Key.
            </Text>
          </Box>
        )}

        {isExpiringSoon && !isExpired && (
          <Box style={{ 
            padding: '8px', 
            backgroundColor: 'var(--orange-2)', 
            borderRadius: '4px',
            border: '1px solid var(--orange-6)'
          }}>
            <Text size="2" color="orange">
              ⚠️ This Session Key will expire soon.
            </Text>
          </Box>
        )}

        {/* Action Buttons */}
        {onDelete && (
          <Flex gap="2">
            <Button 
              size="1" 
              variant="outline" 
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              Delete
            </Button>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
