import React from 'react';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Button, Flex, Text, Card } from '@radix-ui/themes';
import { useAppContext } from '../../context/AppContext';
import { truncateAddress } from '../../utils/config';

export function WalletConnector() {
  const { state, dispatch } = useAppContext();
  const currentAccount = useCurrentAccount();

  React.useEffect(() => {
    if (currentAccount) {
      dispatch({
        type: 'SET_WALLET',
        payload: {
          account: currentAccount,
          connected: true,
          balance: 0 // TODO: Fetch actual balance
        }
      });
    } else {
      dispatch({
        type: 'SET_WALLET',
        payload: {
          account: null,
          connected: false,
          balance: 0
        }
      });
    }
  }, [currentAccount, dispatch]);

  if (!state.wallet.connected) {
    return (
      <Card>
        <Flex direction="column" gap="3" align="center">
          <Text size="4" weight="bold">Connect Wallet</Text>
          <Text size="2" color="gray">
            Connect your Sui wallet to interact with Walrus and Seal
          </Text>
          <ConnectButton />
        </Flex>
      </Card>
    );
  }

  return (
    <Card>
      <Flex justify="between" align="center">
        <Flex direction="column" gap="1">
          <Text size="2" color="gray">Connected Wallet</Text>
          <Text size="3" style={{ fontFamily: 'monospace' }}>
            {truncateAddress(currentAccount?.address || '')}
          </Text>
        </Flex>
        <Flex direction="column" gap="1" align="end">
          <Text size="2" color="gray">Balance</Text>
          <Text size="3" weight="bold">
            {state.wallet.balance} SUI
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}

export function ConnectWalletButton() {
  const { state } = useAppContext();
  
  if (state.wallet.connected) {
    return (
      <Button variant="soft" size="2">
        <Text size="2">
          {truncateAddress(state.wallet.account?.address || '')}
        </Text>
      </Button>
    );
  }
  
  return <ConnectButton />;
}