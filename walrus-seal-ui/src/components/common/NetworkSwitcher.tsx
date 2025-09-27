import React from 'react';
import { Select, Flex, Text } from '@radix-ui/themes';
import { useAppContext } from '../../context/AppContext';

export function NetworkSwitcher() {
  const { state, dispatch } = useAppContext();

  const handleNetworkChange = (network: 'testnet' | 'mainnet') => {
    dispatch({ type: 'SET_NETWORK', payload: network });
  };

  return (
    <Flex align="center" gap="2">
      <Text size="2" weight="medium">Network:</Text>
      <Select.Root
        value={state.network.current}
        onValueChange={handleNetworkChange}
      >
        <Select.Trigger />
        <Select.Content>
          <Select.Item value="testnet">Testnet</Select.Item>
          <Select.Item value="mainnet">Mainnet</Select.Item>
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}