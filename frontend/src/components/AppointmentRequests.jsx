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
  const [currentUser, setCurrentUser] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [notifyProvider, setNotifyProvider] = useState(false);
  const [declineReasonType, setDeclineReasonType] = useState('');
  const [declineAdditionalNotes, setDeclineAdditionalNotes] = useState('');

  useEffect(() => {
    fetchRequests();
    getCurrentUser();
    // Refresh every 30 seconds to ensure status updates are reflected
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, searchTerm, statusFilter]);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Get current user info and join socket room
  const getCurrentUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  // Join user room for real-time notifications
  useEffect(() => {
    if (socket && currentUser?.user_id) {
      // Check if socket is connected
      if (socket.connected) {
        socket.emit('joinRoom', currentUser.user_id);
        console.log('✅ Joined user room for case manager:', currentUser.user_id);
      } else {
        console.warn('⚠️ Socket not connected, waiting for connection...');
        socket.once('connect', () => {
          socket.emit('joinRoom', currentUser.user_id);
          console.log('✅ Joined user room after reconnection:', currentUser.user_id);
        });
      }
    }
  }, [socket, currentUser]);

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      const handleNotification = (data) => {
        console.log('🔔 New notification received in AppointmentRequests:', data);
        
        // Immediately update local state if we have the data
        // Handle both direct data and payload structure
        const requestId = data.request_id || data.payload?.request_id;
        const appointmentId = data.appointment_id || data.payload?.appointment_id;
        const declineReason = data.decline_reason || data.payload?.decline_reason;
        
        if (data.type === 'appointment_request_approved' && requestId) {
          console.log('✅ Updating request to approved:', requestId);
          // Update request status immediately
          setRequests(prev => prev.map(req => {
            if (req.request_id === requestId) {
              return { ...req, status: 'approved', appointment_id: appointmentId || req.appointment_id };
            }
            return req;
          }));
        } else if (data.type === 'appointment_request_declined' && requestId) {
          console.log('❌ Updating request to declined:', requestId);
          // Update request status immediately
          setRequests(prev => prev.map(req => {
            if (req.request_id === requestId) {
              return { ...req, status: 'declined', decline_reason: declineReason };
            }
            return req;
          }));
        } else if (data.type === 'appointment_request' && requestId) {
          console.log('➕ Adding new request:', requestId);
          // Add new request immediately
          setRequests(prev => {
            const exists = prev.some(req => req.request_id === requestId);
            if (!exists) {
              return [data.payload || data, ...prev];
            }
            return prev;
          });
        }
        
        // Then refresh from API to ensure consistency
        if (data.type === 'appointment_created' || 
            data.type === 'appointment_request' || 
            data.type === 'appointment_request_approved' || 
            data.type === 'appointment_request_declined') {
          console.log('🔄 Refreshing requests from API after notification');
          fetchRequests();
        }
      };

      socket.on('newNotification', handleNotification);
      console.log('✅ Listening for newNotification events in AppointmentRequests');

      return () => {
        socket.off('newNotification', handleNotification);
        console.log('❌ Stopped listening for newNotification events in AppointmentRequests');
      };
    }
  }, [socket]);

  // Listen for real-time appointment request updates
  useEffect(() => {
    if (socket && currentUser?.user_id) {
      console.log('🔌 Socket connection status:', socket.connected ? '✅ Connected' : '❌ Disconnected');
      console.log('🔌 Socket ID:', socket.id);
      
      const handleRequestUpdate = (data) => {
        console.log('🔄🔄🔄 APPOINTMENT REQUEST UPDATED VIA SOCKET:', data);
        console.log('📋 Current user:', currentUser.user_id, 'Request ID:', data.request_id, 'Action:', data.action);
        
        // Immediately update local state
        if (data.request_id) {
          if (data.action === 'approved') {
            console.log('✅✅✅ UPDATING REQUEST TO APPROVED IMMEDIATELY:', data.request_id);
            // Update request status immediately
            setRequests(prev => {
              const updated = prev.map(req => {
                if (req.request_id === data.request_id) {
                  console.log('🔄 Found request, updating status to approved');
                  return { 
                    ...req, 
                    status: 'approved', 
                    appointment_id: data.appointment_id || req.appointment_id 
                  };
                }
                return req;
              });
              console.log('📊 Updated requests count:', updated.length);
              return updated;
            });
          } else if (data.action === 'declined') {
            console.log('❌❌❌ UPDATING REQUEST TO DECLINED IMMEDIATELY:', data.request_id);
            // Update request status immediately
            setRequests(prev => {
              const updated = prev.map(req => {
                if (req.request_id === data.request_id) {
                  console.log('🔄 Found request, updating status to declined');
                  return { 
                    ...req, 
                    status: 'declined', 
                    decline_reason: data.decline_reason 
                  };
                }
                return req;
              });
              console.log('📊 Updated requests count:', updated.length);
              return updated;
            });
          } else if (data.action === 'cancelled') {
            console.log('🗑️ Removing cancelled request:', data.request_id);
            // Remove cancelled request from list
            setRequests(prev => {
              const filtered = prev.filter(req => req.request_id !== data.request_id);
              console.log('📊 Remaining requests count:', filtered.length);
              return filtered;
            });
          } else if (data.action === 'created') {
            console.log('➕ Adding new request:', data.request_id);
            // Add new request to list
            setRequests(prev => {
              const exists = prev.some(req => req.request_id === data.request_id);
              if (!exists) {
                console.log('📊 Adding new request to list');
                return [data, ...prev];
              }
              console.log('⚠️ Request already exists, skipping');
              return prev;
            });
          }
        } else {
          console.warn('⚠️ No request_id in update data:', data);
        }
        
        // Then refresh from API to ensure consistency (with a small delay to let state update)
        setTimeout(() => {
          console.log('🔄 Refreshing requests from API after socket update');
          fetchRequests();
        }, 500);
      };

      socket.on('appointmentRequestUpdated', handleRequestUpdate);
      console.log('✅✅✅ LISTENING FOR appointmentRequestUpdated EVENTS for user:', currentUser.user_id);

      // Also listen for socket connection to rejoin room
      const handleConnect = () => {
        console.log('🔌 Socket connected, rejoining room:', currentUser.user_id);
        socket.emit('joinRoom', currentUser.user_id);
      };
      
      socket.on('connect', handleConnect);

      return () => {
        socket.off('appointmentRequestUpdated', handleRequestUpdate);
        socket.off('connect', handleConnect);
        console.log('❌ Stopped listening for appointmentRequestUpdated events in AppointmentRequests');
      };
    }
  }, [socket, currentUser]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;

      // Fetch appointment requests from the new endpoint
      const response = await fetch(`${API_BASE_URL}/appointment-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        // Sort by newest first
        const sortedRequests = (data.data || []).sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
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

    // Status filter - now using appointment_requests status values
    if (statusFilter === 'pending') {
      filtered = filtered.filter(req => req.status === 'pending');
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter(req => req.status === 'approved');
    } else if (statusFilter === 'declined') {
      filtered = filtered.filter(req => req.status === 'declined');
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

const handleApprove = async (requestId, notes = '', notifyProviderFlag = false) => {
  // IMMEDIATELY update UI (optimistic update) - NO WAITING!
  console.log('⚡ IMMEDIATE UI UPDATE - Approving request:', requestId);
  setRequests(prev => prev.map(req => {
    if (req.request_id === requestId) {
      console.log('✅ Updating request status to approved IMMEDIATELY');
      return { 
        ...req, 
        status: 'approved',
        appointment_id: req.appointment_id // Keep existing if any
      };
    }
    return req;
  }));
  
  // Close modal immediately
  setShowDetailModal(false);
  setShowApproveModal(false);
  setSelectedRequest(null);
  showToast('Appointment request approved successfully', 'success');
  
  try {
    setActionLoading(true);
    const token = getAuthToken();
    if (!token) return;

    // Call the appointment-requests approve endpoint
    const response = await fetch(`${API_BASE_URL}/appointment-requests/${requestId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        review_notes: notes || null,
        notify_provider: notifyProviderFlag
      })
    });

    const data = await response.json();

    if (data.success) {
      // Update with actual appointment_id from server
      setRequests(prev => prev.map(req => {
        if (req.request_id === requestId) {
          return { 
            ...req, 
            status: 'approved', 
            appointment_id: data.data?.appointment_id || req.appointment_id 
          };
        }
        return req;
      }));
      
      // Refresh to get complete data
      fetchRequests();
    } else {
      // Rollback on error
      console.error('❌ Approval failed, rolling back UI');
      setRequests(prev => prev.map(req => {
        if (req.request_id === requestId) {
          return { ...req, status: 'pending' };
        }
        return req;
      }));
      throw new Error(data.message || 'Failed to approve request');
    }
  } catch (error) {
    console.error('Error approving request:', error);
    // Rollback on error
    setRequests(prev => prev.map(req => {
      if (req.request_id === requestId) {
        return { ...req, status: 'pending' };
      }
      return req;
    }));
    showToast('Failed to approve request: ' + error.message, 'error');
  } finally {
    setActionLoading(false);
  }
};

