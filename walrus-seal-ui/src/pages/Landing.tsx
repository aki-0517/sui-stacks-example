import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Flex, Text, Button, Grid, Box, Badge } from '@radix-ui/themes';
import { WalletConnector } from '../components/common/WalletConnector';
import { ROUTES } from '../utils/constants';

export function Landing() {
  return (
    <Flex direction="column" gap="6">
      <Box style={{ textAlign: 'center', padding: '40px 0' }}>
        <Text size="8" weight="bold" style={{ 
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '16px',
          display: 'block'
        }}>
          Walrus & Seal Integration
        </Text>
        <Text size="5" color="gray" style={{ marginBottom: '24px', display: 'block' }}>
          Decentralized Storage meets Advanced Encryption
        </Text>
        <Text size="3" color="gray" style={{ maxWidth: '600px', margin: '0 auto', display: 'block' }}>
          Experience the power of Walrus distributed storage combined with Seal's sophisticated
          encryption and access control patterns. Build secure, decentralized applications
          with confidence.
        </Text>
      </Box>

      <WalletConnector />

      <Grid columns="3" gap="4">
        <FeatureCard
          title="Walrus Storage"
          description="Store files on a decentralized network with high availability and redundancy"
          icon="🐋"
          features={[
            "Blob Storage & Retrieval",
            "Quilt Batch Operations", 
            "System Monitoring",
            "Blob Management"
          ]}
          link={ROUTES.WALRUS.ROOT}
          color="blue"
        />
        
        <FeatureCard
          title="Seal Encryption"
          description="Advanced encryption with flexible access control patterns"
          icon="🔐"
          features={[
            "Data Encryption/Decryption",
            "Session Key Management",
            "Access Control Policies",
            "Key Server Integration"
          ]}
          link={ROUTES.SEAL.ROOT}
          color="purple"
        />
        
        <FeatureCard
          title="Integration Demos"
          description="Real-world examples combining Walrus and Seal capabilities"
          icon="🔗"
          features={[
            "Encrypted File Storage",
            "Allowlist Management",
            "Subscription Services",
            "Time-locked Content"
          ]}
          link={ROUTES.INTEGRATED.ROOT}
          color="green"
        />
      </Grid>

      <Card>
        <Flex direction="column" gap="4">
          <Text size="5" weight="bold">Quick Start Guide</Text>
          
          <Grid columns="2" gap="4">
            <Box>
              <Text size="4" weight="medium" style={{ marginBottom: '12px', display: 'block' }}>
                1. Connect Your Wallet
              </Text>
              <Text size="3" color="gray">
                Connect your Sui wallet to interact with both Walrus and Seal networks.
                Make sure you have testnet SUI for transactions.
              </Text>
            </Box>
            
            <Box>
              <Text size="4" weight="medium" style={{ marginBottom: '12px', display: 'block' }}>
                2. Choose Your Network
              </Text>
              <Text size="3" color="gray">
                Switch between testnet and mainnet configurations.
                Testnet is recommended for development and testing.
              </Text>
            </Box>
            
            <Box>
              <Text size="4" weight="medium" style={{ marginBottom: '12px', display: 'block' }}>
                3. Store Files on Walrus
              </Text>
              <Text size="3" color="gray">
                Upload files to the decentralized Walrus network.
                Files are automatically encoded and distributed across storage nodes.
              </Text>
            </Box>
            
            <Box>
              <Text size="4" weight="medium" style={{ marginBottom: '12px', display: 'block' }}>
                4. Encrypt with Seal
              </Text>
              <Text size="3" color="gray">
                Add encryption and access control to your data using Seal's
                flexible policy system before storing on Walrus.
              </Text>
            </Box>
          </Grid>
        </Flex>
      </Card>
    </Flex>
  );
}

function FeatureCard({ 
  title, 
  description, 
  icon, 
  features, 
  link, 
  color 
}: {
  title: string;
  description: string;
  icon: string;
  features: string[];
  link: string;
  color: 'blue' | 'purple' | 'green';
}) {
  return (
    <Card style={{ height: '100%' }}>
      <Flex direction="column" gap="3" style={{ height: '100%' }}>
        <Flex align="center" gap="3">
          <Text size="6">{icon}</Text>
          <Text size="5" weight="bold">{title}</Text>
        </Flex>
        
        <Text size="3" color="gray" style={{ flex: 1 }}>
          {description}
        </Text>
        
        <Flex direction="column" gap="2">
          {features.map((feature, index) => (
            <Flex key={index} align="center" gap="2">
              <Badge color={color} variant="soft" size="1">
                ✓
              </Badge>
              <Text size="2">{feature}</Text>
            </Flex>
          ))}
        </Flex>
        
        <Link to={link} style={{ textDecoration: 'none' }}>
          <Button size="3" style={{ width: '100%' }} color={color}>
            Explore {title}
          </Button>
        </Link>
      </Flex>
    </Card>
  );
}