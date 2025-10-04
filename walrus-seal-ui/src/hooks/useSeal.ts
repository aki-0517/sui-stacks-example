import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSignPersonalMessage } from '@mysten/dapp-kit';
import { SealService } from '../services/seal';
import { useAppContext } from '../context/AppContext';
import type {
  SealEncryptionPolicy,
  SealEncryptionResult,
  SealSessionKey
} from '../types/seal';

export function useSeal() {
  const { state, dispatch } = useAppContext();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
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
        console.log('Starting Seal service initialization...', {
          network: state.network.current,
          sealConfig: state.network.sealConfig
        });
        
        setIsInitialized(false);
        setError(null);
        
        const { SuiClient, getFullnodeUrl } = await import('@mysten/sui/client');
        const networkUrl = state.network.current === 'testnet' 
          ? getFullnodeUrl('testnet')
          : getFullnodeUrl('mainnet');
        
        console.log(`Creating Sui client for network: ${state.network.current}, URL: ${networkUrl}`);
        const client = new SuiClient({ url: networkUrl });
        
        console.log('Creating SealService instance...');
        
        // Create a signing function wrapper that returns Promise
        const walletSigningFunction = (message: string | Uint8Array): Promise<{ signature: string; bytes: string }> => {
          return new Promise((resolve, reject) => {
            signPersonalMessage(
              { message: typeof message === 'string' ? new TextEncoder().encode(message) : message },
              {
                onSuccess: (result) => {
                  console.log('Wallet signature successful:', {
                    hasSignature: !!result.signature,
                    hasBytes: !!result.bytes,
                    signatureLength: result.signature?.length
                  });
                  resolve({
                    signature: result.signature,
                    bytes: result.bytes
                  });
                },
                onError: (error) => {
                  console.error('Wallet signature failed:', error);
                  reject(error);
                }
              }
            );
          });
        };
        
        const service = new SealService(state.network.sealConfig, client, walletSigningFunction);
        
        // Create the initialization promise and store it
        const initPromise = service.initializeSealClient().then(() => {
          if (!isCancelled) {
            console.log('Seal service fully initialized successfully');
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
          console.error('Failed to initialize Seal service - detailed error:', {
            error: error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : 'No stack trace',
            networkState: {
              current: state.network.current,
              sealConfig: state.network.sealConfig
            }
          });
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
    console.log('Waiting for Seal initialization...', { isInitialized, sealServiceExists: !!sealService });
    
    if (isInitialized && sealService) {
      console.log('Seal service already initialized');
      return;
    }
    
    if (initializationPromise) {
      console.log('Waiting for initialization promise to resolve...');
      await initializationPromise;
    }
    
    if (!isInitialized || !sealService) {
      console.error('Seal service failed to initialize - throwing error');
      throw new Error('Seal service failed to initialize');
    }
    
    console.log('Seal service initialization wait completed successfully');
  }, [isInitialized, sealService, initializationPromise]);

  const handleError = useCallback((error: unknown, operation: string) => {
    const message = error instanceof Error ? error.message : `${operation} failed`;
    console.error(`Seal ${operation} error - detailed info:`, {
      operation,
      error: error,
      errorMessage: message,
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    });
    setError(message);
    dispatch({ type: 'SET_ERROR', payload: message });
  }, [dispatch]);

  const clearError = useCallback(() => {
    setError(null);
    dispatch({ type: 'SET_ERROR', payload: null });
  }, [dispatch]);

  const encrypt = useCallback(async (data: Uint8Array, policy: SealEncryptionPolicy): Promise<SealEncryptionResult | null> => {
    console.log('Starting encryption with policy:', {
      policyId: policy.id,
      packageId: policy.packageId,
      threshold: policy.threshold,
      policyType: policy.policyType,
      dataLength: data.length
    });
    
    setLoading(true);
    clearError();

    try {
      await waitForInitialization();
      
      const result = await sealService!.encrypt(data, policy);
      
      console.log('Encryption completed successfully, storing session key...');
      
      // Store session key in global state
      dispatch({
        type: 'ADD_SESSION_KEY',
        payload: result.sessionKey
      });
      
      console.log('Session key stored in global state');
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
      console.error('Decrypt called without transaction bytes');
      handleError(new Error('Transaction bytes required for decryption'), 'decrypt');
      return null;
    }

    console.log('Starting decryption...', {
      sessionKeyId: sessionKey.id,
      encryptedDataLength: encryptedData.length,
      txBytesLength: txBytes.length
    });

    setLoading(true);
    clearError();

    try {
      await waitForInitialization();
      const result = await sealService!.decrypt(encryptedData, sessionKey, txBytes);
      console.log('Decryption completed successfully');
      return result;
    } catch (error) {
      handleError(error, 'decrypt');
      return null;
    } finally {
      setLoading(false);
    }
  }, [waitForInitialization, sealService, handleError, clearError]);

  const createSessionKey = useCallback(async (packageId: string, ttl: number, userAddress?: string): Promise<SealSessionKey | null> => {
    console.log('Creating session key...', {
      packageId,
      ttl,
      userAddress: userAddress || 'using fallback'
    });
    
    setLoading(true);
    clearError();

    try {
      await waitForInitialization();
      
      const sessionKey = await sealService!.createSessionKey(packageId, ttl, userAddress);
      
      console.log('Session key created successfully, storing in global state...');
      
      // Store session key in global state
      dispatch({
        type: 'ADD_SESSION_KEY',
        payload: sessionKey
      });
      
      console.log('Session key stored in global state');
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
    
    console.log('Creating encryption policy:', {
      type,
      hexId,
      threshold: state.network.sealConfig.defaultThreshold,
      packageId: state.network.sealConfig.packageId
    });
    
    return {
      threshold: state.network.sealConfig.defaultThreshold,
      packageId: state.network.sealConfig.packageId,
      id: hexId,
      keyServers: state.network.sealConfig.keyServers,
      policyType: type,
      policyConfig: config
    };
  }, [state.network.sealConfig]);

  const removeSessionKey = useCallback((sessionKeyId: string): boolean => {
    try {
      dispatch({ type: 'REMOVE_SESSION_KEY', payload: sessionKeyId });
      return true;
    } catch (error) {
      handleError(error, 'removeSessionKey');
      return false;
    }
  }, [dispatch, handleError]);

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
    removeSessionKey,
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