import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Save, X, Trash2, Settings as SettingsIcon, AlertCircle, Check } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const SystemSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    setting_key: '',
    setting_value: '',
    description: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_BASE_URL}/system-settings?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data.success) {
        setSettings(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setToast({
        message: 'Failed to fetch settings: ' + error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (setting = null) => {
    if (setting) {
      setEditingSetting(setting);
      setFormData({
        setting_key: setting.setting_key,
        setting_value: typeof setting.setting_value === 'object' 
          ? JSON.stringify(setting.setting_value, null, 2)
          : String(setting.setting_value),
        description: setting.description || '',
      });
    } else {
      setEditingSetting(null);
      setFormData({
        setting_key: '',
        setting_value: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSetting(null);
    setFormData({
      setting_key: '',
      setting_value: '',
      description: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Try to parse setting_value as JSON, if it fails, treat as string
      let parsedValue;
      try {
        parsedValue = JSON.parse(formData.setting_value);
      } catch {
        // If not valid JSON, treat as string
        parsedValue = formData.setting_value;
      }

      const payload = {
        setting_key: formData.setting_key,
        setting_value: parsedValue,
        description: formData.description || null,
      };

      const url = editingSetting
        ? `${API_BASE_URL}/system-settings/${formData.setting_key}`
        : `${API_BASE_URL}/system-settings`;

      const method = editingSetting ? 'PUT' : 'POST';

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
          message: editingSetting
            ? 'Setting updated successfully'
            : 'Setting created successfully',
          type: 'success',
        });
        handleCloseModal();
        fetchSettings();
      } else {
        throw new Error(data.message || 'Failed to save setting');
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      setToast({
        message: 'Failed to save setting: ' + error.message,
        type: 'error',
      });
    }
  };

  const handleDelete = async (settingKey) => {
    if (!window.confirm(`Are you sure you want to delete setting "${settingKey}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/system-settings/${settingKey}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Setting deleted successfully',
          type: 'success',
        });
        fetchSettings();
      } else {
        throw new Error(data.message || 'Failed to delete setting');
      }
    } catch (error) {
      console.error('Error deleting setting:', error);
      setToast({
        message: 'Failed to delete setting: ' + error.message,
        type: 'error',
      });
    }
  };

  const formatValue = (value) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const filteredSettings = settings.filter((setting) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      setting.setting_key.toLowerCase().includes(searchLower) ||
      (setting.description && setting.description.toLowerCase().includes(searchLower))
    );
  });

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
            System Settings
          </h3>
          <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
            Manage system configuration and preferences
          </p>
        </div>
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
          Add Setting
        </button>
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
          placeholder="Search settings..."
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

      {/* Settings Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading settings...</p>
        </div>
      ) : filteredSettings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          <SettingsIcon size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
          <p>No settings found</p>
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
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Key</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Value</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Updated</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettings.map((setting) => (
                <tr
                  key={setting.setting_key}
                  style={{ borderBottom: '1px solid #dee2e6' }}
                >
                  <td style={{ padding: '12px' }}>
                    <code style={{ background: '#f8f9fa', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {setting.setting_key}
                    </code>
                  </td>
                  <td style={{ padding: '12px', maxWidth: '300px' }}>
                    <div
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '13px',
                        color: '#495057',
                      }}
                      title={formatValue(setting.setting_value)}
                    >
                      {formatValue(setting.setting_value)}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#6c757d' }}>
                    {setting.description || '-'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#6c757d' }}>
                    {setting.updated_at
                      ? new Date(setting.updated_at).toLocaleDateString()
                      : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleOpenModal(setting)}
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
                        onClick={() => handleDelete(setting.setting_key)}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
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
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
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
                {editingSetting ? 'Edit Setting' : 'Add Setting'}
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
                  Setting Key *
                </label>
                <input
                  type="text"
                  value={formData.setting_key}
                  onChange={(e) =>
                    setFormData({ ...formData, setting_key: e.target.value })
                  }
                  required
                  disabled={!!editingSetting}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  placeholder="e.g., system.name, email.smtp_host"
                />
                {editingSetting && (
                  <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                    Key cannot be changed
                  </p>
                )}
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
                  Setting Value *
                </label>
                <textarea
                  value={formData.setting_value}
                  onChange={(e) =>
                    setFormData({ ...formData, setting_value: e.target.value })
                  }
                  required
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                  placeholder='Enter value as JSON or plain text. Example: "My System" or {"host": "smtp.example.com", "port": 587}'
                />
                <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                  Enter as JSON object/array or plain string/number
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
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
                  placeholder="Optional description of this setting"
                />
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
                  {editingSetting ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;

