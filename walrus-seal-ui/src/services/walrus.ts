import type { 
  WalrusClient, 
  WalrusStoreOptions, 
  WalrusStoreResult, 
  WalrusBlobStatus,
  WalrusBlobInfo,
  WalrusSystemInfo,
  QuiltFile,
  WalrusQuiltResult,
  WalrusConfig 
} from '../types/walrus';

export class WalrusService implements WalrusClient {
  private config: WalrusConfig;

  constructor(config: WalrusConfig) {
    this.config = config;
  }

  async store(files: File[], options: WalrusStoreOptions): Promise<WalrusStoreResult> {
    try {
      // For single blob store, only handle first file
      if (files.length === 0) {
        throw new Error('No files provided');
      }
      
      const file = files[0];
      const url = new URL(`${this.config.publisher}/v1/blobs`);
      
      // Add query parameters
      url.searchParams.append('epochs', options.epochs.toString());
      if (options.permanent) url.searchParams.append('permanent', 'true');
      if (options.deletable) url.searchParams.append('deletable', 'true');

      const response = await fetch(url.toString(), {
        method: 'PUT',
        body: file
      });

      if (!response.ok) {
        throw new Error(`Store failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle Walrus API response format
      let blobData;
      if (result.newlyCreated) {
        blobData = result.newlyCreated;
      } else if (result.alreadyCertified) {
        blobData = result.alreadyCertified;
      } else {
        throw new Error(`Unexpected Walrus API response format: ${JSON.stringify(result)}`);
      }
      
      return {
        blobId: blobData.blobObject?.blobId || blobData.blobId,
        suiObjectId: blobData.blobObject?.id || blobData.blobObject?.sui_object_id,
        epochs: options.epochs,
        cost: blobData.cost || 0,
        gasUsed: blobData.gasUsed || blobData.gas_used || 0
      };
    } catch (error) {
      console.error('Walrus store error:', error);
      throw error;
    }
  }

  async read(blobId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.config.aggregator}/v1/blobs/${blobId}`);
      
      if (!response.ok) {
        throw new Error(`Read failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Walrus read error:', error);
      throw error;
    }
  }

  async status(blobId: string): Promise<WalrusBlobStatus> {
    try {
      // Note: Status API is not available on aggregator, only on storage nodes
      // We'll attempt to read the blob to verify its existence instead
      const response = await fetch(`${this.config.aggregator}/v1/blobs/${blobId}`, {
        method: 'HEAD' // Use HEAD to check existence without downloading content
      });
      
      if (response.ok) {
        // Blob exists and is accessible
        return {
          id: blobId,
          status: 'available',
          epochs: 0, // Unknown from aggregator
          expiry: undefined,
          size: parseInt(response.headers.get('content-length') || '0'),
          confirmed: true,
          availability: 1.0,
          mimeType: response.headers.get('content-type') || 'application/octet-stream'
        };
      } else if (response.status === 404) {
        // Blob not found or not yet available
        return {
          id: blobId,
          status: 'not_found',
          epochs: 0,
          expiry: undefined,
          size: 0,
          confirmed: false,
          availability: 0,
          mimeType: undefined
        };
      } else {
        throw new Error(`Status check failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Walrus status error:', error);
      throw error;
    }
  }

  async extend(_objectId: string, _epochs: number): Promise<void> {
    // Note: Extend functionality is only available via CLI, not HTTP API
    throw new Error('Extend functionality is only available via Walrus CLI, not HTTP API');
  }

  async delete(_blobId: string): Promise<void> {
    // Note: Delete functionality is only available via CLI, not HTTP API
    throw new Error('Delete functionality is only available via Walrus CLI, not HTTP API');
  }

  async storeQuilt(files: QuiltFile[], options: WalrusStoreOptions): Promise<WalrusQuiltResult> {
    try {
      const formData = new FormData();
      const metadata: any[] = [];
      
      // Add files with their identifiers as field names
      files.forEach((quiltFile) => {
        formData.append(quiltFile.identifier, quiltFile.file);
        
        // Build metadata array
        if (quiltFile.tags || quiltFile.metadata) {
          metadata.push({
            identifier: quiltFile.identifier,
            tags: quiltFile.tags || {},
            ...quiltFile.metadata
          });
        }
      });
      
      // Add metadata as _metadata field if any
      if (metadata.length > 0) {
        formData.append('_metadata', JSON.stringify(metadata));
      }
      
      // Add query parameters to URL
      const url = new URL(`${this.config.publisher}/v1/quilts`);
      url.searchParams.append('epochs', options.epochs.toString());
      if (options.permanent) url.searchParams.append('permanent', 'true');
      if (options.deletable) url.searchParams.append('deletable', 'true');

      const response = await fetch(url.toString(), {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Quilt store failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle Walrus Quilt API response format
      const blobStoreResult = result.blobStoreResult;
      let blobData;
      if (blobStoreResult?.newlyCreated) {
        blobData = blobStoreResult.newlyCreated;
      } else if (blobStoreResult?.alreadyCertified) {
        blobData = blobStoreResult.alreadyCertified;
      } else {
        throw new Error('Unexpected Walrus Quilt API response format');
      }
      
      return {
        quiltId: blobData.blobObject?.blobId || blobData.blobId,
        patches: result.storedQuiltBlobs || [],
        totalSize: blobData.blobObject?.size || 0,
        cost: blobData.cost || 0
      };
    } catch (error) {
      console.error('Walrus store quilt error:', error);
      throw error;
    }
  }

  async readQuilt(quiltId: string, identifier: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.config.aggregator}/v1/blobs/by-quilt-id/${quiltId}/${identifier}`);
      
      if (!response.ok) {
        throw new Error(`Quilt read failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Walrus read quilt error:', error);
      throw error;
    }
  }

  async systemInfo(): Promise<WalrusSystemInfo> {
    // Note: System info is only available via CLI, not HTTP API
    throw new Error('System info is only available via Walrus CLI, not HTTP API');
  }

  async listBlobs(_owner?: string): Promise<WalrusBlobInfo[]> {
    // Note: List blobs functionality is not available in public HTTP API
    throw new Error('List blobs functionality is not available in public HTTP API');
  }

  async getBlobAttributes(_blobId: string): Promise<Record<string, string>> {
    // Note: Blob attributes are only available via object ID endpoints  
    throw new Error('Blob attributes are only available via by-object-id endpoint, not by blob ID');
  }

  async setBlobAttributes(_blobId: string, _attributes: Record<string, string>): Promise<void> {
    // Note: Setting blob attributes is not available in public HTTP API
    throw new Error('Setting blob attributes is not available in public HTTP API');
  }

  async deleteBlobAttributes(_blobId: string, _keys: string[]): Promise<void> {
    // Note: Deleting blob attributes is not available in public HTTP API
    throw new Error('Deleting blob attributes is not available in public HTTP API');
  }
}