import type {
  SealClient,
  SealEncryptionPolicy,
  SealEncryptionResult,
  SealSessionKey,
  SealKeyServerInfo,
  SealDecryptionRequest,
  SealDecryptionResponse,
  SealConfig
} from '../types/seal';

export class SealService implements SealClient {
  private config: SealConfig;
  private sealClient: any; // SealClient from @mysten/seal
  private suiClient: any; // SuiClient from @mysten/sui
  private signPersonalMessage?: (message: string | Uint8Array) => Promise<{ signature: string; bytes: string }>;

  constructor(config: SealConfig, suiClient?: any, signPersonalMessage?: (message: string | Uint8Array) => Promise<{ signature: string; bytes: string }>) {
    this.config = config;
    this.suiClient = suiClient;
    this.signPersonalMessage = signPersonalMessage;
    // Don't initialize immediately - wait for explicit initialization
  }

  async initializeSealClient() {
    try {
      console.log('Starting Seal SDK initialization...');
      
      // Dynamically import Seal SDK to avoid build issues
      const { SealClient: SealSDK } = await import('@mysten/seal');
      const { SuiClient } = await import('@mysten/sui/client');
      const { getFullnodeUrl } = await import('@mysten/sui/client');

      console.log('Seal SDK modules imported successfully');

      // Initialize Sui client if not provided
      if (!this.suiClient) {
        const network = this.config.keyServers[0]?.url.includes('testnet') ? 'testnet' : 'mainnet';
        console.log(`Initializing Sui client for network: ${network}`);
        this.suiClient = new SuiClient({ url: getFullnodeUrl(network) });
        console.log(`Sui client initialized with URL: ${getFullnodeUrl(network)}`);
      } else {
        console.log('Using provided Sui client');
      }

      // Use the exact server object IDs from Seal documentation (testnet)
      const serverObjectIds = [
        "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75", 
        "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8"
      ];

      console.log('Using verified Seal key server object IDs:', serverObjectIds);

      // Initialize Seal SDK client with exact format from docs
      console.log('Creating Seal SDK client...');
      this.sealClient = new SealSDK({
        suiClient: this.suiClient,
        serverConfigs: serverObjectIds.map((id) => ({
          objectId: id,
          weight: 1,
        })),
        verifyKeyServers: false // Set to false for performance as recommended
      });

      console.log('Seal SDK client initialized successfully');
      
      // Test the connection with a simple operation
      try {
        console.log('Testing Seal SDK connection...');
        const publicKeys = await this.sealClient.getPublicKeys(serverObjectIds);
        console.log(`Seal SDK connection test successful, retrieved ${publicKeys?.length || 0} public keys`);
      } catch (testError) {
        console.warn('Seal SDK connection test failed, but client may still work:', testError);
      }
      
    } catch (error) {
      console.error('Failed to initialize Seal SDK - detailed error info:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        configInfo: {
          keyServersCount: this.config.keyServers?.length || 0,
          keyServers: this.config.keyServers?.map(ks => ({ id: ks.id, url: ks.url })) || [],
          defaultThreshold: this.config.defaultThreshold
        },
        suiClientExists: !!this.suiClient
      });
      throw new Error(`Seal SDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this.sealClient) {
      await this.initializeSealClient();
    }
  }

  async encrypt(data: Uint8Array, policy: SealEncryptionPolicy): Promise<SealEncryptionResult> {
    await this.ensureInitialized();
    
    try {
      console.log('=== SEAL ENCRYPTION DEBUG START ===');
      console.log('Starting encryption process...', {
        inputDataLength: data.length,
        inputDataType: typeof data,
        inputDataConstructor: data?.constructor?.name,
        inputDataPreview: Array.from(data.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '),
        policyInfo: {
          id: policy.id,
          packageId: policy.packageId,
          threshold: policy.threshold,
          policyType: policy.policyType,
          keyServersCount: policy.keyServers?.length
        }
      });
      
      // Validate inputs with detailed logging
      if (!policy.packageId || typeof policy.packageId !== 'string') {
        console.error('Invalid packageId provided:', { packageId: policy.packageId, type: typeof policy.packageId });
        throw new Error(`Invalid packageId: ${policy.packageId}`);
      }
      if (!policy.id || typeof policy.id !== 'string') {
        console.error('Invalid policy id provided:', { id: policy.id, type: typeof policy.id });
        throw new Error(`Invalid policy id: ${policy.id}`);
      }
      if (!data || data.length === 0) {
        console.error('Invalid data provided:', { dataExists: !!data, dataLength: data?.length });
        throw new Error('Data to encrypt cannot be empty');
      }

      // Ensure proper hex format for packageId (keep as string for Seal SDK)
      const normalizedPackageId = policy.packageId.startsWith('0x') ? policy.packageId : `0x${policy.packageId}`;
      // For policy ID: Seal SDK expects it WITHOUT 0x prefix for scalar operations
      const normalizedId = policy.id.startsWith('0x') ? policy.id.slice(2) : policy.id;

      console.log('Encryption parameters validated and normalized:', {
        originalPackageId: policy.packageId,
        normalizedPackageId: normalizedPackageId,
        originalId: policy.id,
        normalizedId: normalizedId, // This should NOT have 0x prefix
        threshold: policy.threshold,
        dataLength: data.length,
        policyType: policy.policyType || 'unknown'
      });
      
      console.log('Calling Seal SDK encrypt with parameters:', {
        threshold: policy.threshold,
        packageId: normalizedPackageId,
        id: normalizedId,
        dataLength: data.length,
        sealClientExists: !!this.sealClient,
        sealClientType: typeof this.sealClient
      });
      
      // Call Seal SDK encrypt - packageId keeps 0x, but id should NOT have 0x
      const encryptionResult = await this.sealClient.encrypt({
        threshold: policy.threshold,
        packageId: normalizedPackageId, // Keep 0x prefix for package ID
        id: normalizedId, // NO 0x prefix for policy ID - this is what was causing "Scalar out of range"
        data
      });

      console.log('Encryption SDK call completed, analyzing result:', {
        resultExists: !!encryptionResult,
        resultType: typeof encryptionResult,
        resultKeys: Object.keys(encryptionResult || {}),
        encryptedObjectExists: !!encryptionResult?.encryptedObject,
        encryptedObjectType: typeof encryptionResult?.encryptedObject,
        encryptedObjectLength: encryptionResult?.encryptedObject?.length,
        encryptedObjectConstructor: encryptionResult?.encryptedObject?.constructor?.name,
        encryptedObjectPreview: encryptionResult?.encryptedObject 
          ? Array.from(encryptionResult.encryptedObject.slice(0, 20)).map((b: any) => b.toString(16).padStart(2, '0')).join(' ')
          : 'N/A',
        keyExists: !!encryptionResult?.key,
        keyType: typeof encryptionResult?.key,
        keyValue: encryptionResult?.key?.toString?.()
      });

      console.log('Creating session key for encryption result...');
      
      // Create session key for this encryption
      const sessionKey = await this.createSessionKeyInternal(normalizedPackageId, 10); // 10 minutes TTL
      
      console.log('Session key created, building final result...');

      const result = {
        encryptedData: new Uint8Array(encryptionResult.encryptedObject),
        sessionKey,
        id: policy.id, // Return original ID format
        packageId: normalizedPackageId,
        threshold: policy.threshold,
        backupKey: encryptionResult.key?.toString() // Symmetric key for disaster recovery
      };

      console.log('Encryption result built:', {
        encryptedDataLength: result.encryptedData.length,
        encryptedDataType: typeof result.encryptedData,
        encryptedDataConstructor: result.encryptedData?.constructor?.name,
        encryptedDataPreview: Array.from(result.encryptedData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '),
        sessionKeyId: result.sessionKey.id,
        sessionKeyExists: !!result.sessionKey.key,
        id: result.id,
        packageId: result.packageId,
        threshold: result.threshold,
        hasBackupKey: !!result.backupKey,
        backupKeyLength: result.backupKey?.length
      });
      
      console.log('=== SEAL ENCRYPTION DEBUG END ===');

      return result;
    } catch (error) {
      console.log('=== SEAL ENCRYPTION ERROR DEBUG ===');
      console.error('Seal encryption error details:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        errorName: error instanceof Error ? error.name : 'Unknown',
        policyInfo: {
          packageId: policy.packageId,
          id: policy.id,
          threshold: policy.threshold,
          policyType: policy.policyType
        },
        inputData: {
          dataLength: data?.length || 0,
          dataType: typeof data,
          dataConstructor: data?.constructor?.name
        },
        sealClientState: {
          exists: !!this.sealClient,
          type: typeof this.sealClient
        }
      });
      console.log('=== SEAL ENCRYPTION ERROR DEBUG END ===');
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async decrypt(encryptedData: Uint8Array, sessionKey: SealSessionKey, txBytes?: Uint8Array): Promise<Uint8Array> {
    await this.ensureInitialized();
    
    try {
      console.log('=== SEAL DECRYPTION DEBUG START ===');
      console.log('Starting decryption process...', {
        encryptedDataLength: encryptedData.length,
        encryptedDataPreview: Array.from(encryptedData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '),
        sessionKeyId: sessionKey.id,
        sessionKeyActive: sessionKey.isActive,
        sessionKeyAddress: sessionKey.address,
        sessionKeyPackageId: sessionKey.packageId,
        hasTxBytes: !!txBytes,
        txBytesLength: txBytes?.length,
        txBytesPreview: txBytes ? Array.from(txBytes.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ') : 'N/A'
      });

      if (!txBytes) {
        throw new Error('Transaction bytes required for decryption - must call seal_approve function');
      }

      // Validate session key has required properties
      if (!sessionKey.key) {
        throw new Error('Session key object is missing key property');
      }

      console.log('Session key object validation:', {
        hasKey: !!sessionKey.key,
        keyType: typeof sessionKey.key,
        keyConstructor: sessionKey.key?.constructor?.name,
        availableMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(sessionKey.key || {})).filter(name => typeof sessionKey.key[name] === 'function')
      });

      // Check if session key has a signature set - with detailed logging
      try {
        console.log('Checking session key signature capabilities...');
        
        // Try to get the personal message to check if signature functionality is available
        const personalMessage = sessionKey.key.getPersonalMessage();
        console.log('Personal message retrieved:', {
          hasPersonalMessage: !!personalMessage,
          messageType: typeof personalMessage,
          messageLength: personalMessage?.length || 0,
          messagePreview: typeof personalMessage === 'string' 
            ? personalMessage.slice(0, 50) + '...'
            : personalMessage instanceof Uint8Array 
              ? Array.from(personalMessage.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')
              : 'Unknown type',
          hasSetSignatureMethod: typeof sessionKey.key.setPersonalMessageSignature === 'function'
        });
        
        // Check if session key needs a signature and use wallet to sign
        if (!this.signPersonalMessage) {
          console.warn('No wallet signing function available - session key may not work for decryption');
        } else {
          try {
            console.log('Requesting wallet signature for session key during decryption...');
            
            // Request signature from wallet
            const signResult = await this.signPersonalMessage(personalMessage);
            
            console.log('Wallet signature received for decryption:', {
              hasSignature: !!signResult.signature,
              signatureLength: signResult.signature?.length
            });
            
            // Clean up signature format - remove 0x prefix if present
            let cleanSignature = signResult.signature;
            if (cleanSignature.startsWith('0x')) {
              cleanSignature = cleanSignature.slice(2);
            }
            
            console.log('Setting wallet signature on session key for decryption');
            sessionKey.key.setPersonalMessageSignature(cleanSignature);
            console.log('Wallet signature set successfully for decryption');
            
          } catch (setSignatureError) {
            console.error('Failed to set signature during decryption - detailed error:', {
              error: setSignatureError,
              errorMessage: setSignatureError instanceof Error ? setSignatureError.message : 'Unknown error',
              errorStack: setSignatureError instanceof Error ? setSignatureError.stack : 'No stack trace',
              errorName: setSignatureError instanceof Error ? setSignatureError.name : 'Unknown'
            });
            // Don't throw here - let's continue and see if the existing signature works
            console.warn('Continuing with existing session key signature...');
          }
        }
      } catch (signatureCheckError) {
        console.error('Session key signature check failed - detailed error:', {
          error: signatureCheckError,
          errorMessage: signatureCheckError instanceof Error ? signatureCheckError.message : 'Unknown error',
          errorStack: signatureCheckError instanceof Error ? signatureCheckError.stack : 'No stack trace',
          errorName: signatureCheckError instanceof Error ? signatureCheckError.name : 'Unknown'
        });
        // Don't throw here, continue with decryption attempt
        console.warn('Continuing decryption attempt without signature validation...');
      }

      // Final validation before calling Seal SDK
      console.log('Pre-decryption validation:', {
        sealClientExists: !!this.sealClient,
        sealClientType: typeof this.sealClient,
        encryptedDataValid: encryptedData instanceof Uint8Array && encryptedData.length > 0,
        sessionKeyValid: !!sessionKey.key,
        txBytesValid: txBytes instanceof Uint8Array && txBytes.length > 0
      });

      console.log('Calling Seal SDK decrypt with parameters:', {
        dataLength: encryptedData.length,
        sessionKeyId: sessionKey.id,
        txBytesLength: txBytes.length
      });

      // Add detailed pre-SDK call validation
      console.log('Pre-SDK decrypt call - detailed data analysis:', {
        encryptedData: {
          length: encryptedData.length,
          type: typeof encryptedData,
          constructor: encryptedData?.constructor?.name,
          isUint8Array: encryptedData instanceof Uint8Array,
          buffer: encryptedData?.buffer?.byteLength,
          byteOffset: encryptedData?.byteOffset,
          preview: Array.from(encryptedData.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ')
        },
        sessionKey: {
          exists: !!sessionKey.key,
          type: typeof sessionKey.key,
          constructor: sessionKey.key?.constructor?.name,
          hasGetPersonalMessage: typeof sessionKey.key?.getPersonalMessage === 'function',
          hasSetSignature: typeof sessionKey.key?.setPersonalMessageSignature === 'function'
        },
        txBytes: {
          length: txBytes.length,
          type: typeof txBytes,
          constructor: txBytes?.constructor?.name,
          isUint8Array: txBytes instanceof Uint8Array,
          buffer: txBytes?.buffer?.byteLength,
          byteOffset: txBytes?.byteOffset,
          preview: Array.from(txBytes.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ')
        }
      });

      console.log('About to call sealClient.decrypt...');
      
      let decryptedData;
      try {
        decryptedData = await this.sealClient.decrypt({
          data: encryptedData,
          sessionKey: sessionKey.key,
          txBytes
        });
        console.log('Seal SDK decrypt call completed successfully');
      } catch (sdkError) {
        console.error('=== SEAL SDK DECRYPT CALL FAILED ===');
        console.error('SDK Error details:', {
          error: sdkError,
          errorMessage: sdkError instanceof Error ? sdkError.message : 'Unknown SDK error',
          errorStack: sdkError instanceof Error ? sdkError.stack : 'No stack trace',
          errorName: sdkError instanceof Error ? sdkError.name : 'Unknown',
          errorConstructor: sdkError?.constructor?.name,
          isRangeError: sdkError instanceof RangeError,
          isTypeError: sdkError instanceof TypeError,
          errorProperties: Object.getOwnPropertyNames(sdkError || {})
        });
        
        // Check if this is the "Invalid typed array length: 32" error specifically
        if (sdkError instanceof RangeError && sdkError.message.includes('Invalid typed array length')) {
          console.error('FOUND THE TYPED ARRAY LENGTH ERROR!', {
            fullMessage: sdkError.message,
            stackTrace: sdkError.stack,
            possibleCause: 'Data corruption or invalid buffer handling in Seal SDK'
          });
        }
        
        console.error('=== SEAL SDK DECRYPT CALL FAILED END ===');
        throw sdkError; // Re-throw the original error
      }

      console.log('Decryption completed successfully', {
        decryptedDataLength: decryptedData.length,
        decryptedDataType: typeof decryptedData,
        decryptedDataConstructor: decryptedData?.constructor?.name,
        decryptedDataPreview: decryptedData instanceof Uint8Array 
          ? Array.from(decryptedData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')
          : 'Not Uint8Array'
      });
      console.log('=== SEAL DECRYPTION DEBUG END ===');

      return decryptedData;
    } catch (error) {
      console.log('=== SEAL DECRYPTION ERROR DEBUG ===');
      console.error('Seal decryption error details:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorConstructor: error?.constructor?.name,
        sessionKeyInfo: {
          id: sessionKey.id,
          isActive: sessionKey.isActive,
          hasKey: !!sessionKey.key,
          address: sessionKey.address,
          packageId: sessionKey.packageId,
          ttl: sessionKey.ttl,
          createdAt: sessionKey.createdAt,
          expiresAt: sessionKey.expiresAt
        },
        inputData: {
          encryptedDataLength: encryptedData.length,
          encryptedDataConstructor: encryptedData?.constructor?.name,
          hasTxBytes: !!txBytes,
          txBytesLength: txBytes?.length,
          txBytesConstructor: txBytes?.constructor?.name
        },
        sealClientState: {
          exists: !!this.sealClient,
          type: typeof this.sealClient
        }
      });
      console.log('=== SEAL DECRYPTION ERROR DEBUG END ===');
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createSessionKey(packageId: string, ttlMin: number, userAddress?: string): Promise<SealSessionKey> {
    return this.createSessionKeyInternal(packageId, ttlMin, userAddress);
  }

  private async createSessionKeyInternal(packageId: string, ttlMin: number, userAddress?: string): Promise<SealSessionKey> {
    await this.ensureInitialized();
    
    try {
      console.log('=== SESSION KEY CREATION DEBUG START ===');
      console.log('Starting session key creation...', {
        packageId,
        ttlMin,
        userAddress,
        suiClientExists: !!this.suiClient,
        sealClientExists: !!this.sealClient
      });
      
      const { SessionKey } = await import('@mysten/seal');

      // Use provided address or get from current wallet connection
      const address = userAddress || '0xbf7d5d6172973a8ad84a8f6f09fbdf6499bdac17ca6a396fd5e62a5b76f4dbcf'; // Fallback address for development
      
      // Ensure proper hex format for packageId (keep as string, don't convert with fromHEX)
      const normalizedPackageId = packageId.startsWith('0x') ? packageId : `0x${packageId}`;

      console.log('Creating session key with detailed params:', {
        address,
        packageId: normalizedPackageId,
        ttlMin,
        suiClientExists: !!this.suiClient,
        sessionKeyModule: !!SessionKey,
        sessionKeyModuleType: typeof SessionKey
      });

      const sessionKey = await SessionKey.create({
        address,
        packageId: normalizedPackageId, // Keep as string - TS types suggest this should be string
        ttlMin,
        suiClient: this.suiClient
      });

      console.log('Session key created successfully, analyzing object:', {
        sessionKeyExists: !!sessionKey,
        sessionKeyType: typeof sessionKey,
        sessionKeyConstructor: sessionKey?.constructor?.name,
        availableMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(sessionKey || {})).filter(name => typeof (sessionKey as any)[name] === 'function'),
        availableProperties: Object.getOwnPropertyNames(sessionKey || {}).filter(name => typeof (sessionKey as any)[name] !== 'function')
      });

      console.log('Attempting to sign session key with wallet...');

      // Use proper wallet signing for the session key
      try {
        console.log('Getting personal message from session key...');
        const personalMessage = sessionKey.getPersonalMessage();
        
        // Handle both string and Uint8Array cases
        let messagePreview = 'Unknown message type';
        if (typeof personalMessage === 'string') {
          messagePreview = (personalMessage as string).slice(0, 100) + '...';
        } else if (personalMessage instanceof Uint8Array) {
          messagePreview = 'Binary message';
        }
        
        console.log('Personal message analysis:', {
          messageExists: !!personalMessage,
          messageType: typeof personalMessage,
          messageLength: personalMessage?.length || 0,
          messageConstructor: personalMessage?.constructor?.name,
          messagePreview
        });

        if (!this.signPersonalMessage) {
          throw new Error('Wallet signing function not available - please ensure wallet is connected');
        }
        
        console.log('Requesting wallet signature for session key...');
        
        // Request signature from wallet
        const signResult = await this.signPersonalMessage(personalMessage);
        
        console.log('Wallet signature received:', {
          hasSignature: !!signResult.signature,
          signatureLength: signResult.signature?.length,
          signaturePreview: signResult.signature?.slice(0, 40) + '...',
          hasBytes: !!signResult.bytes,
          bytesLength: signResult.bytes?.length
        });
        
        // Clean up signature format - remove 0x prefix if present
        let cleanSignature = signResult.signature;
        if (cleanSignature.startsWith('0x')) {
          cleanSignature = cleanSignature.slice(2);
        }
        
        console.log('Setting wallet signature on session key:', {
          originalSignature: signResult.signature.slice(0, 40) + '...',
          cleanSignature: cleanSignature.slice(0, 40) + '...',
          cleanSignatureLength: cleanSignature.length
        });
        
        sessionKey.setPersonalMessageSignature(cleanSignature);
        console.log('Wallet signature set successfully on session key');
        
      } catch (signError) {
        console.error('Session key wallet signing failed - detailed error:', {
          error: signError,
          errorMessage: signError instanceof Error ? signError.message : 'Unknown signing error',
          errorStack: signError instanceof Error ? signError.stack : 'No stack trace',
          errorName: signError instanceof Error ? signError.name : 'Unknown',
          hasSignFunction: !!this.signPersonalMessage
        });
        
        // If wallet signing fails, throw error - don't continue with invalid signature
        throw new Error(`Session key signing failed: ${signError instanceof Error ? signError.message : 'Unknown error'}`);
      }

      const sessionKeyResult = {
        id: `session_${Date.now()}`,
        key: sessionKey,
        packageId: normalizedPackageId,
        address,
        ttl: ttlMin,
        createdAt: Date.now(),
        expiresAt: Date.now() + (ttlMin * 60 * 1000),
        isActive: true // Set to true for development
      };

      console.log('Session key creation completed:', {
        id: sessionKeyResult.id,
        packageId: sessionKeyResult.packageId,
        address: sessionKeyResult.address,
        ttl: sessionKeyResult.ttl,
        expiresAt: new Date(sessionKeyResult.expiresAt).toISOString(),
        hasSetSignatureMethod: typeof sessionKey.setPersonalMessageSignature === 'function',
        resultObjectKeys: Object.keys(sessionKeyResult),
        sessionKeyObjectKeys: Object.keys(sessionKey || {})
      });
      console.log('=== SESSION KEY CREATION DEBUG END ===');

      return sessionKeyResult;
    } catch (error) {
      console.log('=== SESSION KEY CREATION ERROR DEBUG ===');
      console.error('Seal session key creation error - detailed info:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        errorName: error instanceof Error ? error.name : 'Unknown',
        inputParams: {
          packageId,
          normalizedPackageId: packageId.startsWith('0x') ? packageId : `0x${packageId}`,
          ttlMin,
          userAddress,
          fallbackAddress: userAddress || '0xbf7d5d6172973a8ad84a8f6f09fbdf6499bdac17ca6a396fd5e62a5b76f4dbcf'
        },
        clientState: {
          sealClientExists: !!this.sealClient,
          suiClientExists: !!this.suiClient
        }
      });
      console.log('=== SESSION KEY CREATION ERROR DEBUG END ===');
      throw new Error(`Session key creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async signSessionKey(sessionKey: SealSessionKey, signature: string): Promise<void> {
    try {
      console.log('Signing session key...', {
        sessionKeyId: sessionKey.id,
        signatureLength: signature.length,
        hasSessionKeyObject: !!sessionKey.key
      });

      if (!sessionKey.key || typeof sessionKey.key.setPersonalMessageSignature !== 'function') {
        throw new Error('Invalid session key object - missing setPersonalMessageSignature method');
      }

      // Ensure signature is in proper hex format (128 characters for 64 bytes)
      let normalizedSignature = signature;
      if (signature.startsWith('0x')) {
        normalizedSignature = signature.slice(2);
      }
      
      if (normalizedSignature.length !== 128) {
        console.warn('Signature length is not 128 characters, padding or truncating...', {
          originalLength: normalizedSignature.length,
          signature: normalizedSignature.slice(0, 32) + '...'
        });
        
        // Pad with zeros or truncate to 128 characters
        normalizedSignature = normalizedSignature.padEnd(128, '0').slice(0, 128);
      }

      sessionKey.key.setPersonalMessageSignature(normalizedSignature);
      sessionKey.isActive = true;
      
      console.log('Session key signed successfully');
    } catch (error) {
      console.error('Session key signing error:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        sessionKeyInfo: {
          id: sessionKey.id,
          hasKey: !!sessionKey.key,
          isActive: sessionKey.isActive
        }
      });
      throw new Error(`Session key signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyKeyServers(serverIds: string[]): Promise<boolean> {
    try {
      const verificationPromises = serverIds.map(async (serverId) => {
        const keyServer = this.config.keyServers.find(ks => ks.id === serverId);
        if (!keyServer) return false;

        try {
          const response = await fetch(`${keyServer.url}/v1/service?service_id=${serverId}`, {
            method: 'GET',
            headers: {
              'Client-Sdk-Version': '1.0.0',
              'Client-Sdk-Type': 'typescript'
            }
          });

          if (!response.ok) return false;

          // Verify the response contains the expected service ID
          const data = await response.json();
          return data.objectId === serverId;
        } catch {
          return false;
        }
      });

      const results = await Promise.all(verificationPromises);
      return results.every(result => result);
    } catch (error) {
      console.error('Seal key server verification error:', error);
      return false;
    }
  }

  async fetchKeys(ids: string[], txBytes: Uint8Array, sessionKey: SealSessionKey, threshold?: number): Promise<Map<string, string>> {
    await this.ensureInitialized();
    
    try {
      const fetchThreshold = threshold || this.config.defaultThreshold;
      
      const keys = await this.sealClient.fetchKeys({
        ids,
        txBytes,
        sessionKey: sessionKey.key,
        threshold: fetchThreshold
      });

      // Convert to Map format expected by the interface
      const keyMap = new Map<string, string>();
      if (keys) {
        Object.entries(keys).forEach(([id, key]) => {
          keyMap.set(id, key as string);
        });
      }

      return keyMap;
    } catch (error) {
      console.error('Seal fetch keys error:', error);
      throw new Error(`Key fetching failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDerivedKeys(id: string, txBytes: Uint8Array, sessionKey: SealSessionKey, threshold?: number): Promise<Map<string, any>> {
    await this.ensureInitialized();
    
    try {
      const fetchThreshold = threshold || this.config.defaultThreshold;
      
      const derivedKeys = await this.sealClient.getDerivedKeys({
        id,
        txBytes,
        sessionKey: sessionKey.key,
        threshold: fetchThreshold
      });

      return new Map(Object.entries(derivedKeys || {}));
    } catch (error) {
      console.error('Seal get derived keys error:', error);
      throw new Error(`Derived key retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPublicKeys(serverObjectIds: string[]): Promise<any[]> {
    await this.ensureInitialized();
    
    try {
      return await this.sealClient.getPublicKeys(serverObjectIds);
    } catch (error) {
      console.error('Seal get public keys error:', error);
      throw new Error(`Public key retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Move contract integration methods
  async createAllowlist(members: string[]): Promise<string> {
    throw new Error('Allowlist management should be done via Move contracts on Sui blockchain - use Sui transaction building');
  }

  async addToAllowlist(allowlistId: string, member: string): Promise<void> {
    throw new Error('Allowlist management should be done via Move contracts on Sui blockchain - use Sui transaction building');
  }

  async removeFromAllowlist(allowlistId: string, member: string): Promise<void> {
    throw new Error('Allowlist management should be done via Move contracts on Sui blockchain - use Sui transaction building');
  }

  async checkAllowlistMembership(allowlistId: string, member: string): Promise<boolean> {
    throw new Error('Allowlist membership should be checked via Move contracts on Sui blockchain - use Sui object queries');
  }

  // Utility methods
  async parseEncryptedObject(encryptedBytes: Uint8Array): Promise<any> {
    try {
      const { EncryptedObject } = await import('@mysten/seal');
      return EncryptedObject.parse(encryptedBytes);
    } catch (error) {
      console.error('Failed to parse encrypted object:', error);
      throw new Error(`Encrypted object parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async buildSealApproveTransaction(packageId: string, moduleName: string, functionName: string, id: string, ...args: unknown[]): Promise<Uint8Array> {
    try {
      const { Transaction } = await import('@mysten/sui/transactions');
      const { fromHEX } = await import('@mysten/sui/utils');

      // Ensure proper hex format for packageId (needs 0x prefix)
      const normalizedPackageId = packageId.startsWith('0x') ? packageId : `0x${packageId}`;
      // For policy ID: remove 0x prefix if present, as we need raw hex for fromHEX conversion
      const normalizedId = id.startsWith('0x') ? id.slice(2) : id;

      console.log('Building Seal approve transaction:', {
        packageId: normalizedPackageId,
        id: normalizedId,
        moduleName,
        functionName,
        argsLength: args.length
      });

      const tx = new Transaction();
      tx.moveCall({
        target: `${normalizedPackageId}::${moduleName}::${functionName}`,
        arguments: [
          tx.pure.vector('u8', fromHEX(normalizedId)), // Convert hex string to bytes
          ...(args as any[])
        ]
      });

      return await tx.build({ client: this.suiClient, onlyTransactionKind: true });
    } catch (error) {
      console.error('Failed to build seal approve transaction:', error);
      throw new Error(`Transaction building failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}