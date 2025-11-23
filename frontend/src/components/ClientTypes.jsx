import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Save, X, Trash2, Users, AlertCircle, Check } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const ClientTypes = () => {
  const [clientTypes, setClientTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClientType, setEditingClientType] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    type_name: '',
    type_code: '',
    description: '',
    is_active: true,
  });
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchClientTypes();
    getUserRole();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getUserRole = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
  };

  const fetchClientTypes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('is_active', '1'); // Show active by default
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_BASE_URL}/client-types?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch client types');
      }

      const data = await response.json();
      if (data.success) {
        setClientTypes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching client types:', error);
      setToast({
        message: 'Failed to fetch client types: ' + error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (clientType = null) => {
    if (clientType) {
      setEditingClientType(clientType);
      setFormData({
        type_name: clientType.type_name,
        type_code: clientType.type_code || '',
        description: clientType.description || '',
        is_active: clientType.is_active === 1 || clientType.is_active === true,
      });
    } else {
      setEditingClientType(null);
      setFormData({
        type_name: '',
        type_code: '',
        description: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClientType(null);
    setFormData({
      type_name: '',
      type_code: '',
      description: '',
      is_active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        type_name: formData.type_name,
        type_code: formData.type_code || null,
        description: formData.description || null,
        is_active: formData.is_active ? 1 : 0,
      };

      const url = editingClientType
        ? `${API_BASE_URL}/client-types/${editingClientType.client_type_id}`
        : `${API_BASE_URL}/client-types`;

      const method = editingClientType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: editingClientType
            ? 'Client type updated successfully'
            : 'Client type created successfully',
          type: 'success',
        });
        handleCloseModal();
        fetchClientTypes();
      } else {
        throw new Error(data.message || 'Failed to save client type');
      }
    } catch (error) {
      console.error('Error saving client type:', error);
      setToast({
        message: 'Failed to save client type: ' + error.message,
        type: 'error',
      });
    }
  };

  const handleDelete = async (clientTypeId, typeName) => {
    if (!window.confirm(`Are you sure you want to delete client type "${typeName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/client-types/${clientTypeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Client type deleted successfully',
          type: 'success',
        });
        fetchClientTypes();
      } else {
        throw new Error(data.message || 'Failed to delete client type');
      }
    } catch (error) {
      console.error('Error deleting client type:', error);
      setToast({
        message: 'Failed to delete client type: ' + error.message,
        type: 'error',
      });
    }
  };

  const filteredClientTypes = clientTypes.filter((clientType) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      clientType.type_name.toLowerCase().includes(searchLower) ||
      (clientType.type_code && clientType.type_code.toLowerCase().includes(searchLower)) ||
      (clientType.description && clientType.description.toLowerCase().includes(searchLower))
    );
  });

  const isAdmin = userRole === 'admin';

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            Client Types
          </h3>
          <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
            Manage patient/client type classifications
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => handleOpenModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#D84040',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <Plus size={18} />
            Add Client Type
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <Search
          size={20}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6c757d',
          }}
        />
        <input
          type="text"
          placeholder="Search client types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 10px 10px 40px',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            background: toast.type === 'success' ? '#4caf50' : '#f44336',
            color: 'white',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {toast.type === 'success' ? (
            <Check size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {toast.message}
        </div>
      )}

      {/* Client Types Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading client types...</p>
        </div>
      ) : filteredClientTypes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          <Users size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
          <p>No client types found</p>
        </div>
      ) : (
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Code</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Status</th>
                {isAdmin && (
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredClientTypes.map((clientType) => (
                <tr
                  key={clientType.client_type_id}
                  style={{ borderBottom: '1px solid #dee2e6' }}
                >
                  <td style={{ padding: '12px', fontSize: '13px', color: '#6c757d' }}>
                    {clientType.client_type_id}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 500 }}>
                    {clientType.type_name}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {clientType.type_code ? (
                      <code
                        style={{
                          background: '#f8f9fa',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        {clientType.type_code}
                      </code>
                    ) : (
                      <span style={{ color: '#6c757d', fontSize: '13px' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#6c757d' }}>
                    {clientType.description || '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background:
                          clientType.is_active === 1 || clientType.is_active === true
                            ? '#d4edda'
                            : '#f8d7da',
                        color:
                          clientType.is_active === 1 || clientType.is_active === true
                            ? '#155724'
                            : '#721c24',
                      }}
                    >
                      {clientType.is_active === 1 || clientType.is_active === true
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenModal(clientType)}
                          style={{
                            padding: '6px 12px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(
                              clientType.client_type_id,
                              clientType.type_name
                            )
                          }
                          style={{
                            padding: '6px 12px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && isAdmin && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '500px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                {editingClientType ? 'Edit Client Type' : 'Add Client Type'}
              </h3>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Type Name *
                </label>
                <input
                  type="text"
                  value={formData.type_name}
                  onChange={(e) =>
                    setFormData({ ...formData, type_name: e.target.value })
                  }
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  placeholder="e.g., Males having Sex with Males"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Type Code
                </label>
                <input
                  type="text"
                  value={formData.type_code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type_code: e.target.value.toUpperCase(),
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  placeholder="e.g., MSM, FSW"
                />
                <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  Optional unique code (will be converted to uppercase)
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  placeholder="Optional description"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                  Active
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '10px 20px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: '#D84040',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Save size={16} />
                  {editingClientType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientTypes;

