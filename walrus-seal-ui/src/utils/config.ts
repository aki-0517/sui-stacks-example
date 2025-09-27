import { NETWORK_CONFIG } from './constants';
import type { WalrusConfig, SealConfig } from '../types/common';

export function getNetworkConfig(network: 'testnet' | 'mainnet') {
  return NETWORK_CONFIG[network];
}

export function getWalrusConfig(network: 'testnet' | 'mainnet'): WalrusConfig {
  return NETWORK_CONFIG[network].walrus;
}

export function getSealConfig(network: 'testnet' | 'mainnet'): SealConfig {
  return NETWORK_CONFIG[network].seal;
}

export function getSuiRpcUrl(network: 'testnet' | 'mainnet'): string {
  return NETWORK_CONFIG[network].sui.rpc;
}

export function validateFileSize(file: File, maxSize: number = 50 * 1024 * 1024): boolean {
  return file.size <= maxSize;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const prefix = type.slice(0, -2);
      return file.type.startsWith(prefix);
    }
    return file.type === type;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function isValidSuiAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}