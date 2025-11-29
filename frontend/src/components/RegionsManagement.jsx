import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Save, X, Trash2, MapPin, AlertCircle, Check, Building } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const RegionsManagement = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    region_name: '',
    region_code: '',
    is_active: true,
  });
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchRegions();
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

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_BASE_URL}/regions?${params}`);
      const data = await response.json();
      if (data.success) {
        setRegions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
      setToast({
        message: 'Failed to fetch regions: ' + error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, [searchTerm]);

  const handleOpenModal = (region = null) => {
    if (region) {
      setEditingRegion(region);
      setFormData({
        region_name: region.region_name || '',
        region_code: region.region_code || '',
        is_active: region.is_active === 1 || region.is_active === true,
      });
    } else {
      setEditingRegion(null);
      setFormData({
        region_name: '',
        region_code: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRegion(null);
    setFormData({
      region_name: '',
      region_code: '',
      is_active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingRegion
        ? `${API_BASE_URL}/regions/${editingRegion.region_id}`
        : `${API_BASE_URL}/regions`;

      const method = editingRegion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: editingRegion
            ? 'Region updated successfully'
            : 'Region created successfully',
          type: 'success',
        });
        handleCloseModal();
        fetchRegions();
      } else {
        throw new Error(data.message || 'Failed to save region');
      }
    } catch (error) {
      console.error('Error saving region:', error);
      setToast({
        message: 'Failed to save region: ' + error.message,
        type: 'error',
      });
    }
  };

  const handleDelete = async (regionId) => {
    if (!window.confirm('Are you sure you want to delete this region? This will deactivate it.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/regions/${regionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Region deleted successfully',
          type: 'success',
        });
        fetchRegions();
      } else {
        throw new Error(data.message || 'Failed to delete region');
      }
    } catch (error) {
      console.error('Error deleting region:', error);
      setToast({
        message: 'Failed to delete region: ' + error.message,
        type: 'error',
      });
    }
  };

  const filteredRegions = regions.filter((region) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      region.region_name.toLowerCase().includes(searchLower) ||
      (region.region_code && region.region_code.toLowerCase().includes(searchLower))
    );
  });

  const isAdmin = userRole === 'admin';

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            Regions Management
          </h2>
          <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
            Manage Philippines administrative regions
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => handleOpenModal()}
            style={{
              padding: '10px 20px',
              background: '#D84040',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus size={18} />
            New Region
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search
            size={18}
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
            placeholder="Search regions..."
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
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            background: toast.type === 'success' ? '#28a745' : '#dc3545',
            color: 'white',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Regions Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : filteredRegions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          No regions found
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#495057' }}>
                  Region Name
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#495057' }}>
                  Region Code
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#495057' }}>
                  Status
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#495057' }}>
                  Created At
                </th>
                {isAdmin && (
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', color: '#495057' }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredRegions.map((region) => (
                <tr
                  key={region.region_id}
                  style={{ borderBottom: '1px solid #dee2e6', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fa')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                >
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} color="#6c757d" />
                      <span style={{ fontWeight: 500 }}>{region.region_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {region.region_code ? (
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: '#e7f3ff',
                          color: '#0066cc',
                        }}
                      >
                        {region.region_code}
                      </span>
                    ) : (
                      <span style={{ color: '#6c757d' }}>N/A</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {region.is_active === 1 || region.is_active === true ? (
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: '#d4edda',
                          color: '#155724',
                        }}
                      >
                        Active
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: '#f8d7da',
                          color: '#721c24',
                        }}
                      >
                        Inactive
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#6c757d' }}>
                    {region.created_at
                      ? new Date(region.created_at).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenModal(region)}
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
                          onClick={() => handleDelete(region.region_id)}
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
              padding: '30px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                {editingRegion ? 'Edit Region' : 'New Region'}
              </h3>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Region Name *
                </label>
                <input
                  type="text"
                  value={formData.region_name}
                  onChange={(e) => setFormData({ ...formData, region_name: e.target.value })}
                  required
                  placeholder="e.g., National Capital Region (NCR)"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Region Code
                </label>
                <input
                  type="text"
                  value={formData.region_code}
                  onChange={(e) => setFormData({ ...formData, region_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., NCR, I, II"
                  maxLength={20}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  Optional: Unique code for the region
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Active</span>
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
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Save size={16} />
                  {editingRegion ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionsManagement;

