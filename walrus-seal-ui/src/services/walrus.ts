import type { 
  WalrusClient, 
  WalrusStoreOptions, 
  WalrusStoreResult, 
  WalrusBlobStatus,
  WalrusBlobInfo,
  WalrusSystemInfo,
  QuiltFile,
  WalrusQuiltResult,
  WalrusConfig,
  AvailabilityCertificate
} from '../types/walrus';

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

export class WalrusService implements WalrusClient {
  private config: WalrusConfig;
  private suiClient: SuiClient;
  private signTransaction: (tx: Transaction) => Promise<any>;
  private currentAddress: string;

  constructor(
    config: WalrusConfig, 
    suiClient: SuiClient, 
    signTransaction: (tx: Transaction) => Promise<any>,
    currentAddress: string
  ) {
    console.log('WalrusService constructor called with:', {
      hasConfig: !!config,
      configKeys: config ? Object.keys(config) : [],
      hasSuiClient: !!suiClient,
      hasSignTransaction: !!signTransaction,
      hasAddress: !!currentAddress,
      address: currentAddress
    });
    
    this.config = config;
    this.suiClient = suiClient;
    this.signTransaction = signTransaction;
    this.currentAddress = currentAddress;
    
    console.log('WalrusService initialized successfully');
  }

  async store(files: File[], options: WalrusStoreOptions): Promise<WalrusStoreResult> {
    try {
      console.log('WalrusService.store called with:', {
        filesCount: files.length,
        options: options,
        hasConfig: !!this.config,
        hasSuiClient: !!this.suiClient,
        hasAddress: !!this.currentAddress
      });
      
      if (files.length === 0) {
        throw new Error('No files provided');
      }
      
      const file = files[0];
      const blobData = new Uint8Array(await file.arrayBuffer());
      
      // Step 1: Purchase storage epochs
      const storage = await this.purchaseStorage(options.epochs, blobData.length);
      
      // Step 2: Upload blob and get availability certificate
      const certificate = await this.uploadBlob(blobData);
      
      // Step 3: Register blob on Sui blockchain
      const blobObjectId = await this.registerBlob(certificate.blobId, storage);
      
      // Step 4: Certify blob with availability certificate
      await this.certifyBlob(certificate);
      
      return {
        blobId: certificate.blobId,
        suiObjectId: blobObjectId,
        epochs: options.epochs,
        cost: storage.cost,
        gasUsed: storage.gasUsed
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
      // Check blob status on Sui blockchain
      const blobObjects = await this.suiClient.getOwnedObjects({
        owner: this.currentAddress,
        filter: {
          StructType: `${this.config.walrusPackageId}::blob::Blob`
        }
      });
      
      const blobObject = blobObjects.data.find(obj => {
        // Check if this blob object matches our blob ID
        const content = obj.data?.content;
        if (content && 'fields' in content && content.fields) {
          return (content.fields as any).blob_id === blobId;
        }
        return false;
      });
      
      if (!blobObject) {
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
      }
      
      const response = await fetch(`${this.config.aggregator}/v1/blobs/${blobId}`, {
        method: 'HEAD'
      });
      
      const content = blobObject.data?.content;
      let epochs = 0;
      if (content && 'fields' in content && content.fields) {
        epochs = (content.fields as any).storage?.epochs || 0;
      }

      return {
        id: blobId,
        status: response.ok ? 'stored' : 'not_found',
        epochs,
        expiry: undefined,
        size: parseInt(response.headers.get('content-length') || '0'),
        confirmed: true,
        availability: response.ok ? 1.0 : 0,
        mimeType: response.headers.get('content-type') || 'application/octet-stream'
      };
    } catch (error) {
      console.error('Walrus status error:', error);
      throw error;
    }
  }

  async extend(objectId: string, epochs: number): Promise<void> {
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${this.config.walrusPackageId}::blob::extend_storage_epochs`,
        arguments: [
          tx.object(objectId),
          tx.pure.u32(epochs)
        ]
      });
      
      await this.signTransaction(tx);
    } catch (error) {
      console.error('Walrus extend error:', error);
      throw error;
    }
  }

  async delete(blobId: string): Promise<void> {
    try {
      // Find the blob object on Sui
      const blobObjects = await this.suiClient.getOwnedObjects({
        owner: this.currentAddress,
        filter: {
          StructType: `${this.config.walrusPackageId}::blob::Blob`
        }
      });
      
      const blobObject = blobObjects.data.find(obj => {
        const content = obj.data?.content;
        if (content && 'fields' in content && content.fields) {
          return (content.fields as any).blob_id === blobId;
        }
        return false;
      });
      
      if (!blobObject) {
        throw new Error(`Blob object not found for blob ID: ${blobId}`);
      }
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${this.config.walrusPackageId}::blob::delete`,
        arguments: [tx.object(blobObject.data!.objectId)]
      });
      
