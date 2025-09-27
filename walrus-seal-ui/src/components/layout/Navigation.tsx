import React from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Flex, Text, Separator } from '@radix-ui/themes';
import { ROUTES } from '../../utils/constants';

const navigationItems = [
  {
    label: 'Home',
    path: ROUTES.HOME,
    icon: '🏠'
  },
  {
    label: 'Walrus',
    path: ROUTES.WALRUS.ROOT,
    icon: '🐋',
    children: [
      { label: 'Store Files', path: ROUTES.WALRUS.STORE },
      { label: 'Quilt Manager', path: ROUTES.WALRUS.QUILT },
      { label: 'Manage Blobs', path: ROUTES.WALRUS.MANAGE },
      { label: 'System Info', path: ROUTES.WALRUS.SYSTEM }
    ]
  },
  {
    label: 'Seal',
    path: ROUTES.SEAL.ROOT,
    icon: '🔐',
    children: [
      { label: 'Encrypt Data', path: ROUTES.SEAL.ENCRYPT },
      { label: 'Access Patterns', path: ROUTES.SEAL.PATTERNS },
      { label: 'Key Management', path: ROUTES.SEAL.KEYS },
      { label: 'Policies', path: ROUTES.SEAL.POLICIES }
    ]
  },
  {
    label: 'Integration',
    path: ROUTES.INTEGRATED.ROOT,
    icon: '🔗',
    children: [
      { label: 'Secure Storage', path: ROUTES.INTEGRATED.SECURE_STORAGE },
      { label: 'Allowlist Demo', path: ROUTES.INTEGRATED.ALLOWLIST },
      { label: 'Subscription Demo', path: ROUTES.INTEGRATED.SUBSCRIPTION },
      { label: 'Time-lock Demo', path: ROUTES.INTEGRATED.TIMELOCK }
    ]
  },
  {
    label: 'Settings',
    path: ROUTES.SETTINGS,
    icon: '⚙️'
  }
];

export function Navigation() {
  return (
    <Box style={{ 
      width: '280px',
      borderRight: '1px solid var(--gray-6)',
      background: 'var(--gray-1)',
      padding: '24px 0'
    }}>
      <Flex direction="column" gap="2">
        {navigationItems.map((item, index) => (
          <React.Fragment key={item.path}>
            <NavItem item={item} />
            {item.children && (
              <Box style={{ paddingLeft: '16px' }}>
                {item.children.map(child => (
                  <NavItem key={child.path} item={child} isChild />
                ))}
              </Box>
            )}
            {index < navigationItems.length - 1 && <Separator style={{ margin: '8px 16px' }} />}
          </React.Fragment>
        ))}
      </Flex>
    </Box>
  );
}

function NavItem({ 
  item, 
  isChild = false 
}: { 
  item: { label: string; path: string; icon?: string }; 
  isChild?: boolean;
}) {
  return (
    <NavLink 
      to={item.path} 
      style={{ textDecoration: 'none' }}
      className={({ isActive }) => 
        `nav-item ${isActive ? 'active' : ''} ${isChild ? 'child' : ''}`
      }
    >
      <Box style={{ 
        padding: isChild ? '8px 24px' : '12px 24px',
        margin: '0 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}
      className="nav-link"
      >
        <Flex align="center" gap="3">
          {item.icon && (
            <Text size={isChild ? "2" : "3"}>
              {item.icon}
            </Text>
          )}
          <Text 
            size={isChild ? "2" : "3"} 
            weight={isChild ? "regular" : "medium"}
          >
            {item.label}
          </Text>
        </Flex>
      </Box>
    </NavLink>
  );
}