import { useState, useCallback, useEffect } from 'react';
import { SealService } from '../services/seal';
import { useAppContext } from '../context/AppContext';
import type {
  SealEncryptionPolicy,
  SealEncryptionResult,
  SealSessionKey,
  SealKeyServerInfo
} from '../types/seal';

export function useSeal() {
  const { state, dispatch } = useAppContext();
  const [sealService, setSealService] = useState<SealService | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const service = new SealService(state.network.sealConfig);
    setSealService(service);
  }, [state.network.sealConfig]);

  const handleError = useCallback((error: any, operation: string) => {
    const message = error instanceof Error ? error.message : `${operation} failed`;
    setError(message);
    dispatch({ type: 'SET_ERROR', payload: message });
    console.error(`Seal ${operation} error:`, error);
  }, [dispatch]);

  const clearError = useCallback(() => {
    setError(null);
    dispatch({ type: 'SET_ERROR', payload: null });
  }, [dispatch]);

  const encrypt = useCallback(async (data: Uint8Array, policy: SealEncryptionPolicy): Promise<SealEncryptionResult | null> => {
    if (!sealService) {
      handleError(new Error('Seal service not initialized'), 'encrypt');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      const result = await sealService.encrypt(data, policy);
      
      // Store session key
      dispatch({
        type: 'ADD_SESSION_KEY',
        payload: result.sessionKey
      });
      
      return result;
    } catch (error) {
      handleError(error, 'encrypt');
      return null;
    } finally {
      setLoading(false);
    }
  }, [sealService, handleError, clearError, dispatch]);

  const decrypt = useCallback(async (encryptedData: Uint8Array, sessionKey: SealSessionKey): Promise<Uint8Array | null> => {
    if (!sealService) {
      handleError(new Error('Seal service not initialized'), 'decrypt');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      return await sealService.decrypt(encryptedData, sessionKey);
    } catch (error) {
      handleError(error, 'decrypt');
      return null;
    } finally {
      setLoading(false);
    }
  }, [sealService, handleError, clearError]);

  const createSessionKey = useCallback(async (packageId: string, ttl: number): Promise<SealSessionKey | null> => {
    if (!sealService) {
      handleError(new Error('Seal service not initialized'), 'createSessionKey');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      const sessionKey = await sealService.createSessionKey(packageId, ttl);
      
      // Store session key
      dispatch({
        type: 'ADD_SESSION_KEY',
        payload: sessionKey
      });
      
      return sessionKey;
    } catch (error) {
      handleError(error, 'createSessionKey');
      return null;
    } finally {
      setLoading(false);
    }
  }, [sealService, handleError, clearError, dispatch]);

  const verifyKeyServers = useCallback(async (serverIds: string[]): Promise<boolean> => {
    if (!sealService) {
      handleError(new Error('Seal service not initialized'), 'verifyKeyServers');
      return false;
    }

    setLoading(true);
    clearError();

    try {
      return await sealService.verifyKeyServers(serverIds);
    } catch (error) {
      handleError(error, 'verifyKeyServers');
      return false;
    } finally {
      setLoading(false);
    }
  }, [sealService, handleError, clearError]);

  const fetchKeys = useCallback(async (ids: string[], txBytes: Uint8Array, sessionKey: SealSessionKey): Promise<Map<string, string> | null> => {
    if (!sealService) {
      handleError(new Error('Seal service not initialized'), 'fetchKeys');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      return await sealService.fetchKeys(ids, txBytes, sessionKey);
    } catch (error) {
      handleError(error, 'fetchKeys');
      return null;
    } finally {
      setLoading(false);
    }
  }, [sealService, handleError, clearError]);

  const createAllowlist = useCallback(async (members: string[]): Promise<string | null> => {
    if (!sealService) {
      handleError(new Error('Seal service not initialized'), 'createAllowlist');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      return await sealService.createAllowlist(members);
    } catch (error) {
      handleError(error, 'createAllowlist');
      return null;
    } finally {
      setLoading(false);
    }
  }, [sealService, handleError, clearError]);

  const addToAllowlist = useCallback(async (allowlistId: string, member: string): Promise<boolean> => {
    if (!sealService) {
      handleError(new Error('Seal service not initialized'), 'addToAllowlist');
      return false;
    }

    setLoading(true);
    clearError();

    try {
      await sealService.addToAllowlist(allowlistId, member);
      return true;
    } catch (error) {
      handleError(error, 'addToAllowlist');
      return false;
    } finally {
      setLoading(false);
    }
  }, [sealService, handleError, clearError]);

  const removeFromAllowlist = useCallback(async (allowlistId: string, member: string): Promise<boolean> => {
    if (!sealService) {
      handleError(new Error('Seal service not initialized'), 'removeFromAllowlist');
      return false;
    }

    setLoading(true);
    clearError();

    try {
      await sealService.removeFromAllowlist(allowlistId, member);
      return true;
    } catch (error) {
      handleError(error, 'removeFromAllowlist');
      return false;
    } finally {
      setLoading(false);
    }
  }, [sealService, handleError, clearError]);

  const checkAllowlistMembership = useCallback(async (allowlistId: string, member: string): Promise<boolean> => {
    if (!sealService) {
      handleError(new Error('Seal service not initialized'), 'checkAllowlistMembership');
      return false;
    }

    setLoading(true);
    clearError();

    try {
      return await sealService.checkAllowlistMembership(allowlistId, member);
    } catch (error) {
      handleError(error, 'checkAllowlistMembership');
      return false;
    } finally {
      setLoading(false);
    }
  }, [sealService, handleError, clearError]);

  // Helper function to create default encryption policy
  const createPolicy = useCallback((
    type: 'allowlist' | 'subscription' | 'timelock' | 'voting' | 'private',
    config?: any
  ): SealEncryptionPolicy => {
    return {
      threshold: state.network.sealConfig.defaultThreshold,
      packageId: state.network.sealConfig.packageId,
      id: `policy_${Date.now()}_${type}`,
      keyServers: state.network.sealConfig.keyServers,
      policyType: type,
      policyConfig: config
    };
  }, [state.network.sealConfig]);

  return {
    sessionKeys: state.seal.sessionKeys,
    keyServers: state.seal.keyServers,
    policies: state.seal.policies,
    loading,
    error,
    encrypt,
    decrypt,
    createSessionKey,
    verifyKeyServers,
    fetchKeys,
    createAllowlist,
    addToAllowlist,
    removeFromAllowlist,
    checkAllowlistMembership,
    createPolicy,
    clearError
  };
}