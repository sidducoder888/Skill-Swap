import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemText, Box } from '@mui/material';

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Browse', path: '/browse' },
  { label: 'Profile', path: '/profile' },
  { label: 'Skills', path: '/skills' },
  { label: 'Swaps', path: '/swaps' },
  { label: 'Admin', path: '/admin' },
];

export const Layout = () => (
  <Box sx={{ display: 'flex' }}>
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Skill Swap Platform
        </Typography>
      </Toolbar>
    </AppBar>
    <Drawer variant="permanent" sx={{ width: 200, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: 200, boxSizing: 'border-box' } }}>
      <Toolbar />
      <List>
        {navItems.map((item) => (
          <ListItem button key={item.path} component={Link} to={item.path}>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Drawer>
    <Box component="main" sx={{ flexGrow: 1, p: 3, ml: 25 }}>
      <Toolbar />
      <Outlet />
    </Box>
  </Box>
);