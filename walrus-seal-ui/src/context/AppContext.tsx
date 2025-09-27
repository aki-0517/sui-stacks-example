import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { AppState, NetworkState, WalletState, UIState } from '../types/common';
import { getNetworkConfig } from '../utils/config';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

type AppAction =
  | { type: 'SET_WALLET'; payload: WalletState }
  | { type: 'SET_NETWORK'; payload: 'testnet' | 'mainnet' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'ADD_BLOB'; payload: any }
  | { type: 'UPDATE_BLOB'; payload: { id: string; data: any } }
  | { type: 'REMOVE_BLOB'; payload: string }
  | { type: 'SET_SYSTEM_INFO'; payload: any }
  | { type: 'ADD_SESSION_KEY'; payload: any }
  | { type: 'REMOVE_SESSION_KEY'; payload: string };

const initialState: AppState = {
  wallet: {
    account: null,
    connected: false,
    balance: 0
  },
  network: {
    current: 'testnet',
    walrusConfig: getNetworkConfig('testnet').walrus,
    sealConfig: getNetworkConfig('testnet').seal
  },
  walrus: {
    blobs: [],
    quilts: [],
    systemInfo: null
  },
  seal: {
    keyServers: getNetworkConfig('testnet').seal.keyServers,
    sessionKeys: new Map(),
    policies: []
  },
  ui: {
    loading: false,
    error: null,
    theme: 'light'
  }
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_WALLET':
      return {
        ...state,
        wallet: action.payload
      };
    
    case 'SET_NETWORK':
      const networkConfig = getNetworkConfig(action.payload);
      return {
        ...state,
        network: {
          current: action.payload,
          walrusConfig: networkConfig.walrus,
          sealConfig: networkConfig.seal
        },
        seal: {
          ...state.seal,
          keyServers: networkConfig.seal.keyServers
        }
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload
        }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          error: action.payload
        }
      };
    
    case 'SET_THEME':
      return {
        ...state,
        ui: {
          ...state.ui,
          theme: action.payload
        }
      };
    
    case 'ADD_BLOB':
      return {
        ...state,
        walrus: {
          ...state.walrus,
          blobs: [...state.walrus.blobs, action.payload]
        }
      };
    
    case 'UPDATE_BLOB':
      return {
        ...state,
        walrus: {
          ...state.walrus,
          blobs: state.walrus.blobs.map(blob =>
            blob.id === action.payload.id ? { ...blob, ...action.payload.data } : blob
          )
        }
      };
    
    case 'REMOVE_BLOB':
      return {
        ...state,
        walrus: {
          ...state.walrus,
          blobs: state.walrus.blobs.filter(blob => blob.id !== action.payload)
        }
      };
    
    case 'SET_SYSTEM_INFO':
      return {
        ...state,
        walrus: {
          ...state.walrus,
          systemInfo: action.payload
        }
      };
    
    case 'ADD_SESSION_KEY':
      const newSessionKeys = new Map(state.seal.sessionKeys);
      newSessionKeys.set(action.payload.id, action.payload);
      return {
        ...state,
        seal: {
          ...state.seal,
          sessionKeys: newSessionKeys
        }
      };
    
    case 'REMOVE_SESSION_KEY':
      const updatedSessionKeys = new Map(state.seal.sessionKeys);
      updatedSessionKeys.delete(action.payload);
      return {
        ...state,
        seal: {
          ...state.seal,
          sessionKeys: updatedSessionKeys
        }
      };
    
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}