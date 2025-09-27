import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Theme } from '@radix-ui/themes';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getFullnodeUrl } from '@mysten/sui/client';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { Landing } from './pages/Landing';
import { Store } from './pages/Walrus/Store';
import { Encrypt } from './pages/Seal/Encrypt';
import { SecureStorage } from './pages/Integration/SecureStorage';
import { ROUTES } from './utils/constants';
import '@radix-ui/themes/styles.css';
import './styles/global.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={{
          testnet: { url: getFullnodeUrl('testnet') },
          mainnet: { url: getFullnodeUrl('mainnet') }
        }}
        defaultNetwork="testnet"
      >
        <WalletProvider autoConnect>
          <AppProvider>
            <Theme 
              appearance="light"
              accentColor="blue"
              grayColor="gray"
              radius="medium"
              scaling="100%"
            >
              <Router>
                <Routes>
                  <Route path="/" element={<AppLayout />}>
                    <Route index element={<Landing />} />
                    <Route path={ROUTES.WALRUS.ROOT} element={<Store />} />
                    <Route path={ROUTES.WALRUS.STORE} element={<Store />} />
                    <Route path={ROUTES.WALRUS.QUILT} element={<div>Quilt Manager Coming Soon</div>} />
                    <Route path={ROUTES.WALRUS.MANAGE} element={<div>Blob Management Coming Soon</div>} />
                    <Route path={ROUTES.WALRUS.SYSTEM} element={<div>System Info Coming Soon</div>} />
                    <Route path={ROUTES.SEAL.ROOT} element={<Encrypt />} />
                    <Route path={ROUTES.SEAL.ENCRYPT} element={<Encrypt />} />
                    <Route path={ROUTES.SEAL.PATTERNS} element={<div>Access Patterns Coming Soon</div>} />
                    <Route path={ROUTES.SEAL.KEYS} element={<div>Key Management Coming Soon</div>} />
                    <Route path={ROUTES.SEAL.POLICIES} element={<div>Policy Management Coming Soon</div>} />
                    <Route path={ROUTES.INTEGRATED.ROOT} element={<SecureStorage />} />
                    <Route path={ROUTES.INTEGRATED.SECURE_STORAGE} element={<SecureStorage />} />
                    <Route path={ROUTES.INTEGRATED.ALLOWLIST} element={<div>Allowlist Demo Coming Soon</div>} />
                    <Route path={ROUTES.INTEGRATED.SUBSCRIPTION} element={<div>Subscription Demo Coming Soon</div>} />
                    <Route path={ROUTES.INTEGRATED.TIMELOCK} element={<div>Time-lock Demo Coming Soon</div>} />
                    <Route path={ROUTES.SETTINGS} element={<div>Settings Coming Soon</div>} />
                  </Route>
                </Routes>
              </Router>
            </Theme>
          </AppProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
