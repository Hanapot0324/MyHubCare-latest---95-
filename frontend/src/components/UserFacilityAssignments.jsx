import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Save, X, Trash2, Building, Users, MapPin, AlertCircle, Check } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const UserFacilityAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all', 'byUser', 'byFacility'
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    facility_id: '',
    is_primary: false,
  });

  useEffect(() => {
    fetchAssignments();
    fetchUsers();
    fetchFacilities();
  }, [viewMode, selectedUserId, selectedFacilityId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      let assignmentsData = [];

      if (viewMode === 'byUser' && selectedUserId) {
        const response = await fetch(`${API_BASE_URL}/user-facility-assignments/user/${selectedUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          assignmentsData = data.data || [];
        }
      } else if (viewMode === 'byFacility' && selectedFacilityId) {
        const response = await fetch(`${API_BASE_URL}/user-facility-assignments/facility/${selectedFacilityId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          assignmentsData = data.data || [];
        }
      } else {
        // Fetch all assignments by getting all users and their assignments
        const usersResponse = await fetch(`${API_BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = await usersResponse.json();
        if (usersData.success) {
          const allAssignments = [];
          const usersMap = new Map();
          // Create a map of user_id to user info for quick lookup
          (usersData.users || []).forEach(user => {
            usersMap.set(user.user_id, user);
          });
          
          for (const user of usersData.users || []) {
            const response = await fetch(`${API_BASE_URL}/user-facility-assignments/user/${user.user_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
              // Enrich assignments with user info if missing
              const enrichedAssignments = (data.data || []).map(assignment => ({
                ...assignment,
                // Ensure user info is present
                full_name: assignment.full_name || user.full_name,
                username: assignment.username || user.username,
                email: assignment.email || user.email,
                role: assignment.role || user.role,
              }));
              allAssignments.push(...enrichedAssignments);
            }
          }
          assignmentsData = allAssignments;
        }
      }

      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setToast({
        message: 'Failed to fetch assignments: ' + error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/facilities?is_active=1`);
      const data = await response.json();
      if (data.success) {
        setFacilities(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  const handleOpenModal = (assignment = null) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        user_id: assignment.user_id,
        facility_id: assignment.facility_id,
        is_primary: assignment.is_primary === 1 || assignment.is_primary === true,
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        user_id: selectedUserId || '',
        facility_id: selectedFacilityId || '',
        is_primary: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAssignment(null);
    setFormData({
      user_id: '',
      facility_id: '',
      is_primary: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingAssignment
        ? `${API_BASE_URL}/user-facility-assignments/${editingAssignment.assignment_id}`
        : `${API_BASE_URL}/user-facility-assignments`;

      const method = editingAssignment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: editingAssignment
            ? 'Assignment updated successfully'
            : 'Assignment created successfully',
          type: 'success',
        });
        handleCloseModal();
        fetchAssignments();
      } else {
        throw new Error(data.message || 'Failed to save assignment');
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
      setToast({
        message: 'Failed to save assignment: ' + error.message,
        type: 'error',
      });
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user-facility-assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Assignment removed successfully',
          type: 'success',
        });
        fetchAssignments();
      } else {
        throw new Error(data.message || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setToast({
        message: 'Failed to delete assignment: ' + error.message,
        type: 'error',
      });
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const searchLower = searchTerm.toLowerCase();
    const userName = assignment.full_name || assignment.user_name || '';
    const facilityName = assignment.facility_name || '';
    return (
      userName.toLowerCase().includes(searchLower) ||
      facilityName.toLowerCase().includes(searchLower) ||
      (assignment.username && assignment.username.toLowerCase().includes(searchLower)) ||
      (assignment.email && assignment.email.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            User Facility Assignments
          </h2>
          <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
            Manage user assignments to facilities
          </p>
        </div>
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
          New Assignment
        </button>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search by user or facility..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value);
              setSelectedUserId('');
              setSelectedFacilityId('');
            }}
            style={{
              padding: '10px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <option value="all">All Assignments</option>
            <option value="byUser">By User</option>
            <option value="byFacility">By Facility</option>
          </select>
          {viewMode === 'byUser' && (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '200px',
              }}
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name} ({user.role})
                </option>
              ))}
            </select>
          )}
          {viewMode === 'byFacility' && (
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '200px',
              }}
            >
              <option value="">Select Facility</option>
              {facilities.map((facility) => (
                <option key={facility.facility_id} value={facility.facility_id}>
                  {facility.facility_name}
                </option>
              ))}
            </select>
          )}
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

      {/* Assignments Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : filteredAssignments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          No assignments found
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#495057' }}>
                  User
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#495057' }}>
                  Facility
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#495057' }}>
                  Type
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#495057' }}>
                  Primary
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#495057' }}>
                  Assigned At
                </th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', color: '#495057' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((assignment) => (
                <tr
                  key={assignment.assignment_id}
                  style={{ borderBottom: '1px solid #dee2e6', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fa')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                >
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={16} color="#6c757d" />
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {assignment.full_name || assignment.user_name || 'N/A'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {assignment.username || assignment.email || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building size={16} color="#6c757d" />
                      <div>
                        <div style={{ fontWeight: 500 }}>{assignment.facility_name || 'N/A'}</div>
                        {assignment.facility_type && (
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>
                            {assignment.facility_type}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
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
                      {assignment.role || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {assignment.is_primary === 1 || assignment.is_primary === true ? (
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
                        Primary
                      </span>
                    ) : (
                      <span style={{ color: '#6c757d' }}>Secondary</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#6c757d' }}>
                    {assignment.assigned_at
                      ? new Date(assignment.assigned_at).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleOpenModal(assignment)}
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
                        onClick={() => handleDelete(assignment.assignment_id)}
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
                        Remove
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
                {editingAssignment ? 'Edit Assignment' : 'New Assignment'}
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
                  User *
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.full_name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Facility *
                </label>
                <select
                  value={formData.facility_id}
                  onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select Facility</option>
                  {facilities.map((facility) => (
                    <option key={facility.facility_id} value={facility.facility_id}>
                      {facility.facility_name} ({facility.facility_type})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Set as Primary Facility</span>
                </label>
                <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px', marginLeft: '26px' }}>
                  Only one facility can be primary per user
                </p>
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
                  {editingAssignment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFacilityAssignments;

