// web/src/components/Sidebar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Home,
  Users,
  Calendar,
  Package,
  FileText,
  Pill,
  Bell,
  Settings,
  LogOut,
  Check,
} from 'lucide-react';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
  { text: 'Patients', icon: <Users size={20} />, path: '/patient' },
  { text: 'Appointments', icon: <Calendar size={20} />, path: '/appointments' },
  {
    text: 'Clinical Visit',
    icon: <Calendar size={20} />,
    path: '/clinical-visit',
  },
  { text: 'Inventory', icon: <Package size={20} />, path: '/inventory' },
  { text: 'Medication', icon: <Bell size={20} />, path: '/medications' },

  {
    text: 'Prescriptions',
    icon: <FileText size={20} />,
    path: '/prescriptions',
  },
  { text: 'ART Regimens', icon: <Pill size={20} />, path: '/art-regimen' },
  {
    text: 'Vaccination Program',
    icon: <Check size={20} />,
    path: '/vaccination-program',
  },
  {
    text: 'Lab Test ',
    icon: <Check size={20} />,
    path: '/lab-test',
  },
  {
    text: 'HTS Sessions ',
    icon: <Check size={20} />,
    path: '/hts-sessions',
  },
  {
    text: 'Counseling Sessions ',
    icon: <Check size={20} />,
    path: '/counseling',
  },
  {
    text: 'Referrals ',
    icon: <Check size={20} />,
    path: '/referrals',
  },

  { text: 'Branch', icon: <Bell size={20} />, path: '/branch-management' },
  { text: 'Notifications', icon: <Bell size={20} />, path: '/notifications' },
  { text: 'Settings', icon: <Settings size={20} />, path: '/settings' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Clear any authentication tokens
    localStorage.removeItem('token');
    // Redirect to login page
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'white',
          color: '#333333',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e5e7eb',
        },
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ color: '#2563eb', fontWeight: 600 }}
        >
          My Hub Cares
        </Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                borderLeft:
                  location.pathname === item.path
                    ? '4px solid #2563eb'
                    : '4px solid transparent',
                transition: 'all 0.2s ease-in-out',
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(37, 99, 235, 0.05)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#2563eb',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#2563eb',
                    fontWeight: 500,
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(37, 99, 235, 0.05)',
                  borderLeft: '4px solid #2563eb',
                  '& .MuiListItemIcon-root': {
                    color: '#2563eb',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#2563eb',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.path ? '#2563eb' : '#64748b',
                  minWidth: 40,
                  transition: 'color 0.2s ease-in-out',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    color:
                      location.pathname === item.path ? '#2563eb' : '#333333',
                    fontWeight: location.pathname === item.path ? 500 : 400,
                    transition: 'color 0.2s ease-in-out',
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ p: 1, mb: 1 }}>
        <Divider sx={{ mb: 1 }} />
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            mx: 1,
            '&:hover': {
              backgroundColor: 'rgba(220, 38, 38, 0.05)',
            },
          }}
        >
          <ListItemIcon sx={{ color: '#ef4444', minWidth: 40 }}>
            <LogOut size={20} />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: '#ef4444' }} />
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
