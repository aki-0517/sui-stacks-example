import { useState, useCallback, useEffect, useMemo } from 'react';
import { SealService } from '../services/seal';
import { useAppContext } from '../context/AppContext';
import type {
  SealEncryptionPolicy,
  SealEncryptionResult,
  SealSessionKey
} from '../types/seal';

export function useSeal() {
  const { state, dispatch } = useAppContext();
  const [sealService, setSealService] = useState<SealService | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationPromise, setInitializationPromise] = useState<Promise<void> | null>(null);

  // Network dependency for service initialization
  useEffect(() => {
    let isCancelled = false;
    
    const initService = async () => {
      try {
        setIsInitialized(false);
        setError(null);
        
        const { SuiClient, getFullnodeUrl } = await import('@mysten/sui/client');
        const networkUrl = state.network.current === 'testnet' 
          ? getFullnodeUrl('testnet')
          : getFullnodeUrl('mainnet');
        const client = new SuiClient({ url: networkUrl });
        
        const service = new SealService(state.network.sealConfig, client);
        
        // Create the initialization promise and store it
        const initPromise = service.initializeSealClient().then(() => {
          if (!isCancelled) {
            console.log('Seal service fully initialized');
            setIsInitialized(true);
            setSealService(service);
          }
        });
        
        if (!isCancelled) {
          setInitializationPromise(initPromise);
        }
        
        // Wait for initialization to complete
        await initPromise;
        
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to initialize Seal service:', error);
          setError(`Failed to initialize Seal service: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsInitialized(false);
          setSealService(null);
        }
      }
    };

    initService();
    
    return () => {
      isCancelled = true;
    };
  }, [state.network]);

  const waitForInitialization = useCallback(async () => {
    if (isInitialized && sealService) {
      return;
    }
    
    if (initializationPromise) {
      await initializationPromise;
    }
    
    if (!isInitialized || !sealService) {
      throw new Error('Seal service failed to initialize');
    }
  }, [isInitialized, sealService, initializationPromise]);

  const handleError = useCallback((error: unknown, operation: string) => {
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
    setLoading(true);
    clearError();

    try {
      await waitForInitialization();
      
      const result = await sealService!.encrypt(data, policy);
      
      // Store session key in global state
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
  }, [waitForInitialization, sealService, handleError, clearError, dispatch]);

  const decrypt = useCallback(async (encryptedData: Uint8Array, sessionKey: SealSessionKey, txBytes?: Uint8Array): Promise<Uint8Array | null> => {
    if (!txBytes) {
      handleError(new Error('Transaction bytes required for decryption'), 'decrypt');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      await waitForInitialization();
      return await sealService!.decrypt(encryptedData, sessionKey, txBytes);
    } catch (error) {
      handleError(error, 'decrypt');
      return null;
    } finally {
      setLoading(false);
    }
  }, [waitForInitialization, sealService, handleError, clearError]);

  const createSessionKey = useCallback(async (packageId: string, ttl: number, userAddress?: string): Promise<SealSessionKey | null> => {
    setLoading(true);
    clearError();

    try {
      await waitForInitialization();
      
      const sessionKey = await sealService!.createSessionKey(packageId, ttl, userAddress);
      
      // Store session key in global state
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
  }, [waitForInitialization, sealService, handleError, clearError, dispatch]);

  const signSessionKey = useCallback(async (sessionKey: SealSessionKey, signature: string): Promise<boolean> => {
    setLoading(true);
    clearError();

    try {
      await waitForInitialization();
      
      await sealService!.signSessionKey(sessionKey, signature);
      
      // Update session key in global state
      dispatch({
        type: 'UPDATE_SESSION_KEY',
        payload: sessionKey
      });
      
      return true;
    } catch (error) {
      handleError(error, 'signSessionKey');
      return false;
    } finally {
      setLoading(false);
    }
  }, [waitForInitialization, sealService, handleError, clearError, dispatch]);

  const verifyKeyServers = useCallback(async (serverIds: string[]): Promise<boolean> => {
    setLoading(true);
    clearError();

    try {
      await waitForInitialization();
      return await sealService!.verifyKeyServers(serverIds);
    } catch (error) {
      handleError(error, 'verifyKeyServers');
      return false;
    } finally {
      setLoading(false);
    }
  }, [waitForInitialization, sealService, handleError, clearError]);

  const fetchKeys = useCallback(async (ids: string[], txBytes: Uint8Array, sessionKey: SealSessionKey, threshold?: number): Promise<Map<string, string> | null> => {
    setLoading(true);
    clearError();

    try {
      await waitForInitialization();
      return await sealService!.fetchKeys(ids, txBytes, sessionKey, threshold);
    } catch (error) {
      handleError(error, 'fetchKeys');
      return null;
    } finally {
      setLoading(false);
    }
  }, [waitForInitialization, sealService, handleError, clearError]);

  const getDerivedKeys = useCallback(async (id: string, txBytes: Uint8Array, sessionKey: SealSessionKey, threshold?: number): Promise<Map<string, unknown> | null> => {
    setLoading(true);
    clearError();

    try {
      await waitForInitialization();
      return await sealService!.getDerivedKeys(id, txBytes, sessionKey, threshold);
    } catch (error) {
      handleError(error, 'getDerivedKeys');
      return null;
    } finally {
      setLoading(false);
    }
  }, [waitForInitialization, sealService, handleError, clearError]);

  const getPublicKeys = useCallback(async (serverObjectIds: string[]): Promise<unknown[] | null> => {
    setLoading(true);
    clearError();

    try {
      await waitForInitialization();
      return await sealService!.getPublicKeys(serverObjectIds);
    } catch (error) {
      handleError(error, 'getPublicKeys');
      return null;
    } finally {
      setLoading(false);
    }
  }, [waitForInitialization, sealService, handleError, clearError]);

  const parseEncryptedObject = useCallback(async (encryptedBytes: Uint8Array): Promise<unknown | null> => {
    try {
      await waitForInitialization();
      return await sealService!.parseEncryptedObject(encryptedBytes);
    } catch (error) {
      handleError(error, 'parseEncryptedObject');
      return null;
    }
  }, [waitForInitialization, sealService, handleError]);

  const buildSealApproveTransaction = useCallback(async (packageId: string, moduleName: string, functionName: string, id: string, ...args: unknown[]): Promise<Uint8Array | null> => {
    setLoading(true);
    clearError();

    try {
      await waitForInitialization();
      return await sealService!.buildSealApproveTransaction(packageId, moduleName, functionName, id, ...args);
    } catch (error) {
      handleError(error, 'buildSealApproveTransaction');
      return null;
    } finally {
      setLoading(false);
    }
  }, [waitForInitialization, sealService, handleError, clearError]);

  // Move contract methods (will throw errors as expected)
  const createAllowlist = useCallback(async (members: string[]): Promise<string | null> => {
    try {
      await waitForInitialization();
      return await sealService!.createAllowlist(members);
    } catch (error) {
      handleError(error, 'createAllowlist');
      return null;
    }
  }, [waitForInitialization, sealService, handleError]);

  const addToAllowlist = useCallback(async (allowlistId: string, member: string): Promise<boolean> => {
    try {
      await waitForInitialization();
      await sealService!.addToAllowlist(allowlistId, member);
      return true;
    } catch (error) {
      handleError(error, 'addToAllowlist');
      return false;
    }
  }, [waitForInitialization, sealService, handleError]);

  const removeFromAllowlist = useCallback(async (allowlistId: string, member: string): Promise<boolean> => {
    try {
      await waitForInitialization();
      await sealService!.removeFromAllowlist(allowlistId, member);
      return true;
    } catch (error) {
      handleError(error, 'removeFromAllowlist');
      return false;
    }
  }, [waitForInitialization, sealService, handleError]);

  const checkAllowlistMembership = useCallback(async (allowlistId: string, member: string): Promise<boolean> => {
    try {
      await waitForInitialization();
      return await sealService!.checkAllowlistMembership(allowlistId, member);
    } catch (error) {
      handleError(error, 'checkAllowlistMembership');
      return false;
    }
  }, [waitForInitialization, sealService, handleError]);

  // Helper function to create default encryption policy
  const createPolicy = useCallback((
    type: 'allowlist' | 'subscription' | 'timelock' | 'voting' | 'private',
    config?: unknown
  ): SealEncryptionPolicy => {
    // Generate a random 32-byte hex string for the policy ID (without 0x prefix)
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const hexId = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return {
      threshold: state.network.sealConfig.defaultThreshold,
      packageId: state.network.sealConfig.packageId,
      id: hexId,
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
    isInitialized,
    encrypt,
    decrypt,
    createSessionKey,
    signSessionKey,
    verifyKeyServers,
    fetchKeys,
    getDerivedKeys,
    getPublicKeys,
    parseEncryptedObject,
    buildSealApproveTransaction,
    createAllowlist,
    addToAllowlist,
    removeFromAllowlist,
    checkAllowlistMembership,
    createPolicy,
    clearError
  };
}