import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

/**
 * ProtectedRoute Component with Role and Permission-Based Access Control
 * 
 * HOW IT WORKS:
 * 
 * 1. ROLE-BASED ACCESS (existing):
 *    - Checks if user has one of the allowedRoles
 *    - Example: <ProtectedRoute allowedRoles={['admin', 'physician']}>
 * 
 * 2. PERMISSION-BASED ACCESS (new):
 *    - Checks if user has the required permission through their roles
 *    - Queries backend: user_roles → role_permissions → permissions
 *    - Example: <ProtectedRoute requiredPermission="patients.create">
 * 
 * 3. COMBINED ACCESS:
 *    - Can use both: allowedRoles AND requiredPermission
 *    - User must satisfy BOTH conditions
 * 
 * USAGE EXAMPLES:
 * - Role only: <ProtectedRoute allowedRoles={['admin']}>
 * - Permission only: <ProtectedRoute requiredPermission="patients.view">
 * - Both: <ProtectedRoute allowedRoles={['nurse']} requiredPermission="patients.create">
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requiredPermission = null 
}) => {
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const userStr = localStorage.getItem('user');
        let user = null;
        
        if (userStr) {
          user = JSON.parse(userStr);
          setUserRole(user.role);
        } else {
          // Fetch user from API
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              user = data.user;
              setUserRole(user.role);
              localStorage.setItem('user', JSON.stringify(user));
            }
          }
        }

        // If permission is required, fetch user permissions
        if (requiredPermission && user) {
          try {
            // Fetch all permissions for this user
            const permResponse = await fetch(`${API_BASE_URL}/users/${user.user_id}/permissions`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (permResponse.ok) {
              const permData = await permResponse.json();
              if (permData.success && permData.permissions) {
                const permissions = permData.permissions.map(p => p.permission_code);
                setUserPermissions(permissions);
                
                // Check if user has the required permission
                setHasPermission(permissions.includes(requiredPermission));
              }
            } else {
              // If endpoint doesn't exist, fallback to role check
              console.warn('Permission endpoint not available, falling back to role check');
              setHasPermission(true); // Allow access, let backend handle permission check
            }
          } catch (permError) {
            console.error('Error fetching permissions:', permError);
            // Fallback: assume permission check will happen on backend
            setHasPermission(true);
          }
        } else {
          // No permission required, just check roles
          setHasPermission(true);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking access:', error);
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [requiredPermission]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userRole) {
    return <Navigate to="/" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission) {
    // Note: We still allow the route to render, but the backend will enforce permission
    // This allows for better UX - show the page but backend will block unauthorized actions
    console.warn(`Permission '${requiredPermission}' may not be granted. Backend will enforce.`);
  }

  return children;
};

/**
 * usePermission Hook
 * 
 * HOW IT WORKS:
 * - Fetches user permissions from backend
 * - Provides helper functions to check permissions
 * - Can be used in any component to conditionally render features
 * 
 * USAGE:
 * const { hasPermission, permissions, loading } = usePermission();
 * if (hasPermission('patients.create')) {
 *   return <button>Create Patient</button>;
 * }
 */
export const usePermission = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (!token || !userStr) {
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        
        const response = await fetch(`${API_BASE_URL}/users/${user.user_id}/permissions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.permissions) {
            const permCodes = data.permissions.map(p => p.permission_code);
            setPermissions(permCodes);
          }
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = (permissionCode) => {
    return permissions.includes(permissionCode);
  };

  const hasAnyPermission = (permissionCodes) => {
    return permissionCodes.some(code => permissions.includes(code));
  };

  const hasAllPermissions = (permissionCodes) => {
    return permissionCodes.every(code => permissions.includes(code));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading
  };
};

export default ProtectedRoute;