const handleDecline = async (requestId) => {
  // Map reason types to readable text
  const reasonMap = {
    'provider_not_available': 'Provider not available',
    'time_slot_booked': 'Time slot already booked',
    'different_appointment_type': 'Patient needs different appointment type',
    'facility_closed': 'Facility closed on selected date',
    'other': declineAdditionalNotes
  };
  
  const finalReason = declineReasonType === 'other' 
    ? declineAdditionalNotes 
    : reasonMap[declineReasonType] || declineReasonType;
    
  if (!finalReason || !finalReason.trim()) {
    showToast('Please provide a reason for declining', 'error');
    return;
  }

  // IMMEDIATELY update UI (optimistic update) - NO WAITING!
  console.log('⚡ IMMEDIATE UI UPDATE - Declining request:', requestId);
  setRequests(prev => prev.map(req => {
    if (req.request_id === requestId) {
      console.log('❌ Updating request status to declined IMMEDIATELY');
      return { 
        ...req, 
        status: 'declined', 
        decline_reason: finalReason 
      };
    }
    return req;
  }));
  
  // Close modals immediately
  setShowDeclineModal(false);
  setShowDetailModal(false);
  setSelectedRequest(null);
  const savedDeclineReason = finalReason;
  setDeclineReason('');
  setDeclineReasonType('');
  setDeclineAdditionalNotes('');
  showToast('Appointment request declined', 'success');

  try {
    setActionLoading(true);
    const token = getAuthToken();
    if (!token) return;

    // Call the appointment-requests decline endpoint
    const response = await fetch(`${API_BASE_URL}/appointment-requests/${requestId}/decline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: savedDeclineReason || finalReason })
    });

    const data = await response.json();

    if (data.success) {
      // Update with server data to ensure consistency
      setRequests(prev => prev.map(req => {
        if (req.request_id === requestId) {
          return { 
            ...req, 
            status: 'declined', 
            decline_reason: data.data?.decline_reason || savedDeclineReason 
          };
        }
        return req;
      }));
      
      // Refresh to get complete data
      fetchRequests();
    } else {
      // Rollback on error
      console.error('❌ Decline failed, rolling back UI');
      setRequests(prev => prev.map(req => {
        if (req.request_id === requestId) {
          return { ...req, status: 'pending', decline_reason: null };
        }
        return req;
      }));
      throw new Error(data.message || 'Failed to decline request');
    }
  } catch (error) {
    console.error('Error declining request:', error);
    // Rollback on error
    setRequests(prev => prev.map(req => {
      if (req.request_id === requestId) {
        return { ...req, status: 'pending', decline_reason: null };
      }
      return req;
    }));
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
      case 'pending':
        return '#ffc107';
      case 'approved':
        return '#28a745';
      case 'declined':
        return '#dc3545';
      case 'cancelled':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color="#ffc107" />;
      case 'approved':
        return <CheckCircle size={16} color="#28a745" />;
      case 'declined':
        return <XCircle size={16} color="#dc3545" />;
      case 'cancelled':
        return <XCircle size={16} color="#6c757d" />;
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
    <div style={{ padding: '20px', paddingTop: '100px', backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(to right, #D84040, #A31D1D)',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
            📋 Appointment Requests
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#F8F2DE', fontSize: '14px' }}>
            Review and manage patient appointment requests
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
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
              placeholder="Search by patient name, provider, facility, or appointment type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #ced4da',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #ced4da',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              minWidth: '200px',
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
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {filteredRequests.map(request => (
            <div
              key={request.request_id}
              style={{
                padding: '20px',
                borderBottom: '1px solid #e9ecef',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                background: 'white',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#A31D1D' }}>
                      {request.patient_name || 'Unknown Patient'}
                    </h3>
                    <span 
                      style={{
                        backgroundColor: request.status === 'pending' ? '#ffc107' : request.status === 'approved' ? '#28a745' : '#dc3545',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {request.status === 'pending' ? '⏳' : request.status === 'approved' ? '✓' : '❌'} {request.status.toUpperCase()}
                    </span>
                  </div>
                
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                      <Calendar size={16} />
                      <span>{formatDate(request.requested_date)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                      <Clock size={16} />
                      <span>{request.requested_time ? formatTime(`2000-01-01 ${request.requested_time}`) : 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                      <MapPin size={16} />
                      <span>{request.facility_name || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                      <User size={16} />
                      <span>Provider: {request.provider_name || 'Not assigned'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                      <span>Type: {getAppointmentTypeLabel(request.appointment_type) || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6c757d', fontSize: '14px' }}>
                    <Clock size={16} />
                    <span>Submitted: {formatDate(request.created_at)} at {formatTime(request.created_at)}</span>
                  </div>
                  
                  {request.patient_notes && (
                    <div style={{ marginTop: '10px', fontStyle: 'italic', color: '#6c757d' }}>
                      "{request.patient_notes}"
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailModal(true);
                        }}
                        style={{
                          padding: '8px 12px',
                          background: '#ECDCBF',
                          color: '#A31D1D',
                          border: '1px solid #ECDCBF',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => (e.target.style.background = '#F8F2DE')}
                        onMouseLeave={(e) => (e.target.style.background = '#ECDCBF')}
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowApproveModal(true);
                        }}
                        style={{
                          padding: '8px 12px',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => (e.target.style.background = '#218838')}
                        onMouseLeave={(e) => (e.target.style.background = '#28a745')}
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDeclineModal(true);
                        }}
                        style={{
                          padding: '8px 12px',
                          background: '#D84040',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => (e.target.style.background = '#A31D1D')}
                        onMouseLeave={(e) => (e.target.style.background = '#D84040')}
                      >
                        <XCircle size={16} />
                        Decline
                      </button>
                    </>
                  )}
                </div>
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
              <h2 style={{ margin: 0, color: '#A31D1D', fontWeight: 'bold' }}>Appointment Request Details</h2>
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
                <X size={24} color="#A31D1D" />
              </button>
            </div>

            {/* Request Details */}
            <div style={{
              padding: '15px',
              background: '#F8F2DE',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #ECDCBF'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#A31D1D' }}>Patient</strong>
                <span style={{ fontSize: '16px' }}>{selectedRequest.patient_name || 'Unknown'}</span>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#A31D1D' }}>Requested Date & Time</strong>
                <span style={{ fontSize: '16px' }}>
                  {formatDate(selectedRequest.requested_date)} at {selectedRequest.requested_time ? formatTime(`2000-01-01 ${selectedRequest.requested_time}`) : 'N/A'}
                </span>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#A31D1D' }}>Facility</strong>
                <span style={{ fontSize: '16px' }}>{selectedRequest.facility_name || 'N/A'}</span>
              </div>

              {selectedRequest.patient_notes && (
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ display: 'block', marginBottom: '5px', color: '#A31D1D' }}>Patient Notes</strong>
                  <span style={{ fontSize: '16px' }}>{selectedRequest.patient_notes}</span>
                </div>
              )}

              {selectedRequest.decline_reason && (
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ display: 'block', marginBottom: '5px', color: '#A31D1D' }}>Decline Reason</strong>
                  <span style={{ fontSize: '16px', color: '#dc3545' }}>{selectedRequest.decline_reason}</span>
                </div>
              )}

              {selectedRequest.appointment_id && (
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ display: 'block', marginBottom: '5px', color: '#A31D1D' }}>Created Appointment</strong>
                  <span style={{ fontSize: '16px', color: '#28a745' }}>Appointment ID: {selectedRequest.appointment_id}</span>
                </div>
              )}

              <div>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#A31D1D' }}>Status</strong>
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
            {selectedRequest.status === 'pending' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#A31D1D' }}>
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
            {selectedRequest.status === 'pending' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleApprove(selectedRequest.request_id)}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    background: actionLoading ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
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
                  onClick={() => handleDecline(selectedRequest.request_id)}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    background: actionLoading ? '#6c757d' : '#D84040',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!actionLoading) e.target.style.background = '#A31D1D';
                  }}
                  onMouseLeave={(e) => {
                    if (!actionLoading) e.target.style.background = '#D84040';
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

      {/* Approval Confirmation Modal */}
      {showApproveModal && selectedRequest && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#A31D1D' }}>
                ✅ Approve Appointment Request
              </h2>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApproveNotes('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                <X size={24} color="#A31D1D" />
              </button>
            </div>

            <p style={{ marginBottom: '20px', color: '#6b7280', fontSize: '14px' }}>
              You are about to approve this appointment:
            </p>

            <div style={{
              padding: '15px',
              background: '#F8F2DE',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #ECDCBF'
            }}>
              <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                <strong>Patient:</strong> {selectedRequest.patient_name || 'Unknown'}
              </div>
              <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                <strong>Date:</strong> {formatDate(selectedRequest.requested_date)}
              </div>
              <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                <strong>Time:</strong> {selectedRequest.requested_time ? formatTime(`2000-01-01 ${selectedRequest.requested_time}`) : 'N/A'}
              </div>
              <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                <strong>Provider:</strong> {selectedRequest.provider_name || 'Not assigned'}
              </div>
              <div style={{ fontSize: '14px' }}>
                <strong>Type:</strong> {getAppointmentTypeLabel(selectedRequest.appointment_type) || 'N/A'}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#A31D1D' }}>
                Notes to Patient (Optional)
              </label>
              <textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="Please arrive 15 minutes early and bring your medication list."
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifyPatient}
                  onChange={(e) => setNotifyPatient(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Send notification to patient</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginTop: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifyProvider}
                  onChange={(e) => setNotifyProvider(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Send notification to provider</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApproveNotes('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#ECDCBF',
                  color: '#A31D1D',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.target.style.background = '#F8F2DE')}
                onMouseLeave={(e) => (e.target.style.background = '#ECDCBF')}
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(selectedRequest.request_id, approveNotes, notifyProvider)}
                disabled={actionLoading}
                style={{
                  padding: '10px 20px',
                  background: actionLoading ? '#9ca3af' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  if (!actionLoading) e.target.style.background = '#218838';
                }}
                onMouseLeave={(e) => {
                  if (!actionLoading) e.target.style.background = '#28a745';
                }}
              >
                {actionLoading ? 'Processing...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && selectedRequest && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#A31D1D' }}>
                ❌ Decline Appointment Request
              </h2>
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReasonType('');
                  setDeclineAdditionalNotes('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                <X size={24} color="#A31D1D" />
              </button>
            </div>

            <p style={{ marginBottom: '20px', color: '#6b7280', fontSize: '14px' }}>
              Please provide a reason for declining:
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', fontSize: '14px', color: '#A31D1D' }}>
                Reason <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{
                padding: '12px',
                background: '#F8F2DE',
                borderRadius: '8px',
                border: '1px solid #ECDCBF'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="declineReason"
                    value="provider_not_available"
                    checked={declineReasonType === 'provider_not_available'}
                    onChange={(e) => setDeclineReasonType(e.target.value)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Provider not available</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="declineReason"
                    value="time_slot_booked"
                    checked={declineReasonType === 'time_slot_booked'}
                    onChange={(e) => setDeclineReasonType(e.target.value)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Time slot already booked</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="declineReason"
                    value="different_appointment_type"
                    checked={declineReasonType === 'different_appointment_type'}
                    onChange={(e) => setDeclineReasonType(e.target.value)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Patient needs different appointment type</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="declineReason"
                    value="facility_closed"
                    checked={declineReasonType === 'facility_closed'}
                    onChange={(e) => setDeclineReasonType(e.target.value)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Facility closed on selected date</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="declineReason"
                    value="other"
                    checked={declineReasonType === 'other'}
                    onChange={(e) => setDeclineReasonType(e.target.value)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Other (specify below)</span>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#A31D1D' }}>
                Additional Notes {declineReasonType === 'other' && <span style={{ color: 'red' }}>*</span>}
              </label>
              <textarea
                value={declineAdditionalNotes}
                onChange={(e) => setDeclineAdditionalNotes(e.target.value)}
                placeholder={declineReasonType === 'other' ? 'Please specify the reason...' : 'Provider is on leave during this period. Please select another date or provider.'}
                rows="3"
                required={declineReasonType === 'other'}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifyPatient}
                  onChange={(e) => setNotifyPatient(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Send notification to patient</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReasonType('');
                  setDeclineAdditionalNotes('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#ECDCBF',
                  color: '#A31D1D',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.target.style.background = '#F8F2DE')}
                onMouseLeave={(e) => (e.target.style.background = '#ECDCBF')}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecline(selectedRequest.request_id)}
                disabled={actionLoading || (!declineReasonType || (declineReasonType === 'other' && !declineAdditionalNotes.trim()))}
                style={{
                  padding: '10px 20px',
                  background: actionLoading ? '#9ca3af' : '#D84040',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  if (!actionLoading) e.target.style.background = '#A31D1D';
                }}
                onMouseLeave={(e) => {
                  if (!actionLoading) e.target.style.background = '#D84040';
                }}
              >
                {actionLoading ? 'Processing...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor:
            toast.type === 'success'
              ? '#28a745'
              : toast.type === 'error'
              ? '#A31D1D'
              : '#17a2b8',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          maxWidth: '400px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
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