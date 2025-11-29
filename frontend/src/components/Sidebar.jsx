// web/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
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
  Collapse,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Inventory as InventoryIcon,
  Description as DescriptionIcon,
  Medication as MedicationIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  CheckCircle as CheckIcon,
  MedicalServices as MedicalServicesIcon,
  LocalHospital as HospitalIcon,
  Science as ScienceIcon,
  Assignment as AssignmentIcon,
  ManageAccounts as ManageAccountsIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  ListAlt as ListAltIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  School as SchoolIcon,
  RateReview as RateReviewIcon,
  BarChart as BarChartIcon,
  ExpandLess,
  ExpandMore,
  SwapHoriz as TransactionsIcon,
  Warning as AlertsIcon,
  LocalShipping as SuppliersIcon,
  ShoppingCart as OrdersIcon,
  Schedule as ScheduleIcon,
  Vaccines as VaccinesIcon,
  NotificationsActive as RemindersIcon
} from '@mui/icons-material';

const drawerWidth = 260;
const API_BASE_URL = 'http://localhost:5000/api';

// Define menu items by role based on SIDEBAR_NAVIGATION.md
const ROLE_MENU_ITEMS = {
  admin: [
    { id: 'dashboard', text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { id: 'patients', text: 'Patients', icon: <PeopleIcon />, path: '/patient' },
    { id: 'doctor-assignments', text: 'Doctor Assignments', icon: <ScheduleIcon />, path: '/doctor-assignments', badge: 'NEW' },
    { id: 'doctor-availability', text: 'Doctor Availability', icon: <ScheduleIcon />, path: '/availability-slots', badge: 'NEW' },
    { id: 'appointment-requests', text: 'Appointment Requests', icon: <AssignmentIcon />, path: '/appointment-requests', badge: 'NEW' },
    { id: 'refill-requests', text: 'Refill Requests', icon: <MedicationIcon />, path: '/refill-requests', badge: 'NEW' },
    { id: 'appointments', text: 'Appointments', icon: <CalendarIcon />, path: '/appointments' },
    { id: 'clinical-visits', text: 'Clinical Visits', icon: <MedicalServicesIcon />, path: '/clinical-visit' },
    { 
      id: 'inventory', 
      text: 'Inventory', 
      icon: <InventoryIcon />, 
      hasSubmenu: true,
      submenu: [
        { id: 'inventory-main', text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
        { id: 'inventory-transactions', text: 'Transactions', icon: <TransactionsIcon />, path: '/inventory/transactions' },
        { id: 'inventory-alerts', text: 'Alerts', icon: <AlertsIcon />, path: '/inventory/alerts' },
        { id: 'inventory-suppliers', text: 'Suppliers', icon: <SuppliersIcon />, path: '/inventory/suppliers' },
        { id: 'inventory-orders', text: 'Purchase Orders', icon: <OrdersIcon />, path: '/inventory/orders' }
      ]
    },
    { id: 'prescriptions', text: 'Prescriptions', icon: <DescriptionIcon />, path: '/prescriptions' },
    { id: 'art-regimen', text: 'ART Regimens', icon: <MedicationIcon />, path: '/art-regimen' },
    { id: 'vaccinations', text: 'Vaccination Program', icon: <VaccinesIcon />, path: '/vaccinations' },
    { id: 'lab-tests', text: 'Lab Tests', icon: <ScienceIcon />, path: '/lab-test' },
    { id: 'hts', text: 'HTS Sessions', icon: <AssignmentIcon />, path: '/hts-sessions' },
    { id: 'counseling', text: 'Counseling', icon: <ListAltIcon />, path: '/counseling' },
    { id: 'referrals', text: 'Referrals', icon: <HospitalIcon />, path: '/referrals' },
    { id: 'care-tasks', text: 'Care Tasks', icon: <CheckIcon />, path: '/care-tasks' },
    { id: 'surveys', text: 'Satisfaction Surveys', icon: <RateReviewIcon />, path: '/survey-metrics' },
    { id: 'survey-responses', text: 'Survey Responses', icon: <ListAltIcon />, path: '/survey-responses' },
    { id: 'users', text: 'User Management', icon: <ManageAccountsIcon />, path: '/users' },
    { id: 'facilities', text: 'My Hub Cares Branches', icon: <BusinessIcon />, path: '/branch-management' },
    { id: 'audit', text: 'Audit Trail', icon: <HistoryIcon />, path: '/audit-trail' },
    { id: 'reports', text: 'Reports', icon: <BarChartIcon />, path: '/reports' },
    { id: 'education', text: 'Education', icon: <SchoolIcon />, path: '/education' }
  ],
  physician: [
    { id: 'dashboard', text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { id: 'patients', text: 'Patients', icon: <PeopleIcon />, path: '/patient' },
    { id: 'appointments', text: 'Appointments', icon: <CalendarIcon />, path: '/appointments' },
    { id: 'clinical-visits', text: 'Clinical Visits', icon: <MedicalServicesIcon />, path: '/clinical-visit' },
    { id: 'prescriptions', text: 'Prescriptions', icon: <DescriptionIcon />, path: '/prescriptions' },
    { id: 'art-regimen', text: 'ART Regimens', icon: <MedicationIcon />, path: '/art-regimen' },
    { id: 'vaccinations', text: 'Vaccination Program', icon: <VaccinesIcon />, path: '/vaccinations' },
    { id: 'lab-results', text: 'Lab Results', icon: <ScienceIcon />, path: '/lab-test' },
    { id: 'counseling', text: 'Counseling', icon: <ListAltIcon />, path: '/counseling' },
    { id: 'care-tasks', text: 'Care Tasks', icon: <CheckIcon />, path: '/care-tasks' },
    { id: 'surveys', text: 'Satisfaction Surveys', icon: <RateReviewIcon />, path: '/survey-metrics' },
    { id: 'inventory', text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { id: 'audit', text: 'My Activity Log', icon: <HistoryIcon />, path: '/audit-trail' },
    { id: 'education', text: 'Education', icon: <SchoolIcon />, path: '/education' }
  ],
  nurse: [
    { id: 'dashboard', text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { id: 'patients', text: 'Patients', icon: <PeopleIcon />, path: '/patient' },
    { id: 'appointments', text: 'Appointments', icon: <CalendarIcon />, path: '/appointments' },
    { id: 'clinical-visits', text: 'Clinical Visits', icon: <MedicalServicesIcon />, path: '/clinical-visit' },
    { id: 'vaccinations', text: 'Vaccination Program', icon: <VaccinesIcon />, path: '/vaccinations' },
    { id: 'inventory', text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { id: 'prescriptions', text: 'Prescriptions', icon: <DescriptionIcon />, path: '/prescriptions' },
    { id: 'hts', text: 'HTS Sessions', icon: <AssignmentIcon />, path: '/hts-sessions' },
    { id: 'care-tasks', text: 'Care Tasks', icon: <CheckIcon />, path: '/care-tasks' },
    { id: 'audit', text: 'My Activity Log', icon: <HistoryIcon />, path: '/audit-trail' },
    { id: 'education', text: 'Education', icon: <SchoolIcon />, path: '/education' }
  ],
  case_manager: [
    { id: 'dashboard', text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { id: 'patients', text: 'Patients', icon: <PeopleIcon />, path: '/patient' },
    { id: 'appointment-requests', text: 'Appointment Requests', icon: <AssignmentIcon />, path: '/appointment-requests', badge: 'NEW' },
    { id: 'refill-requests', text: 'Refill Requests', icon: <MedicationIcon />, path: '/refill-requests', badge: 'NEW' },
    { id: 'appointments', text: 'Appointments', icon: <CalendarIcon />, path: '/appointments' },
    { id: 'counseling', text: 'Counseling', icon: <ListAltIcon />, path: '/counseling' },
    { id: 'referrals', text: 'Referrals', icon: <HospitalIcon />, path: '/referrals' },
    { id: 'care-tasks', text: 'Care Tasks', icon: <CheckIcon />, path: '/care-tasks' },
    { id: 'surveys', text: 'Satisfaction Surveys', icon: <RateReviewIcon />, path: '/survey-metrics' },
    { id: 'hts', text: 'HTS Sessions', icon: <AssignmentIcon />, path: '/hts-sessions' },
    { id: 'audit', text: 'My Activity Log', icon: <HistoryIcon />, path: '/audit-trail' },
    { id: 'education', text: 'Education', icon: <SchoolIcon />, path: '/education' }
  ],
  lab_personnel: [
    { id: 'dashboard', text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { id: 'lab-tests', text: 'Lab Tests', icon: <ScienceIcon />, path: '/lab-test' },
    { id: 'hts', text: 'HTS Sessions', icon: <AssignmentIcon />, path: '/hts-sessions' },
    { id: 'patients', text: 'Patients', icon: <PeopleIcon />, path: '/patient' },
    { id: 'audit', text: 'My Activity Log', icon: <HistoryIcon />, path: '/audit-trail' },
    { id: 'education', text: 'Education', icon: <SchoolIcon />, path: '/education' }
  ],
  patient: [
    { id: 'dashboard', text: 'My Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { id: 'profile', text: 'My Profile', icon: <PersonIcon />, path: '/profile' },
    { id: 'appointments', text: 'My Appointments', icon: <CalendarIcon />, path: '/my-appointments' },
    { id: 'my-medications', text: 'My Medications', icon: <MedicationIcon />, path: '/my-medications', badge: 'NEW' },
    { id: 'vaccinations', text: 'My Vaccinations', icon: <VaccinesIcon />, path: '/vaccinations' },
    { id: 'prescriptions', text: 'Prescriptions', icon: <DescriptionIcon />, path: '/prescriptions' },
    { id: 'lab-results', text: 'Lab Results', icon: <ScienceIcon />, path: '/lab-test' },
    { id: 'feedback', text: 'Feedback', icon: <RateReviewIcon />, path: '/patient-survey' },
    { id: 'audit', text: 'My Activity Log', icon: <HistoryIcon />, path: '/audit-trail' },
    { id: 'education', text: 'Health Education', icon: <SchoolIcon />, path: '/education' }
  ]
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);

  useEffect(() => {
    fetchUserRole();
  }, []);

  // Auto-open submenu if on submenu route
  useEffect(() => {
    const menuItems = ROLE_MENU_ITEMS[userRole] || [];
    menuItems.forEach(item => {
      if (item.hasSubmenu && item.submenu) {
        // Check if current path matches any submenu item (ignoring query params)
        const isSubmenuActive = item.submenu.some(sub => {
          const subPath = sub.path.split('?')[0];
          return location.pathname === subPath || location.pathname === item.path;
        });
        if (isSubmenuActive) {
          setOpenSubmenu(item.id);
        }
      }
    });
  }, [location.pathname, userRole]);

  const fetchUserRole = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('Sidebar: User role from localStorage:', user.role);
        setUserRole(user.role);
      } else {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              console.log('Sidebar: User role from API:', data.user.role);
              setUserRole(data.user.role);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleSubmenu = (menuId) => {
    setOpenSubmenu(openSubmenu === menuId ? null : menuId);
  };

  const menuItems = ROLE_MENU_ITEMS[userRole] || [];
  
  // Debug logging
  useEffect(() => {
    if (userRole) {
      console.log('Sidebar: Current user role:', userRole);
      console.log('Sidebar: Available menu items:', menuItems.length);
      console.log('Sidebar: Menu items:', menuItems.map(item => item.text));
    }
  }, [userRole, menuItems]);

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
        <Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ color: '#B82132', fontWeight: 600 }}
          >
            My Hub Cares
          </Typography>
          {userRole && (
            <Typography variant="caption" sx={{ color: '#6c757d', textTransform: 'capitalize' }}>
              {userRole.replace('_', ' ')}
            </Typography>
          )}
        </Box>
      </Toolbar>
      
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List>
          {menuItems.length === 0 ? (
            <ListItem>
              <ListItemText primary="Loading..." />
            </ListItem>
          ) : (
            menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const hasSubmenu = item.hasSubmenu && item.submenu;
              const isSubmenuOpen = openSubmenu === item.id;
              const isAnySubmenuActive = hasSubmenu && item.submenu.some(sub => location.pathname === sub.path);

              if (hasSubmenu) {
                return (
                  <React.Fragment key={item.id}>
                    <ListItem
                      onClick={(e) => {
                        // If clicking the expand icon, only toggle submenu
                        // Otherwise, navigate to main path
                        if (e.target.closest('.MuiSvgIcon-root')) {
                          toggleSubmenu(item.id);
                        } else {
                          navigate(item.path);
                          toggleSubmenu(item.id);
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1,
                        mx: 1,
                        my: 0.5,
                        borderLeft: (isActive || isAnySubmenuActive) ? '4px solid #B82132' : '4px solid transparent',
                        transition: 'all 0.2s ease-in-out',
                        backgroundColor: (isActive || isAnySubmenuActive) ? 'rgba(184, 33, 50, 0.1)' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(184, 33, 50, 0.05)',
                          borderLeft: '4px solid #B82132',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: (isActive || isAnySubmenuActive) ? '#B82132' : '#64748b', minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text}
                        sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem', fontWeight: (isActive || isAnySubmenuActive) ? 500 : 400 } }}
                      />
                      {item.badge && (
                        <Chip 
                          label={item.badge} 
                          size="small" 
                          sx={{ 
                            height: '18px', 
                            fontSize: '10px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            fontWeight: 'bold',
                            mr: 1
                          }} 
                        />
                      )}
                      <Box onClick={(e) => { e.stopPropagation(); toggleSubmenu(item.id); }} sx={{ cursor: 'pointer' }}>
                        {isSubmenuOpen ? <ExpandLess /> : <ExpandMore />}
                      </Box>
                    </ListItem>
                    <Collapse in={isSubmenuOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.submenu.map((subItem) => {
                          const subPath = subItem.path.split('?')[0]; // Get path without query params
                          const isSubActive = location.pathname === subPath;
                          return (
                            <ListItem
                              key={subItem.id}
                              onClick={() => navigate(subItem.path)}
                              sx={{
                                pl: 4,
                                cursor: 'pointer',
                                borderRadius: 1,
                                mx: 1,
                                my: 0.25,
                                borderLeft: isSubActive ? '4px solid #B82132' : '4px solid transparent',
                                backgroundColor: isSubActive ? 'rgba(184, 33, 50, 0.1)' : 'transparent',
                                '&:hover': {
                                  backgroundColor: 'rgba(184, 33, 50, 0.05)',
                                  borderLeft: '4px solid #B82132',
                                },
                              }}
                            >
                              {subItem.icon && (
                                <ListItemIcon sx={{ color: isSubActive ? '#B82132' : '#64748b', minWidth: 40 }}>
                                  {subItem.icon}
                                </ListItemIcon>
                              )}
                              <ListItemText 
                                primary={subItem.text}
                                sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem' } }}
                              />
                              {subItem.badge && (
                                <Chip 
                                  label={subItem.badge} 
                                  size="small" 
                                  sx={{ 
                                    height: '18px', 
                                    fontSize: '10px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }} 
                                />
                              )}
                            </ListItem>
                          );
                        })}
                      </List>
                    </Collapse>
                  </React.Fragment>
                );
              }

              return (
                <ListItem
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  selected={isActive}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    borderLeft: isActive ? '4px solid #B82132' : '4px solid transparent',
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(184, 33, 50, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(184, 33, 50, 0.15)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(184, 33, 50, 0.05)',
                      borderLeft: '4px solid #B82132',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? '#B82132' : '#64748b', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem', fontWeight: isActive ? 500 : 400 } }}
                  />
                  {item.badge && (
                    <Chip 
                      label={item.badge} 
                      size="small" 
                      sx={{ 
                        height: '18px', 
                        fontSize: '10px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        fontWeight: 'bold'
                      }} 
                    />
                  )}
                </ListItem>
              );
            })
          )}
        </List>
      </Box>

      <Box sx={{ p: 1, mb: 1 }}>
        <Divider sx={{ mb: 1 }} />
        {/* Settings - Only visible for admin */}
        {userRole === 'admin' && (
          <ListItem
            button
            onClick={() => navigate('/settings')}
            selected={location.pathname === '/settings'}
            sx={{
              cursor: 'pointer',
              borderRadius: 1,
              mx: 1,
              mb: 1,
              '&:hover': { backgroundColor: 'rgba(184, 33, 50, 0.05)' }
            }}
          >
            <ListItemIcon sx={{ color: '#64748b', minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem' } }} />
          </ListItem>
        )}
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            mx: 1,
            backgroundColor: '#B82132',
            color: 'white',
            '&:hover': {
              backgroundColor: '#8B1A26',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: 'white', '& .MuiListItemText-primary': { fontSize: '0.875rem' } }} />
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar;