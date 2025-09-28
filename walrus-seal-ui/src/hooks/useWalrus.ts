import { useState, useCallback, useEffect } from 'react';
import { WalrusService } from '../services/walrus';
import { useAppContext } from '../context/AppContext';
import type { 
  WalrusBlobInfo, 
  WalrusStoreOptions, 
  WalrusStoreResult,
  WalrusSystemInfo,
  QuiltFile,
  WalrusQuiltResult
} from '../types/walrus';

import { useSuiClient } from '@mysten/dapp-kit';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

import { useCurrentAccount } from '@mysten/dapp-kit';

export function useWalrus() {
  const { state, dispatch } = useAppContext();
  const suiClientResult = useSuiClient();
  const { suiClient } = suiClientResult;
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  
  // デバッグ情報を追加
  console.log('useWalrus hook - SuiClient state:', {
    suiClientResult,
    hasSuiClient: !!suiClient,
    suiClientType: typeof suiClient,
    currentAccount: currentAccount?.address,
    signAndExecute: !!signAndExecute
  });
  const [walrusService, setWalrusService] = useState<WalrusService | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeWalrusService = async () => {
      console.log('useWalrus initialization check:', {
        hasCurrentAccount: !!currentAccount,
        hasAddress: !!currentAccount?.address,
        address: currentAccount?.address,
        hasSuiClient: !!suiClient,
        hasWalrusConfig: !!state.network.walrusConfig,
        walrusConfig: state.network.walrusConfig
      });

      if (!currentAccount?.address) {
        console.log('useWalrus: Missing current account, setting service to null');
        setWalrusService(null);
        return;
      }

      if (!state.network.walrusConfig) {
        console.log('useWalrus: Missing walrus config, setting service to null');
        setWalrusService(null);
        return;
      }

      // SuiClientが利用できない場合は手動で作成
      let clientToUse = suiClient;
      if (!clientToUse) {
        console.log('useWalrus: SuiClient not available from hook, creating manually');
        try {
          // 動的インポートを使用してブラウザ環境で動作するようにする
          const { SuiClient, getFullnodeUrl } = await import('@mysten/sui/client');
          const network = state.network.current;
          const rpcUrl = getFullnodeUrl(network);
          console.log(`useWalrus: Creating SuiClient for ${network} with URL: ${rpcUrl}`);
          clientToUse = new SuiClient({ url: rpcUrl });
          console.log('useWalrus: Manual SuiClient created successfully');
        } catch (error) {
          console.error('useWalrus: Failed to create manual SuiClient:', error);
          setWalrusService(null);
          return;
        }
      }

      const signTransaction = async (tx: Transaction): Promise<any> => {
        const result = await signAndExecute({
          transaction: tx,
          options: {
            showEffects: true,
            showEvents: true
          }
        });
        
        // Return the actual transaction result for executeTransactionBlock
        return result as any;
      };

      console.log('useWalrus: Creating WalrusService with:', {
        config: state.network.walrusConfig,
        hasSuiClient: !!clientToUse,
        hasSignTransaction: !!signTransaction,
        address: currentAccount.address
      });

      const service = new WalrusService(
        state.network.walrusConfig,
        clientToUse,
        signTransaction,
        currentAccount.address
      );
      
      console.log('useWalrus: WalrusService created successfully:', !!service);
      setWalrusService(service);
    };

    initializeWalrusService();
  }, [state.network.walrusConfig, state.network.current, suiClient, signAndExecute, currentAccount]);

  const handleError = useCallback((error: any, operation: string) => {
    const message = error instanceof Error ? error.message : `${operation} failed`;
    setError(message);
    dispatch({ type: 'SET_ERROR', payload: message });
    console.error(`Walrus ${operation} error:`, error);
  }, [dispatch]);

  const clearError = useCallback(() => {
    setError(null);
    dispatch({ type: 'SET_ERROR', payload: null });
  }, [dispatch]);

  const store = useCallback(async (files: File[], options: WalrusStoreOptions): Promise<WalrusStoreResult | null> => {
    console.log('useWalrus store function called:', {
      hasWalrusService: !!walrusService,
      hasCurrentAccount: !!currentAccount,
      hasAddress: !!currentAccount?.address,
      address: currentAccount?.address,
      filesCount: files.length
    });

    if (!walrusService) {
      const errorMsg = `Walrus service not initialized. Current state: wallet=${!!currentAccount?.address}, suiClient=${!!suiClientResult.suiClient}, config=${!!state.network.walrusConfig}`;
      console.error('useWalrus store error:', errorMsg);
      handleError(new Error(errorMsg), 'store');
      return null;
    }

    if (!currentAccount?.address) {
      handleError(new Error('Wallet not connected'), 'store');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      const result = await walrusService.store(files, options);
      
      // Add blob to state
      const blobInfo: WalrusBlobInfo = {
        id: result.blobId,
        size: files.reduce((total, file) => total + file.size, 0),
        uploadedAt: new Date(),
        status: 'pending',
        epochs: options.epochs,
        permanent: options.permanent || false,
        deletable: options.deletable || false,
        attributes: options.attributes
      };
      
      dispatch({ type: 'ADD_BLOB', payload: blobInfo });
      
      return result;
    } catch (error) {
      handleError(error, 'store');
      return null;
    } finally {
      setLoading(false);
    }
  }, [walrusService, currentAccount, handleError, clearError, dispatch]);

  const read = useCallback(async (blobId: string): Promise<Blob | null> => {
    if (!walrusService) {
      handleError(new Error('Walrus service not initialized'), 'read');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      return await walrusService.read(blobId);
    } catch (error) {
      handleError(error, 'read');
      return null;
    } finally {
      setLoading(false);
    }
  }, [walrusService, handleError, clearError]);

  const status = useCallback(async (blobId: string) => {
    if (!walrusService) {
      handleError(new Error('Walrus service not initialized'), 'status');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      const blobStatus = await walrusService.status(blobId);
      
      // Update blob in state
      dispatch({ 
        type: 'UPDATE_BLOB', 
        payload: { 
          id: blobId, 
          data: { status: blobStatus.status } 
        } 
      });
      
      return blobStatus;
    } catch (error) {
      handleError(error, 'status');
      return null;
    } finally {
      setLoading(false);
    }
  }, [walrusService, handleError, clearError, dispatch]);

  const extend = useCallback(async (objectId: string, epochs: number): Promise<boolean> => {
    if (!walrusService) {
      handleError(new Error('Walrus service not initialized'), 'extend');
      return false;
    }

    setLoading(true);
    clearError();

    try {
      await walrusService.extend(objectId, epochs);
      return true;
    } catch (error) {
      handleError(error, 'extend');
      return false;
    } finally {
      setLoading(false);
    }
  }, [walrusService, handleError, clearError]);

  const deleteBlob = useCallback(async (blobId: string): Promise<boolean> => {
    if (!walrusService) {
      handleError(new Error('Walrus service not initialized'), 'delete');
      return false;
    }

    setLoading(true);
    clearError();

    try {
      await walrusService.delete(blobId);
      dispatch({ type: 'REMOVE_BLOB', payload: blobId });
      return true;
    } catch (error) {
      handleError(error, 'delete');
      return false;
    } finally {
      setLoading(false);
    }
  }, [walrusService, handleError, clearError, dispatch]);

  const storeQuilt = useCallback(async (files: QuiltFile[], options: WalrusStoreOptions): Promise<WalrusQuiltResult | null> => {
    if (!walrusService) {
      handleError(new Error('Walrus service not initialized'), 'storeQuilt');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      return await walrusService.storeQuilt(files, options);
    } catch (error) {
      handleError(error, 'storeQuilt');
      return null;
    } finally {
      setLoading(false);
    }
  }, [walrusService, handleError, clearError]);

  const readQuilt = useCallback(async (quiltId: string, identifier: string): Promise<Blob | null> => {
    if (!walrusService) {
      handleError(new Error('Walrus service not initialized'), 'readQuilt');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      return await walrusService.readQuilt(quiltId, identifier);
    } catch (error) {
      handleError(error, 'readQuilt');
      return null;
    } finally {
      setLoading(false);
    }
  }, [walrusService, handleError, clearError]);

  const getSystemInfo = useCallback(async (): Promise<WalrusSystemInfo | null> => {
    if (!walrusService) {
      handleError(new Error('Walrus service not initialized'), 'systemInfo');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      const systemInfo = await walrusService.systemInfo();
      dispatch({ type: 'SET_SYSTEM_INFO', payload: systemInfo });
      return systemInfo;
    } catch (error) {
      handleError(error, 'systemInfo');
      return null;
    } finally {
      setLoading(false);
    }
  }, [walrusService, handleError, clearError, dispatch]);

  const listBlobs = useCallback(async (owner?: string): Promise<WalrusBlobInfo[]> => {
    if (!walrusService) {
      handleError(new Error('Walrus service not initialized'), 'listBlobs');
      return [];
    }

    setLoading(true);
    clearError();

    try {
      return await walrusService.listBlobs(owner);
    } catch (error) {
      handleError(error, 'listBlobs');
      return [];
    } finally {
      setLoading(false);
    }
  }, [walrusService, handleError, clearError]);

  return {
    blobs: state.walrus.blobs,
    quilts: state.walrus.quilts,
    systemInfo: state.walrus.systemInfo,
    loading,
    error,
    store,
    read,
    status,
    extend,
    deleteBlob,
    storeQuilt,
    readQuilt,
    getSystemInfo,
    listBlobs,
    clearError
  };
}