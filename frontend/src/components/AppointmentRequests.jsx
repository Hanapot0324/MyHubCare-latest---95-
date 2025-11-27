// web/src/components/AppointmentRequests.jsx
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Eye,
  X
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const AppointmentRequests = ({ socket }) => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'all', 'approved', 'declined'
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, searchTerm, statusFilter]);

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('newNotification', (data) => {
        if (data.type === 'appointment_created' || data.type === 'appointment_request') {
          fetchRequests();
        }
      });

      return () => {
        socket.off('newNotification');
      };
    }
  }, [socket]);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;

      // Fetch appointments with 'scheduled' status (pending approval)
      const response = await fetch(`${API_BASE_URL}/appointments?status=scheduled`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        // Sort by newest first
        const sortedRequests = (data.data || []).sort((a, b) => 
          new Date(b.booked_at) - new Date(a.booked_at)
        );
        setRequests(sortedRequests);
      } else {
        throw new Error(data.message || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching appointment requests:', error);
      showToast('Failed to fetch appointment requests: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Status filter
    if (statusFilter === 'pending') {
      filtered = filtered.filter(req => req.status === 'scheduled');
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter(req => req.status === 'confirmed');
    } else if (statusFilter === 'declined') {
      filtered = filtered.filter(req => req.status === 'cancelled');
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(req => {
        const patientMatch = req.patient_name?.toLowerCase().includes(searchLower);
        const providerMatch = req.provider_name?.toLowerCase().includes(searchLower);
        const facilityMatch = req.facility_name?.toLowerCase().includes(searchLower);
        const typeMatch = req.appointment_type?.toLowerCase().includes(searchLower);
        return patientMatch || providerMatch || facilityMatch || typeMatch;
      });
    }

    setFilteredRequests(filtered);
  };

const handleApprove = async (appointmentId) => {
  try {
    setActionLoading(true);
    const token = getAuthToken();
    if (!token) return;

    // Call the NEW approve endpoint
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      showToast('Appointment request approved successfully', 'success');
      setShowDetailModal(false);
      setSelectedRequest(null);
      fetchRequests(); // Refresh the list
    } else {
      throw new Error(data.message || 'Failed to approve request');
    }
  } catch (error) {
    console.error('Error approving request:', error);
    showToast('Failed to approve request: ' + error.message, 'error');
  } finally {
    setActionLoading(false);
  }
};

const handleDecline = async (appointmentId) => {
  if (!declineReason.trim()) {
    showToast('Please provide a reason for declining', 'error');
    return;
  }

  try {
    setActionLoading(true);
    const token = getAuthToken();
    if (!token) return;

    // Call the NEW decline endpoint
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/decline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: declineReason })
    });

    const data = await response.json();

    if (data.success) {
      showToast('Appointment request declined', 'success');
      setShowDetailModal(false);
      setSelectedRequest(null);
      setDeclineReason('');
      fetchRequests(); // Refresh the list
    } else {
      throw new Error(data.message || 'Failed to decline request');
    }
  } catch (error) {
    console.error('Error declining request:', error);
    showToast('Failed to decline request: ' + error.message, 'error');
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

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return '#ffc107';
      case 'confirmed':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Clock size={16} color="#ffc107" />;
      case 'confirmed':
        return <CheckCircle size={16} color="#28a745" />;
      case 'cancelled':
        return <XCircle size={16} color="#dc3545" />;
      default:
        return <AlertCircle size={16} color="#6c757d" />;
    }
  };

  const getAppointmentTypeLabel = (type) => {
    const labels = {
      follow_up: 'Follow-up',
      art_pickup: 'ART Pickup',
      lab_test: 'Lab Test',
      counseling: 'Counseling',
      general: 'General',
      initial: 'Initial Visit'
    };
    return labels[type] || type;
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
              Appointment Requests
            </h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>
              Review and approve patient appointment requests
            </p>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '15px 20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
              {requests.filter(r => r.status === 'scheduled').length}
            </div>
            <div style={{ fontSize: '12px', color: '#F8F2DE' }}>Pending Requests</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
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
            placeholder="Search by patient, provider, or facility..."
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
        <div style={{ position: 'relative' }}>
          <Filter
            size={18}
            color="#A31D1D"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              appearance: 'none',
            }}
          >
            <option value="pending">Pending</option>
            <option value="all">All Requests</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: '#A31D1D' }} />
          <p style={{ marginTop: '10px', color: '#6c757d' }}>Loading appointment requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center',
          color: '#6c757d'
        }}>
          <AlertCircle size={48} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
          <p>No appointment requests found</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {filteredRequests.map(request => (
            <div
              key={request.appointment_id}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: `2px solid ${getStatusColor(request.status)}`,
                transition: 'transform 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              {/* Status Badge */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: getStatusColor(request.status) + '20',
                color: getStatusColor(request.status),
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {getStatusIcon(request.status)}
                {request.status.toUpperCase()}
              </div>

              {/* Request Info */}
              <div style={{ marginBottom: '15px', marginTop: '25px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px' }}>
                  {request.patient_name || 'Unknown Patient'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#6c757d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} />
                    <span>{formatDate(request.scheduled_start)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} />
                    <span>{formatTime(request.scheduled_start)} - {formatTime(request.scheduled_end)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} />
                    <span>{request.provider_name || 'No provider assigned'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} />
                    <span>{request.facility_name || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Type Badge */}
              <div style={{
                padding: '6px 12px',
                background: '#e7f3ff',
                color: '#0066cc',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '15px',
                display: 'inline-block'
              }}>
                {getAppointmentTypeLabel(request.appointment_type)}
              </div>

              {/* Reason */}
              {request.reason && (
                <div style={{
                  padding: '10px',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  fontSize: '13px'
                }}>
                  <strong>Reason:</strong> {request.reason}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowDetailModal(true);
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
                    gap: '5px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#0056b3'}
                  onMouseLeave={(e) => e.target.style.background = '#007bff'}
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
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
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#A31D1D' }}>Appointment Request Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                  setDeclineReason('');
                }}
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

            {/* Request Details */}
            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Patient</strong>
                <span style={{ fontSize: '16px' }}>{selectedRequest.patient_name || 'Unknown'}</span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Appointment Type</strong>
                <span style={{ fontSize: '16px' }}>{getAppointmentTypeLabel(selectedRequest.appointment_type)}</span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Date & Time</strong>
                <span style={{ fontSize: '16px' }}>
                  {formatDate(selectedRequest.scheduled_start)} at {formatTime(selectedRequest.scheduled_start)} - {formatTime(selectedRequest.scheduled_end)}
                </span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Provider</strong>
                <span style={{ fontSize: '16px' }}>{selectedRequest.provider_name || 'No provider assigned'}</span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Facility</strong>
                <span style={{ fontSize: '16px' }}>{selectedRequest.facility_name || 'N/A'}</span>
              </div>

              {selectedRequest.reason && (
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Reason</strong>
                  <span style={{ fontSize: '16px' }}>{selectedRequest.reason}</span>
                </div>
              )}

              <div style={{ marginBottom: '15px' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Duration</strong>
                <span style={{ fontSize: '16px' }}>{selectedRequest.duration_minutes} minutes</span>
              </div>

              <div>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Status</strong>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  background: getStatusColor(selectedRequest.status) + '20',
                  color: getStatusColor(selectedRequest.status),
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {getStatusIcon(selectedRequest.status)}
                  {selectedRequest.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Decline Reason Input */}
            {selectedRequest.status === 'scheduled' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Decline Reason (if declining)
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Enter reason for declining this request..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}

            {/* Actions */}
            {selectedRequest.status === 'scheduled' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleApprove(selectedRequest.appointment_id)}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    background: actionLoading ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!actionLoading) e.target.style.background = '#218838';
                  }}
                  onMouseLeave={(e) => {
                    if (!actionLoading) e.target.style.background = '#28a745';
                  }}
                >
                  {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Approve
                </button>
                <button
                  onClick={() => handleDecline(selectedRequest.appointment_id)}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    background: actionLoading ? '#6c757d' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!actionLoading) e.target.style.background = '#c82333';
                  }}
                  onMouseLeave={(e) => {
                    if (!actionLoading) e.target.style.background = '#dc3545';
                  }}
                >
                  {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>
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
          zIndex: 9999,
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}
          <span style={{ fontSize: '14px' }}>{toast.message}</span>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AppointmentRequests;