      await this.signTransaction(tx);
    } catch (error) {
      console.error('Walrus delete error:', error);
      throw error;
    }
  }

  private async purchaseStorage(epochs: number, size: number): Promise<{ objectId: string; cost: number; gasUsed: number }> {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.walrusPackageId}::storage::purchase`,
      arguments: [
        tx.pure.u32(epochs),
        tx.pure.u64(size)
      ]
    });
    
    const result = await this.signTransaction(tx);
    
    // Extract storage object from events
    const storageEvent = result.events?.find((e: any) => 
      e.type.includes('storage::StoragePurchased')
    );
    
    if (!storageEvent) {
      throw new Error('Storage purchase failed - no storage event found');
    }
    
    return {
      objectId: storageEvent.parsedJson?.storage_id,
      cost: parseInt(storageEvent.parsedJson?.cost || '0'),
      gasUsed: parseInt(result.effects?.gasUsed?.computationCost || '0')
    };
  }

  private async uploadBlob(data: Uint8Array): Promise<AvailabilityCertificate> {
    // Upload to Walrus storage nodes via publisher
    const response = await fetch(`${this.config.publisher}/v1/store`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: new Blob([data.buffer as ArrayBuffer])
    });
    
    if (!response.ok) {
      throw new Error(`Blob upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      blobId: result.blobId,
      epochNumber: result.epochNumber,
      nodes: result.nodes,
      signatures: result.signatures
    };
  }

  private async registerBlob(blobId: string, storage: { objectId: string }): Promise<string> {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.walrusPackageId}::blob::register`,
      arguments: [
        tx.pure.string(blobId),
        tx.object(storage.objectId)
      ]
    });
    
    const result = await this.signTransaction(tx);
    
    // Extract blob object ID from created objects
    const createdObject = result.effects?.created?.[0];
    if (!createdObject) {
      throw new Error('Blob registration failed - no object created');
    }
    
    return createdObject.reference.objectId;
  }

  private async certifyBlob(certificate: AvailabilityCertificate): Promise<void> {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.config.walrusPackageId}::blob::certify`,
      arguments: [
        tx.pure.string(certificate.blobId),
        tx.pure.u64(certificate.epochNumber),
        tx.pure.vector('address', certificate.nodes),
        tx.pure.vector('vector<u8>', certificate.signatures.map(sig => Array.from(sig).map(b => Number(b))))
      ]
    });
    
    await this.signTransaction(tx);
  }

  async storeQuilt(files: QuiltFile[], options: WalrusStoreOptions): Promise<WalrusQuiltResult> {
    throw new Error('Quilt functionality not implemented in proper Walrus protocol');
  }

  async readQuilt(quiltId: string, identifier: string): Promise<Blob> {
    throw new Error('Quilt functionality not implemented in proper Walrus protocol');
  }

  async systemInfo(): Promise<WalrusSystemInfo> {
    throw new Error('System info is only available via Walrus CLI, not in client implementation');
  }

  async listBlobs(owner?: string): Promise<WalrusBlobInfo[]> {
    try {
      const address = owner || this.currentAddress;
      
      const blobObjects = await this.suiClient.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${this.config.walrusPackageId}::blob::Blob`
        },
        options: {
          showContent: true
        }
      });
      
      return blobObjects.data.map(obj => {
        const content = obj.data?.content;
        let blobId = '';
        let size = 0;
        let epochs = 0;
        
        if (content && 'fields' in content && content.fields) {
          const fields = content.fields as any;
          blobId = fields.blob_id || '';
          size = fields.size || 0;
          epochs = fields.storage?.epochs || 0;
        }
        
        return {
          id: blobId,
          uploadedAt: new Date(),
          status: 'stored' as const,
          permanent: false,
          deletable: true,
          size,
          epochs,
          attributes: {}
        };
      });
    } catch (error) {
      console.error('Walrus list blobs error:', error);
      throw error;
    }
  }

  async getBlobAttributes(blobId: string): Promise<Record<string, string>> {
    throw new Error('Blob attributes functionality not implemented');
  }

  async setBlobAttributes(blobId: string, attributes: Record<string, string>): Promise<void> {
    throw new Error('Blob attributes functionality not implemented');
  }

  async deleteBlobAttributes(blobId: string, keys: string[]): Promise<void> {
    throw new Error('Blob attributes functionality not implemented');
  }
}