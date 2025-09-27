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
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      
      formData.append('epochs', options.epochs.toString());
      if (options.permanent) formData.append('permanent', 'true');
      if (options.deletable) formData.append('deletable', 'true');
      if (options.attributes) {
        formData.append('attributes', JSON.stringify(options.attributes));
      }

      const response = await fetch(`${this.config.publisher}/v1/store`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Store failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        blobId: result.blobId || result.blob_id,
        suiObjectId: result.suiObjectId || result.sui_object_id,
        epochs: options.epochs,
        cost: result.cost || 0,
        gasUsed: result.gasUsed || result.gas_used
      };
    } catch (error) {
      console.error('Walrus store error:', error);
      throw error;
    }
  }

  async read(blobId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.config.aggregator}/v1/${blobId}`);
      
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
      const response = await fetch(`${this.config.aggregator}/v1/status/${blobId}`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: blobId,
        status: data.status,
        epochs: data.epochs,
        expiry: data.expiry ? new Date(data.expiry) : undefined,
        size: data.size,
        confirmed: data.confirmed,
        availability: data.availability || 1.0,
        mimeType: data.mimeType || data.mime_type
      };
    } catch (error) {
      console.error('Walrus status error:', error);
      throw error;
    }
  }

  async extend(objectId: string, epochs: number): Promise<void> {
    try {
      const response = await fetch(`${this.config.publisher}/v1/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          objectId,
          epochs
        })
      });

      if (!response.ok) {
        throw new Error(`Extend failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Walrus extend error:', error);
      throw error;
    }
  }

  async delete(blobId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.publisher}/v1/delete/${blobId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Walrus delete error:', error);
      throw error;
    }
  }

  async storeQuilt(files: QuiltFile[], options: WalrusStoreOptions): Promise<WalrusQuiltResult> {
    try {
      const formData = new FormData();
      
      files.forEach((quiltFile, index) => {
        formData.append(`file${index}`, quiltFile.file);
        formData.append(`identifier${index}`, quiltFile.identifier);
        if (quiltFile.tags) {
          formData.append(`tags${index}`, JSON.stringify(quiltFile.tags));
        }
        if (quiltFile.metadata) {
          formData.append(`metadata${index}`, JSON.stringify(quiltFile.metadata));
        }
      });
      
      formData.append('epochs', options.epochs.toString());
      if (options.permanent) formData.append('permanent', 'true');

      const response = await fetch(`${this.config.publisher}/v1/store-quilt`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Quilt store failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        quiltId: result.quiltId || result.quilt_id,
        patches: result.patches || [],
        totalSize: result.totalSize || result.total_size,
        cost: result.cost || 0
      };
    } catch (error) {
      console.error('Walrus store quilt error:', error);
      throw error;
    }
  }

  async readQuilt(quiltId: string, identifier: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.config.aggregator}/v1/quilt/${quiltId}/${identifier}`);
      
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
    try {
      const response = await fetch(`${this.config.aggregator}/v1/system-info`);
      
      if (!response.ok) {
        throw new Error(`System info failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        currentEpoch: data.currentEpoch || data.current_epoch,
        epochStartTime: new Date(data.epochStartTime || data.epoch_start_time),
        epochDuration: data.epochDuration || data.epoch_duration,
        totalStorage: data.totalStorage || data.total_storage,
        availableStorage: data.availableStorage || data.available_storage,
        networkHealth: data.networkHealth || data.network_health || 'healthy',
        nodeCount: data.nodeCount || data.node_count || 0,
        averageLatency: data.averageLatency || data.average_latency || 0
      };
    } catch (error) {
      console.error('Walrus system info error:', error);
      throw error;
    }
  }

  async listBlobs(owner?: string): Promise<WalrusBlobInfo[]> {
    try {
      const url = new URL(`${this.config.aggregator}/v1/blobs`);
      if (owner) {
        url.searchParams.append('owner', owner);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`List blobs failed: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.blobs || []).map((blob: any) => ({
        id: blob.id,
        size: blob.size,
        uploadedAt: new Date(blob.uploadedAt || blob.uploaded_at),
        status: blob.status,
        epochs: blob.epochs,
        permanent: blob.permanent || false,
        deletable: blob.deletable || false,
        owner: blob.owner,
        attributes: blob.attributes
      }));
    } catch (error) {
      console.error('Walrus list blobs error:', error);
      throw error;
    }
  }

  async getBlobAttributes(blobId: string): Promise<Record<string, string>> {
    try {
      const response = await fetch(`${this.config.aggregator}/v1/attributes/${blobId}`);
      
      if (!response.ok) {
        throw new Error(`Get attributes failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.attributes || {};
    } catch (error) {
      console.error('Walrus get attributes error:', error);
      throw error;
    }
  }

  async setBlobAttributes(blobId: string, attributes: Record<string, string>): Promise<void> {
    try {
      const response = await fetch(`${this.config.publisher}/v1/attributes/${blobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ attributes })
      });

      if (!response.ok) {
        throw new Error(`Set attributes failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Walrus set attributes error:', error);
      throw error;
    }
  }

  async deleteBlobAttributes(blobId: string, keys: string[]): Promise<void> {
    try {
      const response = await fetch(`${this.config.publisher}/v1/attributes/${blobId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keys })
      });

      if (!response.ok) {
        throw new Error(`Delete attributes failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Walrus delete attributes error:', error);
      throw error;
    }
  }
}