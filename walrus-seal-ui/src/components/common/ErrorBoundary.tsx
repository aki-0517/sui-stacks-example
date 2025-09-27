import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, Flex, Text, Button } from '@radix-ui/themes';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card style={{ margin: '20px', padding: '20px' }}>
          <Flex direction="column" gap="4" align="center">
            <Text size="6" weight="bold" color="red">
              Something went wrong
            </Text>
            
            <Text size="4" color="gray" style={{ textAlign: 'center' }}>
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </Text>
            
            {this.state.error && (
              <Card style={{ width: '100%', padding: '16px', background: 'var(--red-2)' }}>
                <Text size="2" style={{ fontFamily: 'monospace', color: 'var(--red-11)' }}>
                  {this.state.error.message}
                </Text>
              </Card>
            )}
            
            <Flex gap="3">
              <Button onClick={this.handleReset} color="blue">
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="soft"
              >
                Refresh Page
              </Button>
            </Flex>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Card style={{ width: '100%', padding: '16px', background: 'var(--gray-2)' }}>
                <Text size="1" style={{ fontFamily: 'monospace' }}>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </Text>
              </Card>
            )}
          </Flex>
        </Card>
      );
    }

    return this.props.children;
  }
}