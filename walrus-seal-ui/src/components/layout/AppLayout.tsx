import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container, Flex, Box } from '@radix-ui/themes';
import { Navigation } from './Navigation';
import { Header } from './Header';
import { Footer } from './Footer';

export function AppLayout() {
  return (
    <Flex direction="column" style={{ minHeight: '100vh' }}>
      <Header />
      <Flex style={{ flex: 1 }}>
        <Navigation />
        <Box style={{ flex: 1, padding: '24px' }}>
          <Container size="4">
            <Outlet />
          </Container>
        </Box>
      </Flex>
      <Footer />
    </Flex>
  );
}