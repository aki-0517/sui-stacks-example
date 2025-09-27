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

export function useWalrus() {
  const { state, dispatch } = useAppContext();
  const [walrusService, setWalrusService] = useState<WalrusService | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const service = new WalrusService(state.network.walrusConfig);
    setWalrusService(service);
  }, [state.network.walrusConfig]);

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
    if (!walrusService) {
      handleError(new Error('Walrus service not initialized'), 'store');
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
  }, [walrusService, handleError, clearError, dispatch]);

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