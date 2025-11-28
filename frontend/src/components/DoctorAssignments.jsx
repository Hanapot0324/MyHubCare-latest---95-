import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Search,
  Lock,
  Unlock,
  X
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const DoctorAssignments = ({ socket }) => {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'upcoming', 'past'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // For form dropdowns
  const [providers, setProviders] = useState([]);
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    fetchAssignments();
    fetchProviders();
    fetchFacilities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assignments, searchTerm, filterType]);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/doctor-assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setAssignments(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching doctor assignments:', error);
      showToast('Failed to fetch doctor assignments: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      console.log('Fetching providers from /users/providers endpoint...');
      
      let response = await fetch(`${API_BASE_URL}/users/providers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // If users/providers doesn't work, try doctor-assignments/providers
      if (!response.ok && (response.status === 404 || response.status === 403)) {
        console.log('Trying fallback endpoint /doctor-assignments/providers...');
        response = await fetch(`${API_BASE_URL}/doctor-assignments/providers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Provider fetch response:', data);

      if (data.success) {
        // Handle both response formats
        if (data.providers) {
          // Map to consistent format
          const providersList = data.providers.map(p => ({
            user_id: p.user_id || p.provider_id,
            full_name: p.full_name || p.provider_name,
            username: p.username,
            email: p.email,
            role: p.role || 'physician',
            status: p.status || 'active',
            facility_id: p.facility_id,
            facility_name: p.facility_name
          }));
          console.log('Setting providers:', providersList.length);
          setProviders(providersList);
        } else if (data.users) {
          // Fallback if response has 'users' instead of 'providers'
          const providersList = data.users
            .filter(u => u.role?.toLowerCase() === 'physician')
            .map(p => ({
              user_id: p.user_id,
              full_name: p.full_name,
              username: p.username,
              email: p.email,
              role: p.role,
              status: p.status,
              facility_id: p.facility_id,
              facility_name: p.facility_name
            }));
          console.log('Setting providers from users:', providersList.length);
          setProviders(providersList);
        } else {
          console.warn('No providers found in response:', data);
          setProviders([]);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch providers');
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      showToast('Failed to fetch providers: ' + error.message, 'error');
      setProviders([]);
    }
  };

  const fetchFacilities = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/facilities`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setFacilities(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...assignments];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter by type (all, upcoming, past)
    if (filterType === 'upcoming') {
      filtered = filtered.filter(assignment => {
        const assignmentDate = new Date(assignment.assignment_date);
        assignmentDate.setHours(0, 0, 0, 0);
        return assignmentDate >= today;
      });
    } else if (filterType === 'past') {
      filtered = filtered.filter(assignment => {
        const assignmentDate = new Date(assignment.assignment_date);
        assignmentDate.setHours(0, 0, 0, 0);
        return assignmentDate < today;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(assignment => {
        const doctorMatch = assignment.doctor_name?.toLowerCase().includes(searchLower) || assignment.provider_name?.toLowerCase().includes(searchLower);
        const facilityMatch = assignment.facility_name?.toLowerCase().includes(searchLower);
        return doctorMatch || facilityMatch;
      });
    }

    setFilteredAssignments(filtered);
  };

  const handleAddAssignment = async (assignmentData) => {
    try {
      setActionLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/doctor-assignments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignmentData)
      });

      const data = await response.json();

      if (data.success) {
        showToast('Doctor assignment created successfully. Availability slots generated automatically.', 'success');
        setShowAddModal(false);
        fetchAssignments();
      } else {
        throw new Error(data.message || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      showToast('Failed to create assignment: ' + error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAssignment = async (assignmentId, assignmentData) => {
    try {
      setActionLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/doctor-assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignmentData)
      });

      const data = await response.json();

      if (data.success) {
        showToast('Doctor assignment updated successfully. Availability slots regenerated.', 'success');
        setShowEditModal(false);
        setSelectedAssignment(null);
        fetchAssignments();
      } else {
        throw new Error(data.message || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      showToast('Failed to update assignment: ' + error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This will also delete associated availability slots.')) {
      return;
    }

    try {
      setActionLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/doctor-assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        showToast('Doctor assignment deleted successfully', 'success');
        fetchAssignments();
      } else {
        throw new Error(data.message || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      showToast('Failed to delete assignment: ' + error.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh', paddingTop: '100px' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '30px', 
        background: 'linear-gradient(to right, #D84040, #A31D1D)', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 15px rgba(216, 64, 64, 0.2)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
              Doctor Availability Assignments
            </h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>
              Manage doctor schedules and availability slots
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 20px',
              background: '#ECDCBF',
              color: '#A31D1D',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={20} />
            New Assignment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={18}
              color="#A31D1D"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              type="text"
              placeholder="Search by provider or facility..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
              }}
            />
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '8px 20px',
              background: filterType === 'all' ? '#A31D1D' : '#e9ecef',
              color: filterType === 'all' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            All Assignments
          </button>
          <button
            onClick={() => setFilterType('upcoming')}
            style={{
              padding: '8px 20px',
              background: filterType === 'upcoming' ? '#A31D1D' : '#e9ecef',
              color: filterType === 'upcoming' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilterType('past')}
            style={{
              padding: '8px 20px',
              background: filterType === 'past' ? '#A31D1D' : '#e9ecef',
              color: filterType === 'past' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            Past
          </button>
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: '#A31D1D' }} />
          <p style={{ marginTop: '10px', color: '#6c757d' }}>Loading assignments...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center',
          color: '#6c757d'
        }}>
          <AlertCircle size={48} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
          <p>No doctor assignments found</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {filteredAssignments.map(assignment => (
            <div
              key={assignment.assignment_id}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: `2px solid ${assignment.is_locked ? '#dc3545' : '#28a745'}`,
                transition: 'transform 0.2s ease',
                position: 'relative'
              }}
            >
              {/* Lock Status Badge */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: assignment.is_locked ? '#dc354520' : '#28a74520',
                color: assignment.is_locked ? '#dc3545' : '#28a745',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {assignment.is_locked ? <Lock size={14} /> : <Unlock size={14} />}
                {assignment.is_locked ? 'LOCKED' : 'UNLOCKED'}
              </div>

              {/* Assignment Info */}
              <div style={{ marginBottom: '15px', marginTop: '25px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px' }}>
                  {assignment.doctor_name || assignment.provider_name || 'Unknown Doctor'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#6c757d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} />
                    <span>{assignment.facility_name || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} />
                    <span>{formatDate(assignment.assignment_date)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} />
                    <span>{formatTime(assignment.start_time)} - {formatTime(assignment.end_time)}</span>
                  </div>
                  {assignment.max_patients && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>Max Patients:</span>
                      <span>{assignment.max_patients}</span>
                    </div>
                  )}
                  {assignment.notes && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>Notes:</span>
                      <span>{assignment.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  onClick={() => {
                    setSelectedAssignment(assignment);
                    setShowEditModal(true);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#0056b3'}
                  onMouseLeave={(e) => e.target.style.background = '#007bff'}
                >
                  <span>✏️</span>
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedAssignment(assignment);
                    setShowConflictModal(true);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#ffc107',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#e0a800'}
                  onMouseLeave={(e) => e.target.style.background = '#ffc107'}
                >
                  <AlertCircle size={16} />
                  Conflicts
                </button>
                <button
                  onClick={() => handleDeleteAssignment(assignment.assignment_id)}
                  disabled={actionLoading}
                  style={{
                    padding: '8px 16px',
                    background: actionLoading ? '#6c757d' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (!actionLoading) e.target.style.background = '#c82333';
                  }}
                  onMouseLeave={(e) => {
                    if (!actionLoading) e.target.style.background = '#dc3545';
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddModal && (
        <AssignmentModal
          mode="add"
          providers={providers}
          facilities={facilities}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddAssignment}
        />
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && selectedAssignment && (
        <AssignmentModal
          mode="edit"
          assignment={selectedAssignment}
          providers={providers}
          facilities={facilities}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAssignment(null);
          }}
          onSave={(assignmentData) => handleUpdateAssignment(selectedAssignment.assignment_id, assignmentData)}
        />
      )}

      {/* Conflicts Modal */}
      {showConflictModal && selectedAssignment && (
        <ConflictsModal
          assignment={selectedAssignment}
          onClose={() => {
            setShowConflictModal(false);
            setSelectedAssignment(null);
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: toast.type === 'success' ? '#28a745' : '#dc3545',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '300px',
          zIndex: 9999
        }}>
          {toast.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}
          <span style={{ fontSize: '14px' }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

// Assignment Modal Component
const AssignmentModal = ({ mode, assignment, providers, facilities, onClose, onSave }) => {
  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // If already in YYYY-MM-DD format, return as is
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Otherwise, parse and format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState(
    assignment ? {
      doctor_id: assignment.doctor_id || assignment.provider_id,
      facility_id: assignment.facility_id,
      assignment_date: formatDateForInput(assignment.assignment_date),
      start_time: assignment.start_time || '08:00:00',
      end_time: assignment.end_time || '17:00:00',
      max_patients: assignment.max_patients || 8,
      notes: assignment.notes || '',
      is_locked: assignment.is_locked || false
    } : {
      doctor_id: '',
      facility_id: '',
      assignment_date: '',
      start_time: '08:00:00',
      end_time: '17:00:00',
      max_patients: 8,
      notes: '',
      is_locked: false
    }
  );


  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert time format from HH:MM to HH:MM:SS
    const formatTimeForBackend = (timeStr) => {
      if (!timeStr) return timeStr;
      // If already in HH:MM:SS format, return as is
      if (timeStr.split(':').length === 3) return timeStr;
      // Otherwise, add :00 for seconds
      return timeStr + ':00';
    };
    
    const formattedData = {
      ...formData,
      start_time: formatTimeForBackend(formData.start_time),
      end_time: formatTimeForBackend(formData.end_time)
    };
    
    onSave(formattedData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };


  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#A31D1D' }}>
            {mode === 'add' ? 'Create Doctor Assignment' : 'Edit Doctor Assignment'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            <X size={24} color="#6c757d" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Doctor <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="doctor_id"
              value={formData.doctor_id}
              onChange={handleChange}
              required
              disabled={mode === 'edit'}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              <option value="">Select Doctor</option>
              {providers.map(provider => (
                <option key={provider.user_id} value={provider.user_id}>
                  {provider.full_name || provider.username}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Facility <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="facility_id"
              value={formData.facility_id}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              <option value="">Select Facility</option>
              {facilities.map(facility => (
                <option key={facility.facility_id} value={facility.facility_id}>
                  {facility.facility_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Assignment Date <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="date"
              name="assignment_date"
              value={formData.assignment_date}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
            <p style={{ marginTop: '5px', fontSize: '12px', color: '#6c757d' }}>
              Select a single date for this assignment (per-day model)
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                Start Time <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time ? formData.start_time.slice(0, 5) : ''}
                onChange={(e) => {
                  const timeValue = e.target.value;
                  setFormData({ ...formData, start_time: timeValue ? timeValue + ':00' : '' });
                }}
                required
                step="3600"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                End Time <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time ? formData.end_time.slice(0, 5) : ''}
                onChange={(e) => {
                  const timeValue = e.target.value;
                  setFormData({ ...formData, end_time: timeValue ? timeValue + ':00' : '' });
                }}
                required
                step="3600"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                Max Patients
              </label>
              <input
                type="number"
                name="max_patients"
                value={formData.max_patients}
                onChange={handleChange}
                min="1"
                max="50"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '16px',
                resize: 'vertical'
              }}
              placeholder="Add any notes about this assignment..."
            />
          </div>


          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="is_locked"
                checked={formData.is_locked}
                onChange={handleChange}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: 'bold', color: '#333' }}>Lock Assignment (creates locked slots)</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {mode === 'add' ? 'Create Assignment' : 'Update Assignment'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

// Conflicts Modal Component
const ConflictsModal = ({ assignment, onClose }) => {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddConflict, setShowAddConflict] = useState(false);
  const [newConflict, setNewConflict] = useState({
    conflict_date: '',
    conflict_type: 'leave',
    reason: '',
    start_time: '',
    end_time: '',
    is_all_day: true,
    facility_id: assignment?.facility_id || ''
  });

  useEffect(() => {
    if (assignment && assignment.conflicts) {
      setConflicts(assignment.conflicts);
    } else if (assignment) {
      fetchConflicts();
    }
  }, [assignment]);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/doctor-assignments/${assignment.assignment_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success && data.data.conflicts) {
        setConflicts(data.data.conflicts);
      }
    } catch (error) {
      console.error('Error fetching conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConflict = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      if (!newConflict.conflict_date || !newConflict.reason) {
        alert('Please provide conflict date and reason');
        return;
      }

      if (!newConflict.is_all_day && (!newConflict.start_time || !newConflict.end_time)) {
        alert('Please provide start and end times for partial day conflicts');
        return;
      }

      // Build conflict payload
      const conflictPayload = {
        doctor_id: assignment.doctor_id || assignment.provider_id,
        facility_id: newConflict.facility_id || null,
        conflict_date: newConflict.conflict_date,
        conflict_type: newConflict.conflict_type,
        reason: newConflict.reason,
        is_all_day: newConflict.is_all_day,
        start_time: newConflict.is_all_day ? null : newConflict.start_time,
        end_time: newConflict.is_all_day ? null : newConflict.end_time
      };

      const response = await fetch(`${API_BASE_URL}/doctor-conflicts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(conflictPayload)
      });

      const data = await response.json();

      if (data.success) {
        setNewConflict({
          conflict_date: '',
          conflict_type: 'leave',
          reason: '',
          start_time: '',
          end_time: '',
          is_all_day: true,
          facility_id: assignment?.facility_id || ''
        });
        setShowAddConflict(false);
        fetchConflicts();
      } else {
        throw new Error(data.message || 'Failed to add conflict');
      }
    } catch (error) {
      console.error('Error adding conflict:', error);
      alert('Failed to add conflict: ' + error.message);
    }
  };

  const handleDeleteConflict = async (conflictId) => {
    if (!window.confirm('Are you sure you want to remove this conflict?')) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/doctor-conflicts/${conflictId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchConflicts();
      } else {
        throw new Error(data.message || 'Failed to remove conflict');
      }
    } catch (error) {
      console.error('Error removing conflict:', error);
      alert('Failed to remove conflict: ' + error.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#A31D1D' }}>Doctor Conflicts</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            <X size={24} color="#6c757d" />
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ margin: '0 0 10px 0', color: '#6c757d' }}>
            <strong>Doctor:</strong> {assignment.doctor_name || assignment.provider_name}<br />
            <strong>Facility:</strong> {assignment.facility_name}<br />
            <strong>Date:</strong> {formatDate(assignment.assignment_date)}
          </p>
        </div>

        {!showAddConflict ? (
          <button
            onClick={() => setShowAddConflict(true)}
            style={{
              padding: '10px 20px',
              background: '#ffc107',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginBottom: '20px'
            }}
          >
            <Plus size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Add Conflict
          </button>
        ) : (
          <div style={{
            padding: '15px',
            background: '#f8f9fa',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>New Conflict</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Conflict Date <span style={{ color: 'red' }}>*</span></label>
              <input
                type="date"
                value={newConflict.conflict_date}
                onChange={(e) => setNewConflict({ ...newConflict, conflict_date: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Conflict Type <span style={{ color: 'red' }}>*</span></label>
              <select
                value={newConflict.conflict_type}
                onChange={(e) => setNewConflict({ ...newConflict, conflict_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              >
                <option value="leave">Leave</option>
                <option value="meeting">Meeting</option>
                <option value="training">Training</option>
                <option value="emergency">Emergency</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newConflict.is_all_day}
                  onChange={(e) => setNewConflict({ ...newConflict, is_all_day: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: 'bold' }}>All Day Conflict</span>
              </label>
            </div>
            {!newConflict.is_all_day && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Time</label>
                  <input
                    type="time"
                    value={newConflict.start_time ? newConflict.start_time.slice(0, 5) : ''}
                    onChange={(e) => {
                      const timeValue = e.target.value;
                      setNewConflict({ ...newConflict, start_time: timeValue ? timeValue + ':00' : '' });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Time</label>
                  <input
                    type="time"
                    value={newConflict.end_time ? newConflict.end_time.slice(0, 5) : ''}
                    onChange={(e) => {
                      const timeValue = e.target.value;
                      setNewConflict({ ...newConflict, end_time: timeValue ? timeValue + ':00' : '' });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            )}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reason <span style={{ color: 'red' }}>*</span></label>
              <textarea
                value={newConflict.reason}
                onChange={(e) => setNewConflict({ ...newConflict, reason: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  minHeight: '60px'
                }}
                placeholder="Describe the conflict reason..."
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAddConflict}
                style={{
                  padding: '8px 16px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddConflict(false);
                  setNewConflict({
                    conflict_date: '',
                    conflict_type: 'leave',
                    reason: '',
                    start_time: '',
                    end_time: '',
                    is_all_day: true,
                    facility_id: assignment?.facility_id || ''
                  });
                }}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#A31D1D' }} />
          </div>
        ) : conflicts.length === 0 ? (
          <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>No conflicts defined</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {conflicts.map(conflict => (
              <div
                key={conflict.conflict_id}
                style={{
                  padding: '15px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {formatDate(conflict.conflict_date)}
                    {conflict.is_all_day ? ' (All Day)' : ` (${formatTime(conflict.start_time)} - ${formatTime(conflict.end_time)})`}
                  </div>
                  <div style={{ color: '#991b1b', fontSize: '14px', marginBottom: '5px' }}>
                    <strong>Type:</strong> {conflict.conflict_type?.charAt(0).toUpperCase() + conflict.conflict_type?.slice(1)}
                  </div>
                  {conflict.reason && (
                    <div style={{ color: '#991b1b', fontSize: '14px' }}>
                      <strong>Reason:</strong> {conflict.reason}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteConflict(conflict.conflict_id)}
                  style={{
                    padding: '5px 10px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorAssignments;

